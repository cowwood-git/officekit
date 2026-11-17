import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const items: RepeatGroup = {
  id: 'items',
  label: '점검 항목',
  help: '점검 위치와 항목, 상태, 조치 내용을 적습니다.',
  minRows: 3,
  maxRows: 40,
  addLabel: '+ 점검 항목 추가',
  required: true,
  group: '시설 정보',
  summaryField: 'itemCountLabel',
  summaryLabel: '점검 항목',
  columns: [
    {
      id: 'area',
      label: '점검 위치',
      type: 'text',
      placeholder: '예: 1층 로비',
      maxLength: 40,
      width: 1.5,
    },
    {
      id: 'item',
      label: '점검 항목',
      type: 'text',
      required: true,
      placeholder: '예: 자동문 작동 상태',
      maxLength: 70,
      width: 2.4,
    },
    {
      id: 'status',
      label: '상태',
      type: 'select',
      options: ['양호', '보수 필요', '즉시 조치'],
      width: 1.4,
    },
    {
      id: 'action',
      label: '조치',
      type: 'text',
      placeholder: '조치 내용·일정',
      maxLength: 60,
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
    placeholder: 'FC-20261117-001',
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
    id: 'building',
    label: '시설명',
    type: 'text',
    group: '시설 정보',
    required: true,
    placeholder: '예: 옷깃 본사 빌딩',
    maxLength: 80,
    span: 2,
  },
  {
    id: 'manager',
    label: '점검자',
    type: 'text',
    group: '시설 정보',
    required: true,
    placeholder: '김시설',
    maxLength: 30,
  },
  {
    id: 'checkDate',
    label: '점검일',
    type: 'date',
    group: '시설 정보',
    required: true,
  },
  {
    id: 'itemCountLabel',
    label: '점검 항목 수',
    type: 'computed',
    group: '시설 정보',
    help: '아래 표에 입력한 점검 항목 수입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '보수 일정, 예산, 외부 업체 요청 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['점검자', '시설 담당', '부서장'],
    defaultValue: JSON.stringify([
      { label: '점검자', enabled: true },
      { label: '시설 담당', enabled: true },
      { label: '부서장', enabled: false },
    ]),
    required: true,
    maxSelected: 3,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.item ?? '').trim());

export const facilityCheck: FormTemplate = {
  slug: 'facility-check',
  title: '시설물 점검표',
  family: 'operations',
  category: 'report',
  description:
    '건물·설비의 점검 항목과 상태, 보수 필요 사항을 정리하는 시설물 점검표를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '시설물 점검표',
    '시설 점검표 양식',
    '건물 점검표',
    '설비 점검표',
    '시설물 안전점검',
    '시설물 점검표 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'FC',
  lead: '건물과 설비를 위치별로 점검하고 상태·조치를 기록하는 표입니다. 보수 필요 항목을 한눈에 정리해 유지보수 계획을 세울 수 있습니다.',
  useCases: [
    '정기 시설물 점검을 기록할 때',
    '보수·교체가 필요한 설비를 정리할 때',
    '외부 점검 업체에 상태를 전달할 때',
    '건물 안전·유지보수 이력을 남길 때',
  ],
  howTo: [
    '문서 번호와 작성일, 시설 정보를 확인합니다.',
    '점검 위치와 항목, 상태(양호·보수 필요·즉시 조치)를 입력합니다.',
    '보수가 필요한 항목의 조치 내용과 일정을 적습니다.',
    '비고를 확인하고 PDF로 내려받아 서명·보관합니다.',
  ],
  notes: [
    '이 점검표는 시설 상태를 기록하는 보조 자료입니다. 법정 점검·안전진단은 관련 법령과 전문 업체 절차를 따르세요.',
    '누수·전기·소방 등 즉시 위험이 있는 항목은 사용을 중지하고 담당 부서에 바로 알리세요.',
    '보수 이력과 사진을 함께 보관하면 다음 점검과 예산 계획에 도움이 됩니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '시설물 점검표',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '시설 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '시설명', field: 'building' },
        { label: '점검자', field: 'manager' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '점검일', field: 'checkDate' },
        { label: '점검 항목 수', field: 'itemCountLabel' },
      ],
    },
    { kind: 'section', title: '점검 항목' },
    {
      kind: 'table',
      columns: [
        { label: '점검 위치', width: 40 },
        { label: '점검 항목', width: 64 },
        { label: '상태', width: 30, align: 'center' },
        { label: '조치', width: 40 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row) => [
          (row.area ?? '').trim(),
          (row.item ?? '').trim(),
          (row.status ?? '').trim(),
          (row.action ?? '').trim(),
        ]),
      minRows: 4,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['점검자', '시설 담당', '부서장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const count = itemsOf(rows).length;
    return { itemCountLabel: count > 0 ? `${count}개` : '' };
  },
  validate: (_values, rows) =>
    itemsOf(rows).length === 0 ? ['점검 항목을 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'FC-20261117-001',
    date: '2026-11-17',
    building: '옷깃 본사 빌딩',
    manager: '김시설',
    checkDate: '2026-11-17',
    note: '엘리베이터는 11월 20일 업체 점검 예정입니다. 자동문은 11월 19일 보수합니다.',
  },
  sampleRows: {
    items: [
      {
        area: '1층 로비',
        item: '자동문 작동 상태',
        status: '보수 필요',
        action: '11/19 센서 교체',
      },
      {
        area: '1층 로비',
        item: '소화기·소화전',
        status: '양호',
        action: '',
      },
      {
        area: '3층 엘리베이터',
        item: '운행 소음·문 닫힘',
        status: '보수 필요',
        action: '11/20 업체 점검',
      },
      {
        area: '옥상',
        item: '배수구 막힘',
        status: '즉시 조치',
        action: '청소 완료',
      },
    ],
  },
  faq: [
    {
      q: '시설물 점검표는 얼마나 자주 쓰나요?',
      a: '건물·설비의 종류와 회사 규정에 따라 다릅니다. 일반적으로 월간·분기별 정기 점검과 이상 발생 시 수시 점검을 기록합니다.',
    },
    {
      q: '상태는 어떻게 구분하나요?',
      a: '정상이면 “양호”, 수리가 필요하면 “보수 필요”, 안전에 즉시 영향을 주면 “즉시 조치”로 적습니다.',
    },
    {
      q: '법정 점검을 대체할 수 있나요?',
      a: '아니요. 이 양식은 내부 기록용입니다. 소방·전기·승강기 등 법정 점검은 자격을 갖춘 업체와 관련 법령에 따라 진행하세요.',
    },
    {
      q: '보수 이력은 어떻게 관리하나요?',
      a: '점검일과 조치 내용을 남기고, 같은 항목의 이전 점검표와 사진을 함께 보관하세요. 반복되는 고장은 교체 검토 대상으로 정리합니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '국토교통부 — 시설물 안전관리',
      href: 'https://www.molit.go.kr/',
    },
    {
      label: '시설물안전법 국가시설물안전관리시스템',
      href: 'https://www.fms.or.kr/',
    },
  ],
  related: [
    { label: '안전점검일지 양식', href: '/forms/safety-check/' },
    { label: '작업일보 양식', href: '/forms/work-daily/' },
    { label: '비품 신청서 양식', href: '/forms/supplies-request/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
