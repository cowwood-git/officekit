import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const trips: RepeatGroup = {
  id: 'trips',
  label: '운행 기록',
  help: '운행일·목적·출발/도착 계기판을 적으면 주행거리가 자동 계산됩니다.',
  minRows: 3,
  maxRows: 40,
  addLabel: '+ 운행 추가',
  required: true,
  group: '차량 정보',
  summaryField: 'totalDistanceLabel',
  summaryLabel: '총 주행거리',
  columns: [
    {
      id: 'date',
      label: '운행일',
      type: 'date',
      required: true,
      width: 1.4,
    },
    {
      id: 'purpose',
      label: '운행 목적',
      type: 'text',
      required: true,
      placeholder: '예: 거래처 방문',
      maxLength: 80,
      width: 2.8,
    },
    {
      id: 'startKm',
      label: '출발(km)',
      type: 'number',
      placeholder: '12,345',
      width: 1.2,
    },
    {
      id: 'endKm',
      label: '도착(km)',
      type: 'number',
      placeholder: '12,380',
      width: 1.2,
    },
    {
      id: 'distance',
      label: '주행거리',
      type: 'computed',
      width: 1.2,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '동승자·유류비 등',
      maxLength: 60,
      width: 1.8,
    },
  ],
  computeRow: (row) => {
    const start = Number((row.startKm ?? '').replace(/[^\d.-]/g, ''));
    const end = Number((row.endKm ?? '').replace(/[^\d.-]/g, ''));
    return {
      distance:
        Number.isFinite(start) && Number.isFinite(end) && end >= start
          ? `${new Intl.NumberFormat('ko-KR').format(end - start)}km`
          : '',
    };
  },
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'VLR-20261118-001',
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
    id: 'vehicleNo',
    label: '차량번호',
    type: 'text',
    group: '차량 정보',
    placeholder: '예: 12가 3456',
    required: true,
    maxLength: 30,
  },
  {
    id: 'model',
    label: '차종',
    type: 'text',
    group: '차량 정보',
    placeholder: '예: 현대 아반떼',
    maxLength: 40,
  },
  {
    id: 'driver',
    label: '운전자',
    type: 'text',
    group: '차량 정보',
    placeholder: '김운전',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '차량 정보',
    placeholder: '경영지원팀',
    maxLength: 40,
  },
  {
    id: 'tripCountLabel',
    label: '운행 횟수',
    type: 'computed',
    group: '차량 정보',
    help: '아래 표에 입력한 운행 건수입니다.',
  },
  {
    id: 'totalDistanceLabel',
    label: '총 주행거리',
    type: 'computed',
    group: '차량 정보',
    help: '운행별 주행거리의 합계입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '유류비, 통행료, 정비 내역 등',
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

const tripsOf = (rows: FormRows): FormRows['trips'] =>
  (rows.trips ?? []).filter((row) => (row.purpose ?? '').trim());

const kmOf = (value: string | undefined): number => Number((value ?? '').replace(/[^\d.-]/g, ''));

const distanceOf = (row: Record<string, string>): number => {
  const start = Number((row.startKm ?? '').replace(/[^\d.-]/g, ''));
  const end = Number((row.endKm ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? end - start : 0;
};

export const vehicleLog: FormTemplate = {
  slug: 'vehicle-log',
  title: '법인차량 운행일지',
  family: 'report',
  category: 'report',
  description:
    '법인차량의 운행일·목적·주행거리를 기록하는 운행일지를 브라우저에서 작성하고 A4 PDF로 저장합니다. 총 주행거리와 운행 횟수가 자동 계산됩니다.',
  keywords: [
    '법인차량 운행일지',
    '차량 운행일지 양식',
    '운행기록부',
    '업무용 차량 운행일지',
    '주행거리 기록',
    '법인차량 운행일지 PDF',
  ],
  updated: '2026-11-18',
  docPrefix: 'VLR',
  lead: '법인차량의 운행일·목적·출발/도착 계기판을 기록하는 운행일지입니다. 운행별 주행거리와 총 주행거리를 자동으로 계산합니다.',
  useCases: [
    '업무용 차량의 운행 내역을 기록할 때',
    '유류비·통행료 등 비용 증빙을 정리할 때',
    '차량별 월간 운행 거리를 확인할 때',
    '세무·감사 대비 운행 기록을 남길 때',
  ],
  howTo: [
    '차량번호와 운전자, 부서를 적습니다.',
    '운행일과 목적, 출발·도착 계기판을 입력합니다.',
    '주행거리와 총 주행거리를 확인합니다.',
    '비고를 적고 PDF로 내려받아 보관합니다.',
  ],
  notes: [
    '운행일지의 출발·도착 계기판은 실제 차량 값과 맞춰야 합니다.',
    '업무 외 사용은 회사 차량 관리 규정에 따라 별도로 기록하세요.',
    '유류비·통행료 증빙은 운행일지와 함께 보관하면 비용 확인이 쉽습니다.',
  ],
  fields,
  groups: [trips],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '법인차량 운행일지',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '차량 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '차량번호', field: 'vehicleNo' },
        { label: '차종', field: 'model' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '운전자', field: 'driver' },
        { label: '부서', field: 'department' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '운행 횟수', field: 'tripCountLabel' },
        { label: '총 주행거리', field: 'totalDistanceLabel' },
      ],
    },
    { kind: 'section', title: '운행 기록' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '운행일', width: 26 },
        { label: '운행 목적', width: 56 },
        { label: '출발(km)', width: 24, align: 'right' },
        { label: '도착(km)', width: 24, align: 'right' },
        { label: '주행거리', width: 24, align: 'right' },
        { label: '비고', width: 32 },
      ],
      rows: (_values, rows) =>
        tripsOf(rows).map((row, index) => [
          String(index + 1),
          row.date ?? '',
          (row.purpose ?? '').trim(),
          row.startKm && Number.isFinite(kmOf(row.startKm))
            ? new Intl.NumberFormat('ko-KR').format(kmOf(row.startKm))
            : '',
          row.endKm && Number.isFinite(kmOf(row.endKm))
            ? new Intl.NumberFormat('ko-KR').format(kmOf(row.endKm))
            : '',
          distanceOf(row) > 0 ? `${new Intl.NumberFormat('ko-KR').format(distanceOf(row))}km` : '',
          (row.note ?? '').trim(),
        ]),
      minRows: 3,
    },
    {
      kind: 'totals',
      rows: [{ label: '총 주행거리', field: 'totalDistanceLabel', strong: true }],
      width: 64,
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
    const list = tripsOf(rows);
    const total = list.reduce((sum, row) => sum + distanceOf(row), 0);
    return {
      tripCountLabel: list.length > 0 ? `${list.length}회` : '',
      totalDistanceLabel: total > 0 ? `${new Intl.NumberFormat('ko-KR').format(total)}km` : '',
    };
  },
  validate: (_values, rows) =>
    tripsOf(rows).length === 0 ? ['운행 기록을 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'VLR-20261118-001',
    date: '2026-11-18',
    vehicleNo: '12가 3456',
    model: '현대 아반떼',
    driver: '김운전',
    department: '경영지원팀',
    note: '11월 유류비 8만 원, 통행료 1만 2천 원 사용. 다음 정기 점검은 12월 예정입니다.',
  },
  sampleRows: {
    trips: [
      {
        date: '2026-11-03',
        purpose: '거래처 방문',
        startKm: '12345',
        endKm: '12380',
        note: '판교',
      },
      {
        date: '2026-11-07',
        purpose: '물품 수령',
        startKm: '12380',
        endKm: '12410',
        note: '본사 창고',
      },
      {
        date: '2026-11-12',
        purpose: '세미나 참석',
        startKm: '12410',
        endKm: '12472',
        note: '일산',
      },
      {
        date: '2026-11-17',
        purpose: '은행 업무',
        startKm: '12472',
        endKm: '12486',
        note: '',
      },
    ],
  },
  faq: [
    {
      q: '법인차량 운행일지는 왜 필요한가요?',
      a: '업무용 차량의 운행 내역과 비용을 확인하고, 세무·감사 대비 증빙을 남기기 위해 필요합니다. 회사 차량 관리 규정에 따라 작성하세요.',
    },
    {
      q: '주행거리는 어떻게 계산되나요?',
      a: '도착 계기판에서 출발 계기판을 뺀 값입니다. 도착 값이 출발 값보다 작으면 계산하지 않고 비워 둡니다.',
    },
    {
      q: '운행일지를 매일 써야 하나요?',
      a: '회사 규정에 따라 다르지만 운행이 있을 때마다 기록하고, 월 단위로 합계를 확인하는 것이 좋습니다.',
    },
    {
      q: '업무 외 사용도 적어야 하나요?',
      a: '법인차량의 사적 사용은 회사 규정에 따라 별도로 기록·정산해야 합니다. 운행일지에도 구분해 남기세요.',
    },
  ],
  sources: [
    {
      label: '국세청 — 업무용승용차 관련 비용 안내',
      href: 'https://www.nts.go.kr/',
    },
  ],
  related: [
    { label: '출장신청서 양식', href: '/forms/travel-request/' },
    { label: '출장비 정산서 양식', href: '/forms/travel-expense/' },
    { label: '지출결의서 양식', href: '/forms/expense-report/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
