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

/** 시행령 제27조 제1항 제2~4·6~8호. 성명으로 임금 내역과 짝을 맞춘다. */
const workers: RepeatGroup = {
  id: 'workers',
  label: '근로자·근로시간',
  help: '임금 내역의 사원별로 근로자 특정 정보·고용일·업무·근로일수·근로시간을 적습니다. 상시 4명 이하 사업장은 근로시간·연장근로 시간 칸을 비워도 됩니다.',
  minRows: 2,
  maxRows: 30,
  addLabel: '+ 근로자 추가',
  group: '귀속 정보',
  columns: [
    {
      id: 'name',
      label: '성명',
      type: 'text',
      required: true,
      placeholder: '김근로',
      maxLength: 30,
      width: 1.3,
    },
    {
      id: 'idNo',
      label: '사번·생년월일',
      type: 'text',
      placeholder: '2021001',
      maxLength: 20,
      width: 1.5,
    },
    { id: 'hireDate', label: '고용일', type: 'date', width: 1.5 },
    {
      id: 'job',
      label: '업무',
      type: 'text',
      placeholder: '회계',
      maxLength: 30,
      width: 1.4,
    },
    { id: 'days', label: '근로일수', type: 'number', placeholder: '21', width: 1 },
    { id: 'hours', label: '근로시간', type: 'number', placeholder: '168', width: 1 },
    {
      id: 'extraHours',
      label: '연장·야간·휴일',
      type: 'text',
      placeholder: '연장 8 / 야간 0 / 휴일 0',
      maxLength: 40,
      width: 1.8,
    },
  ],
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
    id: 'basis',
    label: '임금 계산기초',
    type: 'textarea',
    group: '귀속 정보',
    placeholder:
      '예: 통상시급 = 기본급 ÷ 209시간, 연장·야간·휴일근로 50% 가산, 가족수당 배우자 4만 원·자녀 1인당 2만 원',
    help: '임금과 가족수당을 어떤 기준으로 계산했는지 적습니다(근로기준법 시행령 제27조 제1항 제5호).',
    maxLength: 400,
    rows: 2,
    span: 3,
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

const workersOf = (rows: FormRows): FormRows['workers'] =>
  (rows.workers ?? []).filter((row) => (row.name ?? '').trim());

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
    '근로기준법 시행령 제27조의 기재사항(고용일·업무·계산기초·근로일수·근로시간·연장근로 시간·임금 내역·공제액)을 갖춘 임금대장을 A4 PDF로 만듭니다. 합계는 자동 계산됩니다.',
  keywords: [
    '임금대장',
    '임금대장 양식',
    '급여대장',
    '급여 지급대장',
    '임금 지급 기록',
    '임금대장 PDF',
  ],
  updated: '2026-11-20',
  docPrefix: 'WGL',
  lead: '사원별 기본급과 수당, 공제 내역을 한 표에 정리하고, 법령이 요구하는 근로자 정보·근로시간과 임금 계산기초를 함께 남기는 임금대장입니다. 지급액과 실수령액, 합계를 자동으로 계산합니다.',
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
    '임금 계산기초와 근로자별 고용일·업무·근로일수·근로시간을 적습니다.',
    '합계를 확인하고 PDF로 내려받아 보관합니다.',
  ],
  notes: [
    '법정 기재사항(시행령 제27조): 성명, 생년월일·사번 등 특정 정보, 고용 연월일, 종사 업무, 임금·가족수당 계산기초, 근로일수, 근로시간수, 연장·야간·휴일근로 시간수, 임금 내역별 금액, 공제액.',
    '사용기간 30일 미만 일용근로자는 특정 정보·계산기초를, 상시 4명 이하 사업장 근로자는 근로시간수·연장근로 시간수를 적지 않아도 됩니다(같은 조 제2·3항).',
    '임금대장에는 급여·공제 등 민감한 개인정보가 포함되므로 접근 권한을 제한하세요.',
    '4대보험·소득세 공제액은 최신 요율과 사원별 조건을 반영해 확인하세요.',
    '급여명세서와 임금대장의 금액이 일치하는지 매월 확인하세요.',
  ],
  fields,
  groups: [rows, workers],
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
    { kind: 'kv', columns: 1, rows: [{ label: '임금 계산기초', field: 'basis' }] },
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
    { kind: 'section', title: '근로자·근로시간' },
    {
      kind: 'table',
      columns: [
        { label: '성명', width: 22 },
        { label: '사번·생년월일', width: 27 },
        { label: '고용일', width: 24 },
        { label: '업무', width: 27 },
        { label: '근로일수', width: 18, align: 'right' },
        { label: '근로시간', width: 18, align: 'right' },
        { label: '연장·야간·휴일', width: 34 },
      ],
      rows: (_values, rows) =>
        workersOf(rows).map((row) => [
          (row.name ?? '').trim(),
          (row.idNo ?? '').trim(),
          row.hireDate ?? '',
          (row.job ?? '').trim(),
          row.days ? `${row.days}일` : '',
          row.hours ? `${row.hours}시간` : '',
          (row.extraHours ?? '').trim(),
        ]),
      minRows: 2,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 1 },
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
  warn: (values, rows) => {
    const wages = rowsOf(rows);
    if (wages.length === 0) return [];
    const warnings: string[] = [];
    const listed = new Set(workersOf(rows).map((row) => (row.name ?? '').trim()));
    const missing = wages.map((row) => (row.name ?? '').trim()).filter((name) => !listed.has(name));
    if (missing.length > 0) {
      warnings.push(
        `${missing.join('·')}: 근로자·근로시간 표에 고용일·업무·근로일수 등을 적어야 합니다(근로기준법 시행령 제27조).`,
      );
    }
    if (!(values.basis ?? '').trim()) {
      warnings.push('임금 계산기초를 적어야 합니다. 예: 통상시급 = 기본급 ÷ 209시간.');
    }
    return warnings;
  },
  sample: {
    docNo: 'WGL-20261118-001',
    date: '2026-11-18',
    company: '옷깃 주식회사',
    period: '2026-11',
    basis:
      '월급제(주 40시간, 월 209시간). 통상시급 = 기본급 ÷ 209시간. 연장근로는 통상시급의 1.5배. 가족수당 없음.',
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
    workers: [
      {
        name: '김옷깃',
        idNo: '2021001',
        hireDate: '2021-03-02',
        job: '경영지원',
        days: '20',
        hours: '160',
        extraHours: '연장 8',
      },
      {
        name: '이개발',
        idNo: '2022004',
        hireDate: '2022-07-01',
        job: '개발',
        days: '20',
        hours: '160',
        extraHours: '연장 4',
      },
      {
        name: '박계약',
        idNo: '2024002',
        hireDate: '2024-01-15',
        job: '영업',
        days: '20',
        hours: '160',
        extraHours: '',
      },
      {
        name: '최인턴',
        idNo: '2026011',
        hireDate: '2026-09-01',
        job: '사무 보조',
        days: '20',
        hours: '160',
        extraHours: '',
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
      a: '네. 근로기준법 제48조제1항에 따라 사업장별로 임금대장을 작성하고, 임금을 지급할 때마다 기재해야 합니다. 임금대장은 근로계약에 관한 중요한 서류로 3년간 보존합니다(제42조).',
    },
    {
      q: '근로시간 칸은 꼭 채워야 하나요?',
      a: '상시 4명 이하 사업장의 근로자나 근로시간 적용 제외 근로자(제63조)는 근로시간수와 연장·야간·휴일근로 시간수를 적지 않아도 됩니다. 그 밖에는 적어야 합니다.',
    },
    {
      q: '개인정보는 어떻게 관리하나요?',
      a: '급여 정보는 민감한 개인정보입니다. 접근 권한을 제한하고, 파일은 비밀번호·접근 기록과 함께 안전하게 보관하세요.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 임금대장·근로조건 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '국가법령정보센터 — 근로기준법 시행령 제27조(임금대장의 기재사항)',
      href: 'https://www.law.go.kr/법령/근로기준법시행령',
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
