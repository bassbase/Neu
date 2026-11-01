const $ = selector => document.querySelector(selector);
const messages = [];
let busy = false;
let controller;
let configured = false;
const dialog = $('#settings');
function notice(text) { $('#notice').textContent = text; $('#notice').hidden = !text; }
async function api(path, options) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Die Verbindung ist fehlgeschlagen.');
  return data;
}
async function refresh() {
  try {
    const data = await api('/api/status');
    configured = data.configured;
    $('#status').textContent = data.ready ? 'Verbunden' : configured ? 'Anbieter prüfen' : 'Schlüssel fehlt';
    $('#status').classList.toggle('ready', data.ready);
    const selected = $('#model').value;
    $('#model').replaceChildren(new Option('Automatisch · mit Fallback', 'auto'));
    for (const model of data.models) if (!['auto', 'fusion'].includes(model.id)) $('#model').add(new Option(model.name, model.id));
    if ([...$('#model').options].some(o => o.value === selected)) $('#model').value = selected;
    if (!configured) dialog.showModal();
    else if (!data.ready) notice('FreeLLMAPI ist verbunden, aber noch kein Anbieter bereit. Prüfe deinen Google-Schlüssel im Dashboard.');
    else notice('');
  } catch (error) {
    $('#status').textContent = 'Verbindung prüfen';
    $('#status').classList.remove('ready');
    notice(error.message);
  }
}
function addMessage(role, content) {
  $('#welcome').hidden = true;
  const article = document.createElement('article');
  article.className = `message ${role}`;
  const byline = document.createElement('div'); byline.className = 'byline';
  const name = document.createElement('span'); name.textContent = role === 'user' ? 'Du' : '✦ Neu';
  const model = document.createElement('span'); model.className = 'model';
  const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'copy'; copy.textContent = 'Kopieren';
  const text = document.createElement('div'); text.className = 'text'; text.textContent = content;
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text.textContent); copy.textContent = 'Kopiert'; setTimeout(() => copy.textContent = 'Kopieren', 1500); }
    catch { notice('Kopieren nicht erlaubt. Markiere den Text und nutze Strg+C.'); }
  });
  byline.append(name, model, copy); article.append(byline, text); $('#messages').append(article);
  return { article, text, model };
}
function scroll() { $('#conversation').scrollTop = $('#conversation').scrollHeight; }
function setBusy(value) {
  busy = value; $('#send').disabled = value; $('#stop').hidden = !value; $('#model').disabled = value; $('#new-chat').disabled = value;
}
async function send(event) {
  event.preventDefault();
  if (busy) return;
  const content = $('#prompt').value.trim();
  if (!content) return;
  if (!configured) { dialog.showModal(); return; }
  if (messages.length >= 78) { notice('Dieser Chat ist sehr lang. Starte bitte einen neuen Chat.'); return; }
  notice(''); setBusy(true);
  const history = [...messages, { role: 'user', content }];
  addMessage('user', content);
  $('#prompt').value = ''; $('#prompt').style.height = '';
  const output = addMessage('assistant', 'Denkt nach …'); output.article.classList.add('pending'); scroll();
  controller = new AbortController();
  let answer = ''; let done = false;
  try {
    const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: $('#model').value, messages: history }), signal: controller.signal });
    if (!response.ok) throw new Error((await response.json()).error ?? 'Anfrage fehlgeschlagen.');
    const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
    async function line(value) {
      if (!value.startsWith('data:')) return;
      const raw = value.slice(5).trim();
      if (raw === '[DONE]') { done = true; return; }
      if (!raw) return;
      const chunk = JSON.parse(raw);
      if (chunk.error) throw new Error('Das Modell hat die Antwort abgebrochen. Bitte erneut versuchen.');
      if (chunk.model) output.model.textContent = chunk.model;
      const delta = chunk.choices?.[0]?.delta?.content;
      if (typeof delta === 'string') { answer += delta; output.text.textContent = answer; output.article.classList.remove('pending'); scroll(); }
    }
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      buffer += decoder.decode(part.value, { stream: true });
      const lines = buffer.split('\n'); buffer = lines.pop();
      for (const value of lines) await line(value.replace(/\r$/, ''));
    }
    buffer += decoder.decode(); if (buffer.trim()) await line(buffer);
    if (!done || !answer) throw new Error('Die Antwort wurde nicht vollständig übertragen. Bitte erneut versuchen.');
    messages.push({ role: 'user', content }, { role: 'assistant', content: answer });
  } catch (error) {
    output.text.textContent = answer || (error.name === 'AbortError' ? 'Antwort gestoppt.' : 'Keine Antwort erhalten.');
    notice(error.name === 'AbortError' ? 'Gestoppt. Deine Nachricht steht für einen neuen Versuch bereit.' : error.message);
    $('#prompt').value = content;
  } finally { output.article.classList.remove('pending'); setBusy(false); $('#prompt').focus(); }
}
$('#chat-form').addEventListener('submit', send);
$('#stop').addEventListener('click', () => controller?.abort());
$('#prompt').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#chat-form').requestSubmit(); } });
$('#prompt').addEventListener('input', () => { $('#prompt').style.height = 'auto'; $('#prompt').style.height = `${Math.min($('#prompt').scrollHeight, 180)}px`; });
$('#new-chat').addEventListener('click', () => { messages.length = 0; $('#messages').replaceChildren(); $('#welcome').hidden = false; $('#prompt').value = ''; notice(''); $('#prompt').focus(); });
$('#connection').addEventListener('click', () => dialog.showModal());
$('#close-settings').addEventListener('click', () => dialog.close());
$('#model').addEventListener('change', () => { $('#routing-label').textContent = $('#model').value === 'auto' ? '✦ Automatische Modellwahl über FreeLLMAPI' : '✦ Gewähltes Modell · Fallback gemäß Gateway'; });
for (const button of document.querySelectorAll('[data-prompt]')) button.addEventListener('click', () => { $('#prompt').value = button.dataset.prompt; $('#prompt').focus(); });
$('#connection-form').addEventListener('submit', async e => {
  e.preventDefault(); $('#connection-error').textContent = ''; $('#save-key').disabled = true;
  try {
    await api('/api/connection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: $('#api-key').value.trim() }) });
    $('#api-key').value = ''; dialog.close(); await refresh();
  } catch (error) { $('#connection-error').textContent = error.message; }
  finally { $('#save-key').disabled = false; }
});
await refresh();
