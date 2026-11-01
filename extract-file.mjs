import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import sharp from 'sharp';
import yauzl from 'yauzl';
import mammoth from 'mammoth';
import { createExtractorFromData } from 'node-unrar-js';
import { getDocumentProxy } from 'unpdf';
import ffmpegPath from 'ffmpeg-static';

const TEXT = new Set('.txt .md .csv .json .yaml .yml .xml .html .css .js .mjs .cjs .ts .tsx .jsx .py .java .cs .cpp .c .h .go .rs .sql .log .ini .toml .srt .vtt .svg .sh .ps1 .bat .cmd .vue .svelte .rb .php'.split(' '));
const IMAGES = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif']);
const VIDEO = new Map([['.mp4', 'mov'], ['.mov', 'mov'], ['.m4v', 'mov'], ['.webm', 'matroska'], ['.mkv', 'matroska'], ['.avi', 'avi']]);
const MAX_EXPANDED = 15 * 1024 * 1024;
let mediaProcess;
process.on('SIGTERM', () => { mediaProcess?.kill('SIGKILL'); process.exit(1); });
function safeName(name) { return !name.includes('\0') && !/^(?:[/\\]|[a-z]:)/i.test(name) && !name.split(/[/\\]/).includes('..'); }
function trim(value, max = 40000) { return { text: value.slice(0, max), truncated: value.length > max }; }
async function image(data) {
  const result = await sharp(data, { limitInputPixels: 25000000, animated: false }).rotate().resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 80 }).toBuffer();
  if (result.length > 2 * 1024 * 1024) throw new Error('Bild ist nach der Verarbeitung noch zu gross.');
  return 'data:image/jpeg;base64,' + result.toString('base64');
}
async function zipEntries(data) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(data, { lazyEntries: true, validateEntrySizes: true }, (error, zip) => {
      if (error) return reject(new Error('ZIP ist beschaedigt oder nicht unterstuetzt.'));
      const entries = []; let total = 0; let count = 0; let failed = false;
      function fail(message) { if (!failed) { failed = true; zip.close(); reject(new Error(message)); } }
      zip.on('error', () => fail('ZIP ist beschaedigt oder enthaelt unzulaessige Pfade.'));
      zip.on('entry', entry => {
        if (++count > 60 || (total += entry.uncompressedSize) > MAX_EXPANDED || entry.uncompressedSize > MAX_EXPANDED) return fail('Archiv zu gross: maximal 60 Eintraege und 15 MB entpackter Inhalt.');
        if (!safeName(entry.fileName) || (entry.externalFileAttributes >>> 16 & 0xf000) === 0xa000) return fail('Archiv mit Verknuepfungen oder unzulaessigen Pfaden wird nicht geoeffnet.');
        if (entry.generalPurposeBitFlag & 1) return fail('Passwortgeschuetzte Archive werden nicht unterstuetzt.');
        if (entry.fileName.endsWith('/')) return zip.readEntry();
        zip.openReadStream(entry, (err, stream) => {
          if (err) return fail('ZIP-Eintrag kann nicht gelesen werden.');
          const chunks = []; let actual = 0;
          stream.on('data', chunk => { actual += chunk.length; if (actual > entry.uncompressedSize || actual > MAX_EXPANDED) { stream.destroy(); fail('Archiv ueberschreitet die Entpackgrenze.'); } else chunks.push(chunk); });
          stream.on('error', () => fail('ZIP-Eintrag ist beschaedigt.'));
          stream.on('end', () => { if (!failed) { entries.push({ name: entry.fileName, data: Buffer.concat(chunks) }); zip.readEntry(); } });
        });
      });
      zip.on('end', () => { if (!failed) resolve(entries); }); zip.readEntry();
    });
  });
}
async function rarEntries(data) {
  const extractor = await createExtractorFromData({ data: Uint8Array.from(data).buffer });
  const list = extractor.getFileList();
  if (list.arcHeader.flags.volume || list.arcHeader.flags.headerEncrypted) throw new Error('Mehrteilige oder verschluesselte RAR-Dateien werden nicht unterstuetzt.');
  let total = 0; const headers = [];
  for (const header of list.fileHeaders) {
    if (headers.length >= 60 || (total += header.unpSize) > MAX_EXPANDED || !Number.isFinite(header.unpSize) || header.unpSize < 0) throw new Error('RAR zu gross: maximal 60 Eintraege und 15 MB entpackter Inhalt.');
    if (!safeName(header.name) || header.flags.encrypted) throw new Error('RAR enthaelt unzulaessige Pfade oder verschluesselte Dateien.');
    headers.push(header);
  }
  const entries = []; let actual = 0;
  for (const item of extractor.extract().files) if (item.extraction) {
    actual += item.extraction.length;
    if (actual > MAX_EXPANDED || item.extraction.length > item.fileHeader.unpSize) throw new Error('RAR ueberschreitet die Entpackgrenze.');
    entries.push({ name: item.fileHeader.name, data: Buffer.from(item.extraction) });
  }
  return entries;
}
function command(args) {
  return new Promise((resolve, reject) => {
    mediaProcess = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'ignore'], windowsHide: true });
    const child = mediaProcess;
    const timer = setTimeout(() => child.kill('SIGKILL'), 20000);
    child.on('error', () => { clearTimeout(timer); reject(new Error('Videowerkzeug konnte nicht gestartet werden.')); });
    child.on('exit', code => { clearTimeout(timer); mediaProcess = undefined; if (code === 0) resolve(); else reject(new Error('Video konnte nicht gelesen werden oder braucht zu lange. Bitte einen kuerzeren Clip verwenden.')); });
  });
}
async function inspect(name, data, directory, inArchive = false) {
  const ext = path.extname(name).toLowerCase();
  const result = { text: '', images: [], warnings: [], truncated: false, summary: '' };
  if (TEXT.has(ext)) {
    let value;
    try { value = new TextDecoder('utf-8', { fatal: true }).decode(data); } catch { throw new Error('Textdatei bitte als UTF-8 speichern.'); }
    if (value.includes('\0')) throw new Error('Binaerdatei kann nicht als Text gelesen werden.');
    Object.assign(result, trim(value)); result.summary = `Textdatei, ${result.text.length} Zeichen gelesen`;
  } else if (IMAGES.has(ext)) {
    result.images.push(await image(data)); result.summary = ext === '.gif' ? 'Bild: erstes GIF-Einzelbild' : 'Bild: verkleinert fuer die Bildanalyse';
  } else if (ext === '.pdf') {
    const pdf = await getDocumentProxy(new Uint8Array(data), { isEvalSupported: false, useSystemFonts: false });
    try {
      const pages = Math.min(pdf.numPages, 30); let value = '';
      for (let n = 1; n <= pages && value.length <= 40000; n++) {
        const page = await pdf.getPage(n); const content = await page.getTextContent();
        value += `\nSeite ${n}:\n` + content.items.map(item => item.str ?? '').join(' ');
      }
      if (value.replace(/Seite \d+:|\s/g, '').length < 5) throw new Error('PDF enthaelt keinen lesbaren Text. Scans bitte als Bilder hochladen; OCR ist nicht enthalten.');
      Object.assign(result, trim(value)); result.truncated ||= pdf.numPages > pages;
      result.summary = `PDF-Text aus maximal ${pages} von ${pdf.numPages} Seiten; Bilder und Layout nicht analysiert`;
    } finally { await pdf.destroy(); }
  } else if (ext === '.docx') {
    // Check archive expansion limits before handing it to the DOCX parser.
    await zipEntries(data);
    const value = await mammoth.extractRawText({ buffer: data }); Object.assign(result, trim(value.value));
    result.summary = 'DOCX-Text, ohne Bilder und Layout';
    if (!result.text.trim()) throw new Error('Dieses DOCX enthaelt keinen lesbaren Text.');
  } else if ((ext === '.zip' || ext === '.rar') && !inArchive) {
    const entries = ext === '.zip' ? await zipEntries(data) : await rarEntries(data);
    const skipped = []; let value = ''; let processed = 0;
    for (const entry of entries) {
      const type = path.extname(entry.name).toLowerCase();
      if (processed >= 20 || value.length >= 40000 || ![...TEXT, ...IMAGES, '.pdf', '.docx'].includes(type) || (IMAGES.has(type) && result.images.length >= 6)) { skipped.push(entry.name); continue; }
      try {
        const part = await inspect(entry.name, entry.data, directory, true);
        result.images.push(...part.images); value += `\nDatei ${entry.name}:\n${part.text}\n`;
        if (part.truncated) result.truncated = true;
        processed++;
      } catch { skipped.push(entry.name); }
    }
    if (!processed) throw new Error('Archiv enthaelt keine lesbaren Textdateien, Dokumente oder Bilder. Verschachtelte Archive und Programme werden nicht analysiert.');
    const shortened = trim(value); result.text = shortened.text; result.truncated ||= shortened.truncated;
    result.summary = `Archiv: ${processed} von ${entries.length} Dateien gelesen, ${result.images.length} Bilder`;
    if (skipped.length) result.warnings.push('Nicht gelesen: ' + skipped.join(', ').slice(0, 1200));
  } else if (VIDEO.has(ext) && !inArchive) {
    const input = path.join(directory, 'video' + ext); await fs.writeFile(input, data);
    await command(['-hide_banner', '-loglevel', 'error', '-nostdin', '-threads', '2', '-protocol_whitelist', 'file,pipe', '-f', VIDEO.get(ext), '-i', input, '-t', '60', '-an', '-vf', "select='isnan(prev_selected_t)+gte(t-prev_selected_t,10)',scale='min(1024,iw)':-2", '-fps_mode', 'vfr', '-frames:v', '6', '-threads', '2', path.join(directory, 'frame-%02d.jpg')]);
    const frames = (await fs.readdir(directory)).filter(n => /^frame-\d+\.jpg$/.test(n)).sort();
    if (!frames.length) throw new Error('Im Video wurden keine lesbaren Bilder gefunden.');
    for (const frame of frames) result.images.push(await image(await fs.readFile(path.join(directory, frame))));
    result.summary = `Video: ${frames.length} Standbilder, ab Beginn etwa alle 10 Sekunden, nur erste 60 Sekunden, kein Ton`;
    result.warnings.push('Keine vollstaendige Video- oder Audioanalyse. Fuer Details einen kurzen Clip oder passende Einzelbilder waehlen.');
  } else throw new Error('Format nicht unterstuetzt. Moeglich: Text/Code, PNG/JPG/WebP/GIF/AVIF, Text-PDF, DOCX, ZIP/RAR und MP4/MOV/WebM/MKV/AVI.');
  if (result.truncated) result.warnings.push('Inhalt gekuerzt: maximal 40.000 Zeichen bzw. 30 PDF-Seiten pro Datei.');
  return result;
}

process.once('message', async ({ name, input, directory }) => {
  try {
    const data = await fs.readFile(input);
    const value = await inspect(name, data, directory);
    process.send({ ok: true, value }, () => process.exit(0));
  } catch (error) {
    const message = error.name === 'UnrarError' ? 'RAR beschaedigt, mehrteilig oder passwortgeschuetzt. Bitte ein einzelnes Archiv ohne Passwort verwenden.' : error.message;
    process.send({ ok: false, error: String(message).slice(0, 500) }, () => process.exit(1));
  }
});
