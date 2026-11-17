import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const members: RepeatGroup = {
  id: 'members',
  label: '업무 분장',
  group: '부서 정보',
  help: '담당자별 업무와 책임, 대체 담당을 적습니다. 인원 수가 자동으로 계산됩니다.',
  minRows: 2,
  maxRows: 30,
  addLabel: '+ 담당자 추가',
  required: true,
  summaryField: 'memberCountLabel',
  summaryLabel: '인원',
  columns: [
    {
      id: 'name',
      label: '담당자',
      type: 'text',
      required: true,
      placeholder: '홍길동',
      maxLength: 30,
      width: 1.4,
    },
    {
      id: 'position',
      label: '직위',
      type: 'text',
      placeholder: '대리',
      maxLength: 30,
      width: 1,
    },
    {
      id: 'area',
      label: '담당 업무',
      type: 'text',
      required: true,
      placeholder: '예: 고객 상담',
      maxLength: 60,
      width: 2.4,
    },
    {
      id: 'responsibility',
      label: '주요 책임',
      type: 'text',
      placeholder: '예: 문의 응대·이슈 전달',
      maxLength: 60,
      width: 2.4,
    },
    {
      id: 'backup',
      label: '대체 담당',
      type: 'text',
      placeholder: '이데이터',
      maxLength: 30,
      width: 1.2,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'RN-20261117-001',
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
    id: 'department',
    label: '부서',
    type: 'text',
    group: '부서 정보',
    required: true,
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'head',
    label: '부서장',
    type: 'text',
    group: '부서 정보',
    placeholder: '박부장',
    maxLength: 30,
  },
  {
    id: 'effectiveDate',
    label: '적용 시작일',
    type: 'date',
    group: '부서 정보',
    required: true,
  },
  {
    id: 'memberCountLabel',
    label: '인원',
    type: 'computed',
    group: '부서 정보',
    help: '등록된 담당자 수입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '겸임 업무, 협업 부서, 변경 예정 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['작성자', '부서장', '본부장', '대표', '전결'],
    defaultValue: JSON.stringify([
      { label: '작성자', enabled: true },
      { label: '부서장', enabled: true },
      { label: '본부장', enabled: false },
      { label: '대표', enabled: false },
      { label: '전결', enabled: false },
    ]),
    required: true,
    maxSelected: 5,
    editable: true,
    help: '5칸 중 필요한 단계만 켜고, 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const membersOf = (rows: FormRows): FormRows['members'] =>
  (rows.members ?? []).filter((row) => (row.name ?? '').trim());

export const rnr: FormTemplate = {
  slug: 'rnr',
  title: '업무분장표',
  family: 'report',
  category: 'report',
  description:
    '부서 구성원의 담당 업무와 책임, 대체 담당을 한눈에 정리하는 업무분장표를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '업무분장표',
    '업무 분장표 양식',
    'R&R 표',
    '담당 업무표',
    '업무분담표',
    '업무분장표 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'RN',
  lead: '부서 구성원이 각각 무엇을 담당하는지 정리하는 표입니다. 담당 업무와 주요 책임, 대체 담당을 적어 역할을 명확히 합니다.',
  useCases: [
    '부서 개편 후 업무를 다시 나눌 때',
    '신규 입사자에게 역할을 안내할 때',
    '겸임·대체 담당을 정리할 때',
    '평가·인수인계의 기준 자료로 쓸 때',
  ],
  howTo: [
    '문서 번호와 작성일, 부서 정보를 확인합니다.',
    '부서장과 적용 시작일을 적습니다.',
    '담당자별 담당 업무·주요 책임·대체 담당을 입력합니다.',
    '인원과 비고를 확인하고 PDF로 내려받아 공유합니다.',
  ],
  notes: [
    '업무분장은 조직 개편·인사 이동 때마다 갱신하고 적용 시작일을 남기세요.',
    '한 사람에게 업무가 몰리지 않도록 대체 담당을 함께 정하는 것이 좋습니다.',
    '개인별 평가나 징계 자료로 사용하기보다 역할 안내와 협업 기준으로 활용하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [members],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '업무분장표',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '부서 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '부서', field: 'department' },
        { label: '부서장', field: 'head' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '적용 시작일', field: 'effectiveDate' },
        { label: '인원', field: 'memberCountLabel' },
      ],
    },
    { kind: 'section', title: '업무 분장' },
    {
      kind: 'table',
      columns: [
        { label: '담당자', width: 28 },
        { label: '직위', width: 20 },
        { label: '담당 업무', width: 54 },
        { label: '주요 책임', width: 48 },
        { label: '대체 담당', width: 24 },
      ],
      rows: (_values, rows) =>
        membersOf(rows).map((row) => [
          (row.name ?? '').trim(),
          (row.position ?? '').trim(),
          (row.area ?? '').trim(),
          (row.responsibility ?? '').trim(),
          (row.backup ?? '').trim(),
        ]),
      minRows: 4,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '부서장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const count = membersOf(rows).length;
    return { memberCountLabel: count > 0 ? `${count}명` : '' };
  },
  validate: (_values, rows) => {
    const list = membersOf(rows);
    return list.length === 0 ? ['업무를 분장할 담당자를 한 명 이상 입력하세요.'] : [];
  },
  sample: {
    docNo: 'RN-20261117-001',
    date: '2026-11-17',
    department: '경영지원팀',
    head: '박부장',
    effectiveDate: '2026-12-01',
    note: '12월부터 신규 입사자 1명이 합류해 고객 상담 업무를 분담합니다.',
  },
  sampleRows: {
    members: [
      {
        name: '김옷깃',
        position: '대리',
        area: '총무·자산',
        responsibility: '비품·시설 관리, 자산 대장',
        backup: '이데이터',
      },
      {
        name: '이데이터',
        position: '과장',
        area: '인사·급여',
        responsibility: '채용·근태·급여 정산',
        backup: '김옷깃',
      },
      {
        name: '박표',
        position: '사원',
        area: '회계·정산',
        responsibility: '지출 증빙, 세금계산서',
        backup: '이데이터',
      },
      {
        name: '최문서',
        position: '대리',
        area: '고객 상담',
        responsibility: '문의 응대, 클레임 전달',
        backup: '박표',
      },
    ],
  },
  faq: [
    {
      q: '업무분장표에는 무엇을 적어야 하나요?',
      a: '담당자별 이름·직위·담당 업무·주요 책임과 대체 담당을 적습니다. 업무가 겹치거나 비는 부분을 확인하는 데 목적이 있습니다.',
    },
    {
      q: 'R&R과 같은 문서인가요?',
      a: '비슷합니다. R&R(Responsibility & Role)은 역할과 책임을 정리한 개념이고, 업무분장표는 이를 표로 문서화한 것입니다.',
    },
    {
      q: '부서가 바뀌면 어떻게 하나요?',
      a: '새 업무분장표를 만들어 적용 시작일을 새로 적고, 이전 문서는 이력으로 보관하세요.',
    },
    {
      q: '평가 자료로 써도 되나요?',
      a: '업무분장표는 역할 안내용입니다. 인사 평가에 활용하려면 별도의 평가 기준과 절차를 마련해야 합니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 직무·조직 관리 안내',
      href: 'https://www.moel.go.kr/',
    },
  ],
  related: [
    { label: '인수인계서 양식', href: '/forms/handover/' },
    { label: '일일업무일지 양식', href: '/forms/work-log/' },
    { label: '주간업무보고 양식', href: '/forms/weekly-report/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
