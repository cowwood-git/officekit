import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';
import { hiringTopicWarnings } from '@/lib/hiring-limits';

const items: RepeatGroup = {
  id: 'items',
  label: '확인 항목',
  help: '이전 근무처에서 확인할 항목과 질문, 평가를 적습니다.',
  minRows: 3,
  maxRows: 12,
  addLabel: '+ 항목 추가',
  required: true,
  group: '확인 대상자',
  columns: [
    {
      id: 'item',
      label: '확인 항목',
      type: 'text',
      required: true,
      placeholder: '예: 업무 성과',
      maxLength: 50,
      width: 1.8,
    },
    {
      id: 'question',
      label: '질문',
      type: 'text',
      placeholder: '확인할 질문',
      maxLength: 120,
      width: 3.4,
    },
    {
      id: 'score',
      label: '평가',
      type: 'select',
      options: ['매우 우수', '우수', '보통', '미흡'],
      width: 1.4,
    },
    {
      id: 'note',
      label: '의견',
      type: 'text',
      placeholder: '구체적인 사례·의견',
      maxLength: 100,
      width: 2.6,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '문서 번호',
    type: 'text',
    group: '문서',
    placeholder: 'REF-20261118-001',
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
    id: 'candidate',
    label: '지원자',
    type: 'text',
    group: '지원자 정보',
    placeholder: '김지원',
    required: true,
    maxLength: 30,
  },
  {
    id: 'position',
    label: '지원 직무',
    type: 'text',
    group: '지원자 정보',
    placeholder: '예: 문서 자동화 개발자',
    maxLength: 80,
  },
  {
    id: 'consent',
    label: '지원자 동의',
    type: 'select',
    group: '지원자 정보',
    options: ['동의함', '동의하지 않음'],
    defaultValue: '동의함',
    required: true,
    help: '평판 조회 전에 지원자에게 확인·동의를 받습니다.',
  },
  {
    id: 'referenceName',
    label: '확인 대상자',
    type: 'text',
    group: '확인 대상자',
    placeholder: '이전 회사 담당자',
    required: true,
    maxLength: 30,
  },
  {
    id: 'relationship',
    label: '관계',
    type: 'text',
    group: '확인 대상자',
    placeholder: '예: 전 직장 팀장',
    maxLength: 40,
  },
  {
    id: 'company',
    label: '소속',
    type: 'text',
    group: '확인 대상자',
    placeholder: '예: 페이퍼랩',
    maxLength: 60,
  },
  {
    id: 'contact',
    label: '연락처',
    type: 'text',
    group: '확인 대상자',
    placeholder: '전화 또는 이메일',
    maxLength: 60,
  },
  {
    id: 'overall',
    label: '종합 의견',
    type: 'textarea',
    group: '종합 의견',
    placeholder: '확인한 내용과 채용 판단에 참고할 점을 적습니다.',
    required: true,
    maxLength: 600,
    rows: 3,
    span: 3,
  },
  {
    id: 'recommendation',
    label: '확인 결과',
    type: 'select',
    group: '확인 결과',
    options: ['추천', '보류', '비추천'],
    defaultValue: '추천',
    required: true,
  },
  {
    id: 'approvalRoles',
    label: '서명',
    type: 'roles',
    group: '서명',
    options: ['확인자'],
    defaultValue: JSON.stringify([{ label: '확인자', enabled: true }]),
    required: true,
    maxSelected: 1,
    editable: true,
    help: '확인자 이름을 적습니다.',
    span: 3,
  },
];

const itemsOf = (rows: FormRows): FormRows['items'] =>
  (rows.items ?? []).filter((row) => (row.item ?? '').trim());

export const referenceCheck: FormTemplate = {
  slug: 'reference-check',
  title: '레퍼런스 체크',
  family: 'hr',
  category: 'people',
  description:
    '지원자의 이전 근무처에 업무 성과·협업·태도를 같은 질문으로 확인하는 레퍼런스 체크 시트를 A4 PDF로 만듭니다. 지원자 동의를 받은 뒤 진행하세요.',
  keywords: [
    '레퍼런스 체크',
    '레퍼런스 체크 양식',
    '평판 조회',
    '채용 레퍼런스',
    '경력 확인서',
    '레퍼런스 체크 PDF',
  ],
  updated: '2026-11-20',
  docPrefix: 'REF',
  lead: '지원자의 이전 근무처에 업무 성과와 협업 태도를 확인하는 레퍼런스 체크 시트입니다. 지원자 동의와 확인 결과를 함께 남깁니다.',
  useCases: [
    '최종 합격 전에 경력을 확인할 때',
    '여러 지원자의 평판을 같은 기준으로 확인할 때',
    '채용 결정의 근거를 문서로 남길 때',
    '확인 내용과 추천 의견을 정리할 때',
  ],
  howTo: [
    '지원자와 지원 직무, 동의 여부를 확인합니다.',
    '확인 대상자의 관계·소속·연락처를 적습니다.',
    '확인 항목별 질문과 평가, 의견을 입력합니다.',
    '종합 의견과 확인 결과를 적고 PDF로 저장합니다.',
  ],
  notes: [
    '레퍼런스 체크 전에 지원자에게 목적·확인 대상·확인 항목을 알리고 서면 동의를 받으세요. 지원자 외의 사람에게서 개인정보를 모으는 것이므로 동의 없이 진행하지 않습니다(개인정보 보호법 제15조·제20조).',
    '현 직장 연락은 지원자가 따로 허락한 경우에만 합니다. 참고인에게도 지원자의 용모·키·체중, 출신 지역, 혼인 여부, 재산, 가족의 학력·직업·재산을 묻지 마세요(채용절차법 제4조의3).',
    '확인 내용은 채용 판단 목적으로만 사용하고, 개인정보 보호 기준에 따라 보관·파기하세요.',
    '이전 회사에서 확인이 어려운 경우 지원자가 제공한 다른 참고인을 활용할 수 있습니다.',
  ],
  fields,
  groups: [items],
  blocks: [
    {
      kind: 'header',
      variant: 'editorial',
      title: '레퍼런스 체크',
      docNoField: 'docNo',
      dateField: 'date',
    },
    { kind: 'section', title: '지원자 정보' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '지원자', field: 'candidate' },
        { label: '지원 직무', field: 'position' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '지원자 동의', field: 'consent' }] },
    { kind: 'section', title: '확인 대상자' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '확인 대상자', field: 'referenceName' },
        { label: '관계', field: 'relationship' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '소속', field: 'company' },
        { label: '연락처', field: 'contact' },
      ],
    },
    { kind: 'section', title: '확인 항목' },
    {
      kind: 'table',
      columns: [
        { label: 'No', width: 10, align: 'center' },
        { label: '확인 항목', width: 34 },
        { label: '질문', width: 80 },
        { label: '평가', width: 24, align: 'center' },
        { label: '의견', width: 30 },
      ],
      rows: (_values, rows) =>
        itemsOf(rows).map((row, index) => [
          String(index + 1),
          (row.item ?? '').trim(),
          (row.question ?? '').trim(),
          (row.score ?? '').trim(),
          (row.note ?? '').trim(),
        ]),
      minRows: 3,
    },
    { kind: 'section', title: '종합 의견' },
    { kind: 'text', field: 'overall', minLines: 3 },
    { kind: 'section', title: '확인 결과' },
    { kind: 'kv', columns: 1, rows: [{ label: '확인 결과', field: 'recommendation' }] },
    {
      kind: 'signature',
      roles: ['확인자'],
      rolesField: 'approvalRoles',
      bottom: true,
    },
  ],
  validate: (values, rows) => {
    const errors: string[] = [];
    if (values.consent === '동의하지 않음') {
      errors.push('지원자 동의 없이 레퍼런스 체크를 진행할 수 없습니다.');
    }
    if (itemsOf(rows).length === 0) errors.push('확인 항목을 한 줄 이상 입력하세요.');
    return errors;
  },
  warn: (values, rows) =>
    hiringTopicWarnings(
      [
        ...itemsOf(rows).flatMap((row) => [row.item ?? '', row.question ?? '', row.note ?? '']),
        values.overall ?? '',
      ],
      '확인 내용',
    ),
  sample: {
    docNo: 'REF-20261118-001',
    date: '2026-11-18',
    candidate: '김지원',
    position: '문서 자동화 개발자',
    consent: '동의함',
    referenceName: '이전 팀장',
    relationship: '전 직장 팀장',
    company: '페이퍼랩',
    contact: '02-987-6543',
    overall:
      '문서 엔진 개발 경험이 구체적이고, 어려운 문제를 끝까지 확인하는 태도가 좋았습니다. 팀 협업과 일정 준수에 대한 평가도 안정적입니다. 다만 대규모 트래픽 경험은 확인되지 않았습니다.',
    recommendation: '추천',
  },
  sampleRows: {
    items: [
      {
        item: '업무 성과',
        question: '가장 눈에 띄는 성과는?',
        score: '우수',
        note: '로딩 40% 단축',
      },
      {
        item: '협업',
        question: '협업 태도는 어땠나요?',
        score: '매우 우수',
        note: '대안으로 조율',
      },
      {
        item: '일정 준수',
        question: '촉박한 일정에 어떻게 대응했나요?',
        score: '우수',
        note: '일정 내 납품',
      },
    ],
  },
  faq: [
    {
      q: '레퍼런스 체크는 꼭 해야 하나요?',
      a: '회사 규정과 채용 절차에 따라 다릅니다. 최종 합격 전 경력·성과를 확인하면 채용 리스크를 줄일 수 있습니다.',
    },
    {
      q: '지원자 동의가 필요한가요?',
      a: '네. 지원자가 아닌 사람에게서 지원자의 정보를 모으므로 확인 목적·대상·항목·보관 기간을 알리고 동의를 받아야 합니다. 이 양식은 지원자 동의가 “동의하지 않음”이면 PDF를 만들지 않습니다. 참고인 쪽 회사도 퇴직자 정보를 알려 줄 때 본인 동의가 필요하므로 동의서 사본을 함께 보내면 좋습니다.',
    },
    {
      q: '어떤 질문을 하면 좋나요?',
      a: '업무 성과, 협업 태도, 일정 준수, 강점과 개선점을 구체적인 사례와 함께 확인하세요. 예/아니오보다 상황을 설명해 달라고 요청합니다.',
    },
    {
      q: '확인 결과가 부정적이면 어떻게 하나요?',
      a: '한 사람의 의견만으로 판단하지 말고 다른 참고인이나 면접 기록과 함께 검토하세요. 사실과 의견을 구분해 기록합니다.',
    },
  ],
  sources: [
    {
      label:
        '국가법령정보센터 — 채용절차의 공정화에 관한 법률 제4조의3(출신지역 등 개인정보 요구 금지)',
      href: 'https://www.law.go.kr/법령/채용절차의공정화에관한법률',
    },
    {
      label: '개인정보보호위원회 — 개인정보 처리 안내',
      href: 'https://www.pipc.go.kr/',
    },
    {
      label: '고용노동부 — 채용절차의 공정화에 관한 법률 안내',
      href: 'https://www.moel.go.kr/',
    },
  ],
  related: [
    { label: '면접 평가표 양식', href: '/forms/interview-evaluation/' },
    { label: '면접 질문지 양식', href: '/forms/interview-questions/' },
    { label: '입사지원서 양식', href: '/forms/job-application/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
