import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import JSZip from 'jszip';
import { parseProjectFiles } from '../public/project-files.js';
import { buildProjectZip } from '../project-export.mjs';
import { createChatServer } from '../server.mjs';

test('recognizes filename headers, filename first lines and path comments without losing indentation', () => {
  const parsed = parseProjectFiles('```text\nprojekt/\n └─ cogs/\n```\n```python\nfilename=cogs/menu.py\nclass Menu:\n    def run(self):\n        return 1\n```\n```python filename=bot.py\nprint("Hallo")\n```\n```python\n# utils/design.py\ncolor = 1\n```');
  assert.deepEqual(parsed.files.map(f => f.name), ['cogs/menu.py', 'bot.py', 'utils/design.py']);
  assert.equal(parsed.files[0].blockIndex, 1);
  assert.equal(parsed.files[0].content, 'class Menu:\n    def run(self):\n        return 1');
  assert.ok(parsed.files.every(f => f.explicit));
  assert.equal(parseProjectFiles('```py filename=./bot.py\nx = 1\n```').files[0].name, 'bot.py');
  assert.equal(parseProjectFiles('```py filename=cogs\\menu.py\nx = 1\n```').files[0].name, 'cogs/menu.py');
});
test('does not export truncated code blocks or unsafe paths as complete files', () => {
  const result = parseProjectFiles('```python filename=bot.py\nprint("fertig")\n```\n```python filename=cogs/menu.py\nclass Menu:\n    def');
  assert.equal(result.files.length, 1); assert.deepEqual(result.unfinished, ['cogs/menu.py']);
  assert.equal(parseProjectFiles('```js filename=../../escape.js\nx\n```').files.length, 0);
  assert.equal(parseProjectFiles('```text\nordner/\n  bot.py\n```').files.length, 0);
});
const entry = (name, data) => ({ name, data: Buffer.from(data).toString('base64'), directory: false });
test('whole project export preserves untouched binary/config files and empty folders', async () => {
  const binary = Buffer.from([0, 255, 128, 10, 0, 66]);
  const original = { entries: [entry('USHERO/cogs/menu.py', 'old menu'), entry('USHERO/bot.py', 'old bot'), entry('USHERO/.env', 'PRIVATE-CONFIG-NOT-A-REAL-KEY'), entry('USHERO/data/bot.db', binary), { name: 'USHERO/cache/', data: '', directory: true }] };
  const { data, manifest } = await buildProjectZip(original, [{ name: 'cogs/menu.py', content: 'new menu', explicit: true }, { name: 'utils/helper.py', content: 'helper', explicit: true }], 'USHERO.zip');
  const zip = await JSZip.loadAsync(data);
  assert.equal(await zip.file('USHERO/cogs/menu.py').async('string'), 'new menu');
  assert.equal(await zip.file('USHERO/bot.py').async('string'), 'old bot');
  assert.equal(await zip.file('USHERO/.env').async('string'), 'PRIVATE-CONFIG-NOT-A-REAL-KEY');
  assert.deepEqual(await zip.file('USHERO/data/bot.db').async('nodebuffer'), binary);
  assert.ok(zip.files['USHERO/cache/'].dir); assert.equal(await zip.file('USHERO/utils/helper.py').async('string'), 'helper');
  assert.equal(manifest.originalFiles, 4); assert.deepEqual(manifest.updated, ['USHERO/cogs/menu.py']); assert.equal(manifest.unchanged.length, 3);
  assert.equal(JSON.parse(await zip.file('USHERO/NEU-PROJEKTBERICHT.json').async('string')).tested, false);
});
test('latest complete version wins across canonical/relative paths, ambiguity is rejected', async () => {
  const original = { entries: [entry('app/cogs/menu.py', 'original')] };
  const result = await buildProjectZip(original, [{ name: 'app/cogs/menu.py', content: 'first', explicit: true }, { name: 'cogs/menu.py', content: 'latest', explicit: true }]);
  const zip = await JSZip.loadAsync(result.data); assert.equal(await zip.file('app/cogs/menu.py').async('string'), 'latest');
  await assert.rejects(buildProjectZip({ entries: [entry('root/a/config.json', '{}'), entry('root/b/config.json', '{}')] }, [{ name: 'config.json', content: '{}', explicit: true }]), /mehrdeutig/);
  await assert.rejects(buildProjectZip(original, [{ name: '../escape.py', content: 'x', explicit: true }]));
  await assert.rejects(buildProjectZip(original, [{ name: 'datei-1.py', content: 'x', explicit: false }]), /eindeutigen/);
  await assert.rejects(buildProjectZip(undefined, [{ name: 'a', content: 'x' }, { name: 'a/b.py', content: 'x' }]), /Ordnerkonflikt/);
});
test('archive upload can be downloaded with all originals, without forwarding private unparsed contents', async t => {
  const listen = s => new Promise(resolve => s.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${s.address().port}`)));
  let sent;
  const gateway = http.createServer(async (req, res) => {
    let value = ''; for await (const part of req) value += part; sent = JSON.parse(value);
    res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.end('data: [DONE]\n\n');
  });
  const url = await listen(gateway); const server = createChatServer({ gateway: url, apiKey: 'test-project-key', configFile: '/tmp/no-project-config-' + Math.random() });
  const base = await listen(server); const page = await fetch(base); await page.text();
  const headers = { Cookie: page.headers.get('set-cookie').split(';')[0], Origin: base };
  t.after(async () => { for (const s of [server, gateway]) { s.closeAllConnections(); await new Promise(r => s.close(r)); } });
  const original = new JSZip(); original.file('bot/bot.py', 'print("original")'); original.file('bot/.env', 'PRIVATE-UPLOAD-CONTENT'); original.file('bot/data/db.bin', new Uint8Array([0, 255, 17])); original.folder('bot/cache');
  const form = new FormData(); form.append('files', new Blob([await original.generateAsync({ type: 'uint8array' })]), 'USHERO.zip');
  const uploaded = await fetch(base + '/api/attachments', { method: 'POST', headers, body: form }).then(r => r.json());
  const attachment = uploaded.attachments[0]; assert.equal(attachment.project.files.length, 3); assert.ok(!JSON.stringify(uploaded).includes('PRIVATE-UPLOAD-CONTENT'));
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };
  await (await fetch(base + '/api/chat', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ model: 'auto', messages: [{ role: 'user', content: 'Verbessern', attachments: [attachment.id] }] }) })).text();
  assert.ok(!JSON.stringify(sent).includes('PRIVATE-UPLOAD-CONTENT')); assert.match(JSON.stringify(sent), /bot\/.env/);
  const response = await fetch(base + '/api/project-zip', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ attachmentId: attachment.id, files: [{ name: 'bot.py', content: 'print("updated")', explicit: true }] }) });
  assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'application/zip'); assert.equal(response.headers.get('x-neu-original-files'), '3');
  const zip = await JSZip.loadAsync(await response.arrayBuffer()); assert.equal(await zip.file('bot/bot.py').async('string'), 'print("updated")'); assert.equal(await zip.file('bot/.env').async('string'), 'PRIVATE-UPLOAD-CONTENT');
  assert.deepEqual(await zip.file('bot/data/db.bin').async('uint8array'), new Uint8Array([0, 255, 17])); assert.ok(zip.files['bot/cache/']);
  await fetch(base + '/api/attachments/' + attachment.id, { method: 'DELETE', headers });
  const missing = await fetch(base + '/api/project-zip', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ attachmentId: attachment.id, files: [] }) }); assert.equal(missing.status, 409);
});
