import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const items: RepeatGroup = {
  id: 'items',
  label: '평가 항목',
  help: '품질·납기·가격·대응·협업을 5점 척도로 평가합니다. 총점과 평균이 자동으로 계산됩니다.',
  minRows: 4,
  maxRows: 20,
  addLabel: '+ 평가 항목 추가',
  required: true,
  group: '평가 정보',
  summaryField: 'totalLabel',
  summaryLabel: '총점',
  columns: [
    {
      id: 'item',
      label: '평가 항목',
      type: 'text',
      required: true,
      placeholder: '예: 품질',
      maxLength: 60,
      width: 2.4,
    },
    {
      id: 'score',
      label: '점수',
      type: 'select',
      options: ['5', '4', '3', '2', '1'],
      width: 1,
    },
    {
      id: 'comment',
      label: '근거·의견',
      type: 'text',
      placeholder: '구체적인 사례·개선점',
      maxLength: 100,
      width: 3.6,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '평가 번호',
    type: 'text',
    group: '문서',
    placeholder: 'VE-20261117-001',
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
    id: 'vendor',
    label: '거래처명',
    type: 'text',
    group: '거래처 정보',
    required: true,
    placeholder: '예: 페이퍼랩',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'bizNo',
    label: '사업자번호',
    type: 'text',
    group: '거래처 정보',
    placeholder: '000-00-00000',
    maxLength: 20,
  },
  {
    id: 'manager',
    label: '거래처 담당자',
    type: 'text',
    group: '거래처 정보',
    placeholder: '이담당',
    maxLength: 40,
  },
  {
    id: 'period',
    label: '평가 기간',
    type: 'text',
    group: '평가 정보',
    placeholder: '예: 2026. 01. ~ 2026. 12.',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'evaluator',
    label: '평가자',
    type: 'text',
    group: '평가 정보',
    required: true,
    placeholder: '김평가',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '평가 정보',
    placeholder: '구매팀',
    maxLength: 40,
  },
  {
    id: 'itemCountLabel',
    label: '평가 항목 수',
    type: 'computed',
    group: '평가 정보',
    help: '입력한 평가 항목 수입니다.',
  },
  {
    id: 'totalLabel',
    label: '총점',
    type: 'computed',
    group: '평가 정보',
    help: '항목별 점수의 합계입니다.',
  },
  {
    id: 'averageLabel',
    label: '평균',
    type: 'computed',
    group: '평가 정보',
    help: '총점을 항목 수로 나눈 값입니다.',
  },
  {
    id: 'overall',
    label: '종합 의견',
    type: 'textarea',
    group: '종합 의견',
    placeholder: '강점, 개선점, 재계약·거래 지속 여부를 적습니다.',
    required: true,
    maxLength: 800,
    rows: 3,
    span: 3,
  },
  {
    id: 'recommendation',
    label: '거래 의견',
    type: 'select',
    group: '거래 의견',
    options: ['우수', '보통', '개선 필요', '거래 중단 검토'],
    defaultValue: '보통',
    required: true,
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['평가자', '구매 담당'],
    defaultValue: JSON.stringify([
      { label: '평가자', enabled: true },
      { label: '구매 담당', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.item ?? '').trim());

const scoreOf = (row: Record<string, string>): number => {
  const score = Number(row.score ?? '');
  return Number.isFinite(score) ? score : 0;
};

export const vendorEvaluation: FormTemplate = {
  slug: 'vendor-evaluation',
  title: '거래처 평가표',
  family: 'sales',
  category: 'money',
  description:
    '거래처의 품질·납기·가격·대응·협업을 5점 척도로 평가하는 거래처 평가표를 브라우저에서 작성하고 A4 PDF로 저장합니다. 총점·평균과 거래 의견을 한 장에 정리합니다.',
  keywords: [
    '거래처 평가표',
    '거래처 평가표 양식',
    '공급업체 평가',
    '협력사 평가표',
    '거래처 평가 기준',
    '거래처 평가표 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'VE',
  lead: '거래처의 품질·납기·가격·대응·협업을 같은 기준으로 평가하는 표입니다. 항목별 근거를 남기고 총점·평균과 거래 의견을 자동으로 정리합니다.',
  useCases: [
    '연간·반기 거래처 평가를 정리할 때',
    '여러 공급업체를 같은 기준으로 비교할 때',
    '재계약·거래 지속 여부를 검토할 때',
    '납기 지연·품질 문제의 개선을 요청할 때',
  ],
  howTo: [
    '평가일과 평가 기간, 거래처 정보를 확인합니다.',
    '품질·납기·가격·대응·협업을 5점 척도로 평가합니다.',
    '항목별 근거와 개선점을 적습니다.',
    '총점·평균을 확인하고 거래 의견을 고른 뒤 PDF로 내려받습니다.',
  ],
  notes: [
    '평가 기준을 미리 정해 두면 담당자마다 점수가 크게 달라지는 것을 줄일 수 있습니다. 예: 5 매우 우수 ~ 1 미흡.',
    '낮은 점수에는 구체적인 사례와 개선 요청을 함께 적으세요.',
    '거래처에 평가 결과를 공유할 때는 개인 평가가 아닌 거래 단위 평가임을 밝히세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '거래처 평가표',
      docNoField: 'docNo',
      dateField: 'date',
      docNoLabel: '평가번호',
      dateLabel: '작성일',
    },
    { kind: 'section', title: '거래처 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '거래처명', field: 'vendor' },
        { label: '사업자번호', field: 'bizNo' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '거래처 담당자', field: 'manager' }] },
    { kind: 'section', title: '평가 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '평가 기간', field: 'period' },
        { label: '평가자', field: 'evaluator' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '부서', field: 'department' },
        { label: '평가 항목 수', field: 'itemCountLabel' },
      ],
    },
    { kind: 'section', title: '평가 항목' },
    {
      kind: 'table',
      columns: [
        { label: '평가 항목', width: 52 },
        { label: '점수', width: 18, align: 'center' },
        { label: '근거·의견', width: 98 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row) => [
          (row.item ?? '').trim(),
          (row.score ?? '').trim(),
          (row.comment ?? '').trim(),
        ]),
      minRows: 5,
    },
    {
      kind: 'totals',
      rows: [
        { label: '총점', field: 'totalLabel' },
        { label: '평균', field: 'averageLabel', strong: true },
      ],
      width: 70,
    },
    { kind: 'section', title: '종합 의견' },
    { kind: 'text', field: 'overall', minLines: 3 },
    {
      kind: 'divider',
      width: 174,
      thickness: 0.2,
      color: '#D8D5CC',
      before: 1,
      after: 2,
    },
    { kind: 'kv', columns: 1, rows: [{ label: '거래 의견', field: 'recommendation' }] },
    {
      kind: 'signature',
      roles: ['평가자', '구매 담당'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = itemsOf(rows);
    const scored = list.filter((row) => scoreOf(row) > 0);
    const total = scored.reduce((sum, row) => sum + scoreOf(row), 0);
    const average = scored.length > 0 ? total / scored.length : 0;
    return {
      itemCountLabel: list.length > 0 ? `${list.length}개` : '',
      totalLabel: scored.length > 0 ? `${total}점` : '',
      averageLabel: scored.length > 0 ? `${average.toFixed(1)}점` : '',
    };
  },
  validate: (_values, rows) => {
    const list = itemsOf(rows);
    const errors: string[] = [];
    if (list.length === 0) errors.push('평가 항목을 한 줄 이상 입력하세요.');
    if (list.some((row) => scoreOf(row) <= 0)) {
      errors.push('모든 평가 항목에 점수를 선택하세요.');
    }
    return errors;
  },
  sample: {
    docNo: 'VE-20261117-001',
    date: '2026-11-17',
    vendor: '페이퍼랩',
    bizNo: '987-65-43210',
    manager: '이담당',
    period: '2026. 01. ~ 2026. 12.',
    evaluator: '김평가',
    department: '구매팀',
    overall:
      '품질과 대응이 안정적이고 납기도 대체로 지켰습니다. 다만 하반기 두 차례 납기 지연이 있었고, 긴급 주문 시 단가가 높아지는 점은 개선이 필요합니다. 내년에도 거래를 유지하되 납기와 긴급 대응 조건을 다시 협의하는 것이 좋겠습니다.',
    recommendation: '보통',
  },
  sampleRows: {
    items: [
      { item: '품질', score: '5', comment: '입고 불량률 1% 미만, 품질 안정적' },
      { item: '납기', score: '4', comment: '하반기 2회 지연, 사전 안내는 신속함' },
      { item: '가격', score: '4', comment: '시장 평균 수준, 긴급 주문 단가 인상' },
      { item: '대응', score: '5', comment: '문의 당일 회신, 교환 처리 빠름' },
      { item: '협업', score: '4', comment: '정기 미팅 참여, 개선 요청 반영 노력' },
    ],
  },
  faq: [
    {
      q: '거래처 평가는 얼마나 자주 하나요?',
      a: '회사 규정에 따라 다르지만 연 1~2회 정기 평가를 하고, 납기 지연·품질 문제가 반복되면 수시로 평가할 수 있습니다.',
    },
    {
      q: '평가 항목은 어떻게 정하나요?',
      a: '품질·납기·가격·대응·협업처럼 거래에 중요한 기준을 정하고, 각 점수의 의미를 미리 합의하세요.',
    },
    {
      q: '총점과 평균은 어떻게 계산되나요?',
      a: '점수가 입력된 항목의 합계와 평균을 계산합니다. 점수가 비어 있는 항목은 평균에서 제외됩니다.',
    },
    {
      q: '낮은 평가를 받은 거래처에 알려야 하나요?',
      a: '개선이 필요하다면 구체적인 사례와 함께 알리고 개선 계획을 협의하세요. 거래 중단은 계약 조건과 내부 절차를 따릅니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '공정거래위원회 — 하도급·거래 공정화 안내',
      href: 'https://www.ftc.go.kr/',
    },
    {
      label: '중소벤처기업부 — 협력사 지원 안내',
      href: 'https://www.mss.go.kr/',
    },
  ],
  related: [
    { label: '견적 요청서 양식', href: '/forms/rfq/' },
    { label: '검수확인서 양식', href: '/forms/inspection/' },
    { label: '거래처 등록신청서 양식', href: '/forms/vendor-registration/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
