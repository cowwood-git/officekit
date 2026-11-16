import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const activities: RepeatGroup = {
  id: 'activities',
  label: '활동 내역',
  help: '시간·거래처·활동·내용을 한 줄씩 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 3,
  maxRows: 20,
  addLabel: '+ 활동 추가',
  required: true,
  columns: [
    {
      id: 'time',
      label: '시간',
      type: 'text',
      placeholder: '10:30',
      maxLength: 5,
      width: 1,
    },
    {
      id: 'company',
      label: '거래처',
      type: 'text',
      required: true,
      placeholder: '예: 거래처 주식회사',
      maxLength: 60,
      width: 2.2,
    },
    {
      id: 'type',
      label: '활동',
      type: 'select',
      options: ['방문', '전화', '메일', '미팅', '기타'],
      width: 1.2,
    },
    {
      id: 'content',
      label: '내용',
      type: 'text',
      placeholder: '논의·요청 사항',
      maxLength: 100,
      width: 3,
    },
    {
      id: 'next',
      label: '후속',
      type: 'text',
      placeholder: '다음 할 일',
      maxLength: 80,
      width: 2,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '기본 정보',
    placeholder: 'SD-20261117-001',
    help: '작성일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  {
    id: 'date',
    label: '작성일',
    type: 'date',
    group: '기본 정보',
    defaultToday: true,
    required: true,
  },
  {
    id: 'name',
    label: '성명',
    type: 'text',
    group: '작성자',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '작성자',
    placeholder: '영업팀',
    maxLength: 40,
  },
  {
    id: 'activityDate',
    label: '활동일',
    type: 'date',
    group: '활동 정보',
    required: true,
  },
  {
    id: 'totalActivities',
    label: '총 활동',
    type: 'computed',
    group: '활동 정보',
    help: '입력한 활동 건수입니다.',
  },
  {
    id: 'summary',
    label: '오늘 요약',
    type: 'textarea',
    group: '요약',
    placeholder: '오늘의 주요 성과와 분위기를 2~3줄로 정리합니다.',
    required: true,
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'plan',
    label: '다음 활동 계획',
    type: 'textarea',
    group: '요약',
    placeholder: '내일 하거나 이어서 할 일',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재',
    options: ['작성자', '팀장'],
    defaultValue: JSON.stringify([
      { label: '작성자', enabled: true },
      { label: '팀장', enabled: false },
    ]),
    maxSelected: 2,
    editable: true,
    help: '일일 일지는 보통 작성자와 팀장까지만 결재합니다.',
    span: 3,
  },
];

const tableRows = (rows: FormRows): readonly (readonly string[])[] => {
  const list = (rows.activities ?? []).filter((row) => (row.company ?? '').trim());
  return list.map((row) => [
    (row.time ?? '').trim(),
    (row.company ?? '').trim(),
    (row.type ?? '').trim(),
    (row.content ?? '').trim(),
    (row.next ?? '').trim(),
  ]);
};

export const salesDaily: FormTemplate = {
  slug: 'sales-daily',
  title: '영업활동일지',
  family: 'sales',
  category: 'report',
  description:
    '하루 동안의 거래처 방문·전화·메일 활동과 후속 조치를 시간 순서대로 정리하는 영업활동일지를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '영업활동일지',
    '영업일지 양식',
    '영업 활동 일지',
    '방문·전화 기록',
    '영업일보',
    '영업일지 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'SD',
  lead: '하루의 영업 활동을 시간 순서대로 남기는 일지입니다. 거래처·활동·내용·후속 조치를 한 표에 정리하고 총 활동 건수를 자동으로 셉니다.',
  useCases: [
    '하루 영업 활동을 팀에 공유할 때',
    '거래처 방문·전화 내용을 기록할 때',
    '후속 조치를 놓치지 않게 정리할 때',
    '주간·월간 보고의 기초 자료로 쓸 때',
  ],
  howTo: [
    '문서 번호와 작성일, 작성자 정보를 확인합니다.',
    '활동일을 적고 시간·거래처·활동·내용·후속 조치를 한 줄씩 추가합니다.',
    '오늘 요약과 다음 활동 계획을 적습니다.',
    'PDF로 내려받아 팀에 공유하거나 보관합니다.',
  ],
  notes: [
    '이 양식은 개인 영업 기록용입니다. 고객 개인정보는 필요한 범위에서만 적고 외부 공유에 주의하세요.',
    '가격·계약 조건은 확정된 내용만 적고, 미확정 사항은 후속 조치에 남기세요.',
    '매일 같은 시간에 정리하면 주간·월간 보고를 만들기 쉽습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [activities],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '영업활동일지',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '작성자' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '성명', field: 'name' },
        { label: '부서', field: 'department' },
      ],
    },
    { kind: 'section', title: '활동 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '활동일', field: 'activityDate' },
        { label: '총 활동', field: 'totalActivities' },
      ],
    },
    { kind: 'section', title: '활동 내역' },
    {
      kind: 'table',
      columns: [
        { label: '시간', width: 18 },
        { label: '거래처', width: 44 },
        { label: '활동', width: 18, align: 'center' },
        { label: '내용', width: 56 },
        { label: '후속', width: 38 },
      ],
      rows: (_values, rows) => tableRows(rows),
      minRows: 3,
    },
    { kind: 'section', title: '오늘 요약' },
    { kind: 'text', field: 'summary', minLines: 3 },
    { kind: 'section', title: '다음 활동 계획' },
    { kind: 'text', field: 'plan', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const count = (rows.activities ?? []).filter((row) => (row.company ?? '').trim()).length;
    return { totalActivities: count > 0 ? `${count}건` : '' };
  },
  validate: (_values, rows) => {
    const filled = (rows.activities ?? []).filter((row) => (row.company ?? '').trim());
    return filled.length === 0 ? ['활동 내역을 한 줄 이상 입력하세요.'] : [];
  },
  sample: {
    docNo: 'SD-20261117-001',
    date: '2026-11-17',
    name: '김옷깃',
    department: '영업팀',
    activityDate: '2026-11-17',
    summary:
      '신규 거래처 2곳을 방문하고 기존 거래처 1곳에 견적을 회신했습니다. 납품 일정 조정 요청은 물류팀 확인 후 회신할 예정입니다.',
    plan: '한빛오피스에 견적 수정본을 보내고, 거래처 주식회사 납품 일정을 확정합니다.',
  },
  sampleRows: {
    activities: [
      {
        time: '10:00',
        company: '거래처 주식회사',
        type: '방문',
        content: '12월 납품 일정 협의, 200박스 조정',
        next: '물류팀 확인 후 회신',
      },
      {
        time: '13:30',
        company: '한빛오피스',
        type: '전화',
        content: '사무용품 견적 요청, 3개 품목',
        next: '견적 수령 후 비교',
      },
      {
        time: '16:00',
        company: '새길문구',
        type: '메일',
        content: '견적서 회신 및 납기 확인',
        next: '12월 8일 방문 예정',
      },
    ],
  },
  faq: [
    {
      q: '영업활동일지에는 무엇을 적어야 하나요?',
      a: '시간·거래처·활동 유형·내용·후속 조치를 적고, 하루 마무리에 요약과 다음 계획을 남기면 충분합니다.',
    },
    {
      q: '방문하지 않은 날도 써야 하나요?',
      a: '전화·메일·미팅도 활동으로 기록할 수 있습니다. 활동이 없는 날은 비워 두거나 요약에 사유를 적으세요.',
    },
    {
      q: '총 활동은 어떻게 계산되나요?',
      a: '거래처가 입력된 활동 줄을 세어 건수로 표시합니다. 줄을 추가·삭제하면 자동으로 바뀝니다.',
    },
    {
      q: '주간보고와 어떻게 연결하나요?',
      a: '일지의 후속 조치와 요약을 주간보고에 옮기면 됩니다. 같은 업무 표 구조를 쓰고 있어 정리가 쉽습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '중소벤처기업부 — 판로·영업 지원',
      href: 'https://www.mss.go.kr/',
    },
  ],
  related: [
    { label: '거래처 방문보고서 양식', href: '/forms/visit-report/' },
    { label: '주간업무보고 양식', href: '/forms/weekly-report/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
