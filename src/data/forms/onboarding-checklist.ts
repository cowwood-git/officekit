import { formatDateDot } from '@/lib/doc/format';
import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const items: RepeatGroup = {
  id: 'items',
  label: '온보딩 항목',
  help: '입사 전·1주·1개월 등 시기별 준비 항목과 담당, 상태를 적습니다. 진행률이 자동으로 계산됩니다.',
  minRows: 4,
  maxRows: 40,
  addLabel: '+ 항목 추가',
  required: true,
  group: '대상자 정보',
  summaryField: 'progressLabel',
  summaryLabel: '진행률',
  columns: [
    {
      id: 'phase',
      label: '구분',
      type: 'select',
      options: ['입사 전', '1주 차', '1개월 차', '3개월 차'],
      width: 1.2,
    },
    {
      id: 'task',
      label: '항목',
      type: 'text',
      required: true,
      placeholder: '예: 계정·출입카드 발급',
      maxLength: 80,
      width: 3,
    },
    {
      id: 'owner',
      label: '담당',
      type: 'text',
      placeholder: '담당자',
      maxLength: 30,
      width: 1.2,
    },
    {
      id: 'dueDate',
      label: '완료 예정',
      type: 'date',
      width: 1.3,
    },
    {
      id: 'status',
      label: '상태',
      type: 'select',
      options: ['예정', '진행 중', '완료'],
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
    placeholder: 'OB-20261117-001',
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
    id: 'name',
    label: '성명',
    type: 'text',
    group: '대상자 정보',
    required: true,
    placeholder: '김신입',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '대상자 정보',
    required: true,
    placeholder: '개발팀',
    maxLength: 40,
  },
  {
    id: 'position',
    label: '직위',
    type: 'text',
    group: '대상자 정보',
    placeholder: '사원',
    maxLength: 30,
  },
  {
    id: 'joinDate',
    label: '입사일',
    type: 'date',
    group: '대상자 정보',
    required: true,
  },
  {
    id: 'mentor',
    label: '담당 멘토',
    type: 'text',
    group: '대상자 정보',
    placeholder: '김옷깃',
    maxLength: 30,
  },
  {
    id: 'progressLabel',
    label: '진행률',
    type: 'computed',
    group: '대상자 정보',
    help: '완료 항목 수와 전체 항목 수를 표시합니다.',
  },
  {
    id: 'note',
    label: '추가 안내',
    type: 'textarea',
    group: '추가 안내',
    placeholder: '준비물, 첫날 안내, 문의처 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['담당자', '팀장'],
    defaultValue: JSON.stringify([
      { label: '담당자', enabled: true },
      { label: '팀장', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.task ?? '').trim());

export const onboardingChecklist: FormTemplate = {
  slug: 'onboarding-checklist',
  title: '신입 온보딩 체크리스트',
  family: 'hr',
  category: 'people',
  description:
    '신입 사원의 입사 전 준비부터 1주·1개월 적응까지 필요한 항목을 정리하는 온보딩 체크리스트를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '신입 온보딩 체크리스트',
    '온보딩 체크리스트 양식',
    '신입 사원 체크리스트',
    '입사 준비 체크리스트',
    '온보딩 계획',
    '온보딩 체크리스트 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'OB',
  lead: '신입 사원이 입사 전·입사 후 해야 할 일을 시기별로 정리하는 체크리스트입니다. 완료 항목을 표시하면 진행률이 자동으로 계산됩니다.',
  useCases: [
    '신입 사원 입사 전 준비물과 계정을 챙길 때',
    '첫 주 적응 일정과 담당자를 정할 때',
    '1개월·3개월 차 교육과 피드백을 관리할 때',
    '부서별 온보딩 담당자에게 진행 상황을 공유할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 대상자 정보를 확인합니다.',
    '입사 전·1주·1개월 등 시기별 항목과 담당자를 적습니다.',
    '완료한 항목의 상태를 “완료”로 바꾸면 진행률이 자동으로 계산됩니다.',
    '추가 안내를 적고 PDF로 내려받아 공유합니다.',
  ],
  notes: [
    '신입 사원의 개인정보는 온보딩 목적에 필요한 범위에서만 적으세요.',
    '항목별 담당자를 정해 두면 준비 누락을 줄일 수 있습니다.',
    '입사 첫날에는 계정·출입카드·좌석·장비를 먼저 확인하는 것이 좋습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '신입 온보딩 체크리스트',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '대상자 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '성명', field: 'name' },
        { label: '부서', field: 'department' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '직위', field: 'position' },
        { label: '입사일', field: 'joinDate' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '담당 멘토', field: 'mentor' },
        { label: '진행률', field: 'progressLabel' },
      ],
    },
    { kind: 'section', title: '온보딩 항목' },
    {
      kind: 'table',
      columns: [
        { label: '구분', width: 26 },
        { label: '항목', width: 62 },
        { label: '담당', width: 26 },
        { label: '완료 예정', width: 26 },
        { label: '상태', width: 34, align: 'center' },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row) => [
          (row.phase ?? '').trim(),
          (row.task ?? '').trim(),
          (row.owner ?? '').trim(),
          row.dueDate ? formatDateDot(row.dueDate) : '',
          (row.status ?? '').trim(),
        ]),
      minRows: 4,
    },
    { kind: 'section', title: '추가 안내' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['담당자', '팀장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = itemsOf(rows);
    const done = list.filter((row) => row.status === '완료').length;
    const percent = list.length > 0 ? Math.round((done / list.length) * 100) : 0;
    return {
      progressLabel: list.length > 0 ? `${done}/${list.length} · ${percent}%` : '',
    };
  },
  validate: (_values, rows) =>
    itemsOf(rows).length === 0 ? ['온보딩 항목을 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'OB-20261117-001',
    date: '2026-11-17',
    name: '김신입',
    department: '개발팀',
    position: '사원',
    joinDate: '2026-12-01',
    mentor: '김옷깃',
    note: '첫날 10시에 3층 교육장에서 오리엔테이션을 진행합니다. 노트북과 출입카드는 입사 전날까지 준비합니다.',
  },
  sampleRows: {
    items: [
      {
        phase: '입사 전',
        task: '입사 서류 안내·회수',
        owner: '경영지원팀',
        dueDate: '2026-11-25',
        status: '완료',
      },
      {
        phase: '입사 전',
        task: '계정·출입카드 발급',
        owner: 'IT팀',
        dueDate: '2026-11-28',
        status: '완료',
      },
      {
        phase: '입사 전',
        task: '좌석·노트북 준비',
        owner: '경영지원팀',
        dueDate: '2026-11-28',
        status: '진행 중',
      },
      {
        phase: '1주 차',
        task: '오리엔테이션·조직 소개',
        owner: '경영지원팀',
        dueDate: '2026-12-01',
        status: '예정',
      },
      {
        phase: '1주 차',
        task: '개발 환경 설치',
        owner: '김옷깃',
        dueDate: '2026-12-02',
        status: '예정',
      },
      {
        phase: '1개월 차',
        task: '첫 과제 리뷰',
        owner: '팀장',
        dueDate: '2026-12-31',
        status: '예정',
      },
      {
        phase: '3개월 차',
        task: '수습 평가·피드백',
        owner: '팀장',
        dueDate: '2027-02-28',
        status: '예정',
      },
      {
        phase: '3개월 차',
        task: '온보딩 만족도 확인',
        owner: '경영지원팀',
        dueDate: '2027-03-05',
        status: '예정',
      },
    ],
  },
  faq: [
    {
      q: '온보딩 체크리스트는 누가 작성하나요?',
      a: '인사·총무 담당자나 신입 사원의 멘토가 작성합니다. 항목별 담당자를 정해 준비 누락을 줄이세요.',
    },
    {
      q: '진행률은 어떻게 계산되나요?',
      a: '상태가 “완료”인 항목 수를 전체 항목 수로 나눈 비율입니다. 완료로 바꾸면 자동으로 갱신됩니다.',
    },
    {
      q: '항목은 어떻게 정하면 좋나요?',
      a: '입사 전 서류·계정·장비, 첫 주 오리엔테이션·환경 설정, 1개월 과제, 3개월 평가 순으로 나누면 빠뜨리기 어렵습니다.',
    },
    {
      q: '신입 사원에게도 공유하나요?',
      a: '네. PDF로 저장해 첫날 안내 자료로 함께 주면 스스로 준비할 항목을 알 수 있습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 신규 채용 안내',
      href: 'https://www.moel.go.kr/',
    },
  ],
  related: [
    { label: '교육 신청서 양식', href: '/forms/training-request/' },
    { label: '인수인계서 양식', href: '/forms/handover/' },
    { label: '업무분장표 양식', href: '/forms/rnr/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
