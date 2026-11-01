const $ = selector => document.querySelector(selector);
const messages = [];
let busy = false;
let controller;
let configured = false;
let pendingFiles = [];
let uploading = false;
const allFiles = new Set();
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
  const download = document.createElement('button'); download.type = 'button'; download.className = 'copy'; download.textContent = 'Speichern';
  const text = document.createElement('div'); text.className = 'text'; text.textContent = content;
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text.textContent); copy.textContent = 'Kopiert'; setTimeout(() => copy.textContent = 'Kopieren', 1500); }
    catch { notice('Kopieren nicht erlaubt. Markiere den Text und nutze Strg+C.'); }
  });
  download.addEventListener('click', () => {
    const link = document.createElement('a'); const url = URL.createObjectURL(new Blob([text.textContent], { type: 'text/plain;charset=utf-8' }));
    link.href = url; link.download = 'KI-Antwort.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  });
  byline.append(name, model, copy); if (role === 'assistant') byline.append(download);
  article.append(byline, text); $('#messages').append(article);
  return { article, text, model };
}
function scroll() { $('#conversation').scrollTop = $('#conversation').scrollHeight; }
function setBusy(value) {
  busy = value; $('#send').disabled = value || uploading; $('#stop').hidden = !value; $('#model').disabled = value; $('#new-chat').disabled = value || uploading; $('#attach').disabled = value || uploading;
}
async function send(event) {
  event.preventDefault();
  if (busy || uploading) return;
  const content = $('#prompt').value.trim();
  if (!content && !pendingFiles.length) return;
  if (!configured) { dialog.showModal(); return; }
  if (messages.length >= 78) { notice('Dieser Chat ist sehr lang. Starte bitte einen neuen Chat.'); return; }
  notice(''); setBusy(true);
  const sentFiles = [...pendingFiles];
  const current = { role: 'user', content, ...(sentFiles.length ? { attachments: sentFiles.map(f => f.id) } : {}) };
  const history = [...messages, current];
  addMessage('user', [content, ...sentFiles.map(f => `📎 ${f.name} — ${f.summary}`)].filter(Boolean).join('\n'));
  pendingFiles = []; renderFiles();
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
    messages.push(current, { role: 'assistant', content: answer });
  } catch (error) {
    output.text.textContent = answer || (error.name === 'AbortError' ? 'Antwort gestoppt.' : 'Keine Antwort erhalten.');
    notice(error.name === 'AbortError' ? 'Gestoppt. Deine Nachricht steht für einen neuen Versuch bereit.' : error.message);
    $('#prompt').value = content;
    pendingFiles = sentFiles; renderFiles();
  } finally { output.article.classList.remove('pending'); setBusy(false); renderFiles(); $('#prompt').focus(); }
}
$('#chat-form').addEventListener('submit', send);
$('#stop').addEventListener('click', () => controller?.abort());
$('#prompt').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#chat-form').requestSubmit(); } });
$('#prompt').addEventListener('input', () => { $('#prompt').style.height = 'auto'; $('#prompt').style.height = `${Math.min($('#prompt').scrollHeight, 180)}px`; });
$('#new-chat').addEventListener('click', () => {
  for (const id of allFiles) fetch('/api/attachments/' + id, { method: 'DELETE' }).catch(() => {});
  allFiles.clear(); pendingFiles = []; renderFiles(); messages.length = 0;
  $('#messages').replaceChildren(); $('#welcome').hidden = false; $('#prompt').value = ''; notice(''); $('#prompt').focus();
});
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
function renderFiles() {
  $('#attachments').replaceChildren();
  for (const file of pendingFiles) {
    const chip = document.createElement('div'); chip.className = 'attachment';
    const label = document.createElement('span'); label.textContent = `📎 ${file.name}`;
    const detail = document.createElement('small'); detail.textContent = [file.summary, ...(file.warnings ?? [])].join(' · ');
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `${file.name} entfernen`); remove.disabled = busy || uploading;
    remove.addEventListener('click', async () => {
      pendingFiles = pendingFiles.filter(f => f.id !== file.id); allFiles.delete(file.id); renderFiles();
      await fetch('/api/attachments/' + file.id, { method: 'DELETE' }).catch(() => {});
    });
    chip.append(label, remove, detail); $('#attachments').append(chip);
  }
}
async function upload(files) {
  if (busy || uploading || !files.length) return;
  if (files.length + pendingFiles.length > 5) { notice('Bitte höchstens 5 Dateien pro Nachricht anhängen.'); return; }
  if ([...files].some(f => f.size > 25 * 1024 * 1024)) { notice('Pro Datei sind höchstens 25 MB möglich.'); return; }
  if ([...files].reduce((n, f) => n + f.size, 0) > 50 * 1024 * 1024) { notice('Bitte zusammen höchstens 50 MB auf einmal hochladen.'); return; }
  uploading = true; setBusy(false); $('#attach').textContent = 'Wird gelesen …'; notice('Dateien werden lokal geprüft. Erst beim Senden erhält der KI-Anbieter die gelesenen Inhalte.');
  try {
    const data = new FormData(); for (const file of files) data.append('files', file);
    const response = await api('/api/attachments', { method: 'POST', body: data });
    for (const file of response.attachments) { pendingFiles.push(file); allFiles.add(file.id); }
    notice(response.errors.length ? response.errors.map(f => `${f.name}: ${f.error}`).join('\n') : 'Anhänge bereit. Beim Senden werden gelesener Text und ggf. Bilder an deinen KI-Anbieter übertragen.');
  } catch (error) { notice(error.message); }
  finally { uploading = false; $('#attach').textContent = '＋ Dateien'; setBusy(false); renderFiles(); $('#files').value = ''; }
}
$('#attach').addEventListener('click', () => $('#files').click());
$('#files').addEventListener('change', () => upload([...$('#files').files]));
$('#chat-form').addEventListener('dragover', e => { e.preventDefault(); });
$('#chat-form').addEventListener('drop', e => { e.preventDefault(); upload([...e.dataTransfer.files]); });
$('#prompt').addEventListener('paste', e => { if (e.clipboardData.files.length) { e.preventDefault(); upload([...e.clipboardData.files]); } });
await refresh();
