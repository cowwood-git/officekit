import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const items: RepeatGroup = {
  id: 'items',
  label: '예산 항목',
  help: '예산 항목별 편성 금액과 집행 계획을 적습니다. 합계와 잔액이 자동으로 계산됩니다.',
  minRows: 3,
  maxRows: 30,
  addLabel: '+ 예산 항목 추가',
  required: true,
  group: '예산 정보',
  summaryField: 'totalBudgetLabel',
  summaryLabel: '편성 합계',
  columns: [
    {
      id: 'category',
      label: '예산 항목',
      type: 'text',
      required: true,
      placeholder: '예: 인건비',
      maxLength: 60,
      width: 2.6,
    },
    {
      id: 'budget',
      label: '편성 금액',
      type: 'money',
      required: true,
      placeholder: '0',
      width: 1.5,
    },
    {
      id: 'plan',
      label: '집행 계획',
      type: 'money',
      placeholder: '0',
      width: 1.5,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '집행 시기·근거',
      maxLength: 40,
      width: 1.6,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'BP-20261117-001',
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
    group: '예산 정보',
    required: true,
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'manager',
    label: '담당자',
    type: 'text',
    group: '예산 정보',
    placeholder: '김옷깃',
    maxLength: 30,
  },
  {
    id: 'fiscalYear',
    label: '회계 연도',
    type: 'text',
    group: '예산 정보',
    placeholder: '2027',
    defaultValue: '2027',
    required: true,
    maxLength: 4,
  },
  {
    id: 'countLabel',
    label: '예산 항목 수',
    type: 'computed',
    group: '예산 정보',
    help: '입력한 예산 항목 수입니다.',
  },
  {
    id: 'totalBudgetLabel',
    label: '편성 합계',
    type: 'computed',
    group: '예산 정보',
    help: '편성 금액의 합계입니다.',
  },
  {
    id: 'totalPlanLabel',
    label: '집행 계획 합계',
    type: 'computed',
    group: '예산 정보',
    help: '집행 계획 금액의 합계입니다.',
  },
  {
    id: 'remainingLabel',
    label: '잔액',
    type: 'computed',
    group: '예산 정보',
    help: '편성 합계에서 집행 계획을 뺀 금액입니다.',
  },
  {
    id: 'note',
    label: '집행 원칙',
    type: 'textarea',
    group: '집행 원칙',
    placeholder: '예산 조정·집행 승인·증빙 기준 등',
    maxLength: 600,
    rows: 3,
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

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.category ?? '').trim());

export const budgetPlan: FormTemplate = {
  slug: 'budget-plan',
  title: '예산 집행계획서',
  family: 'finance',
  category: 'money',
  description:
    '부서 예산의 항목별 편성 금액과 집행 계획을 정리하는 예산 집행계획서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 합계와 잔액이 자동 계산됩니다.',
  keywords: [
    '예산 집행계획서',
    '예산 집행계획서 양식',
    '부서 예산 계획',
    '예산 편성표',
    '집행 계획',
    '예산 집행계획서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'BP',
  lead: '부서 예산을 항목별로 편성하고 언제 얼마를 집행할지 정리하는 계획서입니다. 편성·집행 합계와 잔액을 자동으로 계산합니다.',
  useCases: [
    '연간·분기 부서 예산을 편성할 때',
    '예산 집행 계획을 승인받을 때',
    '항목별 잔액과 집행 시기를 확인할 때',
    '예산 조정·추경 자료로 쓸 때',
  ],
  howTo: [
    '문서 번호와 작성일, 부서와 회계 연도를 확인합니다.',
    '예산 항목별 편성 금액과 집행 계획을 입력합니다.',
    '편성 합계·집행 계획·잔액을 확인합니다.',
    '집행 원칙을 적고 PDF로 내려받아 결재를 받습니다.',
  ],
  notes: [
    '예산 금액과 집행 계획은 회사의 예산 편성 기준과 회계 연도에 맞춰 적으세요.',
    '집행 계획에는 시기와 근거를 비고에 남기면 승인과 집행이 쉬워집니다.',
    '예산을 초과해 집행하지 않도록 잔액을 확인하고, 변경은 추경·품의 절차를 따르세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '예산 집행계획서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '예산 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '부서', field: 'department' },
        { label: '담당자', field: 'manager' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '회계 연도', field: 'fiscalYear' },
        { label: '예산 항목 수', field: 'countLabel' },
      ],
    },
    { kind: 'section', title: '예산 항목' },
    {
      kind: 'table',
      columns: [
        { label: '예산 항목', width: 64 },
        { label: '편성 금액', width: 34, align: 'right' },
        { label: '집행 계획', width: 46, align: 'right' },
        { label: '비고', width: 30 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row) => [
          (row.category ?? '').trim(),
          parseAmount(row.budget ?? '') > 0 ? formatWon(parseAmount(row.budget ?? '')) : '',
          parseAmount(row.plan ?? '') > 0 ? formatWon(parseAmount(row.plan ?? '')) : '',
          (row.note ?? '').trim(),
        ]),
      minRows: 3,
    },
    {
      kind: 'totals',
      rows: [
        { label: '편성 합계', field: 'totalBudgetLabel' },
        { label: '집행 계획', field: 'totalPlanLabel' },
        { label: '잔액', field: 'remainingLabel', strong: true },
      ],
      width: 84,
    },
    { kind: 'section', title: '집행 원칙' },
    { kind: 'text', field: 'note', minLines: 3 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장', '부서장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = itemsOf(rows);
    const budget = list.reduce((sum, row) => sum + parseAmount(row.budget ?? ''), 0);
    const plan = list.reduce((sum, row) => sum + parseAmount(row.plan ?? ''), 0);
    return {
      countLabel: list.length > 0 ? `${list.length}개` : '',
      totalBudgetLabel: budget > 0 ? formatWon(budget) : '',
      totalPlanLabel: plan > 0 ? formatWon(plan) : '',
      remainingLabel: budget > 0 ? formatWon(budget - plan) : '',
    };
  },
  validate: (_values, rows) => {
    const list = itemsOf(rows);
    const errors: string[] = [];
    if (list.length === 0) errors.push('예산 항목을 한 줄 이상 입력하세요.');
    if (list.some((row) => parseAmount(row.plan ?? '') > parseAmount(row.budget ?? ''))) {
      errors.push('집행 계획은 편성 금액을 넘을 수 없습니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'BP-20261117-001',
    date: '2026-11-17',
    department: '경영지원팀',
    manager: '김옷깃',
    fiscalYear: '2027',
    note: '예산 변경은 분기별 검토 후 추경으로 반영합니다. 10만 원 이상 지출은 품의서를 거칩니다.',
  },
  sampleRows: {
    items: [
      { category: '인건비', budget: '180000000', plan: '180000000', note: '연간' },
      { category: '사무용품·비품', budget: '12000000', plan: '9000000', note: '분기별' },
      { category: '교육·세미나', budget: '6000000', plan: '4200000', note: '상반기 집중' },
      { category: '시설·유지보수', budget: '9000000', plan: '7500000', note: '연중' },
    ],
  },
  faq: [
    {
      q: '예산 집행계획서는 언제 작성하나요?',
      a: '연간·분기 예산을 편성할 때 작성합니다. 예산 변경이 있으면 추경 계획과 함께 다시 정리하세요.',
    },
    {
      q: '편성 금액과 집행 계획은 무엇이 다른가요?',
      a: '편성 금액은 배정된 예산 총액, 집행 계획은 실제로 사용할 계획 금액입니다. 잔액은 편성에서 집행 계획을 뺀 값입니다.',
    },
    {
      q: '집행 계획이 편성 금액을 넘으면 어떻게 되나요?',
      a: 'PDF를 만들 수 없습니다. 계획을 조정하거나 추경·예산 변경 절차를 먼저 진행하세요.',
    },
    {
      q: '부서 예산을 합쳐서 볼 수 있나요?',
      a: '이 양식은 한 부서 기준입니다. 전사 예산은 부서별 계획서를 합치거나 별도 예산표로 정리하세요.',
    },
  ],
  sources: [
    {
      label: '기획재정부 — 예산 편성 안내',
      href: 'https://www.moef.go.kr/',
    },
  ],
  related: [
    { label: '지출품의서 양식', href: '/forms/expense-request/' },
    { label: '지출결의서 양식', href: '/forms/expense-report/' },
    { label: '미수금내역 양식', href: '/forms/outstanding-balance/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
