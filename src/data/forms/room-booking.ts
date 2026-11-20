import type { FormField, FormTemplate } from '@/lib/doc/types';

const minutesOf = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const durationLabelOf = (values: Record<string, string>): string => {
  const start = minutesOf(values.startTime ?? '');
  const end = minutesOf(values.endTime ?? '');
  if (start === null || end === null || end <= start) return '';
  const total = end - start;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'RB-20261117-001',
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
    id: 'room',
    label: '회의실',
    type: 'text',
    group: '예약 정보',
    required: true,
    placeholder: '예: 3층 대회의실',
    maxLength: 60,
  },
  {
    id: 'requester',
    label: '신청자',
    type: 'text',
    group: '예약 정보',
    required: true,
    placeholder: '김옷깃',
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '예약 정보',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'bookingDate',
    label: '예약일',
    type: 'date',
    group: '예약 정보',
    required: true,
  },
  {
    id: 'startTime',
    label: '시작 시간',
    type: 'text',
    group: '예약 정보',
    placeholder: '14:00',
    maxLength: 5,
    required: true,
  },
  {
    id: 'endTime',
    label: '종료 시간',
    type: 'text',
    group: '예약 정보',
    placeholder: '15:30',
    maxLength: 5,
    required: true,
  },
  {
    id: 'durationLabel',
    label: '소요 시간',
    type: 'computed',
    group: '예약 정보',
    help: '시작·종료 시간으로 자동 계산합니다.',
  },
  {
    id: 'attendees',
    label: '참석 인원',
    type: 'number',
    group: '예약 정보',
    placeholder: '6',
  },
  {
    id: 'equipment',
    label: '필요 장비',
    type: 'text',
    group: '예약 정보',
    placeholder: '예: 프로젝터, 화상회의',
    maxLength: 80,
  },
  {
    id: 'purpose',
    label: '사용 목적',
    type: 'textarea',
    group: '사용 목적',
    placeholder: '회의·교육 내용과 참석 대상을 적습니다.',
    required: true,
    maxLength: 500,
    rows: 3,
    span: 3,
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '정리·준비 요청, 반복 예약 등',
    maxLength: 300,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['신청인', '담당자', '부서장', '본부장', '대표'],
    defaultValue: JSON.stringify([
      { label: '신청인', enabled: true },
      { label: '담당자', enabled: true },
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

export const roomBooking: FormTemplate = {
  slug: 'room-booking',
  title: '회의실 예약 신청서',
  family: 'admin',
  category: 'people',
  description:
    '회의실 사용 일시와 목적, 참석 인원, 필요 장비를 신청하는 회의실 예약 신청서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '회의실 예약 신청서',
    '회의실 예약 양식',
    '회의실 사용 신청',
    '회의실 예약서',
    '회의실 대관 신청',
    '회의실 예약 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'RB',
  lead: '회의실을 예약할 때 일시와 목적, 인원, 장비를 정리하는 신청서입니다. 시작·종료 시간으로 소요 시간을 자동 계산합니다.',
  useCases: [
    '팀 회의·교육을 위해 회의실을 예약할 때',
    '화상회의 장비가 필요한 회의를 신청할 때',
    '외부 방문객과의 미팅 장소를 잡을 때',
    '같은 시간대 회의실 사용을 조정할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 회의실을 확인합니다.',
    '예약일과 시작·종료 시간을 적으면 소요 시간이 자동으로 표시됩니다.',
    '참석 인원과 필요 장비, 사용 목적을 적습니다.',
    'PDF로 내려받아 담당자 확인을 받습니다.',
  ],
  notes: [
    '예약 시간은 회의 준비·정리 시간을 포함해 여유 있게 잡으세요.',
    '같은 회의실을 반복 예약하려면 비고에 반복 일정을 적고 담당자와 협의하세요.',
    '장비 사용 후에는 원래 상태로 정리하고, 고장이 있으면 담당자에게 알리세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '회의실 예약 신청서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '예약 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '회의실', field: 'room' },
        { label: '신청자', field: 'requester' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '부서', field: 'department' },
        { label: '예약일', field: 'bookingDate' },
      ],
    },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '시작 시간', field: 'startTime' },
        { label: '종료 시간', field: 'endTime' },
        { label: '소요 시간', field: 'durationLabel' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '참석 인원', field: 'attendees' },
        { label: '필요 장비', field: 'equipment' },
      ],
    },
    { kind: 'section', title: '사용 목적' },
    { kind: 'text', field: 'purpose', minLines: 3 },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['신청인', '담당자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (values) => ({ durationLabel: durationLabelOf(values) }),
  validate: (values) => {
    const start = minutesOf(values.startTime ?? '');
    const end = minutesOf(values.endTime ?? '');
    if (values.startTime?.trim() && start === null) {
      return ['시작 시간을 24시간 형식(예: 14:00)으로 입력하세요.'];
    }
    if (values.endTime?.trim() && end === null) {
      return ['종료 시간을 24시간 형식(예: 15:30)으로 입력하세요.'];
    }
    if (start !== null && end !== null && end <= start) {
      return ['종료 시간은 시작 시간보다 늦어야 합니다.'];
    }
    return [];
  },
  sample: {
    docNo: 'RB-20261117-001',
    date: '2026-11-17',
    room: '3층 대회의실',
    requester: '김옷깃',
    department: '경영지원팀',
    bookingDate: '2026-12-04',
    startTime: '15:00',
    endTime: '16:30',
    attendees: '18',
    equipment: '프로젝터, 화상회의, 마이크',
    purpose: '12월 전사 회의. 결산·2027년 계획 공유와 부서별 질의응답을 진행합니다.',
    note: '회의 30분 전부터 장비 테스트가 필요합니다.',
  },
  faq: [
    {
      q: '회의실 예약은 얼마 전에 신청해야 하나요?',
      a: '회사 규정에 따라 다르지만, 일반적으로 최소 1~3일 전에 신청합니다. 장비 설치나 외부 방문객이 있으면 더 여유 있게 잡으세요.',
    },
    {
      q: '소요 시간은 어떻게 계산되나요?',
      a: '시작·종료 시간을 24시간 형식(예: 14:00)으로 입력하면 자동으로 계산됩니다. 준비·정리 시간은 별도로 고려하세요.',
    },
    {
      q: '예약이 겹치면 어떻게 하나요?',
      a: '담당자와 협의해 시간을 조정하거나 다른 회의실을 사용하세요. 이 신청서는 예약 요청 문서이며, 최종 확정은 담당자 확인 후에 이루어집니다.',
    },
    {
      q: '반복 예약도 가능한가요?',
      a: '비고에 반복 일정(예: 매주 금요일 15:00)을 적고 담당자와 협의하세요. 정기 예약은 별도 규칙이 있을 수 있습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '행정안전부 — 회의 운영 안내',
      href: 'https://www.mois.go.kr/',
    },
  ],
  related: [
    { label: '회의록 양식', href: '/forms/meeting-minutes/' },
    { label: '사내 공고문 양식', href: '/forms/notice/' },
    { label: '교육 출석부 양식', href: '/forms/attendance/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
