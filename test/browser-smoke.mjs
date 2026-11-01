import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import JSZip from 'jszip';
import { createChatServer } from '../server.mjs';

const listen = s => new Promise(resolve => s.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${s.address().port}`)));
const code = '## Fertiges Projekt\n\n```html filename=index.html\n<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><h1>Mein Projekt</h1><button id="count">0</button><script src="app.js"></script></body></html>\n```\n\n```css filename=style.css\nbody { background: #e9f7d9; color: #173208; }\n```\n\n```javascript filename=app.js\ndocument.getElementById("count").onclick = e => e.target.textContent = String(Number(e.target.textContent) + 1);\n```';
let answer = code; let imageStatus = 200; let lastRequest;
const png = (await sharp({ create: { width: 24, height: 24, channels: 3, background: 'blue' } }).png().toBuffer()).toString('base64');
const gateway = http.createServer(async (req, res) => {
  if (req.url === '/readyz') { res.setHeader('Content-Type', 'application/json'); return res.end('{"status":"ok"}'); }
  if (req.headers.authorization !== 'Bearer browser-test-key') { res.writeHead(401); return res.end('{}'); }
  if (req.url.startsWith('/v1/models')) { res.setHeader('Content-Type', 'application/json'); return res.end('{"data":[{"id":"auto","available":true}]}'); }
  let body = ''; for await (const chunk of req) body += chunk; lastRequest = JSON.parse(body || '{}');
  if (req.url === '/v1/images/generations') { res.writeHead(imageStatus, { 'Content-Type': 'application/json' }); return res.end(imageStatus === 200 ? JSON.stringify({ data: [{ b64_json: png }], model: 'test-image' }) : '{"error":{"message":"no models"}}'); }
  res.writeHead(200, { 'Content-Type': 'text/event-stream' });
  res.end('data: ' + JSON.stringify({ model: 'test-code', choices: [{ delta: { content: answer }, finish_reason: 'stop' }] }) + '\n\ndata: [DONE]\n\n');
});
const gatewayUrl = await listen(gateway);
const server = createChatServer({ gateway: gatewayUrl, apiKey: 'browser-test-key', configFile: path.join(os.tmpdir(), 'no-browser-test-config-' + Math.random()) });
const base = await listen(server);
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'neu-browser-'));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, acceptDownloads: true });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(base); await page.waitForFunction(() => document.querySelector('#status').textContent === 'Verbunden');
  await page.locator('#mode').selectOption('code');
  await page.locator('#files').setInputFiles({ name: 'idee.txt', mimeType: 'text/plain', buffer: Buffer.from('Baue einen Zaehler.') });
  await page.waitForFunction(() => document.querySelectorAll('.attachment').length === 1 && !document.querySelector('#attach').disabled);
  await page.locator('#prompt').fill('Erstelle ein fertiges Projekt.'); await page.locator('#send').click();
  await page.waitForFunction(() => !document.querySelector('#send').disabled);
  assert.equal(await page.locator('.assistant pre').count(), 3);
  assert.match(lastRequest.messages[0].content, /Programmiermodus/);
  const download = page.waitForEvent('download'); await page.getByText('↓ Projekt als ZIP', { exact: true }).click();
  const zipFile = await download; await zipFile.saveAs(path.join(temp, 'project.zip'));
  const zip = await JSZip.loadAsync(await fs.readFile(path.join(temp, 'project.zip')));
  assert.ok(zip.file('index.html')); assert.match(await zip.file('app.js').async('string'), /onclick/);
  await page.getByText('◉ HTML-Vorschau', { exact: true }).click();
  const frame = page.frameLocator('#preview-frame'); await frame.locator('#count').click(); assert.equal(await frame.locator('#count').innerText(), '1');
  const isolated = await frame.locator('body').evaluate(() => { try { return parent.document.body.innerHTML; } catch { return 'isolated'; } }); assert.equal(isolated, 'isolated');
  const network = await frame.locator('body').evaluate(async () => { try { await fetch('/api/status'); return 'unexpected'; } catch { return 'blocked'; } }); assert.equal(network, 'blocked');
  await page.locator('#close-preview').click();
  answer = '<img src=x onerror="window.pwned=1"><script>window.pwned=2</script>\n**Sicherer Text**';
  await page.locator('#prompt').fill('Sicherheitstest'); await page.locator('#send').click(); await page.waitForFunction(() => !document.querySelector('#send').disabled);
  assert.equal(await page.locator('.assistant').last().locator('img,script').count(), 0); assert.equal(await page.evaluate(() => window.pwned), undefined);
  await page.locator('#mode').selectOption('image'); await page.locator('#prompt').fill('Ein blaues Bild'); await page.locator('#send').click();
  await page.waitForFunction(() => !document.querySelector('#send').disabled); assert.equal(await page.locator('.generated-image').count(), 1);
  imageStatus = 503; await page.locator('#prompt').fill('Ein weiteres Bild'); await page.locator('#send').click(); await page.waitForFunction(() => !document.querySelector('#send').disabled); assert.match(await page.locator('#notice').textContent(), /Bildmodell/);
  await page.locator('#mode').selectOption('code'); await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: path.join(temp, 'mobile.png'), fullPage: true });
  await page.route('**/healthz', route => route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"Nicht gefunden."}' }));
  await page.reload(); await page.waitForFunction(() => !document.querySelector('#notice').hidden);
  await page.locator('#files').setInputFiles({ name: 'test.txt', mimeType: 'text/plain', buffer: Buffer.from('Test') });
  await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('Start.cmd'));
  assert.ok(!(await page.locator('#notice').textContent()).trim().startsWith('Nicht gefunden.'));
  assert.deepEqual(errors, []);
  console.log('Browser OK: upload, Markdown, project ZIP, interactive isolated preview, HTML sanitization, images/errors, mobile layout and old-server recovery message.');
} finally {
  await browser.close(); for (const s of [server, gateway]) { s.closeAllConnections(); await new Promise(r => s.close(r)); }
  await fs.rm(temp, { recursive: true, force: true });
}
