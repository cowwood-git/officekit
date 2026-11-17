import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const recipients: RepeatGroup = {
  id: 'recipients',
  label: '배포 대상',
  help: '문서를 받는 부서·성명과 사본 번호, 배포 상태를 적습니다.',
  minRows: 3,
  maxRows: 50,
  addLabel: '+ 대상 추가',
  required: true,
  group: '문서 정보',
  summaryField: 'totalCountLabel',
  summaryLabel: '배포 대상',
  columns: [
    {
      id: 'department',
      label: '부서',
      type: 'text',
      required: true,
      placeholder: '예: 개발팀',
      maxLength: 40,
      width: 1.8,
    },
    {
      id: 'name',
      label: '성명',
      type: 'text',
      placeholder: '김담당',
      maxLength: 30,
      width: 1.4,
    },
    {
      id: 'copyNo',
      label: '사본번호',
      type: 'text',
      placeholder: '예: 01',
      maxLength: 20,
      width: 1,
    },
    {
      id: 'status',
      label: '상태',
      type: 'select',
      options: ['배포', '회수', '폐기'],
      width: 1.2,
    },
    {
      id: 'note',
      label: '비고',
      type: 'text',
      placeholder: '수령일·회수일 등',
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
    placeholder: 'DD-20261118-001',
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
    id: 'documentTitle',
    label: '문서명',
    type: 'text',
    group: '문서 정보',
    placeholder: '예: 개인정보 처리방침',
    required: true,
    maxLength: 100,
    span: 2,
  },
  {
    id: 'version',
    label: '버전',
    type: 'text',
    group: '문서 정보',
    placeholder: '예: v2.1',
    maxLength: 20,
  },
  {
    id: 'distributionDate',
    label: '배포일',
    type: 'date',
    group: '문서 정보',
    required: true,
  },
  {
    id: 'owner',
    label: '배포 담당',
    type: 'text',
    group: '문서 정보',
    placeholder: '김담당',
    maxLength: 30,
  },
  {
    id: 'totalCountLabel',
    label: '배포 대상 수',
    type: 'computed',
    group: '문서 정보',
    help: '아래 표에 입력한 대상 수입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '배포 목적, 회수 기한, 보관 장소 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '확인',
    type: 'roles',
    group: '확인',
    options: ['작성자', '확인자'],
    defaultValue: JSON.stringify([
      { label: '작성자', enabled: true },
      { label: '확인자', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

const recipientsOf = (rows: FormRows): FormRows['recipients'] =>
  (rows.recipients ?? []).filter((row) => (row.department ?? '').trim() || (row.name ?? '').trim());

export const documentDistribution: FormTemplate = {
  slug: 'document-distribution',
  title: '문서 배포·회수 대장',
  family: 'report',
  category: 'report',
  description:
    '사내 문서의 버전·배포 대상·회수 상태를 기록하는 문서 배포·회수 대장을 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '문서 배포 대장',
    '문서 회수 대장',
    '사내 문서 관리',
    '문서 배포대장 양식',
    '문서 버전 관리',
    '문서 배포 회수 대장 PDF',
  ],
  updated: '2026-11-18',
  docPrefix: 'DD',
  lead: '사내 문서를 누구에게 배포했고 언제 회수했는지 기록하는 대장입니다. 문서명·버전과 사본 번호, 배포·회수 상태를 한 장에 정리합니다.',
  useCases: [
    '사내 규정·매뉴얼을 부서에 배포할 때',
    '문서 버전별 배포 대상을 관리할 때',
    '회수·폐기한 문서를 확인할 때',
    '감사·인증 대비 문서 배포 이력을 남길 때',
  ],
  howTo: [
    '문서명과 버전, 배포일, 담당자를 적습니다.',
    '배포 대상의 부서·성명·사본 번호를 입력합니다.',
    '배포·회수·폐기 상태와 날짜를 기록합니다.',
    '비고를 확인하고 PDF로 내려받아 보관합니다.',
  ],
  notes: [
    '문서 버전이 바뀌면 이전 버전의 회수·폐기 여부를 함께 확인하세요.',
    '사본 번호를 부여하면 배포·회수 누락을 줄일 수 있습니다.',
    '개인정보·영업비밀이 담긴 문서는 배포 대상과 보관 장소를 더 엄격히 관리하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [recipients],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '문서 배포·회수 대장',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '문서 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '문서명', field: 'documentTitle' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '버전', field: 'version' },
        { label: '배포일', field: 'distributionDate' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '배포 담당', field: 'owner' },
        { label: '배포 대상 수', field: 'totalCountLabel' },
      ],
    },
    { kind: 'section', title: '배포 대상' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '부서', width: 56 },
        { label: '성명', width: 36 },
        { label: '사본번호', width: 24, align: 'center' },
        { label: '상태', width: 24, align: 'center' },
        { label: '비고', width: 44 },
      ],
      rows: (_values, rows) =>
        recipientsOf(rows).map((row, index) => [
          String(index + 1),
          (row.department ?? '').trim(),
          (row.name ?? '').trim(),
          (row.copyNo ?? '').trim(),
          (row.status ?? '').trim(),
          (row.note ?? '').trim(),
        ]),
      minRows: 3,
    },
    {
      kind: 'totals',
      rows: [{ label: '배포 대상', field: 'totalCountLabel', strong: true }],
      width: 64,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['작성자', '확인자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => ({
    totalCountLabel: recipientsOf(rows).length > 0 ? `${recipientsOf(rows).length}명` : '',
  }),
  validate: (_values, rows) =>
    recipientsOf(rows).length === 0 ? ['배포 대상을 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'DD-20261118-001',
    date: '2026-11-18',
    documentTitle: '개인정보 처리방침',
    version: 'v2.1',
    distributionDate: '2026-11-18',
    owner: '김담당',
    note: '전 부서 배포 후 2026-11-30까지 회수합니다. 회수한 사본은 본사 문서보관함 B-2에 보관합니다.',
  },
  sampleRows: {
    recipients: [
      { department: '개발팀', name: '이개발', copyNo: '01', status: '배포', note: '11/18 수령' },
      {
        department: '경영지원팀',
        name: '김총무',
        copyNo: '02',
        status: '배포',
        note: '11/18 수령',
      },
      { department: '영업팀', name: '박영업', copyNo: '03', status: '회수', note: '11/29 회수' },
    ],
  },
  faq: [
    {
      q: '문서 배포 대장은 왜 필요한가요?',
      a: '문서 버전과 배포 대상을 기록해 회수·폐기 누락을 줄이고, 감사·인증에서 배포 이력을 확인할 수 있게 합니다.',
    },
    {
      q: '사본 번호는 꼭 있어야 하나요?',
      a: '필수는 아니지만 사본마다 번호를 부여하면 배포·회수 상태를 개별로 관리하기 쉽습니다.',
    },
    {
      q: '전자 문서도 대장에 적나요?',
      a: '네. 파일 배포도 버전과 수신자를 기록하면 좋습니다. 접근 권한과 다운로드 이력을 함께 관리하면 더 안전합니다.',
    },
    {
      q: '회수한 문서는 어떻게 하나요?',
      a: '회수 상태와 날짜를 적고, 회사 규정에 따라 폐기하거나 보관합니다. 개인정보·영업비밀 문서는 폐기 확인을 남기세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '행정안전부 — 기록물 관리 안내',
      href: 'https://www.mois.go.kr/',
    },
  ],
  related: [
    { label: '사내 공고문 양식', href: '/forms/notice/' },
    { label: '개인정보 동의서 양식', href: '/forms/privacy-consent/' },
    { label: '회의록 양식', href: '/forms/meeting-minutes/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
