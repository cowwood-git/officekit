import { formatKoreanAmount } from '@/lib/doc/format';
import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { formatWon, parseAmount } from '@/lib/quote';

/** 시간 수를 함께 적어야 하는 가산 수당(근로기준법 시행령 제27조의2 제5호). */
const HOURLY_PREMIUM = /연장|야간|휴일|초과/;
const HAS_HOURS = /\d+(?:\.\d+)?\s*(?:시간|h|H)/;

const earnings: RepeatGroup = {
  id: 'earnings',
  label: '지급 내역',
  group: '사원 정보',
  help: '기본급·수당처럼 지급하는 항목과 금액을 적습니다. 출근일수·시간에 따라 달라지는 항목은 계산방법도 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 2,
  maxRows: 20,
  addLabel: '+ 지급 항목 추가',
  required: true,
  summaryField: 'totalEarnings',
  summaryLabel: '지급 합계',
  columns: [
    {
      id: 'item',
      label: '지급 항목',
      type: 'text',
      required: true,
      placeholder: '예: 기본급',
      maxLength: 40,
      width: 2,
    },
    {
      id: 'calc',
      label: '계산방법',
      type: 'text',
      placeholder: '예: 연장 8시간 × 18,750원',
      maxLength: 60,
      width: 3,
    },
    {
      id: 'amount',
      label: '금액',
      type: 'money',
      required: true,
      placeholder: '0',
      width: 1.5,
    },
  ],
};

const deductions: RepeatGroup = {
  id: 'deductions',
  label: '공제 내역',
  group: '지급 내역',
  help: '4대보험·소득세처럼 공제하는 항목과 금액을 적습니다.',
  minRows: 2,
  maxRows: 20,
  addLabel: '+ 공제 항목 추가',
  summaryField: 'totalDeductions',
  summaryLabel: '공제 합계',
  columns: [
    {
      id: 'item',
      label: '공제 항목',
      type: 'text',
      required: true,
      placeholder: '예: 국민연금',
      maxLength: 40,
      width: 3,
    },
    {
      id: 'amount',
      label: '금액',
      type: 'money',
      required: true,
      placeholder: '0',
      width: 1.5,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '기본 정보',
    placeholder: 'PS-20261116-001',
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
    group: '사원 정보',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '사원 정보',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'position',
    label: '직위',
    type: 'text',
    group: '사원 정보',
    placeholder: '대리',
    maxLength: 30,
  },
  {
    id: 'employeeId',
    label: '사번·생년월일',
    type: 'text',
    group: '사원 정보',
    placeholder: 'EMP-001 또는 1990-01-01',
    help: '임금명세서에는 성명과 함께 근로자를 특정할 정보(사번·생년월일 등)를 적어야 합니다.',
    required: true,
    maxLength: 30,
  },
  {
    id: 'period',
    label: '귀속 월',
    type: 'text',
    group: '사원 정보',
    placeholder: '2026년 11월',
    required: true,
    maxLength: 20,
  },
  {
    id: 'paymentDate',
    label: '지급일',
    type: 'date',
    group: '사원 정보',
    required: true,
  },
  {
    id: 'totalEarnings',
    label: '지급 합계',
    type: 'computed',
    group: '급여 합계',
    help: '지급 항목 금액의 합계입니다.',
  },
  {
    id: 'totalDeductions',
    label: '공제 합계',
    type: 'computed',
    group: '급여 합계',
    help: '공제 항목 금액의 합계입니다.',
  },
  {
    id: 'netPay',
    label: '실수령액',
    type: 'computed',
    group: '급여 합계',
    help: '지급 합계에서 공제 합계를 뺀 금액입니다.',
  },
  {
    id: 'amountKorean',
    label: '일금',
    type: 'computed',
    group: '급여 합계',
    help: '실수령액을 한글로 표시합니다.',
    span: 2,
  },
  {
    id: 'issuerCompany',
    label: '회사명',
    type: 'text',
    group: '발급 회사',
    placeholder: '옷깃 주식회사',
    maxLength: 60,
  },
  {
    id: 'issuerCeo',
    label: '대표자',
    type: 'text',
    group: '발급 회사',
    placeholder: '박대표',
    maxLength: 30,
  },
];

const sumGroup = (rows: FormRows, id: string): number =>
  (rows[id] ?? []).reduce((sum, row) => sum + parseAmount(row.amount ?? ''), 0);

const filledRows = (rows: FormRows, id: string): FormRows[string] =>
  (rows[id] ?? []).filter((row) => (row.item ?? '').trim() || (row.amount ?? '').trim());

const tableRows = (rows: FormRows, id: string): readonly (readonly string[])[] =>
  filledRows(rows, id).map((row) => [
    (row.item ?? '').trim(),
    row.amount ? formatWon(parseAmount(row.amount)) : '',
  ]);

const earningRows = (rows: FormRows): readonly (readonly string[])[] =>
  filledRows(rows, 'earnings').map((row) => [
    (row.item ?? '').trim(),
    (row.calc ?? '').trim(),
    row.amount ? formatWon(parseAmount(row.amount)) : '',
  ]);

export const payslip: FormTemplate = {
  slug: 'payslip',
  title: '급여명세서',
  family: 'hr',
  category: 'people',
  description:
    '근로기준법 시행령의 임금명세서 기재사항(근로자 특정 정보·지급일·항목별 금액·계산방법·공제 내역)을 갖춘 급여명세서를 A4 PDF로 만듭니다. 실수령액은 자동 계산됩니다.',
  keywords: [
    '급여명세서 양식',
    '급여명세서 PDF',
    '급여 명세서',
    '임금명세서',
    '급여명세서 만들기',
    '실수령액 계산',
  ],
  updated: '2026-11-20',
  docPrefix: 'PS',
  lead: '지급 항목과 계산방법, 공제 항목을 입력하면 지급 합계·공제 합계·실수령액이 자동으로 계산되는 급여명세서입니다. 연장·야간·휴일 수당은 근로시간 수를 함께 적도록 안내합니다. 세금과 4대보험 금액은 급여 프로그램 기준으로 적습니다.',
  useCases: [
    '직원에게 급여 지급 내역을 안내할 때',
    '급여명세서를 PDF로 보관·제출할 때',
    '지급·공제 항목을 한 장으로 확인할 때',
    '급여 이의 신청 전에 내역을 정리할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 귀속 월·지급일을 확인합니다.',
    '사원 정보와 지급 항목·계산방법·금액을 입력합니다.',
    '공제 항목·금액을 입력하면 실수령액과 일금이 자동으로 계산됩니다.',
    '미리보기에서 확인한 뒤 PDF로 내려받습니다.',
  ],
  notes: [
    '이 양식은 입력한 금액을 합산하는 명세서입니다. 세금·4대보험·가산수당 계산은 회사의 급여 프로그램과 회계 기준을 따르세요.',
    '근로기준법 제48조제2항에 따라 임금을 지급할 때 임금명세서를 서면(전자문서 포함)으로 교부해야 합니다.',
    '법정 기재사항(시행령 제27조의2): 성명·생년월일·사번 등 근로자 특정 정보, 임금지급일, 임금 총액, 구성항목별 금액, 출근일수·시간에 따라 달라지는 항목의 계산방법(연장·야간·휴일근로는 시간 수 포함), 공제 항목별 금액과 총액.',
    '급여명세서에는 개인정보가 담기므로 PDF 보관·전송에 주의하세요.',
  ],
  fields,
  groups: [earnings, deductions],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '급여명세서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '사원 정보' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '성명', field: 'name' },
        { label: '부서', field: 'department' },
        { label: '직위', field: 'position' },
      ],
    },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '사번·생년월일', field: 'employeeId' },
        { label: '귀속 월', field: 'period' },
        { label: '지급일', field: 'paymentDate' },
      ],
    },
    { kind: 'section', title: '지급 내역' },
    {
      kind: 'table',
      columns: [
        { label: '지급 항목', width: 48 },
        { label: '계산방법', width: 72 },
        { label: '금액', width: 54, align: 'right' },
      ],
      rows: (_values, rows) => earningRows(rows),
      minRows: 2,
    },
    { kind: 'section', title: '공제 내역' },
    {
      kind: 'table',
      columns: [
        { label: '공제 항목', width: 120 },
        { label: '금액', width: 54, align: 'right' },
      ],
      rows: (_values, rows) => tableRows(rows, 'deductions'),
      minRows: 2,
    },
    {
      kind: 'totals',
      rows: [
        { label: '지급 합계', field: 'totalEarnings' },
        { label: '공제 합계', field: 'totalDeductions' },
        { label: '실수령액', field: 'netPay', strong: true },
      ],
      width: 84,
    },
    { kind: 'kv', columns: 1, rows: [{ label: '일금', field: 'amountKorean' }] },
    { kind: 'section', title: '발급 회사' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '회사명', field: 'issuerCompany' },
        { label: '대표자', field: 'issuerCeo' },
      ],
    },
    {
      kind: 'notice',
      text: '본 급여명세서는 회사 규정에 따라 발급된 참고 자료입니다. 세금·4대보험 금액은 급여 프로그램과 회계 기준을 따릅니다.',
    },
  ],
  compute: (_values, rows) => {
    const totalEarnings = sumGroup(rows, 'earnings');
    const totalDeductions = sumGroup(rows, 'deductions');
    const net = totalEarnings - totalDeductions;
    return {
      totalEarnings: formatWon(totalEarnings),
      totalDeductions: formatWon(totalDeductions),
      netPay: formatWon(net),
      amountKorean: net > 0 ? formatKoreanAmount(net) : '',
    };
  },
  validate: (_values, rows) => {
    const errors: string[] = [];
    const earningRows = (rows.earnings ?? []).filter(
      (row) => (row.item ?? '').trim() || (row.amount ?? '').trim(),
    );
    if (earningRows.length === 0) {
      errors.push('지급 항목을 한 줄 이상 입력하세요.');
    }
    if (earningRows.some((row) => parseAmount(row.amount ?? '') <= 0)) {
      errors.push('지급 금액은 1원 이상이어야 합니다.');
    }
    if (
      (rows.deductions ?? []).some(
        (row) => (row.item ?? '').trim() && parseAmount(row.amount ?? '') <= 0,
      )
    ) {
      errors.push('공제 금액은 1원 이상이어야 합니다.');
    }
    if (sumGroup(rows, 'deductions') > sumGroup(rows, 'earnings')) {
      errors.push('공제 합계가 지급 합계보다 클 수 없습니다.');
    }
    return errors;
  },
  warn: (_values, rows) => {
    const missing = filledRows(rows, 'earnings')
      .filter((row) => HOURLY_PREMIUM.test(row.item ?? '') && !HAS_HOURS.test(row.calc ?? ''))
      .map((row) => (row.item ?? '').trim());
    return missing.length > 0
      ? [
          `${missing.join('·')}: 연장·야간·휴일근로 수당은 계산방법에 근로시간 수를 적어야 합니다(근로기준법 시행령 제27조의2 제5호). 예: 연장 8시간 × 18,750원`,
        ]
      : [];
  },
  sample: {
    docNo: 'PS-20261116-001',
    date: '2026-11-16',
    period: '2026년 11월',
    paymentDate: '2026-11-25',
    name: '김옷깃',
    employeeId: 'EMP-001',
    department: '경영지원팀',
    position: '대리',
    issuerCompany: '옷깃 주식회사',
    issuerCeo: '박대표',
  },
  sampleRows: {
    earnings: [
      { item: '기본급', calc: '월 소정근로 209시간 기준', amount: '3000000' },
      { item: '식대', calc: '매월 정액', amount: '200000' },
      { item: '연장수당', calc: '연장 8시간 × 18,750원', amount: '150000' },
    ],
    deductions: [
      { item: '국민연금', amount: '135000' },
      { item: '건강보험', amount: '106000' },
      { item: '고용보험', amount: '27000' },
      { item: '소득세', amount: '45000' },
    ],
  },
  faq: [
    {
      q: '급여명세서는 꼭 발급해야 하나요?',
      a: '네. 2021년 11월 19일부터 근로기준법 제48조제2항에 따라 사용자는 임금을 지급할 때 임금명세서를 서면이나 전자문서로 교부해야 합니다. 상시 근로자 수와 관계없이 적용됩니다.',
    },
    {
      q: '계산방법은 모든 항목에 적어야 하나요?',
      a: '출근일수·시간 등에 따라 금액이 달라지는 항목에만 적으면 됩니다. 매월 같은 금액인 기본급·정액 수당은 비워도 되지만, 연장·야간·휴일근로 수당은 근로시간 수를 포함한 계산식을 적어야 합니다.',
    },
    {
      q: '세금과 4대보험도 계산해 주나요?',
      a: '아니요. 이 양식은 입력한 지급·공제 금액을 합산해 실수령액만 계산합니다. 세금과 4대보험 금액은 급여 프로그램이나 회계 기준으로 확인하세요.',
    },
    {
      q: '실수령액은 어떻게 계산되나요?',
      a: '지급 항목의 합계에서 공제 항목의 합계를 뺀 금액입니다. 항목을 추가·수정하면 합계와 일금이 바로 바뀝니다.',
    },
    {
      q: '주민등록번호를 꼭 써야 하나요?',
      a: '아니요. 법령은 성명과 함께 생년월일·사번 등 근로자를 특정할 정보를 요구할 뿐 주민등록번호를 요구하지 않습니다. 사번이나 생년월일 중 하나를 적으세요.',
    },
  ],
  sources: [
    {
      label: '국가법령정보센터 — 근로기준법 제48조(임금대장 및 임금명세서)',
      href: 'https://www.law.go.kr/법령/근로기준법',
    },
    {
      label: '국가법령정보센터 — 근로기준법 시행령 제27조의2(임금명세서의 기재사항)',
      href: 'https://www.law.go.kr/법령/근로기준법시행령',
    },
    {
      label: '고용노동부 — 근로기준 안내',
      href: 'https://www.moel.go.kr/',
    },
  ],
  related: [
    { label: '재직증명서 양식', href: '/forms/employment-certificate/' },
    { label: '퇴직증명서 양식', href: '/forms/resignation-certificate/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
