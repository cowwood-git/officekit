import type { FormBlock, FormField, FormTemplate, GridRow } from '@/lib/doc/types';

/** 사진 속 사무용 줄 노트(약 17×25cm). */
const SHEET = { width: 170, height: 250 };
const BLACK = '#1C1C1C';
const LINES = 13;

const fields: FormField[] = [
  { id: 'docNo', label: 'No.', type: 'text', group: '문서', placeholder: 'NTE-20261118-001' },
];

const rows: GridRow[] = [
  { height: 13, cells: [{ text: '' }] },
  ...Array.from({ length: LINES }, () => ({
    height: 222 / LINES,
    cells: [{ text: '' }],
  })),
  { height: 5, cells: [{ text: '' }] },
];

const printBlocks = (): FormBlock[] => [
  {
    kind: 'grid',
    columns: [160],
    rows,
    x: 5,
    gapBefore: 5,
    lineColor: BLACK,
    lineWidth: 0.18,
    overlays: [
      { x: 124, y: 1.4, text: 'No.', size: 6.5 },
      { x: 136, y: 1.4, field: 'docNo', size: 6.5 },
    ],
  },
];

const blocks: FormBlock[] = [
  { kind: 'paragraph', text: '줄 노트', align: 'center', size: 16, bold: true, after: 2 },
  { kind: 'kv', columns: 1, rows: [{ label: 'No.', field: 'docNo' }] },
  {
    kind: 'table',
    columns: [{ label: ' ', width: 160 }],
    rows: () => Array.from({ length: LINES }, () => ['']),
    minRows: LINES,
  },
];

export const linedNote: FormTemplate = {
  slug: 'lined-note',
  title: '줄 노트',
  family: 'admin',
  category: 'report',
  description:
    '사진 속 사무용 줄 노트와 같은 검은 테두리와 가로줄, 오른쪽 위 No. 칸을 그대로 재현해 A4에 인쇄하는 양식입니다.',
  keywords: ['줄 노트', '노트 양식', '사무용 노트', '기록지', '메모지', '줄공책'],
  updated: '2026-11-18',
  docPrefix: 'NTE',
  sheet: { ...SHEET, padding: 0, border: false },
  showFooter: false,
  lead: '사진 속 사무용 줄 노트와 같은 검은 테두리, 가로줄, 오른쪽 위 No. 칸을 그대로 옮겼습니다. A4에 실제 노트 크기로 인쇄합니다.',
  useCases: [
    '사무용 줄 노트를 A4에 인쇄할 때',
    '회의 메모·기록지를 직접 만들 때',
    'No.를 붙여 기록을 관리할 때',
    '필기용 빈 양식을 대량으로 출력할 때',
  ],
  howTo: [
    '필요하면 No.에 문서 번호를 적습니다.',
    'PDF로 내려받아 A4에 100% 크기로 인쇄합니다.',
    '여러 장이 필요하면 인쇄 매수를 늘립니다.',
  ],
  notes: [
    'A4에 170×250mm 크기로 중앙 배치됩니다. 인쇄 배율은 100%로 두세요.',
    '사진 속 상품 라벨의 크기가 잘려 17×25cm로 맞췄습니다. 실제 노트 크기가 다르면 알려 주세요.',
    '한글(HWPX)은 A4 기본 여백으로 만들어집니다. 실제 노트 크기로 인쇄하려면 PDF를 사용하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  blocks,
  printBlocks,
  sample: { docNo: 'NTE-20261118-001' },
  faq: [
    {
      q: '어떤 노트인가요?',
      a: '사진 속 사무용 줄 노트(50매입)와 같은 검은 테두리·가로줄·No. 칸을 재현한 필기용 양식입니다.',
    },
    {
      q: 'A4에 어떤 크기로 인쇄되나요?',
      a: '170×250mm 크기로 A4 중앙에 배치됩니다. 인쇄 배율을 100%로 두세요.',
    },
    {
      q: '줄 수를 바꿀 수 있나요?',
      a: '현재는 사진과 같은 14줄로 고정되어 있습니다. 줄 수·간격이 다르면 알려 주세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성은 브라우저 안에서 이루어집니다.',
    },
  ],
  sources: [],
  related: [
    { label: '회의록 양식', href: '/forms/meeting-minutes/' },
    { label: '업무일지 양식', href: '/forms/work-daily/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
