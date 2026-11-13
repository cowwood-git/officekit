export const LOCALES = ['ko', 'en', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ko';

/**
 * UI 문구. 도구 본문과 분리해 두면 언어 추가 시 레이아웃 수정이 필요 없다.
 * 키가 하나라도 빠지면 타입 오류가 난다.
 */
const ko = {
  skipToContent: '본문으로 건너뛰기',
  navTools: '도구',
  navMethod: '작동 원리',
  navAbout: '소개',
  brandTagline: '설치 없이 끝내는 업무 도구',
  footerTools: '도구',
  footerAllTools: '도구 전체',
  footerWorkflows: '작업 흐름',
  footerCompany: '사이트',
  footerLegal: '약관·정책',
  footerAbout: '소개',
  footerMethod: '작동 원리와 안전성',
  footerPrivacy: '개인정보처리방침',
  footerContact: '문의',
  footerSource: '소스 코드',
  footerDisclaimer: '파일은 서버로 전송되지 않습니다.',
  updated: '최종 검토',
  sources: '참고',
  relatedTools: '함께 쓰면 좋은 도구',
  backToTools: '도구 전체 보기',
  adLabel: '광고',
  notFoundTitle: '페이지를 찾을 수 없어요',
  notFoundBody: '주소가 바뀌었거나 삭제된 페이지입니다.',
} as const;

export type UIKey = keyof typeof ko;
type Dict = Record<UIKey, string>;

const en: Dict = {
  skipToContent: 'Skip to content',
  navTools: 'Tools',
  navMethod: 'How it works',
  navAbout: 'About',
  brandTagline: 'Office tools that run in your browser',
  footerTools: 'Tools',
  footerAllTools: 'All tools',
  footerWorkflows: 'Workflows',
  footerCompany: 'Site',
  footerLegal: 'Legal',
  footerAbout: 'About',
  footerMethod: 'How it works',
  footerPrivacy: 'Privacy',
  footerContact: 'Contact',
  footerSource: 'Source code',
  footerDisclaimer: 'Files never leave your browser.',
  updated: 'Last reviewed',
  sources: 'References',
  relatedTools: 'Related tools',
  backToTools: 'All tools',
  adLabel: 'Advertisement',
  notFoundTitle: 'Page not found',
  notFoundBody: 'The address may have changed or the page was removed.',
};

const ja: Dict = {
  skipToContent: '本文へスキップ',
  navTools: 'ツール',
  navMethod: '仕組み',
  navAbout: '紹介',
  brandTagline: 'インストール不要の仕事ツール',
  footerTools: 'ツール',
  footerAllTools: 'すべてのツール',
  footerWorkflows: 'ワークフロー',
  footerCompany: 'サイト',
  footerLegal: '規約・ポリシー',
  footerAbout: '紹介',
  footerMethod: '仕組みと安全性',
  footerPrivacy: 'プライバシーポリシー',
  footerContact: 'お問い合わせ',
  footerSource: 'ソースコード',
  footerDisclaimer: 'ファイルはサーバーに送信されません。',
  updated: '最終確認',
  sources: '参考',
  relatedTools: '関連ツール',
  backToTools: 'ツール一覧',
  adLabel: '広告',
  notFoundTitle: 'ページが見つかりません',
  notFoundBody: 'アドレスが変更されたか、ページが削除されました。',
};

const dictionaries: Record<Locale, Dict> = { ko, en, ja };

export function t(locale: Locale, key: UIKey): string {
  return dictionaries[locale][key];
}
