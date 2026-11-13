#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises';
/** E2E·수동 확인용 정적 서버. `npm run build` 결과(dist)를 그대로 제공한다. */
import http from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
const port = Number(process.env.PORT ?? 4321);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pfb': 'application/octet-stream',
  '.bcmap': 'application/octet-stream',
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://x');
  const pathname = decodeURIComponent(url.pathname);

  // E2E·수동 확인용 좋아요 API 목. 실제 배포에서는 Pages Function이 처리한다.
  if (pathname.startsWith('/api/likes')) {
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    if (request.method === 'POST') {
      response.end(JSON.stringify({ count: 1, liked: true }));
    } else if (pathname.endsWith('/top') || pathname.endsWith('/related')) {
      response.end(JSON.stringify({ items: [] }));
    } else {
      const slugs = (url.searchParams.get('slugs') ?? '').split(',').filter(Boolean);
      response.end(JSON.stringify({ counts: Object.fromEntries(slugs.map((slug) => [slug, 0])) }));
    }
    return;
  }

  let file = normalize(join(root, pathname));

  if (!file.startsWith(root)) {
    response.writeHead(403).end('forbidden');
    return;
  }

  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(root, '404.html');
  }

  const notFound = file.endsWith('404.html');
  try {
    const body = await readFile(file);
    response.writeHead(notFound ? 404 : 200, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('not found');
  }
});

server.listen(port, () => {
  console.log(`dist server: http://localhost:${port}`);
});
