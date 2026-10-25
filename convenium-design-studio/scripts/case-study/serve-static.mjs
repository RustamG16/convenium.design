// Minimal static file server for measuring a built site: node serve-static.mjs <dir> <port>
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname, resolve } from 'node:path';

const [dir = '.', port = '5199'] = process.argv.slice(2);
const root = resolve(dir);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.txt': 'text/plain' };

http.createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(root, path));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const info = await stat(file);
    const target = info.isDirectory() ? join(file, 'index.html') : file;
    const data = await readFile(target);
    const range = req.headers.range;
    if (range && /video/.test(types[extname(target)] || '')) {
      const [s, e] = range.replace('bytes=', '').split('-').map(Number);
      const end = Number.isFinite(e) && e ? e : data.length - 1;
      res.writeHead(206, { 'content-type': types[extname(target)], 'content-range': `bytes ${s}-${end}/${data.length}`, 'accept-ranges': 'bytes', 'content-length': end - s + 1 });
      res.end(data.subarray(s, end + 1)); return;
    }
    res.writeHead(200, { 'content-type': types[extname(target)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(data);
  } catch { res.writeHead(404).end('not found'); }
}).listen(Number(port), '127.0.0.1', () => console.log(`serving ${root} on http://127.0.0.1:${port}/`));
