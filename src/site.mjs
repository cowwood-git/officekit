// @ts-check
/**
 * 도메인·문의 메일의 단일 출처.
 * astro.config.mjs(빌드 canonical·sitemap)와 src/consts.ts(화면 표기)가 모두 이 파일을 읽는다.
 *
 * 2026-11-13 officekit.kr 등록(가비아 → 네임서버 Cloudflare). 예전 주소 officekit.quickdk.co.kr 은
 * 공개 몇 시간 만이라 리다이렉트 없이 삭제했다(Pages 커스텀 도메인·DNS 모두 제거).
 * 문의 메일은 officekit.kr 메일 수신(Email Routing)을 만들기 전까지 quickdk 주소를 유지한다.
 */
export const DEFAULT_SITE_URL = 'https://officekit.kr';
export const CONTACT_EMAIL = 'officekit@quickdk.co.kr';
/** 소스 코드(AGPL-3.0) — 사이트 하단 «소스 코드» 링크. AGPL 은 이용자에게 소스를 받을 길을 알려야 한다. */
export const SOURCE_URL = 'https://github.com/cowwood-git/officekit';
