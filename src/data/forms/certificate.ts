import { formatDateDot } from '@/lib/doc/format';
import type { FormBlock, FormField, FormTemplate } from '@/lib/doc/types';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '수료번호',
    type: 'text',
    group: '문서',
    placeholder: 'K-20261115-001',
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
    group: '수료자',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'affiliation',
    label: '소속',
    type: 'text',
    group: '수료자',
    placeholder: '예: 경영지원팀',
    maxLength: 60,
  },
  {
    id: 'course',
    label: '과정명',
    type: 'text',
    group: '교육 정보',
    placeholder: '예: 2026 사무행정 실무 과정',
    required: true,
    maxLength: 100,
    span: 2,
  },
  {
    id: 'courseStart',
    label: '시작일',
    type: 'date',
    group: '교육 정보',
  },
  {
    id: 'courseEnd',
    label: '종료일',
    type: 'date',
    group: '교육 정보',
  },
  {
    id: 'hours',
    label: '교육 시간',
    type: 'number',
    group: '교육 정보',
    placeholder: '예: 40',
    maxLength: 6,
  },
  {
    id: 'instructor',
    label: '강사',
    type: 'text',
    group: '교육 정보',
    placeholder: '예: 김강사',
    maxLength: 40,
  },
  {
    id: 'issuerCompany',
    label: '발급 기관',
    type: 'text',
    group: '발급 기관',
    placeholder: '옷깃 아카데미',
    required: true,
    maxLength: 60,
  },
  {
    id: 'issuerCeo',
    label: '대표자',
    type: 'text',
    group: '발급 기관',
    placeholder: '박대표',
    required: true,
    maxLength: 30,
  },
];

const blocks: FormBlock[] = [
  { kind: 'spacer', height: 50 },
  {
    kind: 'paragraph',
    text: 'CERTIFICATE OF COMPLETION',
    align: 'center',
    size: 8.5,
    bold: true,
    color: '#0B6B5B',
    after: 1,
  },
  {
    kind: 'paragraph',
    text: '수료증',
    align: 'center',
    size: 34,
    bold: true,
    after: 1,
  },
  { kind: 'divider', width: 28, before: 2, after: 6 },
  {
    kind: 'paragraph',
    text: '아래 사람은 다음 교육 과정을 수료하였음을 증명합니다.',
    align: 'center',
    size: 10,
    after: 2,
  },
  {
    kind: 'paragraph',
    field: 'name',
    align: 'center',
    size: 24,
    bold: true,
    blankLine: 62,
    before: 5,
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
    field: 'courseLine',
    align: 'center',
    size: 11,
    blankLine: 118,
    before: 2,
  },
  {
    kind: 'paragraph',
    text: '성실히 참여하고 모든 과정을 마쳤기에 이 증서를 수여합니다.',
    align: 'center',
    size: 9.5,
    color: '#5B6472',
    before: 5,
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

export const certificate: FormTemplate = {
  slug: 'certificate',
  title: '수료증',
  family: 'certificate',
  category: 'award',
  description:
    '교육 과정을 마친 사람에게 수여하는 수료증을 브라우저에서 만들고 A4 PDF로 저장합니다. 과정명·기간·시간과 발급 기관·직인을 넣을 수 있습니다.',
  keywords: ['수료증 양식', '수료증 PDF', '수료증 만들기', '교육 수료증', '수료증 디자인'],
  updated: '2026-11-15',
  docPrefix: 'CT',
  companyParty: 'issuer',
  frame: { inset: 12, gap: 3 },
  showFooter: false,
  lead: '교육 과정을 마친 사람에게 수여하는 수료증입니다. 과정명과 기간, 교육 시간을 한 장에 정리하고 발급 기관의 직인을 넣어 바로 출력할 수 있습니다.',
  useCases: [
    '사내 교육·연수 과정을 마쳤을 때',
    '외부 강좌·워크숍 수료를 증명할 때',
    '교육 프로그램 수료식을 열 때',
    '개인 포트폴리오에 수료 이력을 남길 때',
  ],
  howTo: [
    '수여일과 수료자 성명·소속을 입력합니다.',
    '과정명과 교육 기간, 교육 시간, 강사를 적습니다.',
    '발급 기관과 대표자를 입력하고 도장 이미지를 넣습니다.',
    '미리보기에서 확인한 뒤 PDF로 내려받습니다.',
  ],
  notes: [
    '이 수료증은 참고 서식입니다. 수료 기준과 발급 절차는 교육 기관의 규정을 따르세요.',
    '발급 기관의 직인이나 확인 서명이 있어야 공식 문서로 인정되는 경우가 많습니다.',
    '과정명과 교육 시간은 수료를 증명하는 핵심 정보이므로 정확히 적으세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  blocks,
  sample: {
    docNo: 'K-20261115-001',
    date: '2026-11-15',
    name: '김옷깃',
    affiliation: '경영지원팀',
    course: '2026 사무행정 실무 과정',
    courseStart: '2026-09-01',
    courseEnd: '2026-10-31',
    hours: '40',
    instructor: '김강사',
    issuerCompany: '옷깃 아카데미',
    issuerCeo: '박대표',
  },
  compute: (values) => {
    const start = values.courseStart ? formatDateDot(values.courseStart) : '';
    const end = values.courseEnd ? formatDateDot(values.courseEnd) : '';
    const period = start && end ? `${start} ~ ${end}` : start || end;
    const hours = (values.hours ?? '').trim();
    const instructor = (values.instructor ?? '').trim();
    const course = (values.course ?? '').trim();
    return {
      periodLabel: period,
      courseLine: [
        course,
        period,
        hours ? `${hours}시간` : '',
        instructor ? `강사 ${instructor}` : '',
      ]
        .filter(Boolean)
        .join(' · '),
    };
  },
  validate: (values) => {
    const errors: string[] = [];
    if (values.courseStart && values.courseEnd && values.courseStart > values.courseEnd) {
      errors.push('교육 시작일은 종료일보다 늦을 수 없습니다.');
    }
    if (values.hours && Number(values.hours) <= 0) {
      errors.push('교육 시간은 1시간 이상이어야 합니다.');
    }
    return errors;
  },
  faq: [
    {
      q: '수료증에는 무엇을 적어야 하나요?',
      a: '수료자 성명, 과정명, 교육 기간, 교육 시간, 발급 기관과 대표자를 적으면 충분합니다. 기관에 따라 수료번호나 강사 이름을 추가하기도 합니다.',
    },
    {
      q: '직인 없이도 사용할 수 있나요?',
      a: '수료증의 효력은 교육 기관의 규정에 따릅니다. 공식 문서로 인정받으려면 발급 기관의 직인이나 확인 서명이 필요한 경우가 많습니다.',
    },
    {
      q: '교육 시간은 어떻게 표시되나요?',
      a: '교육 시간을 입력하면 과정명 옆에 “40시간”처럼 표시됩니다. 기관에서 인정하는 시간 기준에 맞춰 적으세요.',
    },
    {
      q: '여러 사람에게 한 번에 발급할 수 있나요?',
      a: '이 양식은 한 사람의 수료증을 만듭니다. 여러 명에게 발급하려면 이름을 바꿔 PDF를 반복해서 만들거나, 추후 CSV 대량 생성 기능을 사용하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다.',
    },
  ],
  sources: [
    { label: '교육부 — 평생교육 안내', href: 'https://www.moe.go.kr/' },
    { label: '행정안전부 — 문서 관리 안내', href: 'https://www.mois.go.kr/' },
  ],
  related: [
    { label: '상장', href: '/forms/award/' },
    { label: '재직증명서', href: '/forms/employment-certificate/' },
    { label: 'PDF 합치기', href: '/tools/pdf-merge/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
