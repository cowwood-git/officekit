import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createLastmod, dateModifiedOf } from '../scripts/sitemap-lastmod.mjs';
import { ogCardSvg, toolOgPath, wrapText } from '../src/lib/og-card';
import { rfc822, rssXml, sortByDateDesc } from '../src/lib/rss';
import { robotsTxt, TRAINING_BOTS } from '../src/pages/robots.txt';

const page = (date?: string) =>
  `<html><script type="application/ld+json">{"@type":"WebApplication"${date ? `,"dateModified":"${date}"` : ''}}</script></html>`;

describe('사이트맵 lastmod', () => {
  const dist = mkdtempSync(join(tmpdir(), 'ok-dist-'));
  const put = (path: string, html: string) => {
    mkdirSync(join(dist, path), { recursive: true });
    writeFileSync(join(dist, path, 'index.html'), html);
  };
  put('tools/a', page('2026-11-10'));
  put('tools/b', page('2026-11-13'));
  put('tools/b/variant', page('2026-11-12'));
  put('about', page());
  put('', page());
  const lastmod = createLastmod(dist);

  it('페이지가 밝힌 dateModified 를 쓴다', () => {
    expect(lastmod('https://officekit.kr/tools/a/')).toBe('2026-11-10');
    expect(lastmod('https://officekit.kr/tools/b/variant/')).toBe('2026-11-12');
  });

  it('날짜가 없는 페이지는 비운다(빌드 날짜로 꾸며 넣지 않는다)', () => {
    expect(lastmod('https://officekit.kr/about/')).toBeUndefined();
    expect(lastmod('https://officekit.kr/missing/')).toBeUndefined();
  });

  it('홈·허브는 가장 최근에 바뀐 도구 날짜를 쓴다', () => {
    expect(lastmod('https://officekit.kr/')).toBe('2026-11-13');
    expect(lastmod('https://officekit.kr/pdf/')).toBe('2026-11-13');
  });

  it('JSON-LD 공백 형식이 달라도 읽는다', () => {
    expect(dateModifiedOf('{"dateModified": "2026-01-02"}')).toBe('2026-01-02');
  });
});

describe('RSS', () => {
  const xml = rssXml({
    title: '옷깃 <도구>',
    link: 'https://officekit.kr/',
    description: '설명 & 소개',
    self: 'https://officekit.kr/rss.xml',
    items: [
      { title: 'A', link: 'https://officekit.kr/tools/a/', description: 'a', date: '2026-11-10' },
      { title: 'B', link: 'https://officekit.kr/tools/b/', description: 'b', date: '2026-11-13' },
    ],
  });

  it('최신 수정일 순으로 정렬하고, 같은 날짜는 원래 순서를 지킨다', () => {
    expect(xml.indexOf('<title>B</title>')).toBeLessThan(xml.indexOf('<title>A</title>'));
    const sorted = sortByDateDesc([
      { id: 1, date: '2026-11-10' },
      { id: 2, date: '2026-11-10' },
      { id: 3, date: '2026-11-11' },
    ]);
    expect(sorted.map((item) => item.id)).toEqual([3, 1, 2]);
  });

  it('XML 특수문자를 이스케이프하고 self 링크·lastBuildDate 를 넣는다', () => {
    expect(xml).toContain('<title>옷깃 &lt;도구&gt;</title>');
    expect(xml).toContain('설명 &amp; 소개');
    expect(xml).toContain('rel="self"');
    expect(xml).toContain(`<lastBuildDate>${rfc822('2026-11-13')}</lastBuildDate>`);
  });

  it('pubDate 는 RFC 822(한국 자정 = 전날 15:00 UTC)', () => {
    expect(rfc822('2026-11-13')).toBe('Thu, 12 Nov 2026 15:00:00 +0000');
  });
});

describe('도구 공유 이미지', () => {
  it('폭을 넘으면 낱말 단위로 줄을 나누고, 줄 수를 넘으면 …로 줄인다', () => {
    expect(wrapText('PDF 합치기', 13.7, 2)).toEqual(['PDF 합치기']);
    const lines = wrapText('가나다 라마바 사아자 차카타 파하', 7, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1]?.endsWith('…')).toBe(true);
  });

  it('제목·분류·사이트 주소가 SVG 에 들어가고 특수문자는 이스케이프한다', () => {
    const svg = ogCardSvg({ eyebrow: 'PDF', title: 'A & B', summary: '<요약>' });
    expect(svg).toContain('A &amp; B');
    expect(svg).toContain('&lt;요약&gt;');
    expect(svg).toContain('officekit.kr');
    expect(svg).toContain('width="1200" height="630"');
  });

  it('도구 페이지(목적별 페이지 포함)만 도구 이미지를 쓴다', () => {
    const isTool = (slug: string) => slug === 'pdf-merge';
    expect(toolOgPath('/tools/pdf-merge/', isTool)).toBe('/og/tools/pdf-merge.png');
    expect(toolOgPath('/tools/pdf-merge/two-files/', isTool)).toBe('/og/tools/pdf-merge.png');
    expect(toolOgPath('/tools/unknown/', isTool)).toBeUndefined();
    expect(toolOgPath('/pdf/', isTool)).toBeUndefined();
  });
});

describe('robots.txt', () => {
  const txt = robotsTxt('https://officekit.kr/');

  it('AI 학습 수집기만 막는다', () => {
    for (const bot of TRAINING_BOTS) expect(txt).toContain(`User-agent: ${bot}\nDisallow: /`);
  });

  it('검색·AI 인용 봇은 막지 않는다', () => {
    for (const bot of [
      'Googlebot',
      'Yeti',
      'bingbot',
      'OAI-SearchBot',
      'ChatGPT-User',
      'Claude-SearchBot',
      'Claude-User',
      'PerplexityBot',
      'Perplexity-User',
    ]) {
      expect(txt).not.toContain(`User-agent: ${bot}\n`);
    }
    expect(txt).toMatch(/^User-agent: \*\nAllow: \//);
  });

  it('사이트맵 주소를 빌드 도메인으로 넣는다', () => {
    expect(txt).toContain('Sitemap: https://officekit.kr/sitemap-index.xml');
  });
});
