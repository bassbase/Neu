import { renderAnswer, saveFile } from './workspace.js';
const $ = selector => document.querySelector(selector);
const CLIENT_VERSION = '1.3.0';
const messages = [];
let busy = false;
let controller;
let configured = false;
let serverCurrent = false;
let pendingFiles = [];
let uploading = false;
const allFiles = new Set();
const projectFiles = new Map();
const projectBases = new Map();
const unfinishedFiles = new Set();
let exporting = false;
const dialog = $('#settings');
function notice(text) { $('#notice').textContent = text; $('#notice').hidden = !text; }
async function api(path, options) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (response.status === 404 && path.startsWith('/api/') && (!data.error || data.error === 'Nicht gefunden.')) throw new Error('Diese Funktion fehlt im laufenden Hintergrundserver. Die neue ZIP komplett entpacken und Start.cmd aus dem neuen Ordner starten. Der Starter aktualisiert den eigenen Chat-Dienst. Danach Strg+F5 im Browser.');
  if (!response.ok) throw new Error(data.error ?? 'Die Verbindung ist fehlgeschlagen.');
  return data;
}
async function refresh() {
  try {
    const healthResponse = await fetch('/healthz');
    const health = await healthResponse.json().catch(() => ({}));
    serverCurrent = healthResponse.ok && health.app === 'neu-chat' && health.version === CLIENT_VERSION && health.features?.uploads;
    if (!serverCurrent) throw new Error('Die Webseite und der Hintergrundserver passen nicht zusammen. Bitte die neue Version mit Start.cmd starten und danach Strg+F5 druecken. Bei alten manuell gestarteten Servern zuerst Strg+C im zugehoerigen Fenster.');
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
    try { await navigator.clipboard.writeText(content); copy.textContent = 'Kopiert'; setTimeout(() => copy.textContent = 'Kopieren', 1500); }
    catch { notice('Kopieren nicht erlaubt. Markiere den Text und nutze Strg+C.'); }
  });
  download.addEventListener('click', () => {
    const link = document.createElement('a'); const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    link.href = url; link.download = 'KI-Antwort.md'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  });
  byline.append(name, model, copy); if (role === 'assistant') byline.append(download);
  article.append(byline, text); $('#messages').append(article);
  return { article, text, model, setContent(value) { content = value; } };
}
function scroll() { $('#conversation').scrollTop = $('#conversation').scrollHeight; }
function setBusy(value) {
  busy = value; $('#send').disabled = value || uploading; $('#stop').hidden = !value; $('#model').disabled = value || $('#mode').value === 'image'; $('#mode').disabled = value; $('#new-chat').disabled = value || uploading; $('#attach').disabled = value || uploading; renderProject();
}
async function send(event) {
  event.preventDefault();
  if (busy || uploading) return;
  const content = $('#prompt').value.trim();
  if (!content && !pendingFiles.length) return;
  if (!configured) { dialog.showModal(); return; }
  if (!serverCurrent) { notice('Bitte zuerst den Hintergrundserver aktualisieren: neue Start.cmd oeffnen und Strg+F5 druecken.'); return; }
  if ($('#mode').value === 'image') { await generateImage(content); return; }
  if (messages.length >= 78) { notice('Dieser Chat ist sehr lang. Starte bitte einen neuen Chat.'); return; }
  notice(''); setBusy(true); $('#continue').hidden = true;
  const sentFiles = [...pendingFiles];
  const current = { role: 'user', content, ...(sentFiles.length ? { attachments: sentFiles.map(f => f.id) } : {}) };
  const history = [...messages, current];
  addMessage('user', [content, ...sentFiles.map(f => `📎 ${f.name} — ${f.summary}`)].filter(Boolean).join('\n'));
  pendingFiles = []; renderFiles();
  $('#prompt').value = ''; $('#prompt').style.height = '';
  const output = addMessage('assistant', 'Denkt nach …'); output.article.classList.add('pending'); scroll();
  controller = new AbortController();
  let answer = ''; let done = false; let truncated = false;
  try {
    const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: $('#model').value, mode: $('#mode').value, messages: history }), signal: controller.signal });
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
      if (chunk.choices?.[0]?.finish_reason === 'length') truncated = true;
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
    output.setContent(answer); renderAnswer(output.text, answer, openPreview, { collect: collectProject, export: exportProject });
    messages.push(current, { role: 'assistant', content: answer });
    $('#continue').hidden = !(truncated || unfinishedFiles.size);
    if (truncated || unfinishedFiles.size) notice('Die Antwort oder eine Datei ist noch unvollstaendig. Mit Fortsetzen werden angefangene Dateien komplett neu angefordert; abgeschnittene Teile werden nicht als fertige Dateien exportiert.');
  } catch (error) {
    output.text.textContent = answer || (error.name === 'AbortError' ? 'Antwort gestoppt.' : 'Keine Antwort erhalten.');
    output.setContent(answer || output.text.textContent);
    notice(error.name === 'AbortError' ? 'Gestoppt. Deine Nachricht steht für einen neuen Versuch bereit.' : error.message);
    $('#prompt').value = content;
    pendingFiles = sentFiles; renderFiles();
  } finally { output.article.classList.remove('pending'); setBusy(false); renderFiles(); $('#prompt').focus(); }
}
$('#chat-form').addEventListener('submit', send);
$('#stop').addEventListener('click', () => controller?.abort());
$('#prompt').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#chat-form').requestSubmit(); } });
$('#prompt').addEventListener('input', () => { $('#prompt').style.height = 'auto'; $('#prompt').style.height = `${Math.min($('#prompt').scrollHeight, 180)}px`; });
$('#save-chat').addEventListener('click', () => { if (!messages.length) return notice('Noch kein Chat zum Exportieren.'); saveFile('Neu-Chat.md', messages.map(m => `## ${m.role === 'user' ? 'Du' : 'Neu'}\n\n${m.content}`).join('\n\n')); });
$('#new-chat').addEventListener('click', () => {
  for (const id of allFiles) fetch('/api/attachments/' + id, { method: 'DELETE' }).catch(() => {});
  allFiles.clear(); projectFiles.clear(); projectBases.clear(); unfinishedFiles.clear(); renderProject(); pendingFiles = []; renderFiles(); messages.length = 0; $('#continue').hidden = true;
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
      projectBases.delete(file.id); renderProject();
      await fetch('/api/attachments/' + file.id, { method: 'DELETE' }).catch(() => {});
    });
    chip.append(label, remove, detail); $('#attachments').append(chip);
  }
}
async function upload(files) {
  if (busy || uploading || !files.length) return;
  if (!serverCurrent) { notice('Der Datei-Endpunkt fehlt in der laufenden Serverversion. Bitte die neue Start.cmd starten und den Browser mit Strg+F5 neu laden.'); return; }
  if ($('#mode').value === 'image') { notice('Zum Analysieren eines Bildes bitte Chat oder Programmieren waehlen. Bild erstellen verwendet nur eine neue Textbeschreibung.'); return; }
  if (files.length + pendingFiles.length > 5) { notice('Bitte höchstens 5 Dateien pro Nachricht anhängen.'); return; }
  if ([...files].some(f => f.size > 25 * 1024 * 1024)) { notice('Pro Datei sind höchstens 25 MB möglich.'); return; }
  if ([...files].reduce((n, f) => n + f.size, 0) > 50 * 1024 * 1024) { notice('Bitte zusammen höchstens 50 MB auf einmal hochladen.'); return; }
  uploading = true; setBusy(false); $('#attach').textContent = 'Wird gelesen …'; notice('Dateien werden lokal geprüft. Erst beim Senden erhält der KI-Anbieter die gelesenen Inhalte.');
  try {
    const data = new FormData(); for (const file of files) data.append('files', file);
    const response = await api('/api/attachments', { method: 'POST', body: data });
    for (const file of response.attachments) { pendingFiles.push(file); allFiles.add(file.id); if (file.project) projectBases.set(file.id, file); }
    renderProject(true);
    notice(response.errors.length ? response.errors.map(f => `${f.name}: ${f.error}`).join('\n') : 'Anhänge bereit. Beim Senden werden gelesener Text und ggf. Bilder an deinen KI-Anbieter übertragen.');
  } catch (error) { notice(error.message); }
  finally { uploading = false; $('#attach').textContent = '＋ Dateien'; setBusy(false); renderFiles(); $('#files').value = ''; }
}
$('#attach').addEventListener('click', () => $('#files').click());
$('#files').addEventListener('change', () => upload([...$('#files').files]));
$('#chat-form').addEventListener('dragover', e => { e.preventDefault(); });
$('#chat-form').addEventListener('drop', e => { e.preventDefault(); upload([...e.dataTransfer.files]); });
$('#prompt').addEventListener('paste', e => { if (e.clipboardData.files.length) { e.preventDefault(); upload([...e.clipboardData.files]); } });
async function openPreview(html) {
  try {
    const data = await api('/api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html }) });
    $('#preview-frame').src = data.url; $('#preview').showModal();
  } catch (error) { notice(error.message); }
}
$('#continue').addEventListener('click', () => {
  $('#prompt').value = 'Die Antwort wurde abgeschnitten. Gib angefangene Dateien vollstaendig neu aus, mit der exakten Kopfzeile filename=pfad/datei im Codeblock. Nicht nur den Rest anfuegen; keine Code-Fragmente. Danach liefere weitere noch fehlende Dateien jeweils komplett. Bereits fertige Dateien musst du nicht wiederholen.' + (unfinishedFiles.size ? ' Noch unvollstaendig: ' + [...unfinishedFiles].join(', ') : '');
  $('#chat-form').requestSubmit();
});
$('#close-preview').addEventListener('click', () => { $('#preview').close(); $('#preview-frame').removeAttribute('src'); });
async function generateImage(prompt) {
  if (!prompt) { notice('Bitte beschreibe das gewuenschte Bild.'); return; }
  if (pendingFiles.length) { notice('Bild erstellen verwendet nur deine Textbeschreibung. Bitte Anhaenge entfernen oder zu Chat wechseln.'); return; }
  notice('Bildanfrage laeuft. Verfuegbarkeit und Tarif richten sich nach deinem Bildanbieter.'); setBusy(true);
  addMessage('user', prompt); const output = addMessage('assistant', 'Bild wird angefragt …'); controller = new AbortController(); scroll();
  try {
    output.article.querySelectorAll('.byline .copy').forEach(button => button.remove());
    const data = await api('/api/images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }), signal: controller.signal });
    output.text.replaceChildren(); const image = document.createElement('img'); image.src = data.image; image.alt = prompt; image.className = 'generated-image';
    const download = document.createElement('button'); download.type = 'button'; download.className = 'primary'; download.textContent = '↓ Bild herunterladen';
    download.onclick = () => { const a = document.createElement('a'); a.href = data.image; a.download = 'KI-Bild.png'; a.click(); };
    output.text.append(image, download); output.model.textContent = data.model; $('#prompt').value = ''; notice('');
  } catch (error) { output.text.textContent = 'Kein Bild erzeugt.'; notice(error.name === 'AbortError' ? 'Bildanfrage gestoppt.' : error.message); }
  finally { setBusy(false); scroll(); }
}
$('#mode').addEventListener('change', () => {
  const image = $('#mode').value === 'image'; $('#continue').hidden = true; $('#model').disabled = image; $('#mode-hint').textContent = image ? 'Bildmodell erforderlich · Tarif deines Bildanbieters gilt. Keine Bildbearbeitung.' : $('#mode').value === 'code' ? 'Vollstaendige Dateien, Projekt-ZIP und isolierte HTML-Vorschau.' : 'Fragen, Schreiben, Dateien und Bildanalyse.';
  $('#prompt').placeholder = image ? 'Beschreibe das Bild, das du erstellen moechtest …' : 'Frag, was dich weiterbringt …';
});
function collectProject(parsed) {
  const problems = [...parsed.errors];
  for (const file of parsed.files) {
    if ($('#project-base').value && !file.explicit) { problems.push(`${file.name}: kein eindeutiger Dateipfad; nicht als Änderung übernommen.`); continue; }
    const key = file.name.toLowerCase(); projectFiles.delete(key); projectFiles.set(key, { name: file.name, content: file.content, explicit: file.explicit }); unfinishedFiles.delete(file.name);
  }
  for (const name of parsed.unfinished) unfinishedFiles.add(name);
  renderProject();
  if (problems.length) notice(problems.join('\n'));
}
function renderProject(autoSelect = false) {
  const previous = $('#project-base').value;
  $('#project-base').replaceChildren(new Option('Neues Projekt · erzeugte Dateien', ''));
  for (const [id, file] of projectBases) $('#project-base').add(new Option(`${file.name} · ${file.project.files.length} Originaldateien`, id));
  if (projectBases.has(previous)) $('#project-base').value = previous;
  else if (autoSelect === true && !previous && projectBases.size === 1) $('#project-base').value = projectBases.keys().next().value;
  const base = projectBases.get($('#project-base').value);
  const eligible = [...projectFiles.values()].filter(file => !base || file.explicit);
  $('#project-export').disabled = exporting || busy || uploading || (!base && !projectFiles.size);
  $('#project-info').textContent = `${base ? base.project.files.length + ' Originaldateien + ' : ''}${eligible.length} vollständige Dateiversionen` + (unfinishedFiles.size ? ` · ${unfinishedFiles.size} abgeschnittene Dateien nicht übernommen` : '') + (!eligible.length && base ? ' · Export noch ohne Änderungen' : '');
}
$('#project-base').addEventListener('change', renderProject);
$('#project-export').addEventListener('click', exportProject);
async function exportProject() {
  if (exporting || busy || uploading) return;
  exporting = true; renderProject();
  try {
    const attachmentId = $('#project-base').value;
    const files = [...projectFiles.values()].filter(file => !attachmentId || file.explicit);
    const response = await fetch('/api/project-zip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attachmentId: attachmentId || undefined, files }) });
    if (!response.ok) throw new Error((await response.json()).error ?? 'ZIP konnte nicht erstellt werden.');
    const base = projectBases.get(attachmentId);
    saveFile(base ? base.name.replace(/\.(zip|rar)$/i, '') + '-bearbeitet.zip' : 'KI-Projekt.zip', await response.blob(), 'application/zip');
    const original = response.headers.get('X-Neu-Original-Files');
    notice(`ZIP-Download gestartet: ${original} Originaldateien vollständig erhalten, dazu die gesammelten vollständigen Änderungen. Nicht gelesene Dateien bleiben unverändert. Das Paket wurde nicht automatisch ausgeführt oder funktional getestet.` + (unfinishedFiles.size ? ' Abgeschnittene Dateien sind nicht als Änderung enthalten; bitte Fortsetzen verwenden.' : ''));
  } catch (error) { notice(error.message); }
  finally { exporting = false; renderProject(); }
}
renderProject();
await refresh();
