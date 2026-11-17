import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

const rows: RepeatGroup = {
  id: 'wages',
  label: '임금 내역',
  help: '사원별 기본급·수당·공제를 적으면 지급액과 실수령액이 자동 계산됩니다.',
  minRows: 2,
  maxRows: 30,
  addLabel: '+ 사원 추가',
  required: true,
  group: '귀속 정보',
  summaryField: 'totalNetLabel',
  summaryLabel: '실수령액 합계',
  columns: [
    {
      id: 'name',
      label: '성명',
      type: 'text',
      required: true,
      placeholder: '김근로',
      maxLength: 30,
      width: 1.6,
    },
    {
      id: 'basePay',
      label: '기본급',
      type: 'money',
      placeholder: '2,500,000',
      width: 1.8,
    },
    {
      id: 'allowance',
      label: '수당',
      type: 'money',
      placeholder: '0',
      width: 1.4,
    },
    {
      id: 'gross',
      label: '지급액',
      type: 'computed',
      width: 1.5,
    },
    {
      id: 'deduction',
      label: '공제',
      type: 'money',
      placeholder: '0',
      width: 1.4,
    },
    {
      id: 'net',
      label: '실수령액',
      type: 'computed',
      width: 1.6,
    },
  ],
  computeRow: (row) => {
    const gross = parseAmount(row.basePay ?? '') + parseAmount(row.allowance ?? '');
    const net = gross - parseAmount(row.deduction ?? '');
    return {
      gross: gross > 0 ? formatWon(gross) : '',
      net: gross > 0 ? formatWon(Math.max(0, net)) : '',
    };
  },
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'WGL-20261118-001',
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
    id: 'company',
    label: '사업장명',
    type: 'text',
    group: '귀속 정보',
    placeholder: '옷깃 주식회사',
    required: true,
    maxLength: 60,
    span: 2,
  },
  {
    id: 'period',
    label: '귀속 월',
    type: 'text',
    group: '귀속 정보',
    placeholder: '예: 2026-11',
    required: true,
    maxLength: 20,
  },
  {
    id: 'totalGrossLabel',
    label: '지급액 합계',
    type: 'computed',
    group: '귀속 정보',
    help: '사원별 지급액의 합계입니다.',
  },
  {
    id: 'totalNetLabel',
    label: '실수령액 합계',
    type: 'computed',
    group: '귀속 정보',
    help: '사원별 실수령액의 합계입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '지급일, 공제 항목, 특이 사항 등',
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

const rowsOf = (rows: FormRows): FormRows['wages'] =>
  (rows.wages ?? []).filter((row) => (row.name ?? '').trim());

const grossOf = (row: Record<string, string>): number =>
  parseAmount(row.basePay ?? '') + parseAmount(row.allowance ?? '');

const netOf = (row: Record<string, string>): number =>
  Math.max(0, grossOf(row) - parseAmount(row.deduction ?? ''));

export const wageLedger: FormTemplate = {
  slug: 'wage-ledger',
  title: '임금대장',
  family: 'hr',
  category: 'people',
  description:
    '사원별 기본급·수당·공제와 실수령액을 정리하는 임금대장을 브라우저에서 작성하고 A4 PDF로 저장합니다. 지급액과 실수령액 합계가 자동 계산됩니다.',
  keywords: [
    '임금대장',
    '임금대장 양식',
    '급여대장',
    '급여 지급대장',
    '임금 지급 기록',
    '임금대장 PDF',
  ],
  updated: '2026-11-18',
  docPrefix: 'WGL',
  lead: '사원별 기본급과 수당, 공제 내역을 한 표에 정리하는 임금대장입니다. 지급액과 실수령액, 합계를 자동으로 계산합니다.',
  useCases: [
    '월별 급여 지급 내역을 정리할 때',
    '사원별 공제 내역을 확인할 때',
    '급여명세서 발급의 기준 자료로 쓸 때',
    '노무·세무 자료로 임금 지급 기록을 남길 때',
  ],
  howTo: [
    '작성일과 사업장, 귀속 월을 적습니다.',
    '사원별 기본급과 수당을 입력합니다.',
    '공제액을 적고 지급액·실수령액을 확인합니다.',
    '합계를 확인하고 PDF로 내려받아 보관합니다.',
  ],
  notes: [
    '임금대장에는 급여·공제 등 민감한 개인정보가 포함되므로 접근 권한을 제한하세요.',
    '4대보험·소득세 공제액은 최신 요율과 사원별 조건을 반영해 확인하세요.',
    '급여명세서와 임금대장의 금액이 일치하는지 매월 확인하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [rows],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '임금대장',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '귀속 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '사업장명', field: 'company' },
        { label: '귀속 월', field: 'period' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '지급액 합계', field: 'totalGrossLabel' },
        { label: '실수령액 합계', field: 'totalNetLabel' },
      ],
    },
    { kind: 'section', title: '임금 내역' },
    {
      kind: 'table',
      columns: [
        { label: '성명', width: 30 },
        { label: '기본급', width: 30, align: 'right' },
        { label: '수당', width: 24, align: 'right' },
        { label: '지급액', width: 30, align: 'right' },
        { label: '공제', width: 24, align: 'right' },
        { label: '실수령액', width: 32, align: 'right' },
      ],
      rows: (_values, rows) =>
        rowsOf(rows).map((row) => [
          (row.name ?? '').trim(),
          row.basePay ? formatWon(parseAmount(row.basePay)) : '',
          row.allowance ? formatWon(parseAmount(row.allowance)) : '',
          grossOf(row) > 0 ? formatWon(grossOf(row)) : '',
          row.deduction ? formatWon(parseAmount(row.deduction)) : '',
          grossOf(row) > 0 ? formatWon(netOf(row)) : '',
        ]),
      minRows: 2,
    },
    {
      kind: 'totals',
      rows: [
        { label: '지급액 합계', field: 'totalGrossLabel' },
        { label: '실수령액 합계', field: 'totalNetLabel', strong: true },
      ],
      width: 70,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '팀장', '부서장', '본부장', '대표'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = rowsOf(rows);
    const totalGross = list.reduce((sum, row) => sum + grossOf(row), 0);
    const totalNet = list.reduce((sum, row) => sum + netOf(row), 0);
    return {
      totalGrossLabel: totalGross > 0 ? formatWon(totalGross) : '',
      totalNetLabel: totalNet > 0 ? formatWon(totalNet) : '',
    };
  },
  validate: (_values, rows) =>
    rowsOf(rows).length === 0 ? ['임금 내역을 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'WGL-20261118-001',
    date: '2026-11-18',
    company: '옷깃 주식회사',
    period: '2026-11',
    note: '11월 급여는 11월 25일에 지급합니다. 공제액은 4대보험과 소득세를 반영한 참고 금액입니다.',
  },
  sampleRows: {
    wages: [
      {
        name: '김옷깃',
        basePay: '3500000',
        allowance: '300000',
        deduction: '420000',
      },
      {
        name: '이개발',
        basePay: '3000000',
        allowance: '200000',
        deduction: '350000',
      },
      {
        name: '박계약',
        basePay: '2600000',
        allowance: '100000',
        deduction: '300000',
      },
      {
        name: '최인턴',
        basePay: '1800000',
        allowance: '0',
        deduction: '180000',
      },
    ],
  },
  faq: [
    {
      q: '임금대장과 급여명세서는 무엇이 다른가요?',
      a: '임금대장은 사업장 전체의 지급·공제 내역을 한 표에 정리한 장부이고, 급여명세서는 사원 개인에게 지급 내역을 알려 주는 문서입니다.',
    },
    {
      q: '지급액과 실수령액은 어떻게 계산되나요?',
      a: '지급액은 기본급과 수당의 합계, 실수령액은 지급액에서 공제액을 뺀 금액입니다. 공제액은 4대보험·소득세 등 실제 공제 내역을 반영하세요.',
    },
    {
      q: '임금대장은 꼭 보관해야 하나요?',
      a: '근로기준법상 임금 관련 장부의 작성·보존 의무가 있습니다. 구체적인 보존 기간과 기재 사항은 법령과 회사 규정을 확인하세요.',
    },
    {
      q: '개인정보는 어떻게 관리하나요?',
      a: '급여 정보는 민감한 개인정보입니다. 접근 권한을 제한하고, 파일은 비밀번호·접근 기록과 함께 안전하게 보관하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 임금대장·근로조건 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '국세청 — 근로소득 원천징수 안내',
      href: 'https://www.nts.go.kr/',
    },
  ],
  related: [
    { label: '급여명세서 양식', href: '/forms/payslip/' },
    { label: '근로자 명부 양식', href: '/forms/employee-register/' },
    { label: '연차 사용대장 양식', href: '/forms/leave-ledger/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
