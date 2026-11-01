import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(here, 'public');
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/icon.svg', ['icon.svg', 'image/svg+xml']],
]);

export function createChatServer(options = {}) {
  const gateway = options.gateway ?? 'http://127.0.0.1:3001';
  // Only the trusted launcher may set the gateway; never accept URLs from browser input.
  const destination = new URL(gateway);
  if (destination.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(destination.hostname)) {
    throw new Error('Gateway muss lokal auf diesem Computer laufen.');
  }
  const configFile = options.configFile ?? path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), '.config'), 'NeuChat', 'gateway.json');
  const session = randomBytes(32).toString('hex');
  let savedKey = '';
  let configError = false;
  const keyReady = fs.readFile(configFile, 'utf8').then(s => { savedKey = JSON.parse(s).key ?? ''; }).catch(error => {
    if (error.code !== 'ENOENT') configError = true;
  });

  async function key() {
    await keyReady;
    if (configError) throw new Error('Die lokale Schluesseldatei ist nicht lesbar.');
    if (options.apiKey) return options.apiKey;
    if (process.env.FREELLMAPI_API_KEY) return process.env.FREELLMAPI_API_KEY;
    if (savedKey) return savedKey;
    if (process.env.NEU_CHAT_ADMIN_FILE) {
      const { admin } = JSON.parse(await fs.readFile(process.env.NEU_CHAT_ADMIN_FILE, 'utf8'));
      const login = await fetch(gateway + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(admin), signal: AbortSignal.timeout(10000) });
      if (!login.ok) throw new Error('Cloud-Anmeldung am Gateway fehlgeschlagen.');
      const { token } = await login.json();
      try {
        const res = await fetch(gateway + '/api/settings/api-key', { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error('Gateway-Schluessel konnte nicht geladen werden.');
        return (await res.json()).apiKey;
      } finally {
        await fetch(gateway + '/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) }).catch(() => {});
      }
    }
    return '';
  }
  const json = (res, code, value) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
  async function body(req) {
    if (!req.headers['content-type']?.startsWith('application/json')) throw Object.assign(new Error('JSON erwartet.'), { status: 415 });
    const chunks = []; let length = 0;
    for await (const chunk of req) {
      chunks.push(chunk); length += chunk.length;
      if (length > 131072) throw Object.assign(new Error('Nachricht ist zu lang.'), { status: 413 });
    }
    const text = Buffer.concat(chunks).toString('utf8');
    try { return JSON.parse(text); } catch { throw Object.assign(new Error('Ungueltiges JSON.'), { status: 400 }); }
  }
  function gatewayError(status) {
    if (status === 401 || status === 403) return 'FreeLLMAPI-Schluessel ungueltig. Unter Verbindung neu hinterlegen.';
    if (status === 429) return 'Alle passenden Modelle sind gerade ausgelastet. Bitte spaeter erneut versuchen oder einen weiteren Anbieter verbinden.';
    if (status === 503) return 'Kein passendes Modell bereit. Pruefe Anbieter und Fallback-Kette im FreeLLMAPI-Dashboard.';
    return 'Der Gateway konnte die Anfrage nicht abschliessen. Pruefe das FreeLLMAPI-Dashboard.';
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const port = server.address()?.port;
    const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
    if (!hosts.includes(req.headers.host)) return json(res, 403, { error: 'Unzulaessiger Host.' });
    const url = new URL(req.url, `http://${req.headers.host}`);
    const authenticated = (req.headers.cookie ?? '').split(';').some(c => c.trim() === `neu_session=${session}`);
    if (url.pathname.startsWith('/api/')) {
      if (!authenticated) return json(res, 403, { error: 'Bitte die Chat-Seite neu laden.' });
      if (req.method !== 'GET' && req.headers.origin !== `http://${req.headers.host}`) return json(res, 403, { error: 'Unzulaessiger Ursprung.' });
    }
    try {
      if (req.method === 'GET' && assets.has(url.pathname)) {
        const [name, type] = assets.get(url.pathname);
        const data = await fs.readFile(path.join(publicDir, name));
        if (url.pathname === '/') res.setHeader('Set-Cookie', `neu_session=${session}; HttpOnly; SameSite=Strict; Path=/`);
        res.writeHead(200, { 'Content-Type': type }); return res.end(data);
      }
      if (req.method === 'POST' && url.pathname === '/api/connection') {
        const input = await body(req);
        if (typeof input.key !== 'string' || input.key.length < 8 || input.key.length > 512 || /[\s\x00-\x1f]/.test(input.key)) return json(res, 400, { error: 'Bitte den zentralen FreeLLMAPI-Schluessel eingeben.' });
        const check = await fetch(gateway + '/v1/models', { headers: { Authorization: `Bearer ${input.key}` }, signal: AbortSignal.timeout(15000) });
        if (!check.ok) return json(res, check.status, { error: gatewayError(check.status) });
        const catalog = await check.json();
        if (!Array.isArray(catalog.data)) return json(res, 502, { error: 'Der lokale Dienst liefert keinen Modellkatalog.' });
        if (options.apiKey || process.env.FREELLMAPI_API_KEY || process.env.NEU_CHAT_ADMIN_FILE) return json(res, 409, { error: 'Diese Verbindung wird durch die Laufzeit konfiguriert.' });
        await fs.mkdir(path.dirname(configFile), { recursive: true, mode: 0o700 });
        await fs.writeFile(configFile, JSON.stringify({ key: input.key }), { mode: 0o600 });
        savedKey = input.key;
        return json(res, 200, { configured: true });
      }
      if (req.method === 'GET' && url.pathname === '/api/status') {
        const apiKey = await key();
        if (!apiKey) return json(res, 200, { configured: false, ready: false, models: [] });
        const response = await fetch(gateway + '/v1/models?available=true', { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(15000) });
        if (!response.ok) return json(res, response.status, { error: gatewayError(response.status) });
        const catalog = await response.json();
        const readiness = await fetch(gateway + '/readyz', { signal: AbortSignal.timeout(10000) });
        const models = (catalog.data ?? []).filter(m => typeof m.id === 'string' && m.available !== false && (m.owned_by !== 'freellmapi' || m.id === 'auto' || m.id.startsWith('auto:'))).map(m => ({ id: m.id, name: m.name ?? m.id }));
        return json(res, 200, { configured: true, ready: readiness.ok, models });
      }
      if (req.method === 'POST' && url.pathname === '/api/chat') {
        const input = await body(req);
        if (typeof input.model !== 'string' || input.model.length > 200 || !Array.isArray(input.messages) || !input.messages.length || input.messages.length > 80 || !input.messages.every(m => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.length > 0 && m.content.length <= 20000) || input.messages.at(-1).role !== 'user') return json(res, 400, { error: 'Ungueltige oder zu lange Chat-Nachrichten.' });
        const apiKey = await key();
        if (!apiKey) return json(res, 401, { error: 'Bitte zuerst den FreeLLMAPI-Schluessel unter Verbindung hinterlegen.' });
        const abort = new AbortController();
        res.on('close', () => { if (!res.writableEnded) abort.abort(); });
        const response = await fetch(gateway + '/v1/chat/completions', {
          method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: input.model, messages: [{ role: 'system', content: 'Du bist ein hilfreicher KI-Assistent. Antworte auf Deutsch, sofern keine andere Sprache gewuenscht ist.' }, ...input.messages], max_tokens: 2048, stream: true }),
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(120000)]),
        });
        if (!response.ok) { await response.body?.cancel(); return json(res, response.status, { error: gatewayError(response.status) }); }
        if (!response.headers.get('content-type')?.includes('text/event-stream')) { await response.body?.cancel(); return json(res, 502, { error: 'Gateway liefert kein unterstuetztes Antwortformat.' }); }
        res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'X-Accel-Buffering': 'no' });
        for await (const chunk of response.body) {
          if (!res.write(chunk)) await new Promise(resolve => { res.once('drain', resolve); res.once('close', resolve); });
          if (res.destroyed) break;
        }
        return res.end();
      }
      return json(res, 404, { error: 'Nicht gefunden.' });
    } catch (error) {
      // Do not echo upstream errors: they can contain credentials or request contents.
      if (res.headersSent) return res.destroy();
      return json(res, error.status ?? 502, { error: error.status ? error.message : 'Verbindung unterbrochen. Laeuft FreeLLMAPI im anderen Fenster? Bitte erneut versuchen.' });
    }
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.NEU_CHAT_PORT ?? 3210);
  const server = createChatServer();
  server.listen(port, '127.0.0.1', () => console.log(`Neu Chat gestartet auf Port ${port}. Dieses Fenster offen lassen.`));
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} ist bereits belegt. Der Chat laeuft eventuell schon.` : 'Chat konnte nicht gestartet werden.'); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(); server.closeAllConnections(); });
}
