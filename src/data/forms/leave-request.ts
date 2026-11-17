import { countDaysInclusive, formatDateDot } from '@/lib/doc/format';
import type { FormTemplate } from '@/lib/doc/types';

export const leaveRequest: FormTemplate = {
  slug: 'leave-request',
  title: '휴가신청서',
  family: 'hr',
  category: 'people',
  description:
    '연차·반차·병가를 신청할 때 쓰는 휴가신청서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 입력한 내용은 서버로 전송되지 않습니다.',
  keywords: [
    '휴가신청서 양식',
    '휴가신청서 PDF',
    '연차신청서',
    '반차신청서',
    '휴가 신청서',
    '휴가계',
  ],
  updated: '2026-11-14',
  docPrefix: 'LV',
  lead: '연차·반차·병가를 신청할 때 쓰는 휴가신청서입니다. 왼쪽에 입력하면 오른쪽 A4 미리보기가 바로 바뀌고, 작성본과 빈 양식 모두 PDF로 내려받을 수 있습니다.',
  useCases: [
    '연차·반차를 미리 신청해 결재를 받을 때',
    '병가나 경조휴가를 사내 규정에 맞춰 남길 때',
    '휴가 기간과 업무 인수인계를 한 장으로 정리할 때',
    '인쇄해서 손으로 작성한 뒤 결재를 올릴 때',
  ],
  howTo: [
    '문서 번호와 작성일을 확인합니다. 문서 번호는 날짜를 바꾸면 다시 만들어집니다.',
    '신청자 정보와 휴가 종류, 시작일·종료일을 입력합니다. 사용 일수는 자동으로 계산됩니다.',
    '사유와 업무 인수인계를 적고, 오른쪽 미리보기에서 배치를 확인합니다.',
    'PDF 만들기를 누르면 A4 PDF가 내려받아집니다. 인쇄만 필요하면 빈 양식으로 전환하세요.',
  ],
  notes: [
    '이 양식은 참고용입니다. 휴가 종류·기한·결재선은 회사의 취업규칙과 근무 규정을 우선하세요.',
    '반차처럼 하루의 일부만 쓰는 경우에는 기간을 같은 날로 두고 사유에 “오전 반차”처럼 적어 주세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
    '직인·서명이 필요한 문서는 회사 규정에 따라 출력 후 날인하거나 PDF 서명 도구를 함께 사용하세요.',
  ],
  fields: [
    {
      id: 'docNo',
      label: '문서 번호',
      type: 'text',
      group: '기본 정보',
      placeholder: 'L-20261114-001',
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
      id: 'kind',
      label: '휴가 종류',
      type: 'select',
      group: '휴가 정보',
      options: ['연차', '반차', '병가', '경조휴가', '공가', '기타'],
      required: true,
    },
    {
      id: 'from',
      label: '시작일',
      type: 'date',
      group: '휴가 정보',
      required: true,
    },
    {
      id: 'to',
      label: '종료일',
      type: 'date',
      group: '휴가 정보',
      required: true,
    },
    {
      id: 'period',
      label: '기간',
      type: 'computed',
      group: '휴가 정보',
      help: '시작일과 종료일로 자동 계산합니다.',
      span: 2,
    },
    {
      id: 'days',
      label: '사용 일수',
      type: 'computed',
      group: '휴가 정보',
      help: '두 날짜를 모두 포함해 셉니다.',
    },
    {
      id: 'reason',
      label: '사유',
      type: 'textarea',
      group: '내용',
      placeholder: '예: 개인 사정으로 연차를 사용합니다.',
      required: true,
      maxLength: 500,
      rows: 4,
      span: 3,
    },
    {
      id: 'handover',
      label: '업무 인수인계',
      type: 'textarea',
      group: '내용',
      placeholder: '담당 업무와 인수인계 대상',
      maxLength: 300,
      rows: 2,
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
      title: '휴가신청서',
      docNoField: 'docNo',
      dateField: 'date',
      logo: true,
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
    { kind: 'section', title: '휴가 정보' },
    {
      kind: 'kv',
      columns: 3,
      rows: [
        { label: '종류', field: 'kind' },
        { label: '시작일', field: 'from' },
        { label: '종료일', field: 'to' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '기간', field: 'period' },
        { label: '사용 일수', field: 'days' },
      ],
    },
    { kind: 'section', title: '사유' },
    { kind: 'text', field: 'reason', minLines: 5 },
    { kind: 'section', title: '업무 인수인계' },
    { kind: 'text', field: 'handover', minLines: 2 },
    {
      kind: 'signature',
      roles: ['신청인', '부서장', '대표'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  compute: (values) => {
    const from = values.from ?? '';
    const to = values.to ?? '';
    const days = countDaysInclusive(from, to);
    return {
      period: from && to ? `${formatDateDot(from)} ~ ${formatDateDot(to)}` : '',
      days: days > 0 ? `${days}일` : '',
    };
  },
  validate: (values) => {
    const errors: string[] = [];
    if (values.from && values.to && values.from > values.to) {
      errors.push('종료일은 시작일보다 빠를 수 없습니다.');
    }
    return errors;
  },
  sample: {
    docNo: 'L-20261114-001',
    date: '2026-11-14',
    name: '김옷깃',
    department: '경영지원팀',
    position: '대리',
    kind: '연차',
    from: '2026-11-17',
    to: '2026-11-18',
    reason: '개인 사정으로 연차를 사용합니다.',
    handover: '주간 업무 보고는 김담당에게 인수인계했습니다.',
  },
  faq: [
    {
      q: '휴가신청서는 꼭 PDF로 내야 하나요?',
      a: '아니요. 회사 규정에 따라 인쇄해서 손으로 쓰거나 사내 전자결재에 옮겨 적어도 됩니다. 이 도구는 A4 PDF와 빈 양식 인쇄를 모두 제공합니다.',
    },
    {
      q: '반차나 반반차도 만들 수 있나요?',
      a: '휴가 종류에서 반차를 고르고 시작일과 종료일을 같은 날로 두면 됩니다. 오전·오후 구분은 사유에 적어 주세요.',
    },
    {
      q: '사용 일수는 어떻게 계산되나요?',
      a: '시작일과 종료일을 모두 포함해 달력 일수로 계산합니다. 주말·공휴일을 제외한 근무일 기준이 필요하면 회사 규정에 맞춰 직접 수정하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
    {
      q: '법적 효력이 있나요?',
      a: '이 양식은 참고용입니다. 휴가의 종류·기한·결재 절차는 근로기준법과 회사의 취업규칙·근무 규정을 따릅니다.',
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
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '도장·서명 만들기', href: '/tools/seal-maker/' },
    { label: 'PDF 합치기', href: '/tools/pdf-merge/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
