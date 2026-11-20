import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const schedule: RepeatGroup = {
  id: 'schedule',
  label: '일정·산출물',
  group: '내용',
  help: '단계별 기간과 산출물을 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 2,
  maxRows: 20,
  addLabel: '+ 단계 추가',
  required: true,
  columns: [
    {
      id: 'phase',
      label: '단계',
      type: 'text',
      required: true,
      placeholder: '예: 요구사항 정의',
      maxLength: 40,
      width: 2,
    },
    {
      id: 'period',
      label: '기간',
      type: 'text',
      placeholder: '예: 12/1~12/15',
      maxLength: 40,
      width: 1.8,
    },
    {
      id: 'deliverable',
      label: '산출물',
      type: 'text',
      placeholder: '예: 요구사항 정의서',
      maxLength: 60,
      width: 2.6,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'PK-20261117-001',
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
    id: 'projectName',
    label: '프로젝트명',
    type: 'text',
    group: '프로젝트 개요',
    required: true,
    placeholder: '예: 홈페이지 리뉴얼',
    maxLength: 100,
    span: 3,
  },
  {
    id: 'client',
    label: '발주처',
    type: 'text',
    group: '프로젝트 개요',
    placeholder: '예: 거래처 주식회사',
    maxLength: 60,
  },
  {
    id: 'manager',
    label: '프로젝트 책임자',
    type: 'text',
    group: '프로젝트 개요',
    required: true,
    placeholder: '김옷깃',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '수행 부서',
    type: 'text',
    group: '프로젝트 개요',
    placeholder: '개발팀',
    maxLength: 40,
  },
  {
    id: 'periodFrom',
    label: '시작일',
    type: 'date',
    group: '프로젝트 개요',
    required: true,
  },
  {
    id: 'periodTo',
    label: '종료일',
    type: 'date',
    group: '프로젝트 개요',
    required: true,
  },
  {
    id: 'budget',
    label: '예산',
    type: 'text',
    group: '프로젝트 개요',
    placeholder: '18,000,000',
    maxLength: 20,
  },
  {
    id: 'budgetLabel',
    label: '예산 표시',
    type: 'computed',
    group: '프로젝트 개요',
    help: '입력한 예산을 원 단위로 표시합니다.',
  },
  {
    id: 'goal',
    label: '프로젝트 목표',
    type: 'textarea',
    group: '내용',
    placeholder: '왜 이 프로젝트를 하는지, 무엇을 달성할지 적습니다.',
    required: true,
    maxLength: 600,
    rows: 2,
    span: 3,
  },
  {
    id: 'scope',
    label: '범위',
    type: 'textarea',
    group: '내용',
    placeholder: '포함되는 작업과 제외되는 작업을 구분해 적습니다.',
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'risks',
    label: '리스크·대응',
    type: 'textarea',
    group: '리스크',
    placeholder: '예상 리스크와 대응 방안',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['작성자', '팀장', '부서장', '본부장', '대표'],
    defaultValue: JSON.stringify([
      { label: '작성자', enabled: true },
      { label: '팀장', enabled: true },
      { label: '부서장', enabled: false },
      { label: '본부장', enabled: false },
      { label: '대표', enabled: false },
    ]),
    required: true,
    maxSelected: 5,
    editable: true,
    help: '5칸 중 필요한 단계만 켜고, 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const scheduleOf = (rows: FormRows): FormRows['schedule'] =>
  (rows.schedule ?? []).filter((row) => (row.phase ?? '').trim());

export const projectKickoff: FormTemplate = {
  slug: 'project-kickoff',
  title: '프로젝트 착수보고서',
  family: 'report',
  category: 'report',
  description:
    '프로젝트를 시작할 때 목표·범위·일정·산출물·예산·리스크를 한 장에 정리하는 착수보고서를 A4 PDF로 만듭니다. 끝난 뒤에는 결과보고서로 이어서 작성할 수 있습니다.',
  keywords: [
    '프로젝트 착수보고서',
    '착수보고서 양식',
    '프로젝트 계획서',
    '프로젝트 개요서',
    '킥오프 보고서',
    '착수보고서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'PK',
  lead: '프로젝트를 시작하며 목표와 범위, 일정, 예산, 리스크를 한 장에 정리하는 보고서입니다. 단계별 산출물을 표로 남겨 이해관계자와 기준을 맞춥니다.',
  useCases: [
    '신규 프로젝트를 시작하며 승인을 받을 때',
    '발주처·내부 팀에 프로젝트 개요를 공유할 때',
    '일정과 산출물의 기준을 정할 때',
    '예산·인력·리스크를 사전에 정리할 때',
  ],
  howTo: [
    '문서 번호와 작성일을 확인합니다.',
    '프로젝트명과 발주처, 책임자, 기간, 예산을 적습니다.',
    '목표와 범위를 구체적으로 적고 단계별 일정·산출물을 입력합니다.',
    '리스크와 대응을 적고 PDF로 내려받아 결재를 받습니다.',
  ],
  notes: [
    '이 보고서는 프로젝트 시작 시점의 기준을 정하는 문서입니다. 진행 중 변경은 변경 요청서나 회의록으로 남기세요.',
    '범위에 포함·제외되는 작업을 구분해 적으면 일정 지연과 추가 비용을 줄일 수 있습니다.',
    '예산은 인건비·외주비·장비비를 포함한 총액 기준으로 적고, 산정 근거는 별도로 보관하세요.',
  ],
  fields,
  groups: [schedule],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '프로젝트 착수보고서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '프로젝트 개요' },
    { kind: 'kv', columns: 1, rows: [{ label: '프로젝트명', field: 'projectName' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '발주처', field: 'client' },
        { label: '책임자', field: 'manager' },
      ],
    },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '수행 부서', field: 'department' },
        { label: '시작일', field: 'periodFrom' },
        { label: '종료일', field: 'periodTo' },
      ],
    },
    { kind: 'kv', columns: 2, rows: [{ label: '예산', field: 'budgetLabel' }] },
    { kind: 'section', title: '프로젝트 목표' },
    { kind: 'text', field: 'goal', minLines: 2 },
    { kind: 'section', title: '범위' },
    { kind: 'text', field: 'scope', minLines: 3 },
    { kind: 'section', title: '일정·산출물' },
    {
      kind: 'table',
      columns: [
        { label: '단계', width: 50 },
        { label: '기간', width: 50 },
        { label: '산출물', width: 74 },
      ],
      rows: (_values, rows) =>
        scheduleOf(rows).map((row) => [
          (row.phase ?? '').trim(),
          (row.period ?? '').trim(),
          (row.deliverable ?? '').trim(),
        ]),
      minRows: 3,
    },
    { kind: 'section', title: '리스크·대응' },
    { kind: 'text', field: 'risks', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장', '부서장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (values) => {
    const budget = parseAmount(values.budget ?? '');
    return { budgetLabel: budget > 0 ? formatWon(budget) : '' };
  },
  validate: (values) => {
    const errors: string[] = [];
    if (values.periodFrom && values.periodTo && values.periodTo < values.periodFrom) {
      errors.push('종료일은 시작일보다 빠를 수 없습니다.');
    }
    const budget = parseAmount(values.budget ?? '');
    if (values.budget?.trim() && budget <= 0) {
      errors.push('예산은 1원 이상이어야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'PK-20261117-001',
    date: '2026-11-17',
    projectName: '홈페이지 리뉴얼',
    client: '거래처 주식회사',
    manager: '김옷깃',
    department: '개발팀',
    periodFrom: '2026-12-01',
    periodTo: '2027-02-28',
    budget: '18000000',
    goal: '노후화된 홈페이지를 반응형으로 개편하고, 상담 신청 전환율을 20% 높입니다.',
    scope:
      '포함: 정보 구조 개선, PC·모바일 화면 설계, 상담 신청 폼, 관리자 페이지\n제외: 결제 시스템, 다국어, 기존 콘텐츠 원고 작성',
    risks:
      '연말 일정으로 고객사 담당자 검수가 지연될 수 있습니다. 2주 버퍼를 두고 주간 검수 일정을 합의합니다.',
  },
  sampleRows: {
    schedule: [
      { phase: '요구사항 정의', period: '12/1~12/15', deliverable: '요구사항 정의서' },
      { phase: '화면 설계', period: '12/16~1/10', deliverable: '와이어프레임·디자인 시안' },
      { phase: '개발·검수', period: '1/11~2/15', deliverable: '퍼블리싱·기능 구현' },
      { phase: '오픈', period: '2/16~2/28', deliverable: '오픈 체크리스트·운영 매뉴얼' },
    ],
  },
  faq: [
    {
      q: '착수보고서에는 무엇을 적어야 하나요?',
      a: '프로젝트명·발주처·책임자·기간·예산, 목표, 범위, 단계별 일정과 산출물, 리스크를 적습니다. 시작 시점의 기준을 남기는 것이 핵심입니다.',
    },
    {
      q: '범위는 어떻게 적나요?',
      a: '포함되는 작업과 제외되는 작업을 나눠 적습니다. “결제 시스템 제외”처럼 명시하면 나중에 추가 비용 분쟁을 줄일 수 있습니다.',
    },
    {
      q: '예산은 자동 계산되나요?',
      a: '입력한 예산을 원 단위로 표시합니다. 인건비·외주비·장비비를 포함한 총액인지 비고나 별도 문서에 명시하세요.',
    },
    {
      q: '진행 중 계획이 바뀌면 어떻게 하나요?',
      a: '착수보고서는 시작 기준으로 보관하고, 변경 사항은 변경 요청서·회의록·주간보고에 남깁니다. 필요한 경우 결과보고서에 차이를 정리하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '한국프로젝트경영협회 — 프로젝트 관리 안내',
      href: 'https://www.kpma.or.kr/',
    },
  ],
  related: [
    { label: '결과보고서 양식', href: '/forms/result-report/' },
    { label: '주간업무보고 양식', href: '/forms/weekly-report/' },
    { label: '회의록 양식', href: '/forms/meeting-minutes/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
