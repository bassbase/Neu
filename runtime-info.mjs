import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const files = ['package.json', 'package-lock.json', 'server.mjs', 'local-models.mjs', 'attachments.mjs', 'extract-file.mjs', 'project-export.mjs', 'runtime-info.mjs', 'public/app.js', 'public/workspace.js', 'public/project-files.js', 'public/index.html', 'public/style.css'];
export function runtimeInfo() {
  const hash = createHash('sha256');
  for (const file of files) hash.update(readFileSync(path.join(root, file)));
  return { app: 'neu-chat', version: JSON.parse(readFileSync(path.join(root, 'package.json'))).version, build: hash.digest('hex'), features: { uploads: true, localChat: true, automaticContinuation: 'max-3', codeProjects: true, wholeProjectZip: true, imageGeneration: 'requires-provider' } };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(runtimeInfo()));
