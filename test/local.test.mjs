import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createChatServer } from '../server.mjs';
const listen = s => new Promise(r => s.listen(0, '127.0.0.1', () => r(`http://127.0.0.1:${s.address().port}`)));
async function fixture(t) {
  let gatewayCalls = 0; let localCalls = 0;
  const gateway = http.createServer((req, res) => { gatewayCalls++; res.writeHead(500); res.end('{}'); });
  const local = http.createServer(async (req, res) => {
    assert.equal(req.headers.authorization, undefined);
    if (req.url === '/api/tags') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ models: [{ name: 'qwen-local' }, { name: 'remote-alias' }, { name: 'model:cloud' }] })); }
    let text = ''; for await (const chunk of req) text += chunk; const data = JSON.parse(text);
    if (req.url === '/api/show') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(data.model === 'remote-alias' ? { remote_host: 'https://ollama.com', remote_model: 'cloud' } : { model_info: { parameters: 1 }, details: { format: 'gguf' }, capabilities: ['completion'] })); }
    localCalls++; assert.equal(data.model, 'qwen-local');
    res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.end('data: {"choices":[{"delta":{"content":"Lokal"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n');
  });
  const gatewayUrl = await listen(gateway); const localUrl = await listen(local);
  const server = createChatServer({ gateway: gatewayUrl, localEndpoint: localUrl, apiKey: 'must-not-leak-to-local', configFile: '/tmp/no-local-config-' + Math.random() });
  const base = await listen(server); const page = await fetch(base); await page.text();
  const headers = { Cookie: page.headers.get('set-cookie').split(';')[0], Origin: base, 'Content-Type': 'application/json' };
  t.after(async () => { for (const s of [server, gateway, local]) { s.closeAllConnections(); await new Promise(r => s.close(r)); } });
  return { base, headers, local, counters: () => ({ gatewayCalls, localCalls }), chat: (extra = {}) => fetch(base + '/api/chat', { method: 'POST', headers, body: JSON.stringify({ model: 'auto', messages: [{ role: 'user', content: 'Hallo' }], ...extra }) }) };
}
test('default route is local, works without gateway credentials and sends no API key', async t => {
  const f = await fixture(t);
  const status = await fetch(f.base + '/api/status', { headers: f.headers }).then(r => r.json()); assert.equal(status.source, 'local'); assert.ok(!status.models.some(m => m.id.includes('cloud')));
  const response = await f.chat(); assert.equal(response.status, 200); assert.match(await response.text(), /Lokal/);
  assert.deepEqual(f.counters(), { gatewayCalls: 0, localCalls: 1 });
});
test('cloud aliases and image-provider calls are blocked in default local mode', async t => {
  const f = await fixture(t);
  const remote = await f.chat({ model: 'remote-alias' }); assert.equal(remote.status, 409); assert.match((await remote.json()).error, /Cloud/);
  const image = await fetch(f.base + '/api/images', { method: 'POST', headers: f.headers, body: JSON.stringify({ prompt: 'Ein Bild' }) }); assert.equal(image.status, 409); await image.text();
  assert.deepEqual(f.counters(), { gatewayCalls: 0, localCalls: 0 });
});
test('unavailable local engine never silently falls back to the configured gateway', async t => {
  const f = await fixture(t); await new Promise(r => f.local.close(r));
  const result = await f.chat(); assert.equal(result.status, 409); assert.match((await result.json()).error, /Ollama/);
  assert.equal(f.counters().gatewayCalls, 0);
});
