import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const visitors: RepeatGroup = {
  id: 'visitors',
  label: '방문 기록',
  help: '방문 시간·방문자·소속·방문 목적·담당자를 적습니다. 총 방문 인원이 자동으로 계산됩니다.',
  minRows: 3,
  maxRows: 40,
  addLabel: '+ 방문자 추가',
  required: true,
  group: '방문 정보',
  summaryField: 'totalVisitorsLabel',
  summaryLabel: '총 방문 인원',
  columns: [
    {
      id: 'time',
      label: '일시',
      type: 'text',
      placeholder: '10:30',
      maxLength: 20,
      width: 1,
    },
    {
      id: 'name',
      label: '방문자',
      type: 'text',
      required: true,
      placeholder: '홍길동',
      maxLength: 30,
      width: 1.4,
    },
    {
      id: 'company',
      label: '소속',
      type: 'text',
      placeholder: '예: 거래처 주식회사',
      maxLength: 60,
      width: 2.2,
    },
    {
      id: 'purpose',
      label: '방문 목적',
      type: 'text',
      placeholder: '예: 계약 협의',
      maxLength: 60,
      width: 2.4,
    },
    {
      id: 'host',
      label: '담당자',
      type: 'text',
      placeholder: '김옷깃',
      maxLength: 30,
      width: 1.4,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'VL-20261117-001',
    help: '작성일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
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
    id: 'visitDate',
    label: '방문일',
    type: 'date',
    group: '방문 정보',
    required: true,
  },
  {
    id: 'place',
    label: '방문 장소',
    type: 'text',
    group: '방문 정보',
    required: true,
    placeholder: '예: 본사 3층 회의실',
    maxLength: 80,
  },
  {
    id: 'manager',
    label: '접수자',
    type: 'text',
    group: '방문 정보',
    required: true,
    placeholder: '김옷깃',
    maxLength: 30,
  },
  {
    id: 'totalVisitorsLabel',
    label: '총 방문 인원',
    type: 'computed',
    group: '방문 정보',
    help: '방문 기록의 인원 합계입니다.',
  },
  {
    id: 'note',
    label: '안내 사항',
    type: 'textarea',
    group: '안내 사항',
    placeholder: '출입 안내, 개인정보 수집·이용 고지, 특이 사항',
    maxLength: 400,
    rows: 5,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['접수자', '확인자'],
    defaultValue: JSON.stringify([
      { label: '접수자', enabled: true },
      { label: '확인자', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '접수자와 확인자 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const visitorsOf = (rows: FormRows): FormRows['visitors'] =>
  (rows.visitors ?? []).filter((row) => (row.name ?? '').trim());

export const visitorLog: FormTemplate = {
  slug: 'visitor-log',
  title: '방문기록부',
  family: 'operations',
  category: 'report',
  description:
    '사무실·공장을 찾은 방문자의 시간·소속·방문 목적·담당자를 기록하는 방문기록부를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '방문기록부',
    '방문기록부 양식',
    '방문자 기록',
    '출입 기록부',
    '방문 확인서',
    '방문기록부 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'VL',
  lead: '방문자의 출입과 방문 목적을 남기는 기록부입니다. 일시·소속·담당자를 표로 정리하고 총 방문 인원을 자동으로 계산합니다.',
  useCases: [
    '사무실·공장 방문자를 접수할 때',
    '출입 기록을 일별로 정리할 때',
    '방문 목적과 담당자를 남길 때',
    '보안·안전 교육 이력을 확인할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 방문일·장소를 확인합니다.',
    '방문 시간과 방문자·소속·방문 목적·담당자를 입력합니다.',
    '총 방문 인원을 확인하고 안내 사항을 적습니다.',
    'PDF로 내려받아 접수자·확인자 서명을 받습니다.',
  ],
  notes: [
    '방문자의 이름·연락처 등 개인정보는 출입 관리 목적에 필요한 범위에서만 수집하고, 보관 기간과 파기 절차를 정하세요.',
    '개인정보 수집·이용 안내를 출입구에 게시하거나 안내 사항에 적어 동의를 받는 것이 좋습니다.',
    '방문기록은 외부에 공개하지 말고 담당자만 접근할 수 있게 보관하세요.',
  ],
  fields,
  groups: [visitors],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '방문기록부',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '방문 정보' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '방문일', field: 'visitDate' },
        { label: '방문 장소', field: 'place' },
        { label: '접수자', field: 'manager' },
      ],
    },
    { kind: 'kv', columns: 2, rows: [{ label: '총 방문 인원', field: 'totalVisitorsLabel' }] },
    { kind: 'section', title: '방문 기록' },
    {
      kind: 'table',
      columns: [
        { label: '일시', width: 22 },
        { label: '방문자', width: 28 },
        { label: '소속', width: 44 },
        { label: '방문 목적', width: 50 },
        { label: '담당자', width: 30 },
      ],
      rows: (_values, rows) =>
        visitorsOf(rows).map((row) => [
          (row.time ?? '').trim(),
          (row.name ?? '').trim(),
          (row.company ?? '').trim(),
          (row.purpose ?? '').trim(),
          (row.host ?? '').trim(),
        ]),
      minRows: 4,
    },
    { kind: 'section', title: '안내 사항' },
    { kind: 'text', field: 'note', minLines: 5 },
    {
      kind: 'signature',
      roles: ['접수자', '확인자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const count = visitorsOf(rows).length;
    return { totalVisitorsLabel: count > 0 ? `${count}명` : '' };
  },
  validate: (_values, rows) =>
    visitorsOf(rows).length === 0 ? ['방문 기록을 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'VL-20261117-001',
    date: '2026-11-17',
    visitDate: '2026-11-17',
    place: '본사 3층 회의실',
    manager: '김옷깃',
    note: '방문자 개인정보는 출입 관리 목적으로만 수집하며, 1년 보관 후 파기합니다.',
  },
  sampleRows: {
    visitors: [
      {
        time: '10:00',
        name: '김방문',
        company: '거래처 주식회사',
        purpose: '계약 협의',
        host: '김옷깃',
      },
      {
        time: '14:00',
        name: '이방문',
        company: '한빛오피스',
        purpose: '납품 일정 확인',
        host: '박표',
      },
      {
        time: '16:30',
        name: '박방문',
        company: '새길문구',
        purpose: '견적 전달',
        host: '이데이터',
      },
    ],
  },
  faq: [
    {
      q: '방문기록부는 왜 필요한가요?',
      a: '출입 관리와 보안, 방문 목적 확인을 위해 기록합니다. 화재·안전 교육 이력이나 분실물 확인에도 도움이 됩니다.',
    },
    {
      q: '개인정보를 모두 적어야 하나요?',
      a: '이름·소속·방문 목적처럼 출입 관리에 필요한 최소 정보만 적습니다. 연락처는 필요할 때만 수집하고 보관 기간을 정하세요.',
    },
    {
      q: '방문자가 많으면 어떻게 하나요?',
      a: '방문 기록에 한 줄씩 추가하면 총 인원이 자동으로 계산됩니다. 하루 방문자가 아주 많으면 시간대별로 문서를 나누어도 됩니다.',
    },
    {
      q: '방문기록은 얼마나 보관하나요?',
      a: '회사 규정과 개인정보 처리방침에 따라 정합니다. 보관 목적이 끝나면 지체 없이 파기하세요.',
    },
  ],
  sources: [
    {
      label: '개인정보보호위원회 — 개인정보 처리 안내',
      href: 'https://www.pipc.go.kr/',
    },
  ],
  related: [
    { label: '개인정보 동의서 양식', href: '/forms/privacy-consent/' },
    { label: '안전점검일지 양식', href: '/forms/safety-check/' },
    { label: '시설물 점검표 양식', href: '/forms/facility-check/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
