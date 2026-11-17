import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const defects: RepeatGroup = {
  id: 'defects',
  label: '하자 항목',
  help: '하자 위치와 증상, 요청 사항을 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 2,
  maxRows: 20,
  addLabel: '+ 하자 추가',
  required: true,
  group: '하자 정보',
  columns: [
    {
      id: 'place',
      label: '위치',
      type: 'text',
      required: true,
      placeholder: '예: 본사 2층 회의실',
      maxLength: 60,
      width: 2.2,
    },
    {
      id: 'symptom',
      label: '증상',
      type: 'text',
      required: true,
      placeholder: '예: 천장 누수',
      maxLength: 80,
      width: 2.8,
    },
    {
      id: 'request',
      label: '요청 사항',
      type: 'text',
      placeholder: '예: 누수 원인 확인·보수',
      maxLength: 80,
      width: 2.6,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '발견 일시·사진 등',
      maxLength: 60,
      width: 1.8,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '요청 번호',
    type: 'text',
    group: '문서',
    placeholder: 'DFR-20261117-001',
    help: '요청일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다. 직접 고쳐도 됩니다.',
  },
  {
    id: 'date',
    label: '요청일',
    type: 'date',
    group: '문서',
    defaultToday: true,
    required: true,
  },
  {
    id: 'recipient',
    label: '수신처',
    type: 'text',
    group: '수신 정보',
    placeholder: '예: 거래처 주식회사',
    required: true,
    maxLength: 60,
    span: 2,
  },
  {
    id: 'contact',
    label: '담당자',
    type: 'text',
    group: '수신 정보',
    placeholder: '김담당 · 02-123-4567',
    maxLength: 60,
  },
  {
    id: 'site',
    label: '현장·설치 위치',
    type: 'text',
    group: '하자 정보',
    placeholder: '예: 서울시 강남구 테헤란로 1, 본사 2층',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'contractNo',
    label: '계약·주문 번호',
    type: 'text',
    group: '하자 정보',
    placeholder: '예: CT-20260901-001',
    maxLength: 40,
  },
  {
    id: 'defectDate',
    label: '발견일',
    type: 'date',
    group: '하자 정보',
    required: true,
  },
  {
    id: 'dueDate',
    label: '처리 요청일',
    type: 'date',
    group: '하자 정보',
    required: true,
  },
  {
    id: 'urgency',
    label: '긴급도',
    type: 'select',
    group: '하자 정보',
    options: ['일반', '긴급'],
    defaultValue: '일반',
    required: true,
  },
  {
    id: 'itemCountLabel',
    label: '하자 항목 수',
    type: 'computed',
    group: '하자 정보',
    help: '아래 표에 입력한 항목 수입니다.',
  },
  {
    id: 'description',
    label: '상세 내용',
    type: 'textarea',
    group: '상세 내용',
    placeholder: '하자 발생 경위, 피해 범위, 희망 보수 방식 등을 적습니다.',
    required: true,
    maxLength: 800,
    rows: 4,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['요청자', '팀장', '부서장', '본부장', '대표'],
    defaultValue: JSON.stringify([
      { label: '요청자', enabled: true },
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

const defectsOf = (rows: FormRows): FormRows['defects'] =>
  (rows.defects ?? []).filter((row) => (row.place ?? '').trim() || (row.symptom ?? '').trim());

export const defectRequest: FormTemplate = {
  slug: 'defect-request',
  title: '하자보수 요청서',
  family: 'sales',
  category: 'money',
  description:
    '납품·시공 후 발견한 하자의 위치와 증상, 보수 요청 내용을 정리하는 하자보수 요청서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '하자보수 요청서',
    '하자보수 요청서 양식',
    '하자 보수 요청',
    '시설 하자 신고',
    'AS 요청서',
    '하자보수 요청서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'DFR',
  lead: '납품·시공 후 발견한 하자를 거래처에 알리고 보수를 요청하는 문서입니다. 위치·증상·요청 사항과 처리 기한을 한 장에 정리합니다.',
  useCases: [
    '납품 물품이나 시공 부분에 하자가 생겼을 때',
    '시설·설비의 누수·파손을 보수 요청할 때',
    '계약상 하자보수 기간 안에 공식 요청을 남길 때',
    '여러 하자를 한 번에 정리해 전달할 때',
  ],
  howTo: [
    '요청일과 수신처, 담당자를 확인합니다.',
    '현장 위치와 계약·주문 번호, 발견일을 적습니다.',
    '하자 위치·증상·요청 사항을 줄 단위로 입력합니다.',
    '상세 내용과 처리 기한을 확인하고 PDF로 내려받아 발송합니다.',
  ],
  notes: [
    '하자는 발견 즉시 사진과 함께 기록하고, 가능한 한 빨리 알리세요.',
    '계약서의 하자보수 기간과 책임 범위를 확인한 뒤 요청하세요.',
    '긴급한 누수·안전 문제는 문서와 별도로 전화·메시지로도 알리세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [defects],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '하자보수 요청서',
      docNoField: 'docNo',
      dateField: 'date',
      docNoLabel: '요청번호',
      dateLabel: '요청일',
    },
    { kind: 'section', title: '수신 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '수신처', field: 'recipient' },
        { label: '담당자', field: 'contact' },
      ],
    },
    { kind: 'section', title: '하자 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '현장·설치 위치', field: 'site' },
        { label: '계약·주문 번호', field: 'contractNo' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '발견일', field: 'defectDate' },
        { label: '처리 요청일', field: 'dueDate' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '긴급도', field: 'urgency' },
        { label: '하자 항목 수', field: 'itemCountLabel' },
      ],
    },
    { kind: 'section', title: '하자 항목' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '위치', width: 44 },
        { label: '증상', width: 52 },
        { label: '요청 사항', width: 48 },
        { label: '비고', width: 36 },
      ],
      rows: (_values, rows) =>
        defectsOf(rows).map((row, index) => [
          String(index + 1),
          (row.place ?? '').trim(),
          (row.symptom ?? '').trim(),
          (row.request ?? '').trim(),
          (row.note ?? '').trim(),
        ]),
      minRows: 2,
    },
    { kind: 'section', title: '상세 내용' },
    { kind: 'text', field: 'description', minLines: 4 },
    {
      kind: 'notice',
      text: '하자 책임 범위와 보수 기한은 계약 내용과 협의 결과에 따릅니다.',
    },
    {
      kind: 'signature',
      roles: ['요청자', '팀장', '대표'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => ({
    itemCountLabel: defectsOf(rows).length > 0 ? `${defectsOf(rows).length}개` : '',
  }),
  validate: (values, rows) => {
    const errors: string[] = [];
    if (values.defectDate && values.dueDate && values.dueDate < values.defectDate) {
      errors.push('처리 요청일은 발견일보다 빠를 수 없습니다.');
    }
    if (defectsOf(rows).length === 0) {
      errors.push('하자 항목을 한 줄 이상 입력하세요.');
    }
    return errors;
  },
  sample: {
    docNo: 'DFR-20261117-001',
    date: '2026-11-17',
    recipient: '페이퍼시설 주식회사',
    contact: '이담당 · 02-987-6543',
    site: '서울시 강남구 테헤란로 1, 본사 2층',
    contractNo: 'CT-20260901-001',
    defectDate: '2026-11-16',
    dueDate: '2026-11-24',
    urgency: '긴급',
    description:
      '2층 회의실 천장에서 누수가 발생해 바닥 일부가 젖었습니다. 11월 16일 오전부터 물방울이 떨어지고 있으며, 아래 전자기기 보호를 위해 임시로 버킷과 방수 시트를 설치했습니다. 누수 원인 확인과 천장 보수, 젖은 마감재 교체를 요청합니다.',
  },
  sampleRows: {
    defects: [
      {
        place: '본사 2층 회의실',
        symptom: '천장 누수',
        request: '누수 원인 확인·천장 보수',
        note: '11/16 오전 발견',
      },
      {
        place: '본사 2층 복도',
        symptom: '걸레받이 들뜸',
        request: '마감재 재시공',
        note: '누수 인접 구간',
      },
    ],
  },
  faq: [
    {
      q: '하자보수 요청서는 언제 보내나요?',
      a: '하자를 발견한 뒤 가능한 한 빨리 보내는 것이 좋습니다. 계약서에 하자보수 기간과 통지 기한이 정해져 있다면 그 기한을 확인하세요.',
    },
    {
      q: '사진도 함께 보내야 하나요?',
      a: '네. 하자 위치와 상태를 보여 주는 사진을 함께 보내면 원인 확인과 보수 범위를 정하기 쉽습니다.',
    },
    {
      q: '긴급한 하자는 어떻게 하나요?',
      a: '누수·감전·안전 위험이 있는 경우 문서와 별도로 전화·메시지로 즉시 알리고, 안전 조치를 먼저 하세요.',
    },
    {
      q: '보수 비용은 누가 부담하나요?',
      a: '계약서의 하자보수 조항에 따라 다릅니다. 시공·납품사의 책임인지, 사용상 과실인지 확인한 뒤 협의하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '공정거래위원회 — 하자보수·소비자 분쟁 안내',
      href: 'https://www.ftc.go.kr/',
    },
    {
      label: '국가법령정보센터 — 민법(하자담보책임)',
      href: 'https://www.law.go.kr/',
    },
  ],
  related: [
    { label: '검수확인서 양식', href: '/forms/inspection/' },
    { label: '납품 지연 통보서 양식', href: '/forms/delay-notice/' },
    { label: '거래처 평가표 양식', href: '/forms/vendor-evaluation/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
