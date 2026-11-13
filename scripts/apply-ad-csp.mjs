/**
 * 빌드 후처리: 광고(AdSense)가 켜진 빌드에서만 dist/_headers 의 CSP 에 광고 도메인을 넣는다.
 *
 * 왜: PUBLIC_ADSENSE_CLIENT 만 넣고 public/_headers 를 손으로 고치지 않으면
 * 광고 스크립트가 CSP 에 막혀 광고가 "조용히" 안 뜬다. 두 설정을 한 스위치로 묶는다.
 * 광고가 꺼진 빌드에서는 엄격한 CSP 를 그대로 둔다.
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

if (existsSync('.env')) process.loadEnvFile('.env');

const HEADERS = new URL('../dist/_headers', import.meta.url).pathname;
const ADS_TXT = new URL('../dist/ads.txt', import.meta.url).pathname;
const client = process.env.PUBLIC_ADSENSE_CLIENT ?? '';

// Google 공식 문서 기준 AdSense 가 쓰는 출처.
export const AD_SOURCES = {
  'script-src': [
    'https://pagead2.googlesyndication.com',
    'https://googleads.g.doubleclick.net',
    'https://tpc.googlesyndication.com',
    'https://www.googletagservices.com',
    // Google 동의 메시지(CMP — AdSense '개인정보 보호 및 메시지')와 광고 품질 검사
    'https://fundingchoicesmessages.google.com',
    'https://*.adtrafficquality.google',
  ],
  'frame-src': [
    'https://googleads.g.doubleclick.net',
    'https://tpc.googlesyndication.com',
    'https://www.google.com',
    'https://fundingchoicesmessages.google.com',
    'https://*.adtrafficquality.google',
  ],
  'img-src': [
    'https://*.googlesyndication.com',
    'https://*.g.doubleclick.net',
    'https://*.google.com',
    // 광고 품질 검사(sodar) 픽셀 — 막히면 콘솔에 CSP 위반이 남고 광고 품질 신호가 빠진다.
    'https://*.adtrafficquality.google',
  ],
  'connect-src': [
    'https://pagead2.googlesyndication.com',
    'https://googleads.g.doubleclick.net',
    'https://*.adtrafficquality.google',
    'https://fundingchoicesmessages.google.com',
  ],
};

/** CSP 한 줄에 광고 출처를 더한다. frame-src 'none' 은 광고 출처로 대체한다. */
export function addAdSources(csp) {
  const directives = csp
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
  const seen = new Set();
  const out = directives.map((directive) => {
    const [name, ...values] = directive.split(/\s+/);
    const extra = AD_SOURCES[name];
    if (!extra) return directive;
    seen.add(name);
    const kept = values.filter((v) => v !== "'none'");
    for (const src of extra) if (!kept.includes(src)) kept.push(src);
    return [name, ...kept].join(' ');
  });
  for (const [name, extra] of Object.entries(AD_SOURCES)) {
    if (!seen.has(name)) out.push([name, "'self'", ...extra].join(' '));
  }
  return out.join('; ');
}

/**
 * ads.txt 한 줄 — 이 사이트의 광고 판매자가 이 AdSense 계정뿐임을 밝힌다.
 * f08c47fec0942fa0 은 Google 의 고정 인증 ID(공식 안내값).
 * 광고가 꺼진 빌드에서는 만들지 않는다 — 빈 ads.txt 는 «승인된 판매자 없음»으로 읽힌다.
 */
export function adsTxt(adClient) {
  const pub = adClient.replace(/^ca-/, '');
  return `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`;
}

export function applyToHeaders(text) {
  return text.replace(
    /^(\s*Content-Security-Policy:\s*)(.+)$/gm,
    (_, prefix, csp) => `${prefix}${addAdSources(csp)}`,
  );
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  if (!/^ca-pub-\d{10,}$/.test(client)) {
    console.log('광고 꺼짐(PUBLIC_ADSENSE_CLIENT 없음) — CSP 그대로 유지');
  } else {
    const before = await readFile(HEADERS, 'utf8');
    const after = applyToHeaders(before);
    await writeFile(HEADERS, after);
    const count = (after.match(/^\s*Content-Security-Policy:/gm) ?? []).length;
    await writeFile(ADS_TXT, adsTxt(client));
    console.log(`광고 켜짐(${client}) — CSP ${count}줄에 AdSense 출처 추가, ads.txt 생성`);
  }
}
