import { formatDateDot } from '@/lib/doc/format';
import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const claims: RepeatGroup = {
  id: 'claims',
  label: '클레임 내역',
  help: '접수일·고객사·채널·내용·담당·상태를 적습니다. 총 건수와 처리 중 건수가 자동으로 계산됩니다.',
  minRows: 3,
  maxRows: 40,
  addLabel: '+ 클레임 추가',
  required: true,
  group: '접수 정보',
  summaryField: 'totalLabel',
  summaryLabel: '총 접수',
  columns: [
    {
      id: 'receivedAt',
      label: '접수일',
      type: 'date',
      required: true,
      width: 1.1,
    },
    {
      id: 'company',
      label: '고객사',
      type: 'text',
      required: true,
      placeholder: '예: 거래처 주식회사',
      maxLength: 50,
      width: 1.8,
    },
    {
      id: 'channel',
      label: '채널',
      type: 'select',
      options: ['전화', '이메일', '방문', '기타'],
      width: 1,
    },
    {
      id: 'content',
      label: '내용',
      type: 'text',
      required: true,
      placeholder: '클레임 요약',
      maxLength: 80,
      width: 3,
    },
    {
      id: 'owner',
      label: '담당',
      type: 'text',
      placeholder: '담당자',
      maxLength: 30,
      width: 1.2,
    },
    {
      id: 'status',
      label: '상태',
      type: 'select',
      options: ['접수', '처리 중', '완료', '보류'],
      width: 1.2,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'CL-20261117-001',
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
    id: 'department',
    label: '접수 부서',
    type: 'text',
    group: '접수 정보',
    required: true,
    placeholder: '고객지원팀',
    maxLength: 40,
  },
  {
    id: 'manager',
    label: '접수자',
    type: 'text',
    group: '접수 정보',
    required: true,
    placeholder: '김상담',
    maxLength: 30,
  },
  {
    id: 'totalLabel',
    label: '총 접수 건수',
    type: 'computed',
    group: '접수 정보',
    help: '입력한 클레임 줄 수입니다.',
  },
  {
    id: 'openLabel',
    label: '처리 중',
    type: 'computed',
    group: '접수 정보',
    help: '완료되지 않은 클레임 수입니다.',
  },
  {
    id: 'note',
    label: '비고',
    type: 'textarea',
    group: '비고',
    placeholder: '대응 원칙, 에스컬레이션 기준, 재발 방지 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['접수자', '팀장', '부서장', '본부장', '대표'],
    defaultValue: JSON.stringify([
      { label: '접수자', enabled: true },
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

const claimsOf = (rows: FormRows): FormRows['claims'] =>
  (rows.claims ?? []).filter((row) => (row.company ?? '').trim());

export const claimLog: FormTemplate = {
  slug: 'claim-log',
  title: '클레임 접수대장',
  family: 'sales',
  category: 'report',
  description:
    '고객 클레임을 접수일·고객사·채널·내용·담당·상태로 기록하는 접수대장을 브라우저에서 작성하고 A4 PDF로 저장합니다. 처리 중 건수가 자동 계산됩니다.',
  keywords: [
    '클레임 접수대장',
    '클레임 접수대장 양식',
    '고객 클레임 기록',
    '불만 접수대장',
    '클레임 관리대장',
    '클레임 접수대장 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'CL',
  lead: '고객 클레임을 한눈에 관리하는 대장입니다. 접수 경로와 담당자, 처리 상태를 기록하고 미완료 건수를 자동으로 계산합니다.',
  useCases: [
    '고객 불만·클레임을 접수하고 담당자를 지정할 때',
    '처리 상태를 매일·매주 점검할 때',
    '반복되는 클레임의 원인을 분석할 때',
    '팀장·경영진에게 처리 현황을 보고할 때',
  ],
  howTo: [
    '문서 번호와 작성일, 접수 부서를 확인합니다.',
    '접수일·고객사·채널·내용·담당·상태를 한 줄씩 입력합니다.',
    '총 접수 건수와 처리 중 건수를 확인합니다.',
    '비고에 대응 원칙을 적고 PDF로 내려받습니다.',
  ],
  notes: [
    '고객 개인정보는 접수·처리에 필요한 범위에서만 적고 외부 공유에 주의하세요.',
    '클레임 내용은 사실과 다를 수 있으므로 확인된 내용과 고객 주장을 구분해 기록하세요.',
    '처리 기한과 담당자를 정해 두면 대응 지연을 줄일 수 있습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [claims],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '클레임 접수대장',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '접수 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '접수 부서', field: 'department' },
        { label: '접수자', field: 'manager' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '총 접수 건수', field: 'totalLabel' },
        { label: '처리 중', field: 'openLabel' },
      ],
    },
    { kind: 'section', title: '클레임 내역' },
    {
      kind: 'table',
      columns: [
        { label: '접수일', width: 28 },
        { label: '고객사', width: 28 },
        { label: '채널', width: 14, align: 'center' },
        { label: '내용', width: 62 },
        { label: '담당', width: 20 },
        { label: '상태', width: 22, align: 'center' },
      ],
      rows: (_values, rows) =>
        claimsOf(rows).map((row) => [
          row.receivedAt ? formatDateDot(row.receivedAt) : '',
          (row.company ?? '').trim(),
          (row.channel ?? '').trim(),
          (row.content ?? '').trim(),
          (row.owner ?? '').trim(),
          (row.status ?? '').trim(),
        ]),
      minRows: 3,
    },
    { kind: 'section', title: '비고' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['접수자', '팀장', '부서장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (_values, rows) => {
    const list = claimsOf(rows);
    const open = list.filter((row) => row.status !== '완료').length;
    return {
      totalLabel: list.length > 0 ? `${list.length}건` : '',
      openLabel: list.length > 0 ? `${open}건` : '',
    };
  },
  validate: (_values, rows) =>
    claimsOf(rows).length === 0 ? ['클레임 내역을 한 줄 이상 입력하세요.'] : [],
  sample: {
    docNo: 'CL-20261117-001',
    date: '2026-11-17',
    department: '고객지원팀',
    manager: '김상담',
    note: '접수 후 24시간 안에 1차 회신, 3일 안에 처리 결과를 안내합니다. 반복 클레임은 원인 분석 후 재발 방지 대책을 세웁니다.',
  },
  sampleRows: {
    claims: [
      {
        receivedAt: '2026-11-10',
        company: '거래처 주식회사',
        channel: '전화',
        content: '납품 수량이 주문보다 1박스 부족',
        owner: '박표',
        status: '처리 중',
      },
      {
        receivedAt: '2026-11-12',
        company: '한빛오피스',
        channel: '이메일',
        content: '토너 호환 모델 문의 및 교환 요청',
        owner: '이데이터',
        status: '완료',
      },
      {
        receivedAt: '2026-11-15',
        company: '새길문구',
        channel: '방문',
        content: '견적서 금액과 세금계산서 금액 불일치',
        owner: '김옷깃',
        status: '접수',
      },
      {
        receivedAt: '2026-11-17',
        company: '거래처 주식회사',
        channel: '전화',
        content: '배송 일정 변경 요청',
        owner: '박표',
        status: '보류',
      },
    ],
  },
  faq: [
    {
      q: '클레임 접수대장은 언제 쓰나요?',
      a: '고객 불만·교환·환불·납품 문제를 접수할 때 담당자와 처리 상태를 함께 기록합니다. 팀 단위로 공유하면 대응 누락을 줄일 수 있습니다.',
    },
    {
      q: '처리 중 건수는 어떻게 계산되나요?',
      a: '상태가 “완료”가 아닌 항목(접수·처리 중·보류)을 셉니다. 완료로 바꾸면 자동으로 줄어듭니다.',
    },
    {
      q: '고객사 이름을 꼭 적어야 하나요?',
      a: '네. 같은 내용이라도 고객사별로 원인과 대응이 달라질 수 있어 고객사를 기준으로 기록하는 것이 좋습니다.',
    },
    {
      q: '개인정보가 포함되면 어떻게 하나요?',
      a: '필요한 범위에서만 적고, 문서 공유 범위를 제한하세요. 보관 기간이 지나면 파기하는 절차를 정해 두는 것이 좋습니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '공정거래위원회 — 소비자 분쟁 해결 기준',
      href: 'https://www.ftc.go.kr/',
    },
    {
      label: '한국소비자원 — 소비자24',
      href: 'https://www.consumer.go.kr/',
    },
  ],
  related: [
    { label: '반품·교환 요청서 양식', href: '/forms/return-request/' },
    { label: '거래처 방문보고서 양식', href: '/forms/visit-report/' },
    { label: '납품 지연 통보서 양식', href: '/forms/delay-notice/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
