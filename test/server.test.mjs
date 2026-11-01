import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createChatServer } from '../server.mjs';

const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`)));
async function fixture(t, options = {}) {
  let mode = 'ok'; const received = [];
  const upstream = http.createServer(async (req, res) => {
    if (req.headers.authorization !== 'Bearer test-gateway-secret') { res.writeHead(401); return res.end('{}'); }
    if (req.url.startsWith('/v1/models')) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ data: [{ id: 'auto' }, { id: 'gemini-test', name: 'Gemini Test', available: true }, { id: 'offline', available: false }] })); }
    if (req.url === '/v1/chat/completions') {
      let body = ''; for await (const part of req) body += part; received.push(JSON.parse(body));
      if (mode !== 'ok') { res.writeHead(Number(mode)); return res.end(JSON.stringify({ error: { message: 'PRIVATE-UPSTREAM-DETAIL' } })); }
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.write('data: {"model":"gemini-test","choices":[{"delta":{"content":"Hallo 🌱"}}]}\n\n');
      return res.end('data: [DONE]\n\n');
    }
    res.writeHead(404); res.end();
  });
  const gateway = await listen(upstream);
  // readiness is intentionally public on FreeLLMAPI.
  upstream.prependListener('request', (req, res) => { if (req.url === '/readyz') { req.url = '/v1/models'; req.headers.authorization = 'Bearer test-gateway-secret'; } });
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'neu-chat-test-'));
  const configFile = path.join(dir, 'config.json');
  const server = createChatServer({ gateway, configFile, apiKey: 'test-gateway-secret', ...options });
  const base = await listen(server);
  const home = await fetch(base); await home.text();
  const cookie = home.headers.get('set-cookie').split(';')[0];
  const headers = { Cookie: cookie, Origin: base, 'Content-Type': 'application/json' };
  t.after(async () => { for (const s of [server, upstream]) { s.closeAllConnections(); await new Promise(r => s.close(r)); } await fs.rm(dir, { recursive: true, force: true }); });
  return { base, gateway, headers, configFile, received, setMode: value => { mode = value; } };
}

test('authenticated browser can list configured models without receiving credentials', async t => {
  const f = await fixture(t);
  const res = await fetch(f.base + '/api/status', { headers: f.headers });
  const text = await res.text(); const data = JSON.parse(text);
  assert.equal(res.status, 200); assert.equal(data.ready, true);
  assert.deepEqual(data.models.map(m => m.id), ['auto', 'gemini-test']);
  assert.ok(!text.includes('test-gateway-secret'));
});
test('real HTTP streaming preserves history, Unicode and auto routing', async t => {
  const f = await fixture(t);
  const messages = [{ role: 'user', content: 'Erste Frage' }, { role: 'assistant', content: 'Erste Antwort' }, { role: 'user', content: 'Grüße 🌱' }];
  const res = await fetch(f.base + '/api/chat', { method: 'POST', headers: f.headers, body: JSON.stringify({ model: 'auto', messages }) });
  assert.equal(res.status, 200); assert.match(res.headers.get('content-type'), /event-stream/);
  const text = await res.text(); assert.match(text, /Hallo 🌱/); assert.match(text, /\[DONE\]/);
  assert.deepEqual(f.received[0].messages.slice(1), messages); assert.equal(f.received[0].model, 'auto'); assert.equal(f.received[0].stream, true);
});
test('missing session, foreign origins and DNS-rebinding hosts cannot use the gateway', async t => {
  const f = await fixture(t); const payload = JSON.stringify({ model: 'auto', messages: [{ role: 'user', content: 'x' }] });
  const noSession = await fetch(f.base + '/api/status'); assert.equal(noSession.status, 403);
  const foreign = await fetch(f.base + '/api/chat', { method: 'POST', headers: { ...f.headers, Origin: 'https://evil.example' }, body: payload }); assert.equal(foreign.status, 403);
  // Node fetch normalizes Host; use a raw HTTP client to exercise the actual check.
  const badHost = await new Promise(resolve => { http.get(f.base + '/api/status', { headers: { ...f.headers, Host: 'evil.example' } }, res => { res.resume(); resolve(res.statusCode); }); }); assert.equal(badHost, 403);
  assert.equal(f.received.length, 0);
});
test('provider quota and unavailable errors remain distinct and redact upstream details', async t => {
  const f = await fixture(t);
  for (const code of [429, 503, 401]) {
    f.setMode(String(code));
    const res = await fetch(f.base + '/api/chat', { method: 'POST', headers: f.headers, body: JSON.stringify({ model: 'auto', messages: [{ role: 'user', content: 'Test' }] }) });
    assert.equal(res.status, code); const text = await res.text(); assert.ok(!text.includes('PRIVATE-UPSTREAM-DETAIL')); assert.ok(JSON.parse(text).error);
  }
});
test('rejects malformed history and prevents browser-supplied system instructions', async t => {
  const f = await fixture(t);
  for (const payload of [{ model: 'auto', messages: [] }, { model: 'auto', messages: [{ role: 'system', content: 'x' }] }, { model: 'auto', messages: [{ role: 'assistant', content: 'x' }] }]) {
    const res = await fetch(f.base + '/api/chat', { method: 'POST', headers: f.headers, body: JSON.stringify(payload) }); assert.equal(res.status, 400);
  }
  const large = await fetch(f.base + '/api/chat', { method: 'POST', headers: f.headers, body: JSON.stringify({ x: 'x'.repeat(132000) }) }); assert.equal(large.status, 413);
  assert.equal(f.received.length, 0);
});
test('first connection verifies the key, persists locally and survives restart without exposing it', async t => {
  const f = await fixture(t, { apiKey: '' });
  const status = await fetch(f.base + '/api/status', { headers: f.headers }).then(r => r.json()); assert.equal(status.configured, false);
  const bad = await fetch(f.base + '/api/connection', { method: 'POST', headers: f.headers, body: JSON.stringify({ key: 'wrong-key-value' }) }); assert.equal(bad.status, 401);
  await assert.rejects(fs.readFile(f.configFile));
  const good = await fetch(f.base + '/api/connection', { method: 'POST', headers: f.headers, body: JSON.stringify({ key: 'test-gateway-secret' }) }); assert.equal(good.status, 200); assert.deepEqual(await good.json(), { configured: true });
  assert.equal(JSON.parse(await fs.readFile(f.configFile, 'utf8')).key, 'test-gateway-secret');
  if (process.platform !== 'win32') assert.equal((await fs.stat(f.configFile)).mode & 0o777, 0o600);
  const configured = await fetch(f.base + '/api/status', { headers: f.headers }).then(r => r.json()); assert.equal(configured.configured, true);
  const restarted = createChatServer({ gateway: f.gateway, configFile: f.configFile });
  const base = await listen(restarted);
  t.after(async () => { restarted.closeAllConnections(); await new Promise(r => restarted.close(r)); });
  const page = await fetch(base); await page.text();
  const cookie = page.headers.get('set-cookie').split(';')[0];
  const restored = await fetch(base + '/api/status', { headers: { Cookie: cookie } }).then(r => r.json());
  assert.equal(restored.configured, true); assert.equal(restored.ready, true);
});
test('serves CSP-protected UI and refuses paths outside the static asset list', async t => {
  const f = await fixture(t);
  const home = await fetch(f.base); assert.match(await home.text(), /Was machen/); assert.match(home.headers.get('content-security-policy'), /frame-ancestors 'none'/); assert.match(home.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  for (const uri of ['/server.mjs', '/.env', '/Start.ps1', '/package.json']) assert.equal((await fetch(f.base + uri)).status, 404);
  assert.equal((await fetch(f.base + '/app.js')).status, 200);
});
