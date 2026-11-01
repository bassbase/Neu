import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import sharp from 'sharp';
import { createChatServer } from '../server.mjs';
import { runtimeInfo } from '../runtime-info.mjs';

const listen = s => new Promise(resolve => s.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${s.address().port}`)));
async function fixture(t) {
  const sent = []; let reply = 'image';
  const png = (await sharp({ create: { width: 16, height: 16, channels: 3, background: 'green' } }).png().toBuffer()).toString('base64');
  const gateway = http.createServer(async (req, res) => {
    if (req.headers.authorization !== 'Bearer mock-gateway-key') { res.writeHead(401); return res.end('{}'); }
    let body = ''; for await (const part of req) body += part;
    sent.push({ path: req.url, data: JSON.parse(body || '{}') });
    res.setHeader('Content-Type', 'application/json');
    if (reply === 'missing') { res.writeHead(503); return res.end(JSON.stringify({ error: { message: 'PRIVATE_DETAIL' } })); }
    if (reply === 'url') return res.end(JSON.stringify({ data: [{ url: 'http://127.0.0.1/private-secret' }] }));
    res.end(JSON.stringify({ data: [{ b64_json: png }], model: 'image-model-test', provider: 'mock' }));
  });
  const gatewayUrl = await listen(gateway);
  const server = createChatServer({ gateway: gatewayUrl, apiKey: 'mock-gateway-key', configFile: '/tmp/no-neu-workspace-config-' + Math.random() });
  const base = await listen(server); const page = await fetch(base); await page.text();
  const headers = { Cookie: page.headers.get('set-cookie').split(';')[0], Origin: base, 'Content-Type': 'application/json' };
  t.after(async () => { for (const s of [server, gateway]) { s.closeAllConnections(); await new Promise(r => s.close(r)); } });
  return { base, headers, sent, mode: mode => { reply = mode; }, post: (url, data) => fetch(base + url, { method: 'POST', headers, body: JSON.stringify(data) }) };
}
test('version handshake reports the actual running build and supported features', async t => {
  const f = await fixture(t); const response = await fetch(f.base + '/healthz');
  assert.deepEqual(await response.json(), runtimeInfo());
  const vendor = await fetch(f.base + '/vendor/purify.js'); assert.equal(vendor.status, 200);
  assert.equal((await fetch(f.base + '/node_modules/package.json')).status, 404);
});
test('image generation uses the configured gateway and returns verified PNG bytes', async t => {
  const f = await fixture(t);
  const response = await f.post('/api/images', { prompt: 'Ein gruener Garten' }); assert.equal(response.status, 200);
  const data = await response.json(); assert.match(data.image, /^data:image\/png;base64,/); assert.equal(data.model, 'image-model-test');
  const metadata = await sharp(Buffer.from(data.image.split(',')[1], 'base64')).metadata(); assert.equal(metadata.format, 'png');
  assert.equal(f.sent[0].path, '/v1/images/generations'); assert.equal(f.sent[0].data.n, 1); assert.equal(f.sent[0].data.prompt, 'Ein gruener Garten');
  assert.ok(!JSON.stringify(data).includes('mock-gateway-key'));
});
test('missing image providers and remote-only image URLs do not become fake successes or SSRF', async t => {
  const f = await fixture(t); f.mode('missing');
  const unavailable = await f.post('/api/images', { prompt: 'Ein Bild' }); assert.equal(unavailable.status, 503);
  const error = await unavailable.json(); assert.match(error.error, /Bildmodell/); assert.ok(!error.error.includes('PRIVATE_DETAIL'));
  f.mode('url'); const remote = await f.post('/api/images', { prompt: 'Ein Bild' }); assert.equal(remote.status, 502); await remote.text();
  assert.equal(f.sent.length, 2); // no server-side fetch of the supplied URL
});
test('preview HTML lives in a separate restrictive sandbox and needs same-origin creation', async t => {
  const f = await fixture(t);
  const created = await f.post('/api/preview', { html: '<h1>Demo</h1><script>document.title="Demo"</script>' });
  const data = await created.json(); assert.match(data.url, /^\/preview\/[a-f0-9]+$/);
  const preview = await fetch(f.base + data.url); assert.equal(preview.status, 200);
  const csp = preview.headers.get('content-security-policy'); assert.match(csp, /sandbox allow-scripts/); assert.match(csp, /connect-src 'none'/); assert.match(csp, /frame-src 'none'/);
  assert.ok(!csp.includes('allow-same-origin')); assert.match(await preview.text(), /<h1>Demo/);
  const invalid = await f.post('/api/preview', { html: 'x'.repeat(270000) }); assert.equal(invalid.status, 413);
  const foreign = await fetch(f.base + '/api/preview', { method: 'POST', headers: { ...f.headers, Origin: 'https://foreign.example' }, body: JSON.stringify({ html: '<p>no</p>' }) }); assert.equal(foreign.status, 403);
});
