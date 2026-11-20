import type { FormBlock, FormField, FormTemplate } from '@/lib/doc/types';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '감사장 번호',
    type: 'text',
    group: '문서',
    placeholder: 'APR-20261117-001',
    help: '수여일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다.',
  },
  {
    id: 'date',
    label: '수여일',
    type: 'date',
    group: '문서',
    defaultToday: true,
    required: true,
  },
  {
    id: 'name',
    label: '성명',
    type: 'text',
    group: '대상자',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'affiliation',
    label: '소속',
    type: 'text',
    group: '대상자',
    placeholder: '예: 경영지원팀',
    maxLength: 60,
  },
  {
    id: 'reason',
    label: '감사 내용',
    type: 'textarea',
    group: '감사 내용',
    placeholder: '감사를 전하는 이유와 공로를 두세 문장으로 적습니다.',
    required: true,
    maxLength: 500,
    rows: 4,
    span: 3,
  },
  {
    id: 'issuerCompany',
    label: '수여 기관',
    type: 'text',
    group: '수여 기관',
    placeholder: '옷깃 주식회사',
    required: true,
    maxLength: 60,
  },
  {
    id: 'issuerCeo',
    label: '대표자',
    type: 'text',
    group: '수여 기관',
    placeholder: '박대표',
    required: true,
    maxLength: 30,
  },
];

const blocks: FormBlock[] = [
  { kind: 'spacer', height: 55 },
  {
    kind: 'paragraph',
    text: 'LETTER OF APPRECIATION',
    align: 'center',
    size: 8.5,
    bold: true,
    color: '#0B6B5B',
    after: 1,
  },
  {
    kind: 'paragraph',
    text: '감사장',
    align: 'center',
    size: 34,
    bold: true,
    after: 1,
  },
  { kind: 'divider', width: 28, before: 2, after: 6 },
  {
    kind: 'paragraph',
    text: '아래 사람에게 깊은 감사의 마음을 전합니다.',
    align: 'center',
    size: 10,
    after: 2,
  },
  {
    kind: 'paragraph',
    field: 'name',
    align: 'center',
    size: 26,
    bold: true,
    blankLine: 62,
    before: 6,
    after: 1,
  },
  {
    kind: 'paragraph',
    field: 'affiliation',
    align: 'center',
    size: 10,
    color: '#5B6472',
    blankLine: 42,
  },
  {
    kind: 'paragraph',
    field: 'reason',
    align: 'center',
    size: 9.5,
    blankLine: 130,
    before: 4,
    after: 2,
  },
  {
    kind: 'issuer',
    dateField: 'date',
    companyField: 'issuerCompany',
    ceoField: 'issuerCeo',
    seal: true,
    bottom: true,
  },
];

export const appreciation: FormTemplate = {
  slug: 'appreciation',
  title: '감사장',
  family: 'certificate',
  category: 'award',
  description:
    '공로와 수고에 감사를 전하는 감사장을 브라우저에서 만들고 A4 PDF로 저장합니다. 대상자·감사 내용·수여 기관·직인을 넣을 수 있습니다.',
  keywords: ['감사장', '감사장 양식', '감사장 PDF', '감사패', '공로 감사장'],
  updated: '2026-11-17',
  docPrefix: 'APR',
  companyParty: 'issuer',
  frame: { inset: 12, gap: 3 },
  showFooter: false,
  lead: '공로와 수고에 감사를 전하는 감사장입니다. 대상자와 감사 내용을 담고 수여 기관의 직인을 넣어 바로 출력할 수 있습니다.',
  useCases: [
    '오랜 기간 함께한 직원·파트너에게 감사를 전할 때',
    '행사·프로젝트에 도움을 준 사람을 격려할 때',
    '자원봉사·후원자에게 감사장을 수여할 때',
    '퇴임·이임하는 분께 감사의 뜻을 전할 때',
  ],
  howTo: [
    '수여일과 대상자 성명·소속을 입력합니다.',
    '감사 내용을 구체적인 공로와 함께 적습니다.',
    '수여 기관과 대표자를 입력합니다.',
    '미리보기에서 확인한 뒤 PDF로 내려받습니다.',
  ],
  notes: [
    '이 감사장은 참고 서식입니다. 수여 기준과 절차는 기관의 규정을 따르세요.',
    '감사 내용은 구체적인 행동과 결과를 중심으로 적으면 마음이 잘 전달됩니다.',
    '수여 기관의 직인이나 확인 서명이 있어야 공식 문서로 인정되는 경우가 많습니다.',
  ],
  fields,
  blocks,
  sample: {
    docNo: 'APR-20261117-001',
    date: '2026-11-17',
    name: '김옷깃',
    affiliation: '경영지원팀',
    reason:
      '1년 동안 사내 문서 양식 표준화와 업무 자동화에 힘써 주셨습니다. 덕분에 팀의 반복 업무가 크게 줄었고, 모두가 더 중요한 일에 집중할 수 있게 되었습니다.',
    issuerCompany: '옷깃 주식회사',
    issuerCeo: '박대표',
  },
  validate: (values) => {
    const reason = (values.reason ?? '').trim();
    return reason.length >= 10 ? [] : ['감사 내용을 10자 이상 적어 주세요.'];
  },
  faq: [
    {
      q: '감사장과 상장은 무엇이 다른가요?',
      a: '상장은 우수한 성과를 공식적으로 표창하는 문서이고, 감사장은 공로와 수고에 감사의 마음을 전하는 문서입니다.',
    },
    {
      q: '감사 내용은 어떻게 적나요?',
      a: '구체적인 행동과 그로 인한 결과를 적습니다. “열심히 해 주셔서”보다 “어떤 일을 어떻게 도와주어 무엇이 좋아졌는지”를 적으면 좋습니다.',
    },
    {
      q: '직인이 꼭 필요한가요?',
      a: '기관·회사 규정에 따라 다릅니다. 공식 수여 문서는 직인이나 대표자 서명이 필요한 경우가 많습니다.',
    },
    {
      q: '여러 명에게 수여할 수 있나요?',
      a: '이 양식은 한 사람 기준입니다. 여러 명이면 각각 작성하거나 이름을 바꿔 여러 장을 만드세요.',
    },
  ],
  sources: [
    {
      label: '행정안전부 — 표창·감사 문서 안내',
      href: 'https://www.mois.go.kr/',
    },
  ],
  related: [
    { label: '상장 양식', href: '/forms/award/' },
    { label: '임명장 양식', href: '/forms/appointment/' },
    { label: '수료증 양식', href: '/forms/certificate/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
