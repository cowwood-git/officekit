/**
 * 사이트 전역 상수.
 * 도메인·문의 메일은 src/site.mjs 한 곳에서만 바꾼다.
 */
import { CONTACT_EMAIL, DEFAULT_SITE_URL, SOURCE_URL } from './site.mjs';

export const SITE = {
  name: '옷깃',
  nameEn: 'OfficeKit',
  url: DEFAULT_SITE_URL,
  title: '옷깃 — 서버로 보내지 않는 업무 도구·양식',
  description:
    'PDF·이미지·표 도구와 휴가신청서·견적서 같은 업무 양식을 설치 없이 브라우저에서. 파일과 입력값은 서버로 전송되지 않고, 모든 처리는 브라우저에서 이루어집니다.',
  email: CONTACT_EMAIL,
  source: SOURCE_URL,
  locale: 'ko',
  founded: '2026',
} as const;

/** 번역이 실제로 존재하는 로케일만 노출한다. 번역 페이지를 만들면 여기에 추가. */
export const ENABLED_LOCALES = ['ko'] as const;

/** 계산 결과 고지. */
export const DISCLAIMER =
  '이 결과는 참고용입니다. 실제 업무 문서의 규격·보안 정책은 소속 기관의 안내를 우선하세요.';
