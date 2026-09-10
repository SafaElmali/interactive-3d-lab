import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
};
http
  .createServer(async (req, res) => {
    try {
      let target = path.resolve(
        root,
        '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname),
      );
      if (
        (target !== root && !target.startsWith(root + path.sep)) ||
        target.includes('/.git/') ||
        target.includes('/.openai/')
      ) {
        res.writeHead(403).end();
        return;
      }
      if ((await fs.stat(target)).isDirectory()) {
        if (!new URL(req.url, 'http://local').pathname.endsWith('/')) {
          res
            .writeHead(302, {
              Location: new URL(req.url, 'http://local').pathname + '/',
            })
            .end();
          return;
        }
        target = path.join(target, 'index.html');
      }
      res.writeHead(200, {
        'Content-Type':
          types[path.extname(target)] ?? 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(await fs.readFile(target));
    } catch {
      res.writeHead(404).end('Not found');
    }
  })
  .listen(4320, '127.0.0.1', () =>
    console.log('Object Lab: http://127.0.0.1:4320/'),
  );
