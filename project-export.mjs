import JSZip from 'jszip';
import { createHash } from 'node:crypto';
import { validProjectPath } from './public/project-files.js';

const error = message => Object.assign(new Error(message), { status: 400 });
export async function buildProjectZip(original, patches, sourceName = 'KI-Projekt') {
  if (!Array.isArray(patches) || patches.length > 100) throw error('Hoechstens 100 vollstaendige Aenderungsdateien pro Export.');
  const entries = original?.entries ?? [];
  const originals = new Map();
  for (const entry of entries) {
    const name = entry.name.replace(/\/$/, '');
    if (!validProjectPath(name) || originals.has(name.toLowerCase())) throw error('Das Originalarchiv enthaelt unzulaessige oder doppelte Dateipfade. Kein unvollstaendiger Export erstellt.');
    originals.set(name.toLowerCase(), entry);
  }
  const names = [...originals.values()].filter(e => !e.directory).map(e => e.name);
  const commonRoot = names.length && names.every(n => n.includes('/') && n.split('/')[0] === names[0].split('/')[0]) ? names[0].split('/')[0] + '/' : '';
  function target(name) {
    if (originals.has(name.toLowerCase())) {
      const entry = originals.get(name.toLowerCase());
      if (entry.directory) throw error(`Ein Ordner kann nicht als Datei ersetzt werden: ${name}.`);
      return entry.name;
    }
    const matches = names.filter(n => n.toLowerCase().endsWith('/' + name.toLowerCase()));
    if (matches.length > 1) throw error(`Pfad ist mehrdeutig: ${name}. Bitte einen vollstaendigen Dateinamen erzeugen lassen.`);
    if (matches.length === 1) return matches[0];
    const directory = name.includes('/') ? name.slice(0, name.lastIndexOf('/')) : '';
    if (directory) {
      const parents = [...new Set(names.filter(n => n.includes('/')).map(n => n.slice(0, n.lastIndexOf('/'))))].filter(n => n.toLowerCase().endsWith('/' + directory.toLowerCase()));
      if (parents.length > 1) throw error(`Neuer Dateipfad ist mehrdeutig: ${name}. Bitte den vollstaendigen Ordner angeben.`);
      if (parents.length === 1) return parents[0] + '/' + name.split('/').at(-1);
    }
    return commonRoot && !name.startsWith(commonRoot) ? commonRoot + name : name;
  }
  const changes = new Map(); let total = 0;
  for (const file of patches) {
    if (!validProjectPath(file?.name) || typeof file.content !== 'string') throw error('Ungueltige Aenderungsdatei.');
    if (entries.length && file.explicit !== true) throw error(`Datei ${file.name} hat keinen eindeutigen Dateinamen. Bitte filename=pfad/datei anfordern.`);
    total += Buffer.byteLength(file.content); if (total > 600000) throw error('Zu viele Code-Aenderungen fuer einen Export. Bitte das Projekt aufteilen.');
    const name = target(file.name);
    if ([...originals.values()].some(e => (e.directory && e.name.replace(/\/$/, '').toLowerCase() === name.toLowerCase()) || (!e.directory && name.toLowerCase().startsWith(e.name.toLowerCase() + '/')))) throw error(`Datei-/Ordnerkonflikt bei ${name}.`);
    changes.set(name.toLowerCase(), { name, content: file.content });
  }
  if (!entries.length && !changes.size) throw error('Noch keine vollstaendigen Code-Dateien vorhanden.');
  const targets = [...changes.keys()];
  if (targets.some(name => targets.some(other => other !== name && name.startsWith(other + '/')))) throw error('Aenderungsdateien enthalten einen Datei-/Ordnerkonflikt.');
  const archive = new JSZip(); const unchanged = []; const updated = []; const added = [];
  for (const entry of entries) {
    if (entry.directory) { archive.folder(entry.name.replace(/\/$/, '')); continue; }
    const change = changes.get(entry.name.toLowerCase());
    const data = change ? Buffer.from(change.content, 'utf8') : Buffer.from(entry.data, 'base64');
    archive.file(entry.name, data); (change ? updated : unchanged).push(entry.name);
  }
  for (const change of changes.values()) if (!originals.has(change.name.toLowerCase())) { archive.file(change.name, change.content); added.push(change.name); }
  const manifest = { source: sourceName, originalFiles: names.length, unchanged, updated, added, tested: false };
  let report = commonRoot + 'NEU-PROJEKTBERICHT.json';
  while (archive.files[report] || archive.files[report + '/']) report = commonRoot + 'NEU-' + createHash('sha256').update(report).digest('hex').slice(0, 10) + '-BERICHT.json';
  archive.file(report, JSON.stringify({ ...manifest, note: 'Alle Originaldateien wurden erhalten. Nur eindeutig benannte, vollstaendige Codebloecke wurden ersetzt. Nicht gelesene Dateien bleiben unveraendert. Keine automatische Funktionspruefung oder Programmausfuehrung erfolgt.' }, null, 2));
  return { data: await archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 4 } }), manifest };
}
