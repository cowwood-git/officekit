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

/**
 * 워커 스크립트는 페이지와 별도로 "자기 응답 헤더"의 CSP 를 따른다. 배포(Cloudflare)는 모든 응답에
 * 사이트 CSP 를 붙이므로, 여기서도 .js·.mjs 에 같은 CSP 를 붙여 워커가 배포와 같은 제약에서 돌게 한다.
 * (일반 스크립트 응답의 CSP 는 브라우저가 무시하므로 다른 화면에는 영향이 없다.)
 */
async function siteCsp() {
  try {
    const headers = await readFile(join(root, '_headers'), 'utf8');
    const line = headers
      .split('\n')
      .find((item) => item.trim().startsWith('Content-Security-Policy:'));
    return line?.trim().replace('Content-Security-Policy:', '').trim();
  } catch {
    return undefined;
  }
}
const workerCsp = await siteCsp();

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
    const ext = extname(file);
    response.writeHead(notFound ? 404 : 200, {
      'Content-Type': types[ext] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
      ...(workerCsp && (ext === '.js' || ext === '.mjs')
        ? { 'Content-Security-Policy': workerCsp }
        : {}),
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
