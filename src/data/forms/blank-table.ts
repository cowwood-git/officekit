import type { FormBlock, FormField, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const signatureDefault = JSON.stringify([
  { label: '작성자', enabled: true },
  { label: '확인자', enabled: true },
  { label: '승인자', enabled: false },
  { label: '부서장', enabled: false },
  { label: '대표', enabled: false },
]);

const fields: FormField[] = [
  {
    id: 'title',
    label: '표 제목',
    type: 'text',
    group: '문서',
    placeholder: '예: 11월 업무 현황',
    required: true,
    maxLength: 80,
    span: 2,
  },
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'B-20261115-001',
    help: '작성일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다.',
  },
  {
    id: 'date',
    label: '작성일',
    type: 'date',
    group: '문서',
    defaultToday: true,
    required: true,
  },
  {
    id: 'author',
    label: '작성자',
    type: 'text',
    group: '작성 정보',
    placeholder: '홍길동',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '작성 정보',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'columnCount',
    label: '열 수',
    type: 'select',
    group: '표 설정',
    options: ['2', '3', '4', '5'],
    defaultValue: '5',
    help: 'PDF에는 선택한 열까지만 나옵니다.',
  },
  {
    id: 'col1',
    label: '1열 이름',
    type: 'text',
    group: '표 설정',
    defaultValue: '항목',
    maxLength: 20,
  },
  {
    id: 'col2',
    label: '2열 이름',
    type: 'text',
    group: '표 설정',
    defaultValue: '수량',
    maxLength: 20,
  },
  {
    id: 'col3',
    label: '3열 이름',
    type: 'text',
    group: '표 설정',
    defaultValue: '단위',
    maxLength: 20,
  },
  {
    id: 'col4',
    label: '4열 이름',
    type: 'text',
    group: '표 설정',
    defaultValue: '금액',
    maxLength: 20,
  },
  {
    id: 'col5',
    label: '5열 이름',
    type: 'text',
    group: '표 설정',
    defaultValue: '비고',
    maxLength: 20,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '내용',
    placeholder: '표 아래에 남길 메모',
    rows: 2,
    maxLength: 300,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명',
    type: 'roles',
    group: '서명',
    options: ['작성자', '확인자', '승인자', '부서장', '대표'],
    defaultValue: signatureDefault,
    maxSelected: 5,
    editable: true,
    help: '최대 5명까지 선택할 수 있고, 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const rows: RepeatGroup = {
  id: 'rows',
  label: '표 내용',
  group: '표 설정',
  help: '위에서 정한 열 이름 순서대로 입력합니다. 빈 줄은 PDF에 나오지 않습니다.',
  minRows: 6,
  maxRows: 30,
  addLabel: '+ 행 추가',
  columns: [
    { id: 'c1', label: '1열', type: 'text', placeholder: '값', width: 1.4 },
    { id: 'c2', label: '2열', type: 'text', placeholder: '값', width: 1 },
    { id: 'c3', label: '3열', type: 'text', placeholder: '값', width: 1.4 },
    { id: 'c4', label: '4열', type: 'text', placeholder: '값', width: 1 },
    { id: 'c5', label: '5열', type: 'text', placeholder: '값', width: 1.4 },
  ],
};

const tableColumns = [
  { label: '', labelField: 'col1', width: 1.4 },
  { label: '', labelField: 'col2', width: 1 },
  { label: '', labelField: 'col3', width: 1.4 },
  { label: '', labelField: 'col4', width: 1 },
  { label: '', labelField: 'col5', width: 1.4 },
] as const;

const blocks: FormBlock[] = [
  {
    kind: 'header',
    variant: 'editorial',
    title: '표',
    titleField: 'title',
    docNoField: 'docNo',
    dateField: 'date',
  },
  { kind: 'section', title: '작성 정보' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '작성자', field: 'author' },
      { label: '부서', field: 'department' },
    ],
  },
  { kind: 'section', title: '표' },
  {
    kind: 'table',
    columns: tableColumns,
    columnCountField: 'columnCount',
    grid: true,
    rows: (_values, rowValues) => {
      const items = (rowValues.rows ?? []).filter((row) =>
        [row.c1, row.c2, row.c3, row.c4, row.c5].some((value) => (value ?? '').trim()),
      );
      return items.map((row) => [
        (row.c1 ?? '').trim(),
        (row.c2 ?? '').trim(),
        (row.c3 ?? '').trim(),
        (row.c4 ?? '').trim(),
        (row.c5 ?? '').trim(),
      ]);
    },
    minRows: 5,
    blankMinRows: 8,
  },
  { kind: 'text', label: '비고', field: 'note', minLines: 2 },
  {
    kind: 'signature',
    roles: ['작성자', '확인자'],
    rolesField: 'approvalRoles',
    bottom: true,
  },
];

export const blankTable: FormTemplate = {
  slug: 'blank-table',
  title: '빈 표',
  family: 'report',
  category: 'report',
  description:
    '행을 추가하고 열 이름을 바꿔 바로 쓰는 빈 표 양식입니다. 표를 채운 뒤 A4 PDF로 저장할 수 있고, 입력한 내용은 서버로 전송되지 않습니다.',
  keywords: ['빈 표 양식', '표 양식 PDF', '빈 테이블', '엑셀 대신 표', '업무 표 양식'],
  updated: '2026-11-15',
  docPrefix: 'B',
  showFooter: true,
  lead: '정해진 서식이 없는 업무에 쓰는 빈 표입니다. 열 이름을 바꾸고 행을 추가해 표를 채운 뒤 A4 PDF로 저장하세요.',
  useCases: [
    '정해진 서식 없이 목록을 정리할 때',
    '회의·점검 결과를 표로 남길 때',
    '간단한 현황·재고·일정 표를 만들 때',
    '인쇄해서 손으로 작성할 빈 표가 필요할 때',
  ],
  howTo: [
    '표 제목과 작성일, 작성자·부서를 입력합니다.',
    '열 수와 각 열 이름을 정합니다.',
    '표 내용을 행 단위로 입력하고, 필요하면 행을 추가합니다.',
    '미리보기에서 열과 행을 확인한 뒤 PDF로 내려받습니다.',
  ],
  notes: [
    '이 표는 참고용입니다. 회사 규정이나 제출 기관의 서식이 있으면 그것을 우선하세요.',
    '열 수를 줄이면 PDF에서 뒤쪽 열은 표시되지 않습니다.',
    '빈 양식 PDF로 내려받아 인쇄한 뒤 손으로 작성할 수도 있습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다.',
  ],
  fields,
  groups: [rows],
  blocks,
  sample: {
    title: '11월 업무 현황',
    docNo: 'B-20261115-001',
    date: '2026-11-15',
    author: '김옷깃',
    department: '경영지원팀',
    columnCount: '5',
    col1: '업무',
    col2: '담당',
    col3: '상태',
    col4: '진행률',
    col5: '비고',
    note: '매주 금요일 기준으로 갱신합니다.',
  },
  sampleRows: {
    rows: [
      { c1: '11월 정산 마감', c2: '김옷깃', c3: '완료', c4: '100%', c5: '이상 없음' },
      { c1: '문서 양식 표준화', c2: '박정리', c3: '진행 중', c4: '70%', c5: '' },
      { c1: '사무용품 재고 조사', c2: '이옷깃', c3: '진행 전', c4: '0%', c5: '12월 예정' },
    ],
  },
  faq: [
    {
      q: '열 수를 바꾸면 어떻게 되나요?',
      a: 'PDF에는 선택한 열 수까지만 표시됩니다. 3열을 선택하면 1~3열만 나오고, 4~5열에 입력한 값은 문서에 포함되지 않습니다.',
    },
    {
      q: '행을 더 추가할 수 있나요?',
      a: '표 내용 아래의 “행 추가” 버튼으로 최대 30행까지 추가할 수 있습니다. 빈 행은 PDF에 표시되지 않습니다.',
    },
    {
      q: '빈 표로 인쇄할 수 있나요?',
      a: '미리보기 위의 “빈 양식”을 선택하면 입력값을 지운 빈 표 PDF를 만들 수 있습니다.',
    },
    {
      q: '열 이름에 긴 문장을 넣어도 되나요?',
      a: '열 이름은 20자 이내로 짧게 적는 것이 좋습니다. 긴 문장은 PDF에서 잘릴 수 있습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다.',
    },
  ],
  sources: [{ label: '행정안전부 — 문서 관리 안내', href: 'https://www.mois.go.kr/' }],
  related: [
    { label: '체크리스트', href: '/forms/checklist/' },
    { label: '회의록', href: '/forms/meeting-minutes/' },
    { label: 'PDF 합치기', href: '/tools/pdf-merge/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
