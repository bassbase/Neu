// Shared by browser and server. Only closed code fences become complete files.
const extensions = { html: 'html', javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', jsx: 'jsx', tsx: 'tsx', css: 'css', json: 'json', python: 'py', py: 'py', bash: 'sh', sh: 'sh', powershell: 'ps1', sql: 'sql', yaml: 'yml', xml: 'xml', markdown: 'md', md: 'md', text: 'txt' };
export function validProjectPath(name) {
  return typeof name === 'string' && name.length > 0 && name.length <= 400 && !/^[\\/]|^[a-z]:/i.test(name) && !/[\x00-\x1f\\:*?"<>|]/.test(name) && name.split('/').every(p => p && p !== '.' && p !== '..' && !/[. ]$/.test(p));
}
function headerName(value) {
  return value.match(/(?:filename|file)\s*=\s*(?:"([^"\n]+)"|'([^'\n]+)'|([^\s`]+))/i)?.slice(1).find(Boolean);
}
export function parseProjectFiles(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n'); const files = []; const unfinished = []; const errors = []; let blockIndex = -1;
  for (let index = 0; index < lines.length; index++) {
    const opening = lines[index].match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (!opening) continue;
    blockIndex++;
    const marker = opening[1]; const info = opening[2].trim(); const language = info.split(/\s/)[0].toLowerCase();
    const start = ++index;
    const close = new RegExp('^ {0,3}' + marker[0] + '{' + marker.length + ',}[ \\t]*$');
    while (index < lines.length && !close.test(lines[index])) index++;
    const content = lines.slice(start, index); let name = headerName(info); let explicit = Boolean(name);
    const firstIndex = content.findIndex(line => line.trim());
    const first = content[firstIndex]?.trim() ?? '';
    if (!name && /^(?:filename|file)\s*=\s*[^\s"']+$/i.test(first)) {
      name = headerName(first); explicit = Boolean(name); content.splice(firstIndex, 1);
    }
    if (!name) {
      const comment = first.match(/^(?:#|\/\/)\s*([\w./-]+\.[\w]+)\s*$/);
      if (comment) { name = comment[1]; explicit = true; }
    }
    if (!name && /^[\w./-]+\.[\w]+$/.test(language)) { name = language; explicit = true; }
    if (!name && (!extensions[language] || ['text', 'txt'].includes(language))) continue; // directory trees and unnamed prose are not project files
    name ??= language === 'html' ? 'index.html' : `datei-${files.length + 1}.${extensions[language]}`;
    name = name.replace(/\\/g, '/').replace(/^(?:\.\/)+/, '');
    if (!validProjectPath(name)) { errors.push(`Dateipfad nicht uebernommen: ${name}`); continue; }
    if (index >= lines.length) { unfinished.push(name); continue; }
    files.push({ name, content: content.join('\n'), language, explicit, blockIndex });
  }
  return { files, unfinished, errors };
}
