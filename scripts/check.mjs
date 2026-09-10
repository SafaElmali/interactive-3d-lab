import { readdir, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { projects } from '../shared/projects.js';
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
async function walk(dir) {
  const out = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'dist', 'node_modules'].includes(item.name)) continue;
    const p = path.join(dir, item.name);
    if (item.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}
const files = await walk(root);
let checked = 0;
for (const file of files) {
  if (/\.(m?js)$/.test(file) && !file.includes('/vendor/')) {
    const r = spawnSync(process.execPath, ['--check', file], {
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr);
    checked++;
  }
  if (/\.(html|css|js)$/.test(file)) {
    const source = await readFile(file, 'utf8');
    const refs = [
      ...source.matchAll(/(?:src|href)=["'](\.{1,2}\/[^"']+)["']/g),
      ...source.matchAll(/(?:from\s+|import\s*)["'](\.{1,2}\/[^"']+)["']/g),
      ...source.matchAll(/url\(["']?(\.{1,2}\/[^"')]+)["']?\)/g),
    ];
    for (const match of refs) {
      if (match[1].includes('${')) continue;
      const target = path.resolve(
        path.dirname(file),
        match[1].split(/[?#]/)[0],
      );
      assert.ok(
        await stat(target).catch(() => false),
        `Missing reference ${match[1]} in ${file}`,
      );
    }
  }
}
for (const p of projects) {
  assert.ok(await stat(path.join(root, 'projects', p.id, 'index.html')));
  assert.ok(await stat(path.join(root, 'projects', p.id, 'scene.js')));
}
for (const slug of ['sneaker-studio', 'car-garage']) {
  const b = await readFile(
    path.join(root, 'projects', slug, 'assets/model.glb'),
  );
  assert.equal(b.toString('ascii', 0, 4), 'glTF');
  assert.equal(b.readUInt32LE(4), 2);
  assert.equal(b.readUInt32LE(8), b.length);
}
console.log(
  `${checked} authored scripts parsed. Nine route folders and local references verified.`,
);
const test = spawnSync(
  process.execPath,
  [path.join(root, 'scripts/check-scenes.mjs')],
  { stdio: 'inherit' },
);
process.exitCode = test.status ?? 1;
