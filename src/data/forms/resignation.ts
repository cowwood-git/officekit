import type { FormTemplate } from '@/lib/doc/types';

export const resignation: FormTemplate = {
  slug: 'resignation',
  title: '사직서',
  family: 'hr',
  category: 'people',
  description:
    '퇴사 의사를 회사에 알리는 사직서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 사직 사유와 업무 인수인계, 결재선을 한 장에 정리합니다.',
  keywords: ['사직서 양식', '사직서 PDF', '사직원', '퇴사 신청서', '퇴직 신청서', '사직서 쓰는 법'],
  updated: '2026-11-20',
  docPrefix: 'RS',
  lead: '퇴사 의사를 정식으로 전달하는 사직서입니다. 사직 사유와 마지막 근무일, 업무 인수인계를 한 장에 정리하고 결재선까지 넣어 바로 제출할 수 있습니다.',
  useCases: [
    '퇴사 의사를 회사에 서면으로 전달할 때',
    '마지막 근무일과 업무 인수인계를 함께 정리할 때',
    '사내 전자결재에 올릴 사직서를 만들 때',
    '인쇄해서 서명한 뒤 인사팀에 제출할 때',
  ],
  howTo: [
    '문서 번호와 작성일을 확인합니다. 문서 번호는 날짜에 맞춰 자동으로 바뀝니다.',
    '사직자 정보와 입사일, 퇴사 예정일을 입력합니다.',
    '사직 사유와 업무 인수인계 내용을 적고 결재선을 고릅니다.',
    'PDF 만들기를 누르면 A4 PDF가 내려받아집니다. 빈 양식으로 전환해 인쇄할 수도 있습니다.',
  ],
  notes: [
    '이 양식은 참고용입니다. 사직 절차와 통보 기간, 마지막 근무일은 회사의 취업규칙과 근로계약을 우선하세요.',
    '퇴사일과 4대보험 상실 신고일은 회사 규정과 인사 담당자와 확인하는 것이 안전합니다.',
    '업무 인수인계는 인수인계서와 함께 정리하면 퇴사 후 혼선을 줄일 수 있습니다.',
  ],
  fields: [
    {
      id: 'docNo',
      label: '문서 번호',
      type: 'text',
      group: '기본 정보',
      placeholder: 'RS-20261116-001',
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
      group: '사직자',
      placeholder: '홍길동',
      required: true,
      maxLength: 30,
    },
    {
      id: 'department',
      label: '부서',
      type: 'text',
      group: '사직자',
      placeholder: '경영지원팀',
      maxLength: 40,
    },
    {
      id: 'position',
      label: '직위',
      type: 'text',
      group: '사직자',
      placeholder: '대리',
      maxLength: 30,
    },
    {
      id: 'joinDate',
      label: '입사일',
      type: 'date',
      group: '재직 정보',
      required: true,
    },
    {
      id: 'lastDate',
      label: '퇴사 예정일',
      type: 'date',
      group: '재직 정보',
      required: true,
      help: '마지막 근무일 또는 퇴사일을 회사 규정에 맞춰 적습니다.',
    },
    {
      id: 'reason',
      label: '사직 사유',
      type: 'select',
      group: '사직 사유',
      options: ['이직', '개인 사정', '건강', '계약 만료', '유학·연수', '기타'],
      required: true,
    },
    {
      id: 'reasonDetail',
      label: '상세 사유',
      type: 'textarea',
      group: '사직 사유',
      placeholder: '예: 더 넓은 업무 기회를 위해 이직을 결정했습니다.',
      required: true,
      maxLength: 500,
      rows: 4,
      span: 3,
    },
    {
      id: 'handover',
      label: '업무 인수인계',
      type: 'textarea',
      group: '인수인계',
      placeholder: '담당 업무, 인수인계 대상, 남은 일정',
      maxLength: 400,
      rows: 3,
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
      title: '사직서',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '사직자' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '성명', field: 'name' },
        { label: '부서', field: 'department' },
        { label: '직위', field: 'position' },
      ],
    },
    { kind: 'section', title: '재직 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '입사일', field: 'joinDate' },
        { label: '퇴사 예정일', field: 'lastDate' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '사직 사유', field: 'reason' }] },
    { kind: 'section', title: '상세 사유' },
    { kind: 'text', field: 'reasonDetail', minLines: 4 },
    { kind: 'section', title: '업무 인수인계' },
    { kind: 'text', field: 'handover', minLines: 3 },
    {
      kind: 'signature',
      roles: ['작성자', '부서장', '대표'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  validate: (values) => {
    const errors: string[] = [];
    if (values.joinDate && values.lastDate && values.lastDate < values.joinDate) {
      errors.push('퇴사 예정일은 입사일보다 빠를 수 없습니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'RS-20261116-001',
    date: '2026-11-16',
    name: '김옷깃',
    department: '경영지원팀',
    position: '대리',
    joinDate: '2022-03-02',
    lastDate: '2026-12-31',
    reason: '이직',
    reasonDetail:
      '더 넓은 업무 기회를 위해 이직을 결정했습니다. 그동안 쌓은 경험에 감사드리며, 남은 기간 업무 인수인계에 최선을 다하겠습니다.',
    handover:
      '진행 중인 계약 2건은 김담당에게 인수인계하고, 정산 업무는 12월 20일까지 마무리하겠습니다.',
  },
  faq: [
    {
      q: '사직서는 언제까지 제출해야 하나요?',
      a: '취업규칙이나 근로계약에 정한 통보 기간(흔히 30일)을 따르는 것이 원칙입니다. 회사가 사직을 받아 주지 않으면, 기간의 정함이 없는 계약은 사직 의사를 알린 날부터 1개월이 지나면 효력이 생기고, 월급처럼 기간으로 보수를 정했다면 알린 달의 다음 한 달이 지나야 합니다(민법 제660조). 회사가 수리하기 전에는 함부로 출근을 멈추지 마세요.',
    },
    {
      q: '퇴사 예정일은 마지막 근무일인가요?',
      a: '회사마다 다릅니다. 마지막 근무일과 4대보험 상실일이 다를 수 있으므로, 인사 담당자와 확인해 같은 날짜로 맞추는 것이 좋습니다.',
    },
    {
      q: '업무 인수인계는 꼭 적어야 하나요?',
      a: '필수는 아니지만, 남은 업무와 담당자를 적어 두면 퇴사 후 혼선을 줄일 수 있습니다. 인수인계서 양식과 함께 쓰면 더 좋습니다.',
    },
    {
      q: 'PDF로 제출해도 되나요?',
      a: '회사의 전자결재 규정에 따라 다릅니다. PDF 제출을 받는 회사라면 서명란을 채워 PDF로 제출하고, 원본 서명이 필요하면 인쇄해 서명한 뒤 제출하세요.',
    },
  ],
  sources: [
    {
      label: '국가법령정보센터 — 근로기준법',
      href: 'https://www.law.go.kr/법령/근로기준법',
    },
    {
      label: '고용노동부 — 근로기준 안내',
      href: 'https://www.moel.go.kr/',
    },
  ],
  related: [
    { label: '인수인계서 양식', href: '/forms/handover/' },
    { label: '재직증명서 양식', href: '/forms/employment-certificate/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
