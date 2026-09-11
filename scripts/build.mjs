import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
await rm(path.join(root, 'dist'), { recursive: true, force: true });
await mkdir(path.join(root, 'dist'));
for (const file of [
  'index.html',
  'home.js',
  'styles.css',
  'favicon.svg',
  'credits.html',
  'LICENSES',
  'projects',
  'shared',
  'vendor',
  'assets',
]) {
  await cp(path.join(root, file), path.join(root, 'dist', file), {
    recursive: true,
  });
}
console.log('Built Object Lab in dist/');
