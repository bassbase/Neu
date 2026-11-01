import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import JSZip from 'jszip';
import ffmpeg from 'ffmpeg-static';
import { createChatServer } from '../server.mjs';
import { inspectFile } from '../attachments.mjs';

const run = promisify(execFile);
const listen = s => new Promise(resolve => s.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${s.address().port}`)));
async function fixture(t) {
  const sent = []; let failVision = false;
  const gateway = http.createServer(async (req, res) => {
    if (req.url !== '/v1/chat/completions') { res.writeHead(404); return res.end(); }
    assert.equal(req.headers.authorization, 'Bearer local-test-key');
    let input = ''; for await (const chunk of req) input += chunk;
    sent.push(JSON.parse(input));
    if (failVision) { res.writeHead(422, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: { code: 'no_vision_model' } })); }
    res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.end('data: {"choices":[{"delta":{"content":"Gelesen"}}]}\n\ndata: [DONE]\n\n');
  });
  const gatewayUrl = await listen(gateway);
  const server = createChatServer({ gateway: gatewayUrl, apiKey: 'local-test-key', configFile: '/tmp/neu-test-no-config-' + Math.random() });
  const base = await listen(server); const home = await fetch(base); await home.text();
  const headers = { Cookie: home.headers.get('set-cookie').split(';')[0], Origin: base };
  t.after(async () => { for (const s of [server, gateway]) { s.closeAllConnections(); await new Promise(r => s.close(r)); } });
  async function upload(files) {
    const data = new FormData(); for (const [name, bytes] of files) data.append('files', new Blob([bytes]), name);
    const response = await fetch(base + '/api/attachments', { method: 'POST', headers, body: data });
    return { status: response.status, ...await response.json() };
  }
  async function chat(ids) {
    return fetch(base + '/api/chat', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'gateway', model: 'auto', messages: [{ role: 'user', content: 'Bitte verbessern.', attachments: ids }] }) });
  }
  return { base, headers, sent, upload, chat, noVision: () => { failVision = true; } };
}
test('multipart text and image reach the gateway as text and real image parts', async t => {
  const f = await fixture(t);
  const png = await sharp({ create: { width: 32, height: 32, channels: 3, background: 'red' } }).png().toBuffer();
  const response = await f.upload([['beispiel.js', 'const grüße = "Hallo";'], ['bild.png', png]]);
  assert.equal(response.status, 200); assert.equal(response.attachments.length, 2); assert.deepEqual(response.errors, []);
  assert.equal(response.attachments[1].images, 1); assert.ok(!JSON.stringify(response).includes('base64'));
  const res = await f.chat(response.attachments.map(a => a.id)); assert.equal(res.status, 200); await res.text();
  const content = f.sent[0].messages.at(-1).content;
  assert.ok(content.some(p => p.type === 'text' && p.text.includes('const grüße')));
  assert.ok(content.some(p => p.type === 'image_url' && p.image_url.url.startsWith('data:image/jpeg;base64,')));
  const removed = await fetch(f.base + '/api/attachments/' + response.attachments[0].id, { method: 'DELETE', headers: f.headers }); assert.equal(removed.status, 200);
  const missing = await f.chat([response.attachments[0].id]); assert.equal(missing.status, 409); await missing.text();
});
test('ZIP contents are read without executing programs; traversal and archive bombs are rejected', async t => {
  const f = await fixture(t);
  const zip = new JSZip(); zip.file('projekt/readme.md', 'Eine gute Projektidee'); zip.file('programm.exe', Buffer.from([0, 1, 2]));
  const good = await f.upload([['projekt.zip', await zip.generateAsync({ type: 'nodebuffer' })]]);
  assert.equal(good.attachments.length, 1); assert.match(good.attachments[0].warnings.join(' '), /programm.exe/);
  await (await f.chat([good.attachments[0].id])).text(); assert.match(JSON.stringify(f.sent), /gute Projektidee/);
  const traversal = new JSZip(); traversal.file('../escape.txt', 'nicht lesen');
  const bad = await f.upload([['pfad.zip', await traversal.generateAsync({ type: 'nodebuffer' })]]); assert.equal(bad.attachments.length, 0); assert.equal(bad.errors.length, 1);
  const bomb = new JSZip(); bomb.file('gross.txt', 'A'.repeat(16 * 1024 * 1024));
  const big = await f.upload([['gross.zip', await bomb.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })]]); assert.equal(big.attachments.length, 0); assert.match(big.errors[0].error, /gross|groß/i);
});
test('RAR fixture is actually decoded and encrypted RAR is refused', async () => {
  const data = await fs.readFile(new URL('./fixtures/folders.rar', import.meta.url));
  const result = await inspectFile({ name: 'projekt.rar', data }); assert.match(result.text, /long.txt/); assert.equal(result.truncated, true); assert.ok(result.text.length <= 40000);
  const encrypted = await fs.readFile(new URL('./fixtures/encrypted.rar', import.meta.url));
  await assert.rejects(inspectFile({ name: 'privat.rar', data: encrypted }));
});
function pdf() {
  const content = 'BT /F1 16 Tf 40 160 Td (Hallo aus PDF) Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
  let result = '%PDF-1.4\n'; const offsets = [0];
  for (let n = 0; n < objects.length; n++) { offsets.push(Buffer.byteLength(result)); result += `${n + 1} 0 obj\n${objects[n]}\nendobj\n`; }
  const xref = Buffer.byteLength(result); result += `xref\n0 6\n0000000000 65535 f \n` + offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('') + `trailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(result);
}
test('PDF and DOCX yield real text, not filenames masquerading as analyzed content', async () => {
  const result = await inspectFile({ name: 'test.pdf', data: pdf() }); assert.match(result.text, /Hallo aus PDF/);
  const doc = new JSZip();
  doc.file('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  doc.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  doc.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Hallo aus Word</w:t></w:r></w:p></w:body></w:document>');
  const word = await inspectFile({ name: 'test.docx', data: await doc.generateAsync({ type: 'nodebuffer' }) }); assert.match(word.text, /Hallo aus Word/);
});
test('video produces sampled images and explicitly does not claim audio analysis', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'neu-video-test-')); t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'clip.mp4');
  await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=blue:s=64x64:d=1', '-threads', '1', '-pix_fmt', 'yuv420p', file], { timeout: 10000 });
  const result = await inspectFile({ name: 'clip.mp4', data: await fs.readFile(file) }); assert.equal(result.images.length, 1); assert.match(result.summary, /kein Ton/); assert.match(result.images[0], /^data:image\/jpeg;base64,/);
});
test('upload rejects unsupported binaries, excess file count and missing browser authorization', async t => {
  const f = await fixture(t);
  const binary = await f.upload([['programm.exe', Buffer.from([0, 1, 2])]]); assert.equal(binary.attachments.length, 0); assert.match(binary.errors[0].error, /Format/);
  const many = await f.upload(Array.from({ length: 6 }, (_, i) => [`${i}.txt`, 'Test'])); assert.equal(many.status, 413);
  const oversized = await f.upload([['gross.txt', Buffer.alloc(25 * 1024 * 1024 + 1, 65)]]); assert.equal(oversized.status, 413);
  const noAuth = await fetch(f.base + '/api/attachments', { method: 'POST', body: new FormData() }); assert.equal(noAuth.status, 403);
});
test('missing vision capability is explained rather than silently discarding images', async t => {
  const f = await fixture(t); f.noVision();
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'blue' } }).png().toBuffer();
  const upload = await f.upload([['bild.png', png]]);
  const response = await f.chat([upload.attachments[0].id]); assert.equal(response.status, 422); assert.match((await response.json()).error, /Bildmodell/);
});
