import type { FormField, FormTemplate } from '@/lib/doc/types';

const LEAVE = '육아휴직';
const SHORT_LEAVE = '단기 육아휴직(1~2주)';
const REDUCED_HOURS = '육아기 근로시간 단축';
const SHORT_REASONS = ['방학', '휴업·휴교·휴원', '자녀 질병·사고 입원', '감염병 격리·등교 중지'];

/** 시작일 기준 자녀 만 나이. 출생 전(임신 중)이면 0. */
const childAge = (birth: string | undefined, on: string | undefined): number | null => {
  if (!birth || !on || !/^\d{4}-\d{2}-\d{2}$/.test(birth) || !/^\d{4}-\d{2}-\d{2}$/.test(on)) {
    return null;
  }
  const age = Number(on.slice(0, 4)) - Number(birth.slice(0, 4));
  return Math.max(0, on.slice(5) < birth.slice(5) ? age - 1 : age);
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'ML-20261117-001',
    help: '신청일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  {
    id: 'date',
    label: '신청일',
    type: 'date',
    group: '문서',
    defaultToday: true,
    required: true,
  },
  {
    id: 'name',
    label: '성명',
    type: 'text',
    group: '신청자',
    placeholder: '김육아',
    required: true,
    maxLength: 30,
  },
  {
    id: 'employeeNo',
    label: '사번',
    type: 'text',
    group: '신청자',
    placeholder: '2021001',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '신청자',
    placeholder: '개발팀',
    maxLength: 40,
  },
  {
    id: 'position',
    label: '직위',
    type: 'text',
    group: '신청자',
    placeholder: '대리',
    maxLength: 30,
  },
  {
    id: 'childName',
    label: '자녀 성명',
    type: 'text',
    group: '자녀 정보',
    placeholder: '김아이',
    help: '임신 중 육아휴직이면 “태아”로 적습니다.',
    required: true,
    maxLength: 30,
  },
  {
    id: 'childBirth',
    label: '자녀 생년월일',
    type: 'date',
    group: '자녀 정보',
    help: '임신 중이면 출산 예정일을 적습니다.',
    required: true,
  },
  {
    id: 'leaveType',
    label: '신청 구분',
    type: 'select',
    group: '휴직 정보',
    options: [LEAVE, SHORT_LEAVE, REDUCED_HOURS],
    defaultValue: LEAVE,
    required: true,
    help: '단기 육아휴직(2026. 8. 20. 시행)은 연 1회, 1주 또는 2주 단위로 씁니다.',
  },
  {
    id: 'shortReason',
    label: '단기 육아휴직 사유',
    type: 'select',
    group: '휴직 정보',
    options: ['해당 없음', ...SHORT_REASONS],
    defaultValue: '해당 없음',
    help: '단기 육아휴직을 고를 때만 정합니다.',
  },
  {
    id: 'reducedHours',
    label: '단축 후 주 근로시간',
    type: 'number',
    group: '휴직 정보',
    placeholder: '25',
    help: '육아기 근로시간 단축일 때만 적습니다. 주 15시간 이상 35시간 이하입니다.',
  },
  {
    id: 'startDate',
    label: '휴직 시작일',
    type: 'date',
    group: '휴직 정보',
    required: true,
  },
  {
    id: 'endDate',
    label: '휴직 종료일',
    type: 'date',
    group: '휴직 정보',
    required: true,
  },
  {
    id: 'splitUse',
    label: '분할 사용',
    type: 'select',
    group: '휴직 정보',
    options: ['아니요', '예'],
    defaultValue: '아니요',
    required: true,
    help: '분할 사용을 신청하려면 “예”를 고르고 기간을 적습니다.',
  },
  {
    id: 'benefitApply',
    label: '급여 신청',
    type: 'select',
    group: '휴직 정보',
    options: ['신청함', '신청하지 않음'],
    defaultValue: '신청함',
    required: true,
  },
  {
    id: 'periodLabel',
    label: '휴직 기간',
    type: 'computed',
    group: '휴직 정보',
    help: '시작일과 종료일을 포함한 일수입니다.',
  },
  {
    id: 'splitPlan',
    label: '분할 사용 계획',
    type: 'textarea',
    group: '분할 사용 계획',
    placeholder: '예: 2026. 12. 1. ~ 2027. 5. 31., 2027. 6. 1. ~ 2027. 11. 30.',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'handover',
    label: '업무 인수인계',
    type: 'textarea',
    group: '업무 인수인계',
    placeholder: '인수인계 담당자와 주요 업무, 진행 중인 일정을 적습니다.',
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['신청자', '팀장', '인사 담당', '부서장', '대표'],
    defaultValue: JSON.stringify([
      { label: '신청자', enabled: true },
      { label: '팀장', enabled: true },
      { label: '인사 담당', enabled: true },
      { label: '부서장', enabled: false },
      { label: '대표', enabled: false },
    ]),
    required: true,
    maxSelected: 5,
    editable: true,
    help: '5칸 중 필요한 단계만 켜고, 이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const daysBetween = (start: string, end: string): number => {
  const from = Date.parse(start);
  const to = Date.parse(end);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return 0;
  return Math.floor((to - from) / 86_400_000) + 1;
};

export const parentalLeave: FormTemplate = {
  slug: 'parental-leave',
  title: '육아휴직 신청서',
  family: 'hr',
  category: 'people',
  description:
    '자녀 정보와 휴직 기간, 분할 사용·급여 신청 여부를 정리하는 육아휴직 신청서를 A4 PDF로 만듭니다. 단기 육아휴직·근로시간 단축과 신청 기한(30일 전)도 확인해 줍니다.',
  keywords: [
    '육아휴직 신청서',
    '육아휴직 신청서 양식',
    '육아휴직 신청',
    '육아기 근로시간 단축',
    '육아휴직 PDF',
    '육아휴직 서류',
  ],
  updated: '2026-11-20',
  docPrefix: 'ML',
  lead: '남녀고용평등법 시행령이 정한 신청 사항(자녀 정보·휴직 기간·신청 연월일)을 갖춰 회사에 제출하는 육아휴직 신청서입니다. 단기 육아휴직과 육아기 근로시간 단축도 같은 양식으로 신청하고, 분할 사용·급여 신청·인수인계까지 한 장에 담습니다.',
  useCases: [
    '자녀 양육을 위해 육아휴직을 신청할 때',
    '육아기 근로시간 단축을 함께 신청할 때',
    '분할 사용 기간과 급여 신청 여부를 정리할 때',
    '업무 인수인계와 복직 일정을 회사에 알릴 때',
  ],
  howTo: [
    '신청일과 신청자 정보를 확인합니다.',
    '자녀 성명과 생년월일을 적습니다.',
    '휴직 기간과 분할 사용, 급여 신청 여부를 정합니다.',
    '업무 인수인계를 적고 PDF로 내려받아 결재를 받습니다.',
  ],
  notes: [
    '육아휴직은 만 8세 이하 또는 초등학교 2학년 이하 자녀(임신 중 포함)를 위해 1년까지 쓰고, 부모가 각각 3개월 이상 쓰거나 한부모·중증 장애아동 부모이면 6개월을 더 쓸 수 있습니다(남녀고용평등법 제19조).',
    '휴직 시작 30일 전까지 신청합니다. 출산 예정일 전에 아이가 태어났거나 배우자의 사망·부상·질병 등으로 양육이 어려우면 7일 전까지 신청할 수 있습니다(시행령 제11조).',
    '단기 육아휴직은 2026년 8월 20일부터 연 1회, 1주 또는 2주 단위로 쓸 수 있고 분할 횟수에 넣지 않습니다. 방학은 미리, 입원·휴교·격리처럼 급한 사유는 바로 신청할 수 있습니다.',
    '육아기 근로시간 단축은 만 12세 이하 또는 초등학교 6학년 이하 자녀를 위해 주 15~35시간으로 줄여 쓰는 제도로, 육아휴직과 따로 신청합니다(제19조의2).',
    '육아휴직은 3회까지 나눠(총 4번) 쓸 수 있습니다. 분할 사용 계획에 각 기간을 적으세요.',
    '자녀의 개인정보는 신청 목적에 필요한 범위에서만 적고, 제출 후 보관·파기에 유의하세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '육아휴직 신청서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '신청자' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '성명', field: 'name' },
        { label: '사번', field: 'employeeNo' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '부서', field: 'department' },
        { label: '직위', field: 'position' },
      ],
    },
    { kind: 'section', title: '자녀 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '자녀 성명', field: 'childName' },
        { label: '자녀 생년월일', field: 'childBirth' },
      ],
    },
    { kind: 'section', title: '휴직 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '신청 구분', field: 'leaveTypeLabel' },
        { label: '휴직 기간', field: 'periodLabel' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '휴직 시작일', field: 'startDate' },
        { label: '휴직 종료일', field: 'endDate' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '분할 사용', field: 'splitUse' },
        { label: '급여 신청', field: 'benefitApply' },
      ],
    },
    { kind: 'section', title: '분할 사용 계획' },
    { kind: 'text', field: 'splitPlan', minLines: 2 },
    { kind: 'section', title: '업무 인수인계' },
    { kind: 'text', field: 'handover', minLines: 3 },
    {
      kind: 'notice',
      text: '육아휴직 기간·급여 요건은 관련 법령과 회사 규정에 따라 달라질 수 있습니다.',
    },
    {
      kind: 'signature',
      roles: ['신청자', '팀장', '인사 담당'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (values) => {
    const type = values.leaveType || LEAVE;
    const reason =
      values.shortReason && values.shortReason !== '해당 없음' ? values.shortReason : '';
    const hours = (values.reducedHours ?? '').trim();
    const leaveTypeLabel =
      type === SHORT_LEAVE && reason
        ? `${type} — ${reason}`
        : type === REDUCED_HOURS && hours
          ? `${type} — 주 ${hours}시간`
          : type;
    return {
      leaveTypeLabel,
      periodLabel:
        values.startDate && values.endDate
          ? `${daysBetween(values.startDate, values.endDate).toLocaleString('ko-KR')}일`
          : '',
    };
  },
  validate: (values) => {
    const errors: string[] = [];
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      errors.push('휴직 종료일은 시작일보다 빠를 수 없습니다.');
    }
    if (values.splitUse === '예' && (values.splitPlan ?? '').trim().length < 5) {
      errors.push('분할 사용 계획을 5자 이상 적어 주세요.');
    }
    return errors;
  },
  warn: (values) => {
    const warnings: string[] = [];
    const type = values.leaveType || LEAVE;
    const days =
      values.startDate && values.endDate ? daysBetween(values.startDate, values.endDate) : 0;
    // 시작일 - 신청일 (예: 11월 1일 신청, 12월 1일 시작이면 30일)
    const notice =
      values.date && values.startDate && values.startDate >= values.date
        ? daysBetween(values.date, values.startDate) - 1
        : null;
    if (type === SHORT_LEAVE) {
      if (days > 0 && days !== 7 && days !== 14) {
        warnings.push('단기 육아휴직은 1주(7일) 또는 2주(14일) 단위로 씁니다.');
      }
      if (!values.shortReason || values.shortReason === '해당 없음') {
        warnings.push('단기 육아휴직 사유(방학, 휴업·휴교, 입원, 감염병 격리 등)를 고르세요.');
      }
      if (values.startDate && values.startDate < '2026-08-20') {
        warnings.push('단기 육아휴직은 2026년 8월 20일부터 쓸 수 있습니다.');
      }
      if (values.shortReason === '방학' && notice !== null && notice < 30) {
        warnings.push('방학처럼 미리 알 수 있는 사유는 시작 30일 전까지 신청하는 것이 원칙입니다.');
      }
    } else if (notice !== null && notice < 30) {
      warnings.push(
        `신청일부터 시작일까지 ${notice}일입니다. 원칙은 30일 전 신청이며, 조기 출산이나 배우자의 사망·부상·질병 등 사유가 있으면 7일 전까지 신청할 수 있습니다(남녀고용평등법 시행령 제11조).`,
      );
    }
    if (type === LEAVE && days > 548) {
      warnings.push('육아휴직은 추가 6개월을 더해도 최대 1년 6개월입니다.');
    } else if (type === LEAVE && days > 366) {
      warnings.push(
        '1년을 넘는 기간은 부모가 각각 3개월 이상 사용했거나 한부모·중증 장애아동 부모일 때만 6개월까지 더 쓸 수 있습니다.',
      );
    }
    if (type === REDUCED_HOURS) {
      const hours = Number((values.reducedHours ?? '').trim());
      if (!values.reducedHours?.trim()) {
        warnings.push('단축 후 주 근로시간(15~35시간)을 적으세요.');
      } else if (!Number.isFinite(hours) || hours < 15 || hours > 35) {
        warnings.push('단축 후 근로시간은 주 15시간 이상 35시간 이하여야 합니다.');
      }
    }
    const age = childAge(values.childBirth, values.startDate);
    if (age !== null && type !== REDUCED_HOURS && age >= 9) {
      warnings.push(
        `시작일에 자녀가 만 ${age}세입니다. 육아휴직은 만 8세 이하 또는 초등학교 2학년 이하 자녀가 대상입니다.`,
      );
    }
    if (age !== null && type === REDUCED_HOURS && age >= 13) {
      warnings.push(
        `시작일에 자녀가 만 ${age}세입니다. 근로시간 단축은 만 12세 이하 또는 초등학교 6학년 이하 자녀가 대상입니다.`,
      );
    }
    return warnings;
  },
  sample: {
    docNo: 'ML-20261030-001',
    date: '2026-10-30',
    name: '김육아',
    employeeNo: '2021001',
    department: '개발팀',
    position: '대리',
    childName: '김아이',
    childBirth: '2024-05-10',
    leaveType: '육아휴직',
    shortReason: '해당 없음',
    startDate: '2026-12-01',
    endDate: '2027-11-30',
    splitUse: '아니요',
    benefitApply: '신청함',
    splitPlan: '해당 없음 — 분할 사용하지 않습니다.',
    handover:
      '진행 중인 문서 자동화 프로젝트는 이담당에게 인수인계합니다. 주간보고와 거래처 연락은 팀장이 대신 맡고, 복직 후 기존 업무로 복귀합니다.',
  },
  faq: [
    {
      q: '육아휴직은 얼마나 사용할 수 있나요?',
      a: '부모 각각 자녀 1명당 1년입니다. 2025년 2월 23일부터 부모가 각각 3개월 이상 쓰거나 한부모·중증 장애아동 부모이면 6개월을 더해 1년 6개월까지 쓸 수 있습니다. 단기 육아휴직(1~2주)은 이 기간에서 빠지지만 분할 횟수에는 넣지 않습니다.',
    },
    {
      q: '분할 사용도 가능한가요?',
      a: '네. 육아휴직은 3회까지 나눠 총 4번 쓸 수 있고, 근로시간 단축은 1개월 이상 단위로 나눠 쓸 수 있습니다. 분할 사용 계획에 각 기간을 적으세요.',
    },
    {
      q: '급여는 어디에 신청하나요?',
      a: '육아휴직급여는 회사가 아니라 고용센터(고용24)에 신청합니다. 휴직 시작 1개월 뒤부터 끝난 날 이후 12개월 안에 신청해야 하며, 회사는 확인서를 따로 제출합니다.',
    },
    {
      q: '복직은 언제 하나요?',
      a: '휴직 종료일 다음 날부터 복직하는 것이 일반적입니다. 회사 인사 규정과 복직 절차를 함께 확인하세요.',
    },
  ],
  sources: [
    {
      label: '국가법령정보센터 — 남녀고용평등과 일·가정 양립 지원에 관한 법률 제19조·제19조의2',
      href: 'https://www.law.go.kr/법령/남녀고용평등과일ㆍ가정양립지원에관한법률',
    },
    {
      label: '고용노동부 — 육아휴직·단기 육아휴직 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '고용24 — 육아휴직급여 신청',
      href: 'https://www.work24.go.kr/',
    },
  ],
  related: [
    { label: '휴직 신청서 양식', href: '/forms/leave-of-absence/' },
    { label: '근태 정정 신청서 양식', href: '/forms/attendance-correction/' },
    { label: '근로계약서 양식', href: '/forms/employment-contract/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
