import { formatDateDot } from '@/lib/doc/format';
import type { FormField, FormTemplate } from '@/lib/doc/types';
import {
  ageAt,
  exceedsYears,
  FIXED_TERM_MAX_YEARS,
  MONTHLY_STANDARD_HOURS,
  minimumWageFor,
} from '@/lib/labor-limits';
import { formatWon, parseAmount } from '@/lib/quote';

const CONTRACT_TYPES = ['기간의 정함 없음', '기간제', '단시간', '기간제·단시간'];

/** 근로 시작일 기준 만 나이. 날짜가 없으면 null. */
const isFixedTerm = (type: string | undefined): boolean => (type ?? '').includes('기간제');
const isPartTime = (type: string | undefined): boolean => (type ?? '').includes('단시간');

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'EC-20261117-001',
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
    label: '사업주 상호',
    type: 'text',
    group: '당사자',
    required: true,
    placeholder: '예: 옷깃',
    maxLength: 60,
    span: 2,
  },
  {
    id: 'ceo',
    label: '사업주 대표자',
    type: 'text',
    group: '당사자',
    placeholder: '홍길동',
    maxLength: 30,
  },
  {
    id: 'companyAddress',
    label: '사업장 주소',
    type: 'text',
    group: '당사자',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'employee',
    label: '근로자 성명',
    type: 'text',
    group: '당사자',
    required: true,
    placeholder: '김근로',
    maxLength: 30,
  },
  {
    id: 'employeeBirth',
    label: '근로자 생년월일',
    type: 'text',
    group: '당사자',
    placeholder: '1995-01-01',
    maxLength: 20,
  },
  {
    id: 'employeeAddress',
    label: '근로자 주소',
    type: 'text',
    group: '당사자',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'employeeContact',
    label: '근로자 연락처',
    type: 'text',
    group: '당사자',
    placeholder: '010-1234-5678',
    maxLength: 40,
  },
  {
    id: 'contractType',
    label: '계약 형태',
    type: 'select',
    group: '근로 조건',
    options: CONTRACT_TYPES,
    defaultValue: '기간의 정함 없음',
    required: true,
    help: '고용노동부 표준근로계약서의 유형입니다. 18세 미만은 생년월일로 따로 알려 줍니다.',
  },
  {
    id: 'startDate',
    label: '근로 시작일',
    type: 'date',
    group: '근로 조건',
    required: true,
  },
  {
    id: 'endDate',
    label: '근로 종료일',
    type: 'date',
    group: '근로 조건',
    help: '기간의 정함이 없는 계약이면 비워 둡니다. 기간제는 2년을 넘기면 무기계약으로 봅니다.',
  },
  {
    id: 'workplace',
    label: '근무 장소',
    type: 'text',
    group: '근로 조건',
    placeholder: '서울시 강남구 테헤란로 1',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'job',
    label: '업무 내용',
    type: 'text',
    group: '근로 조건',
    required: true,
    placeholder: '예: 고객 상담·문서 관리',
    maxLength: 100,
    span: 2,
  },
  {
    id: 'workHours',
    label: '소정 근로시간',
    type: 'text',
    group: '근로 조건',
    required: true,
    placeholder: '예: 09:00~18:00 (주 40시간)',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'breakTime',
    label: '휴게시간',
    type: 'text',
    group: '근로 조건',
    required: true,
    placeholder: '예: 12:00~13:00',
    help: '4시간에 30분, 8시간에 1시간 이상 근로시간 도중에 줍니다(근로기준법 제54조).',
    maxLength: 40,
  },
  {
    id: 'holidays',
    label: '근무일·주휴일',
    type: 'text',
    group: '근로 조건',
    required: true,
    placeholder: '예: 매주 5일(월~금) 근무, 주휴일 매주 일요일',
    maxLength: 100,
    span: 3,
  },
  {
    id: 'dailySchedule',
    label: '근로일별 근로시간 (단시간)',
    type: 'text',
    group: '근로 조건',
    placeholder: '예: 월·수·금 10:00~15:00(휴게 1시간, 4시간), 토 10:00~14:00(4시간)',
    help: '단시간 근로자는 근로일과 근로일별 근로시간을 반드시 서면으로 적어야 합니다(기간제법 제17조).',
    maxLength: 120,
    span: 3,
  },
  {
    id: 'wage',
    label: '기본 임금',
    type: 'text',
    group: '임금',
    required: true,
    placeholder: '2,500,000',
    maxLength: 20,
  },
  {
    id: 'wageLabel',
    label: '임금 표시',
    type: 'computed',
    group: '임금',
    help: '입력한 임금을 원 단위로 표시합니다.',
  },
  {
    id: 'wageCycle',
    label: '임금 형태',
    type: 'select',
    group: '임금',
    options: ['월급', '시급', '일급'],
    defaultValue: '월급',
    required: true,
  },
  {
    id: 'bonus',
    label: '상여금',
    type: 'text',
    group: '임금',
    placeholder: '예: 없음 / 연 2회, 기본급의 50%',
    defaultValue: '없음',
    maxLength: 60,
  },
  {
    id: 'allowances',
    label: '기타 수당',
    type: 'text',
    group: '임금',
    placeholder: '예: 식대 월 200,000원, 연장·야간·휴일근로 수당(통상임금 50% 가산)',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'payDay',
    label: '임금 지급일',
    type: 'text',
    group: '임금',
    required: true,
    placeholder: '예: 매월 25일(휴일이면 전날)',
    maxLength: 40,
  },
  {
    id: 'payMethod',
    label: '지급 방법',
    type: 'select',
    group: '임금',
    options: ['근로자 명의 예금통장에 입금', '근로자에게 직접 지급'],
    defaultValue: '근로자 명의 예금통장에 입금',
    required: true,
    span: 2,
  },
  {
    id: 'annualLeave',
    label: '연차유급휴가',
    type: 'text',
    group: '휴가·사회보험',
    required: true,
    defaultValue: '근로기준법에서 정하는 바에 따라 부여',
    maxLength: 80,
    span: 3,
  },
  {
    id: 'insurance',
    label: '사회보험 적용',
    type: 'text',
    group: '휴가·사회보험',
    defaultValue: '고용보험·산재보험·국민연금·건강보험',
    help: '가입하지 않는 보험은 지웁니다. 가입 대상 여부는 근로시간·기간에 따라 다릅니다.',
    maxLength: 60,
    span: 3,
  },
  {
    id: 'terms',
    label: '기타 조건',
    type: 'textarea',
    group: '기타 조건',
    placeholder: '수습 기간, 비밀유지, 근무 규칙 등',
    maxLength: 800,
    rows: 3,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '서명 당사자',
    type: 'roles',
    group: '서명',
    options: ['사업주', '근로자'],
    defaultValue: JSON.stringify([
      { label: '사업주', enabled: true },
      { label: '근로자', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '서명란에 표시할 당사자 이름입니다.',
    span: 3,
  },
];

export const employmentContract: FormTemplate = {
  slug: 'employment-contract',
  title: '근로계약서',
  family: 'hr',
  category: 'people',
  description:
    '고용노동부 표준근로계약서 항목(근로시간·휴게·주휴일·임금 구성·지급일·지급 방법·연차·사회보험)을 갖춘 근로계약서를 A4 PDF로 만듭니다. 최저임금 미달 여부도 알려 줍니다.',
  keywords: [
    '근로계약서',
    '근로계약서 양식',
    '표준 근로계약서',
    '근로 조건',
    '임금 근로시간',
    '근로계약서 PDF',
  ],
  updated: '2026-11-20',
  docPrefix: 'EC',
  lead: '고용노동부 표준근로계약서의 항목 순서를 따라 근로 조건과 임금, 근로시간·휴게·휴일을 정하는 근로계약서입니다. 입력한 임금이 해당 연도 최저임금보다 낮으면 바로 알려 줍니다.',
  useCases: [
    '신규 입사자의 근로계약을 작성할 때',
    '기간제·단시간 근로 조건을 정할 때',
    '임금·근무 시간 변경을 문서로 남길 때',
    '근로 조건의 서면 명시를 확인할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 사업주·근로자 정보를 확인합니다.',
    '근로 시작일·종료일, 근무 장소, 업무 내용을 적습니다.',
    '소정 근로시간·휴게시간·근무일과 주휴일을 입력합니다.',
    '기본 임금과 상여금·수당, 지급일·지급 방법을 입력합니다.',
    '기타 조건을 확인하고 PDF로 내려받아 양쪽이 서명합니다.',
  ],
  notes: [
    '근로기준법 제17조에 따라 임금의 구성항목·계산방법·지급방법, 소정근로시간, 주휴일, 연차유급휴가는 서면으로 명시하고, 계약서를 근로자에게 교부해야 합니다.',
    '최저임금은 2026년 시간당 10,320원, 2027년 10,700원입니다. 주 40시간 월급제는 209시간을 곱한 금액 이상이어야 합니다.',
    '단시간 근로자는 근로일별 근로시간을 적어야 하고, 소정근로시간을 넘는 근로는 주 12시간 이내에서 동의를 받아야 하며 통상임금의 50% 이상을 가산합니다(기간제법 제6조).',
    '4주 평균 주 15시간 미만인 초단시간 근로자에게는 주휴일과 연차유급휴가가 적용되지 않습니다(근로기준법 제18조 제3항).',
    '18세 미만 연소근로자와 건설일용근로자는 고용노동부가 별도 표준계약서를 둡니다. 연소근로자는 친권자 동의서를 함께 받으세요.',
    '위약금·손해배상액을 미리 정하는 조항은 무효입니다(근로기준법 제20조). 수습·해고 조항도 법적 제한을 확인하세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '근로계약서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    {
      kind: 'paragraph',
      text: '사업주와 근로자는 아래와 같이 근로계약을 체결한다.',
      align: 'center',
      before: 2,
      after: 2,
    },
    {
      kind: 'parties',
      left: {
        label: '사업주',
        lines: (values) =>
          [
            values.company ?? '',
            values.ceo ? `대표 ${values.ceo}` : '',
            values.companyAddress ?? '',
          ].filter(Boolean),
      },
      right: {
        label: '근로자',
        lines: (values) =>
          [
            values.employee ?? '',
            values.employeeBirth ?? '',
            values.employeeAddress ?? '',
            values.employeeContact ?? '',
          ].filter(Boolean),
      },
    },
    { kind: 'section', title: '근로 조건' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '계약 형태', field: 'contractType' },
        { label: '계약 기간', field: 'contractPeriod' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '근무 장소', field: 'workplace' },
        { label: '업무 내용', field: 'job' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '소정 근로시간', field: 'workHours' },
        { label: '휴게시간', field: 'breakTime' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '근무일·주휴일', field: 'scheduleLabel' }] },
    { kind: 'section', title: '임금·휴가·사회보험' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '기본 임금', field: 'wageLabel' },
        { label: '임금 형태', field: 'wageCycle' },
        { label: '상여금', field: 'bonus' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '기타 수당', field: 'allowances' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '임금 지급일', field: 'payDay' },
        { label: '지급 방법', field: 'payMethod' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '연차유급휴가', field: 'annualLeave' },
        { label: '사회보험 적용', field: 'insurance' },
      ],
    },
    { kind: 'section', title: '기타 조건' },
    { kind: 'text', field: 'terms', minLines: 2 },
    {
      kind: 'notice',
      text: '사업주는 근로계약을 체결함과 동시에 이 계약서를 사본하여 근로자의 교부 요구와 관계없이 근로자에게 교부한다(근로기준법 제17조). 사업주와 근로자는 근로계약·취업규칙·단체협약을 지키고 성실하게 이행하며, 이 계약에 정함이 없는 사항은 근로기준법령에 따른다.',
    },
    {
      kind: 'signature',
      roles: ['사업주', '근로자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (values) => {
    const wage = parseAmount(values.wage ?? '');
    const start = values.startDate ? formatDateDot(values.startDate) : '';
    const end = values.endDate ? formatDateDot(values.endDate) : '';
    const contractPeriod = start
      ? end
        ? `${start} ~ ${end}`
        : `${start}부터 (기간의 정함 없음)`
      : '';
    const days = (values.holidays ?? '').trim();
    const daily = (values.dailySchedule ?? '').trim();
    const scheduleLabel = daily ? [days, `근로일별 ${daily}`].filter(Boolean).join(' / ') : days;
    return { wageLabel: wage > 0 ? formatWon(wage) : '', contractPeriod, scheduleLabel };
  },
  validate: (values) => {
    const errors: string[] = [];
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      errors.push('근로 종료일은 시작일보다 빠를 수 없습니다.');
    }
    if (values.wage?.trim() && parseAmount(values.wage) <= 0) {
      errors.push('임금은 1원 이상이어야 합니다.');
    }
    return errors;
  },
  warn: (values) => {
    const warnings: string[] = [];
    const wage = parseAmount(values.wage ?? '');
    const { year, hourly } = minimumWageFor(values.startDate || values.date);
    const floor =
      values.wageCycle === '시급'
        ? hourly
        : values.wageCycle === '일급'
          ? hourly * 8
          : hourly * MONTHLY_STANDARD_HOURS;
    // 단시간 월급·일급은 소정근로시간을 알 수 없어 시급제만 비교한다
    const comparable = !isPartTime(values.contractType) || values.wageCycle === '시급';
    if (comparable && wage > 0 && wage < floor) {
      const basis =
        values.wageCycle === '시급'
          ? `시간당 ${formatWon(hourly)}`
          : values.wageCycle === '일급'
            ? `8시간 기준 ${formatWon(floor)}`
            : `주 40시간·월 209시간 기준 ${formatWon(floor)}`;
      warnings.push(
        `${year}년 최저임금(${basis})보다 낮습니다. 소정근로시간이 짧다면 시간당 ${formatWon(hourly)} 이상인지 확인하세요.`,
      );
    }
    if (exceedsYears(values.startDate, values.endDate, FIXED_TERM_MAX_YEARS)) {
      warnings.push(
        '계약 기간이 2년을 넘습니다. 기간제 근로자를 2년을 넘게 사용하면 기간의 정함이 없는 근로자로 봅니다(기간제법 제4조, 예외 있음).',
      );
    }
    if (isFixedTerm(values.contractType) && !values.endDate) {
      warnings.push(
        '기간제 계약이면 근로 종료일을 적으세요. 비워 두면 기간의 정함이 없는 계약으로 읽힙니다.',
      );
    }
    if (values.contractType === '기간의 정함 없음' && values.endDate) {
      warnings.push('근로 종료일이 있습니다. 기간을 정한 계약이면 계약 형태를 기간제로 바꾸세요.');
    }
    if (isPartTime(values.contractType) && !(values.dailySchedule ?? '').trim()) {
      warnings.push(
        '단시간 근로자는 근로일과 근로일별 근로시간을 서면으로 명시해야 합니다(기간제법 제17조, 위반 시 500만 원 이하 과태료).',
      );
    }
    const age = ageAt(values.employeeBirth, values.startDate || values.date);
    if (age !== null && age < 18) {
      warnings.push(
        `근로 시작일에 만 ${age}세인 연소근로자입니다. 친권자(후견인) 동의서와 가족관계기록사항 증명서를 사업장에 갖추고(근로기준법 제66조), 근로시간은 1일 7시간·1주 35시간 이내(합의 시 1일 1시간·1주 5시간 연장)로 정하세요(제69조). 오후 10시~오전 6시와 휴일 근로는 본인 동의와 고용노동부장관 인가가 필요합니다(제70조).${age < 15 ? ' 15세 미만은 고용노동부장관의 취직인허증도 받아야 합니다(제64조).' : ''}`,
      );
    }
    return warnings;
  },
  sample: {
    docNo: 'EC-20261117-001',
    date: '2026-11-17',
    company: '옷깃',
    ceo: '홍길동',
    companyAddress: '서울시 강남구 테헤란로 1',
    employee: '김근로',
    employeeBirth: '1995-01-01',
    employeeAddress: '서울시 강남구 테헤란로 2',
    employeeContact: '010-1234-5678',
    contractType: '기간의 정함 없음',
    startDate: '2026-12-01',
    endDate: '',
    workplace: '서울시 강남구 테헤란로 1',
    job: '고객 상담·문서 관리',
    workHours: '09:00~18:00 (주 40시간)',
    breakTime: '12:00~13:00',
    holidays: '매주 5일(월~금) 근무, 주휴일 매주 일요일',
    wage: '2500000',
    wageCycle: '월급',
    bonus: '없음',
    allowances: '식대 월 200,000원, 연장·야간·휴일근로 수당(통상임금 50% 가산)',
    payDay: '매월 25일(휴일이면 전날)',
    payMethod: '근로자 명의 예금통장에 입금',
    annualLeave: '근로기준법에서 정하는 바에 따라 부여',
    insurance: '고용보험·산재보험·국민연금·건강보험',
    terms:
      '수습 기간 3개월(임금은 감액하지 않음). 근무 규칙은 취업규칙을 따릅니다. 비밀유지 의무는 퇴사 후에도 적용됩니다.',
  },
  faq: [
    {
      q: '근로계약서에 꼭 들어가야 하는 항목은?',
      a: '근로기준법 제17조와 시행령 제8조에 따라 임금(구성항목·계산방법·지급방법), 소정근로시간, 주휴일, 연차유급휴가, 취업 장소와 종사 업무 등을 명시해야 하며, 임금 등 주요 사항은 서면으로 교부해야 합니다. 이 양식은 고용노동부 표준근로계약서 항목을 모두 담았습니다.',
    },
    {
      q: '기간제·단시간 근로자도 쓸 수 있나요?',
      a: '네. 계약 형태를 고르고, 기간제는 근로 종료일을, 단시간은 근로일별 근로시간을 적으면 고용노동부 기간제·단시간 표준근로계약서 항목을 갖춥니다. 기간제는 2년을 넘게 쓰면 원칙적으로 무기계약으로 봅니다(기간제법 제4조).',
    },
    {
      q: '수습 기간을 정해도 되나요?',
      a: '둘 수 있습니다. 1년 이상 계약한 근로자는 수습 시작 후 3개월까지 최저임금의 90%까지 줄 수 있지만, 단순노무 업무는 감액할 수 없습니다(최저임금법 제5조 제2항). 수습 중이라도 정당한 이유 없는 해고는 제한됩니다. 기간과 임금을 기타 조건에 구체적으로 적으세요.',
    },
    {
      q: '최저임금은 어떻게 확인하나요?',
      a: '2026년은 시간당 10,320원(주 40시간 월 2,156,880원), 2027년은 10,700원(월 2,236,300원)입니다. 근로 시작일이 속한 해의 최저임금보다 낮게 입력하면 입력란 위에 안내가 나타납니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 표준근로계약서(2025년 3월 개정, 정책자료실)',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '국가법령정보센터 — 근로기준법 제17조(근로조건의 명시)·제66~70조(연소자)',
      href: 'https://www.law.go.kr/법령/근로기준법',
    },
    {
      label: '국가법령정보센터 — 기간제 및 단시간근로자 보호 등에 관한 법률 제4조·제6조·제17조',
      href: 'https://www.law.go.kr/법령/기간제및단시간근로자보호등에관한법률',
    },
    {
      label: '최저임금위원회 — 연도별 최저임금',
      href: 'https://www.minimumwage.go.kr/',
    },
  ],
  related: [
    { label: '연차 사용계획서 양식', href: '/forms/leave-plan/' },
    { label: '급여명세서 양식', href: '/forms/payslip/' },
    { label: '퇴직증명서 양식', href: '/forms/resignation-certificate/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
