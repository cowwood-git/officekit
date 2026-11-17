import type { FormTemplate } from '@/lib/doc/types';

const toMinutes = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const durationLabel = (minutes: number): string => {
  if (minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}분`;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
};

export const overtimeRequest: FormTemplate = {
  slug: 'overtime-request',
  title: '초과근무 신청서',
  family: 'hr',
  category: 'people',
  description:
    '연장·야간 근무를 미리 신청하는 초과근무 신청서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 일자·시간과 업무 내용, 결재선을 한 장에 정리합니다.',
  keywords: [
    '초과근무 신청서',
    '초과근무 신청서 양식',
    '연장근무 신청서',
    '야근 신청서',
    '시간외근무 신청서',
    '초과근무 PDF',
  ],
  updated: '2026-11-16',
  docPrefix: 'OT',
  lead: '연장·야간 근무를 사전에 신청하는 초과근무 신청서입니다. 일자와 시작·종료 시간, 휴게 시간을 입력하면 총 시간이 자동으로 계산됩니다.',
  useCases: [
    '월말 마감·정산을 위해 연장근무를 신청할 때',
    '행사·시스템 작업으로 야간 근무가 필요할 때',
    '긴급 대응 후 사후 승인을 받을 때',
    '부서별 초과근무 내역을 결재받을 때',
  ],
  howTo: [
    '문서 번호와 작성일, 신청자 정보를 확인합니다.',
    '초과근무 일자와 시작·종료 시간, 휴게 시간을 입력합니다. 총 시간은 자동으로 계산됩니다.',
    '사유와 업무 내용을 적고 결재선을 고릅니다.',
    'PDF로 내려받아 결재를 올리거나 인쇄해 서명받습니다.',
  ],
  notes: [
    '이 양식은 신청서입니다. 초과근무 수당·가산율·대체휴무는 근로기준법과 회사의 취업규칙을 따르며, 이 도구는 금액을 계산하지 않습니다.',
    '가능하면 근무 전에 신청하고, 긴급 상황이라면 사후에라도 회사 규정에 맞춰 승인을 받으세요.',
    '휴게 시간은 실제로 근무하지 않은 시간을 적습니다. 계산 방식은 회사 규정을 확인하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields: [
    {
      id: 'docNo',
      label: '문서 번호',
      type: 'text',
      group: '기본 정보',
      placeholder: 'OT-20261116-001',
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
      group: '신청자',
      placeholder: '홍길동',
      required: true,
      maxLength: 30,
    },
    {
      id: 'department',
      label: '부서',
      type: 'text',
      group: '신청자',
      placeholder: '경영지원팀',
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
      id: 'workDate',
      label: '근무 일자',
      type: 'date',
      group: '초과근무 정보',
      required: true,
    },
    {
      id: 'startTime',
      label: '시작 시간',
      type: 'text',
      group: '초과근무 정보',
      placeholder: '18:00',
      maxLength: 5,
      required: true,
      help: '24시간 표기로 적습니다. 예: 18:00',
    },
    {
      id: 'endTime',
      label: '종료 시간',
      type: 'text',
      group: '초과근무 정보',
      placeholder: '20:30',
      maxLength: 5,
      required: true,
      help: '자정을 넘는 근무는 회사 규정에 맞춰 나누어 신청하세요.',
    },
    {
      id: 'breakMinutes',
      label: '휴게 시간(분)',
      type: 'number',
      group: '초과근무 정보',
      placeholder: '30',
      defaultValue: '30',
      help: '근무하지 않은 시간을 분 단위로 적습니다.',
    },
    {
      id: 'breakLabel',
      label: '휴게 시간 표시',
      type: 'computed',
      group: '초과근무 정보',
      help: '휴게 시간을 분 단위로 표시합니다.',
    },
    {
      id: 'hours',
      label: '총 시간',
      type: 'computed',
      group: '초과근무 정보',
      help: '종료 시간에서 시작 시간과 휴게 시간을 뺍니다.',
    },
    {
      id: 'reason',
      label: '사유',
      type: 'select',
      group: '업무 내용',
      options: ['업무 마감', '행사·준비', '긴급 대응', '시스템 작업', '기타'],
      required: true,
    },
    {
      id: 'detail',
      label: '업무 내용',
      type: 'textarea',
      group: '업무 내용',
      placeholder: '초과근무 중 처리할 업무와 목표를 적습니다.',
      required: true,
      maxLength: 500,
      rows: 4,
      span: 3,
    },
    {
      id: 'approvalRoles',
      label: '결재선',
      type: 'roles',
      group: '결재선',
      options: ['신청인', '팀장', '부서장', '본부장', '대표'],
      defaultValue: JSON.stringify([
        { label: '신청인', enabled: true },
        { label: '팀장', enabled: false },
        { label: '부서장', enabled: true },
        { label: '본부장', enabled: false },
        { label: '대표', enabled: true },
      ]),
      required: true,
      maxSelected: 5,
      editable: true,
      help: '5칸 중 필요한 단계만 켜고, 이름을 직접 고칠 수 있습니다.',
      span: 3,
    },
  ],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '초과근무 신청서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '신청자' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '성명', field: 'name' },
        { label: '부서', field: 'department' },
        { label: '직위', field: 'position' },
      ],
    },
    { kind: 'section', title: '초과근무 정보' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '근무 일자', field: 'workDate' },
        { label: '시작', field: 'startTime' },
        { label: '종료', field: 'endTime' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '휴게 시간', field: 'breakLabel' },
        { label: '총 시간', field: 'hours' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '사유', field: 'reason' }] },
    { kind: 'section', title: '업무 내용' },
    { kind: 'text', field: 'detail', minLines: 4 },
    {
      kind: 'signature',
      roles: ['신청인', '부서장', '대표'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (values) => {
    const start = values.startTime?.trim() ?? '';
    const end = values.endTime?.trim() ?? '';
    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);
    const breakMinutes = Math.max(0, Number(values.breakMinutes ?? 0) || 0);
    const worked =
      startMinutes !== null && endMinutes !== null && endMinutes > startMinutes
        ? endMinutes - startMinutes - breakMinutes
        : 0;
    return {
      hours: durationLabel(worked),
      breakLabel: breakMinutes > 0 ? `${breakMinutes}분` : '없음',
    };
  },
  validate: (values) => {
    const errors: string[] = [];
    const start = toMinutes(values.startTime ?? '');
    const end = toMinutes(values.endTime ?? '');
    if (values.startTime?.trim() && start === null) {
      errors.push('시작 시간을 18:00 형식으로 적어 주세요.');
    }
    if (values.endTime?.trim() && end === null) {
      errors.push('종료 시간을 20:30 형식으로 적어 주세요.');
    }
    if (start !== null && end !== null && end <= start) {
      errors.push('종료 시간은 시작 시간보다 늦어야 합니다.');
    }
    const breakMinutes = Number(values.breakMinutes ?? 0) || 0;
    if (start !== null && end !== null && end > start && breakMinutes >= end - start) {
      errors.push('휴게 시간은 근무 시간보다 짧아야 합니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'OT-20261116-001',
    date: '2026-11-16',
    name: '김옷깃',
    department: '경영지원팀',
    position: '대리',
    workDate: '2026-11-18',
    startTime: '18:00',
    endTime: '20:30',
    breakMinutes: '30',
    reason: '업무 마감',
    detail: '11월 월말 정산 마감과 거래처 세금계산서 발행 내역 확인을 진행합니다.',
  },
  faq: [
    {
      q: '초과근무 수당도 계산해 주나요?',
      a: '아니요. 이 양식은 신청서이며 수당을 계산하지 않습니다. 가산율과 지급 기준은 근로기준법 제56조와 회사의 취업규칙을 따르세요.',
    },
    {
      q: '언제 신청해야 하나요?',
      a: '가능하면 근무 전에 신청하는 것이 원칙입니다. 긴급 상황이라면 회사 규정에 따라 사후 승인 절차를 밟으세요.',
    },
    {
      q: '휴게 시간은 어떻게 적나요?',
      a: '근무하지 않은 시간을 분 단위로 적습니다. 총 시간은 종료 시간에서 시작 시간과 휴게 시간을 뺀 값으로 자동 계산됩니다.',
    },
    {
      q: '대체휴무도 신청할 수 있나요?',
      a: '대체휴무 부여 방식은 회사 규정에 따릅니다. 이 신청서에는 초과근무 사실과 업무 내용을 남기고, 대체휴무는 별도 규정에 맞춰 처리하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '국가법령정보센터 — 근로기준법 제56조(연장·야간 및 휴일 근로)',
      href: 'https://www.law.go.kr/법령/근로기준법',
    },
    {
      label: '고용노동부 — 근로기준 안내',
      href: 'https://www.moel.go.kr/',
    },
  ],
  related: [
    { label: '휴가신청서 양식', href: '/forms/leave-request/' },
    { label: '주간업무보고 양식', href: '/forms/weekly-report/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
