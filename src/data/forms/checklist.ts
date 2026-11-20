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
    label: '체크리스트 제목',
    type: 'text',
    group: '문서',
    placeholder: '예: 11월 정산 체크리스트',
    required: true,
    maxLength: 80,
    span: 2,
  },
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'CK-20261115-001',
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
    id: 'owner',
    label: '담당자',
    type: 'text',
    group: '점검 정보',
    placeholder: '홍길동',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '점검 정보',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'target',
    label: '점검 대상',
    type: 'text',
    group: '점검 정보',
    placeholder: '예: 11월 정산 마감',
    maxLength: 80,
    span: 3,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '내용',
    placeholder: '점검 결과 요약, 후속 조치',
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

const items: RepeatGroup = {
  id: 'items',
  label: '점검 항목',
  group: '점검 정보',
  help: '점검할 일을 한 줄에 하나씩 적고, 상태를 고르면 완료 항목에 체크 표시가 됩니다.',
  minRows: 6,
  maxRows: 30,
  addLabel: '+ 항목 추가',
  required: true,
  columns: [
    {
      id: 'item',
      label: '점검 항목',
      type: 'text',
      required: true,
      placeholder: '예: 정산서 금액 확인',
      maxLength: 80,
      width: 3,
    },
    {
      id: 'owner',
      label: '담당',
      type: 'text',
      placeholder: '담당자',
      maxLength: 20,
      width: 1.2,
    },
    {
      id: 'status',
      label: '상태',
      type: 'select',
      options: ['미확인', '진행 중', '완료', '해당 없음'],
      width: 1.2,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '메모',
      maxLength: 50,
      width: 1.8,
    },
  ],
};

const tableColumns = [
  { label: '확인', width: 10, align: 'center', checkbox: true },
  { label: '점검 항목', width: 72 },
  { label: '담당', width: 24 },
  { label: '상태', width: 24, align: 'center' },
  { label: '비고', width: 44 },
] as const;

const blocks: FormBlock[] = [
  {
    kind: 'header',
    variant: 'editorial',
    title: '체크리스트',
    titleField: 'title',
    docNoField: 'docNo',
    dateField: 'date',
  },
  { kind: 'section', title: '점검 정보' },
  {
    kind: 'kv',
    columns: 2,
    rows: [
      { label: '담당자', field: 'owner' },
      { label: '부서', field: 'department' },
    ],
  },
  { kind: 'kv', columns: 1, rows: [{ label: '점검 대상', field: 'target' }] },
  { kind: 'section', title: '진행 현황', hideInBlank: true },
  {
    kind: 'kv',
    columns: 2,
    hideInBlank: true,
    rows: [
      { label: '완료', field: 'doneLabel' },
      { label: '진행률', field: 'progressLabel' },
    ],
  },
  { kind: 'section', title: '점검 항목' },
  {
    kind: 'table',
    columns: tableColumns,
    grid: true,
    rows: (_values, rows) => {
      const list = (rows.items ?? []).filter((row) => (row.item ?? '').trim());
      return list.map((row) => [
        row.status === '완료' ? 'v' : '',
        (row.item ?? '').trim(),
        (row.owner ?? '').trim(),
        (row.status ?? '').trim(),
        (row.note ?? '').trim(),
      ]);
    },
    minRows: 4,
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

export const checklist: FormTemplate = {
  slug: 'checklist',
  title: '체크리스트',
  family: 'operations',
  category: 'report',
  description:
    '점검할 일과 담당자, 상태를 정리하는 체크리스트를 브라우저에서 만들고 A4 PDF로 저장합니다. 완료 항목은 자동으로 체크 표시됩니다.',
  keywords: [
    '체크리스트 양식',
    '체크리스트 PDF',
    '점검표 양식',
    '할 일 체크리스트',
    '업무 체크리스트',
  ],
  updated: '2026-11-15',
  docPrefix: 'CK',
  lead: '점검할 일을 한 줄에 하나씩 적고 담당자·상태를 정리하는 체크리스트입니다. 완료 항목은 체크 표시가 되고, 진행률이 자동으로 계산됩니다.',
  useCases: [
    '정산·마감 전에 확인할 일을 정리할 때',
    '시설·장비 점검 결과를 남길 때',
    '신입 온보딩·교육 항목을 관리할 때',
    '행사 준비·철수 항목을 빠짐없이 확인할 때',
  ],
  howTo: [
    '제목과 작성일, 담당자·부서, 점검 대상을 입력합니다.',
    '점검 항목과 담당자를 한 줄에 하나씩 적습니다.',
    '상태를 미확인·진행 중·완료·해당 없음 중에서 고릅니다.',
    '진행률을 확인하고, 서명란을 선택한 뒤 PDF로 내려받습니다.',
  ],
  notes: [
    '이 체크리스트는 참고용입니다. 회사의 점검 기준과 절차를 따르세요.',
    '상태를 “완료”로 바꾸면 PDF의 확인란에 체크 표시가 됩니다.',
    '빈 양식으로 내려받아 인쇄한 뒤 손으로 체크할 수도 있습니다.',
  ],
  fields,
  groups: [items],
  blocks,
  sample: {
    title: '11월 정산 체크리스트',
    docNo: 'CK-20261115-001',
    date: '2026-11-15',
    owner: '김옷깃',
    department: '경영지원팀',
    target: '11월 정산 마감',
    note: '미완료 항목은 11월 28일까지 처리합니다.',
  },
  sampleRows: {
    items: [
      { item: '정산서 금액 확인', owner: '김옷깃', status: '완료', note: '이상 없음' },
      { item: '영수증 원본 대조', owner: '김옷깃', status: '완료', note: '3매 확인' },
      { item: '법인카드 사용 내역 확인', owner: '박정리', status: '진행 중', note: '' },
      { item: '거래처별 잔액 확인', owner: '박정리', status: '미확인', note: '12월 초 확인' },
      { item: '정산 보고서 제출', owner: '김옷깃', status: '미확인', note: '' },
    ],
  },
  compute: (_values, rows) => {
    const list = (rows.items ?? []).filter((row) => (row.item ?? '').trim());
    const done = list.filter((row) => row.status === '완료').length;
    const total = list.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return {
      doneLabel: total > 0 ? `${done} / ${total}` : '',
      progressLabel: total > 0 ? `${percent}%` : '',
    };
  },
  faq: [
    {
      q: '완료 항목은 어떻게 체크되나요?',
      a: '상태를 “완료”로 선택하면 PDF의 확인란에 체크 표시가 그려집니다. 미확인·진행 중·해당 없음은 빈칸으로 남습니다.',
    },
    {
      q: '진행률은 어떻게 계산되나요?',
      a: '점검 항목 중 상태가 “완료”인 항목의 비율로 계산합니다. 항목을 추가하거나 상태를 바꾸면 바로 다시 계산됩니다.',
    },
    {
      q: '항목을 많이 추가해도 되나요?',
      a: '최대 30개까지 추가할 수 있습니다. 항목이 많으면 자동으로 다음 페이지로 이어지고, 표 머리글이 반복됩니다.',
    },
    {
      q: '빈 체크리스트로 인쇄할 수 있나요?',
      a: '미리보기 위의 “빈 양식”을 선택하면 입력값을 지운 체크리스트 PDF를 만들 수 있습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다.',
    },
  ],
  sources: [
    { label: '행정안전부 — 문서 관리 안내', href: 'https://www.mois.go.kr/' },
    { label: '고용노동부 — 안전보건 점검', href: 'https://www.moel.go.kr/' },
  ],
  related: [
    { label: '빈 표', href: '/forms/blank-table/' },
    { label: '인수인계서', href: '/forms/handover/' },
    { label: '주간업무보고', href: '/forms/weekly-report/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
