import { marked } from '/vendor/marked.js';
import DOMPurify from '/vendor/purify.js';

const extensions = { html: 'html', javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', jsx: 'jsx', tsx: 'tsx', css: 'css', json: 'json', python: 'py', py: 'py', bash: 'sh', sh: 'sh', powershell: 'ps1', sql: 'sql', yaml: 'yml', xml: 'xml', markdown: 'md', md: 'md', text: 'txt' };
export function saveFile(name, content, type = 'text/plain;charset=utf-8') {
  const link = document.createElement('a'); const url = URL.createObjectURL(new Blob([content], { type }));
  link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function codeFiles(text) {
  const files = []; const used = new Set();
  for (const token of marked.lexer(text)) {
    if (token.type !== 'code') continue;
    const info = token.lang ?? ''; const language = info.split(/\s/)[0].toLowerCase();
    const explicit = info.match(/(?:filename=|file=)([\w./-]+)/)?.[1];
    let name = explicit ?? (language.includes('.') ? language : language === 'html' ? 'index.html' : `datei-${files.length + 1}.${extensions[language] ?? 'txt'}`);
    name = name.replace(/\\/g, '/').split('/').filter(p => p && p !== '.' && p !== '..').join('/').replace(/[^\w./-]/g, '_');
    if (!name || name.startsWith('/') || name.includes(':')) name = `datei-${files.length + 1}.txt`;
    if (used.has(name)) name = `datei-${files.length + 1}-${name.replaceAll('/', '-')}`;
    used.add(name); files.push({ name, content: token.text, language });
  }
  return files.slice(0, 40);
}
export function renderAnswer(element, text, preview) {
  // AI HTML is never trusted in the chat. Executable previews use a separate sandbox.
  const html = marked.parse(text, { gfm: true, breaks: true });
  element.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'del', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'h1', 'h2', 'h3', 'h4', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a'], ALLOWED_ATTR: ['href', 'title', 'class'] });
  element.classList.add('markdown');
  for (const link of element.querySelectorAll('a')) {
    const value = link.getAttribute('href') ?? '';
    if (!/^https?:\/\//i.test(value)) link.removeAttribute('href');
    else { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  }
  const files = codeFiles(text);
  for (const [index, block] of [...element.querySelectorAll('pre')].entries()) {
    const file = files[index]; if (!file) continue;
    const tools = document.createElement('div'); tools.className = 'code-tools';
    const label = document.createElement('span'); label.textContent = file.name;
    const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Code kopieren';
    copy.onclick = async () => { try { await navigator.clipboard.writeText(file.content); copy.textContent = 'Kopiert'; } catch { copy.textContent = 'Text markieren und Strg+C'; } };
    const download = document.createElement('button'); download.type = 'button'; download.textContent = 'Datei laden'; download.onclick = () => saveFile(file.name.split('/').at(-1), file.content);
    tools.append(label, copy, download); block.before(tools);
  }
  if (files.length) {
    const actions = document.createElement('div'); actions.className = 'artifact-actions';
    const zip = document.createElement('button'); zip.type = 'button'; zip.textContent = '↓ Projekt als ZIP';
    zip.onclick = async () => { const archive = new window.JSZip(); for (const file of files) archive.file(file.name, file.content); saveFile('KI-Projekt.zip', await archive.generateAsync({ type: 'uint8array' }), 'application/zip'); };
    actions.append(zip);
    const page = files.find(f => f.name.endsWith('.html'));
    if (page) {
      const show = document.createElement('button'); show.type = 'button'; show.textContent = '◉ HTML-Vorschau';
      show.onclick = () => {
        // Inline same-project CSS/JS for a self-contained preview. No external network.
        let html = page.content;
        const directory = page.name.includes('/') ? page.name.slice(0, page.name.lastIndexOf('/') + 1) : '';
        html = html.replace(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi, (tag, ref) => { const css = files.find(f => f.name === directory + ref.replace(/^\.\//, '')); return css?.name.endsWith('.css') ? `<style>${css.content.replace(/<\/style/gi, '<\\/style')}</style>` : tag; });
        html = html.replace(/<script\b([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, a, ref) => { const js = files.find(f => f.name === directory + ref.replace(/^\.\//, '')); return js?.name.endsWith('.js') ? `<script>${js.content.replace(/<\/script/gi, '<\\/script')}</script>` : tag; });
        preview(html);
      };
      actions.append(show);
    }
    element.append(actions);
  }
  return files;
}
