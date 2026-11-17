import type { FormField, FormTemplate } from '@/lib/doc/types';

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'RVQ-20261117-001',
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
    id: 'title',
    label: '검토 대상',
    type: 'text',
    group: '검토 정보',
    placeholder: '예: 2027년 사업계획서 초안',
    required: true,
    maxLength: 100,
    span: 2,
  },
  {
    id: 'reviewer',
    label: '검토자',
    type: 'text',
    group: '검토 정보',
    placeholder: '예: 이검토 팀장',
    required: true,
    maxLength: 60,
  },
  {
    id: 'dueDate',
    label: '검토 희망일',
    type: 'date',
    group: '검토 정보',
    required: true,
  },
  {
    id: 'docType',
    label: '문서 종류',
    type: 'select',
    group: '검토 정보',
    options: ['기안문', '계약서', '보고서', '계획서', '기타'],
    defaultValue: '보고서',
    required: true,
  },
  {
    id: 'attachment',
    label: '첨부 자료',
    type: 'text',
    group: '검토 정보',
    placeholder: '예: 사업계획서 초안, 예산표',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'requester',
    label: '요청자',
    type: 'text',
    group: '요청자',
    placeholder: '김요청',
    required: true,
    maxLength: 30,
  },
  {
    id: 'department',
    label: '부서',
    type: 'text',
    group: '요청자',
    placeholder: '경영기획팀',
    maxLength: 40,
  },
  {
    id: 'contact',
    label: '연락처',
    type: 'text',
    group: '요청자',
    placeholder: '02-123-4567',
    maxLength: 40,
  },
  {
    id: 'summary',
    label: '문서 요약',
    type: 'textarea',
    group: '문서 요약',
    placeholder: '검토할 문서의 목적과 핵심 내용을 간단히 적습니다.',
    maxLength: 600,
    rows: 2,
    span: 3,
  },
  {
    id: 'reviewPoint',
    label: '검토 요청 사항',
    type: 'textarea',
    group: '검토 요청 사항',
    placeholder: '특히 확인했으면 하는 조항·수치·논리와 의견을 적습니다.',
    required: true,
    maxLength: 800,
    rows: 4,
    span: 3,
  },
  {
    id: 'note',
    label: '참고 사항',
    type: 'textarea',
    group: '참고 사항',
    placeholder: '관련 문서, 이전 검토 의견, 일정 등',
    maxLength: 400,
    rows: 2,
    span: 3,
  },
  {
    id: 'approvalRoles',
    label: '결재선',
    type: 'roles',
    group: '결재선',
    options: ['요청자', '팀장'],
    defaultValue: JSON.stringify([
      { label: '요청자', enabled: true },
      { label: '팀장', enabled: true },
    ]),
    required: true,
    maxSelected: 2,
    editable: true,
    help: '이름을 직접 고칠 수 있습니다.',
    span: 3,
  },
];

export const reviewRequest: FormTemplate = {
  slug: 'review-request',
  title: '검토 요청서',
  family: 'report',
  category: 'report',
  description:
    '보고서·계획서·계약서 초안을 검토받기 위해 문서 요약과 검토 요청 사항을 정리하는 검토 요청서를 브라우저에서 작성하고 A4 PDF로 저장합니다.',
  keywords: [
    '검토 요청서',
    '검토 요청서 양식',
    '문서 검토 요청',
    '보고서 검토 의뢰',
    '계약서 검토 요청',
    '검토 요청서 PDF',
  ],
  updated: '2026-11-17',
  docPrefix: 'RVQ',
  lead: '보고서·계획서·계약서 초안을 검토받을 때 문서 요약과 특히 확인할 부분을 정리하는 요청서입니다. 검토자와 희망일을 명확히 전달합니다.',
  useCases: [
    '보고서·계획서 초안을 상사에게 검토받을 때',
    '계약서·약관을 법무팀에 검토 요청할 때',
    '여러 부서의 의견을 한 번에 모을 때',
    '검토 의견과 수정 이력을 남길 때',
  ],
  howTo: [
    '검토 대상과 검토자, 검토 희망일을 적습니다.',
    '문서 종류와 첨부 자료를 확인합니다.',
    '문서 요약과 검토 요청 사항을 구체적으로 적습니다.',
    'PDF로 내려받아 첨부 문서와 함께 검토자에게 보냅니다.',
  ],
  notes: [
    '검토 희망일은 검토 분량과 상대 일정을 고려해 정하세요.',
    '“전체적으로 봐 주세요”보다 확인할 조항·수치·논리를 구체적으로 적으면 좋은 의견을 받을 수 있습니다.',
    '검토 의견을 반영한 뒤에는 변경 내용과 사유를 함께 남기세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '검토 요청서',
      docNoField: 'docNo',
      dateField: 'date',
      docNoLabel: '요청번호',
      dateLabel: '요청일',
    },
    { kind: 'section', title: '검토 정보' },
    { kind: 'kv', columns: 1, rows: [{ label: '검토 대상', field: 'title' }] },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '검토자', field: 'reviewer' },
        { label: '검토 희망일', field: 'dueDate' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '문서 종류', field: 'docType' },
        { label: '첨부 자료', field: 'attachment' },
      ],
    },
    { kind: 'section', title: '요청자' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '성명', field: 'requester' },
        { label: '부서', field: 'department' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '연락처', field: 'contact' }] },
    { kind: 'section', title: '문서 요약' },
    { kind: 'text', field: 'summary', minLines: 2 },
    { kind: 'section', title: '검토 요청 사항' },
    { kind: 'text', field: 'reviewPoint', minLines: 4 },
    { kind: 'section', title: '참고 사항' },
    { kind: 'text', field: 'note', minLines: 2 },
    {
      kind: 'signature',
      roles: ['요청자', '팀장'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  validate: (values) => {
    const errors: string[] = [];
    if (values.date && values.dueDate && values.dueDate < values.date) {
      errors.push('검토 희망일은 요청일보다 빠를 수 없습니다.');
    }
    if ((values.reviewPoint ?? '').trim().length < 10) {
      errors.push('검토 요청 사항을 10자 이상 적어 주세요.');
    }
    return errors;
  },
  sample: {
    docNo: 'RVQ-20261117-001',
    date: '2026-11-17',
    title: '2027년 사업계획서 초안',
    reviewer: '이검토 팀장',
    dueDate: '2026-11-24',
    docType: '계획서',
    attachment: '2027년 사업계획서 초안, 부서별 예산표',
    requester: '김요청',
    department: '경영기획팀',
    contact: '02-123-4567',
    summary:
      '2027년 매출 목표와 신규 서비스 계획, 부서별 인력·예산 계획을 정리한 초안입니다. 전년 대비 성장률과 투자 우선순위를 중심으로 검토가 필요합니다.',
    reviewPoint:
      '1) 신규 서비스 매출 추정 근거가 타당한지 2) 부서별 인력 계획이 채용 일정과 맞는지 3) 예산 총액이 재무 계획 범위를 넘지 않는지 확인해 주세요. 특히 3분기 투자 집행 순서에 대한 의견을 주시면 좋겠습니다.',
    note: '지난달 경영회의에서 나온 성장률 가정과 예산 상한을 참고해 주세요. 관련 회의록을 함께 첨부했습니다.',
  },
  faq: [
    {
      q: '검토 요청서와 기안문은 무엇이 다른가요?',
      a: '기안문은 업무를 추진하기 위한 공식 결재 문서이고, 검토 요청서는 초안에 대한 의견을 받기 위한 요청 문서입니다.',
    },
    {
      q: '검토 요청 사항은 어떻게 적나요?',
      a: '확인할 조항, 수치, 논리와 원하는 의견의 범위를 구체적으로 적으세요. 우선순위를 함께 적으면 검토자가 집중할 부분을 알 수 있습니다.',
    },
    {
      q: '검토 의견은 어떻게 반영하나요?',
      a: '의견별로 반영 여부와 사유를 정리하고, 수정된 문서에는 변경 이력을 남기세요. 반영하지 않은 의견은 이유를 설명하는 것이 좋습니다.',
    },
    {
      q: '여러 명에게 동시에 검토를 요청할 수 있나요?',
      a: '가능하지만 검토 범위가 겹치면 의견이 충돌할 수 있습니다. 담당별로 확인할 부분을 나누어 요청하는 것이 효율적입니다.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '행정안전부 — 공문·검토 절차 안내',
      href: 'https://www.mois.go.kr/',
    },
  ],
  related: [
    { label: '업무 협조 요청서 양식', href: '/forms/collaboration-request/' },
    { label: '자료 요청서 양식', href: '/forms/data-request/' },
    { label: '기안서 양식', href: '/forms/draft/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
