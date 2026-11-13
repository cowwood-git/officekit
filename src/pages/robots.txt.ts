import type { APIRoute } from 'astro';

/**
 * robots.txt — 사이트맵 주소를 빌드 도메인(Astro.site)에서 만들어 도메인 불일치를 막는다.
 *
 * 원칙(광고 수익이 유일한 수입 — 검색·AI 인용 유입을 막지 않는다):
 *  - 검색 색인(구글·네이버·Bing·다음)과 AI 검색·인용(OAI-SearchBot, ChatGPT-User, Claude-SearchBot,
 *    Claude-User, PerplexityBot, Perplexity-User 등)은 허용한다 — AI 가 인용하면 사람이 도구를 쓰러 온다.
 *  - AI «학습» 수집만 막는다. 아래 목록은 Cloudflare 관리형 robots.txt 의 학습 크롤러 목록과 같다.
 *    이 파일이 정본이므로 Cloudflare 의 «관리형 robots.txt»는 꺼도 된다(중복 `User-agent: *` 해소).
 *  - Google-Extended·Applebot-Extended 차단은 구글·애플 «검색»에는 영향이 없다(학습 전용 토큰).
 */
export const TRAINING_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'Claude-Web',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'meta-externalagent',
  'cohere-ai',
  'MistralAI-Training',
  'Amazonbot',
  'Diffbot',
  'omgili',
  'GoogleOther',
  'Google-CloudVertexBot',
] as const;

export function robotsTxt(site: URL | string): string {
  const sitemap = new URL('sitemap-index.xml', site).href;
  return [
    'User-agent: *',
    'Allow: /',
    '',
    '# 검색 색인·AI 검색 인용은 허용하고, AI 학습 활용만 제한한다.',
    'Content-Signal: search=yes, ai-input=yes, ai-train=no',
    '',
    '# AI 학습용 수집기',
    ...TRAINING_BOTS.flatMap((bot) => [`User-agent: ${bot}`, 'Disallow: /', '']),
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');
}

export const GET: APIRoute = ({ site }) =>
  new Response(robotsTxt(site ?? 'https://officekit.kr/'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
