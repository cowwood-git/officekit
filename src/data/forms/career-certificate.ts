import { formatBizNo, formatDateDot, isValidBizNo } from '@/lib/doc/format';
import type { FormField, FormRows, FormTemplate, RepeatGroup } from '@/lib/doc/types';

const careers: RepeatGroup = {
  id: 'careers',
  label: '경력 사항',
  group: '인적 사항',
  help: '발급 회사에서의 부서·직위·담당업무를 기간 순서대로 적습니다. 빈 줄은 문서에 나오지 않습니다.',
  minRows: 2,
  maxRows: 10,
  addLabel: '+ 경력 추가',
  required: true,
  columns: [
    { id: 'start', label: '시작일', type: 'date', width: 1.3 },
    { id: 'end', label: '종료일', type: 'date', width: 1.3 },
    {
      id: 'department',
      label: '부서',
      type: 'text',
      placeholder: '경영지원팀',
      maxLength: 40,
      width: 2,
    },
    {
      id: 'position',
      label: '직위',
      type: 'text',
      placeholder: '대리',
      maxLength: 30,
      width: 1.3,
    },
    {
      id: 'duty',
      label: '담당업무',
      type: 'text',
      placeholder: '비용 정산, 문서 관리',
      maxLength: 80,
      width: 3,
    },
  ],
};

const fields: FormField[] = [
  {
    id: 'docNo',
    label: '발급번호',
    type: 'text',
    group: '발급 정보',
    placeholder: 'CR-20261116-001',
    help: '발급일을 바꾸면 날짜에 맞춰 자동으로 바뀝니다.',
  },
  {
    id: 'date',
    label: '발급일',
    type: 'date',
    group: '발급 정보',
    defaultToday: true,
    required: true,
  },
  {
    id: 'name',
    label: '성명',
    type: 'text',
    group: '인적 사항',
    placeholder: '홍길동',
    required: true,
    maxLength: 30,
  },
  {
    id: 'birth',
    label: '생년월일',
    type: 'date',
    group: '인적 사항',
    help: '주민등록번호 전체 대신 생년월일만 적습니다.',
  },
  {
    id: 'purpose',
    label: '용도',
    type: 'text',
    group: '발급 정보',
    placeholder: '예: 새 직장 제출용',
    required: true,
    maxLength: 80,
    help: '용도 외 사용을 막기 위해 제출처와 용도를 구체적으로 적습니다.',
    span: 2,
  },
  {
    id: 'issuerCompany',
    label: '상호',
    type: 'text',
    group: '발급 회사',
    placeholder: '옷깃 주식회사',
    required: true,
    maxLength: 60,
  },
  {
    id: 'issuerBiz',
    label: '사업자등록번호',
    type: 'text',
    group: '발급 회사',
    placeholder: '123-45-67891',
    maxLength: 20,
  },
  {
    id: 'issuerBizLabel',
    label: '사업자등록번호 표시',
    type: 'computed',
    group: '발급 회사',
    help: '입력한 번호를 000-00-00000 형식으로 표시합니다.',
  },
  {
    id: 'issuerCeo',
    label: '대표자',
    type: 'text',
    group: '발급 회사',
    placeholder: '박대표',
    required: true,
    maxLength: 30,
  },
  {
    id: 'issuerAddress',
    label: '회사 주소',
    type: 'text',
    group: '발급 회사',
    placeholder: '예: 서울특별시 마포구 옷깃로 12',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'issuerContact',
    label: '연락처',
    type: 'text',
    group: '발급 회사',
    placeholder: '02-1234-5678',
    maxLength: 40,
  },
];

const careerRows = (rows: FormRows): readonly (readonly string[])[] => {
  const list = (rows.careers ?? []).filter(
    (row) =>
      (row.start ?? '').trim() ||
      (row.end ?? '').trim() ||
      (row.department ?? '').trim() ||
      (row.position ?? '').trim() ||
      (row.duty ?? '').trim(),
  );
  return list.map((row) => [
    [row.start, row.end]
      .filter((value) => (value ?? '').trim())
      .map((value) => formatDateDot(value ?? ''))
      .join(' ~ '),
    (row.department ?? '').trim(),
    (row.position ?? '').trim(),
    (row.duty ?? '').trim(),
  ]);
};

export const careerCertificate: FormTemplate = {
  slug: 'career-certificate',
  title: '경력증명서',
  family: 'proof',
  category: 'proof',
  description:
    '발급 회사에서의 부서·직위·담당업무와 기간을 정리하는 경력증명서를 브라우저에서 작성하고 A4 PDF로 저장합니다. 회사 정보와 직인을 넣어 제출할 수 있습니다.',
  keywords: [
    '경력증명서 양식',
    '경력증명서 PDF',
    '경력 증명서',
    '경력증명서 만들기',
    '재직 경력 증명',
  ],
  updated: '2026-11-16',
  docPrefix: 'CR',
  companyParty: 'issuer',
  lead: '발급 회사에서의 근무 기간과 부서·직위·담당업무를 한 장에 정리하는 경력증명서입니다. 회사 정보와 직인을 넣어 새 직장·기관 제출용으로 사용할 수 있습니다.',
  useCases: [
    '새 직장에 이전 회사의 경력을 증명할 때',
    '자격·면허 신청에 경력 서류를 낼 때',
    '관공서·협회에 근무 이력을 제출할 때',
    '이직 서류에 상세 경력을 정리할 때',
  ],
  howTo: [
    '발급번호와 발급일, 인적 사항을 확인합니다.',
    '경력 사항에 시작일·종료일, 부서, 직위, 담당업무를 한 줄씩 추가합니다.',
    '용도와 발급 회사 정보를 적고 회사 로고·직인을 넣습니다.',
    '미리보기에서 확인한 뒤 PDF로 내려받아 직인을 날인합니다.',
  ],
  notes: [
    '이 증명서는 회사가 발급하는 문서입니다. 회사 직인과 발급 책임자의 확인 없이는 효력이 없을 수 있습니다.',
    '경력 사항은 발급 회사의 기록과 일치해야 합니다. 허위 기재는 법적 책임을 질 수 있습니다.',
    '주민등록번호 전체는 꼭 필요한 경우에만 출력 후 직접 적고, 제출 후 안전하게 파기하세요.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  groups: [careers],
  blocks: [
    {
      kind: 'header',
      title: '경력증명서',
      docNoField: 'docNo',
      dateField: 'date',
      docNoLabel: '발급번호',
      dateLabel: '발급일',
      logo: true,
    },
    { kind: 'section', title: '인적 사항' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '성명', field: 'name' },
        { label: '생년월일', field: 'birth' },
      ],
    },
    { kind: 'section', title: '경력 사항' },
    {
      kind: 'table',
      columns: [
        { label: '기간', width: 44 },
        { label: '부서', width: 30 },
        { label: '직위', width: 22 },
        { label: '담당업무', width: 78 },
      ],
      rows: (_values, rows) => careerRows(rows),
      minRows: 2,
    },
    {
      kind: 'paragraph',
      text: '상기와 같이 경력을 증명합니다.',
      align: 'center',
      size: 12,
      bold: true,
      before: 3,
      after: 3,
    },
    { kind: 'section', title: '발급 회사' },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '상호', field: 'issuerCompany' },
        { label: '사업자등록번호', field: 'issuerBizLabel' },
      ],
    },
    {
      kind: 'kv',
      columns: 2,
      rows: [
        { label: '대표자', field: 'issuerCeo' },
        { label: '연락처', field: 'issuerContact' },
      ],
    },
    { kind: 'kv', columns: 1, rows: [{ label: '주소', field: 'issuerAddress' }] },
    {
      kind: 'notice',
      text: '본 증명서는 경력 확인용으로 발급되었으며, 용도 외 사용을 금합니다.',
    },
    {
      kind: 'signature',
      roles: ['대표이사'],
      bottom: true,
      seal: true,
    },
  ],
  compute: (values) => ({
    issuerBizLabel: values.issuerBiz?.trim() ? formatBizNo(values.issuerBiz) : '',
  }),
  validate: (values, rows) => {
    const errors: string[] = [];
    for (const row of rows.careers ?? []) {
      const start = (row.start ?? '').trim();
      const end = (row.end ?? '').trim();
      if (start && end && start > end) {
        errors.push('경력의 종료일은 시작일보다 빠를 수 없습니다.');
        break;
      }
    }
    if (values.issuerBiz?.trim() && !isValidBizNo(values.issuerBiz)) {
      errors.push('사업자등록번호를 다시 확인하세요.');
    }
    return errors;
  },
  sample: {
    docNo: 'CR-20261116-001',
    date: '2026-11-16',
    name: '김옷깃',
    birth: '1990-05-12',
    purpose: '새 직장 제출용',
    issuerCompany: '옷깃 주식회사',
    issuerBiz: '123-45-67891',
    issuerCeo: '박대표',
    issuerAddress: '서울특별시 마포구 옷깃로 12',
    issuerContact: '02-1234-5678',
  },
  sampleRows: {
    careers: [
      {
        start: '2024-01-01',
        end: '2026-10-31',
        department: '경영지원팀',
        position: '대리',
        duty: '비용 정산, 사무용품 구매, 사내 문서 양식 관리',
      },
      {
        start: '2020-03-02',
        end: '2023-12-31',
        department: '운영팀',
        position: '사원',
        duty: '고객 응대, 계약서 관리',
      },
    ],
  },
  faq: [
    {
      q: '경력증명서와 재직증명서는 무엇이 다른가요?',
      a: '재직증명서는 현재 재직 중임을, 경력증명서는 근무 기간과 부서·직위·담당업무를 정리해 경력을 증명합니다. 제출처가 요구하는 서류를 확인하세요.',
    },
    {
      q: '이 경력증명서에는 어떤 경력을 적나요?',
      a: '이 양식은 발급 회사에서의 경력을 적는 문서입니다. 이전 회사 경력 전체를 한 장에 정리하려면 발급 회사별로 증명서를 따로 받는 것이 일반적입니다.',
    },
    {
      q: '퇴사 후에도 발급받을 수 있나요?',
      a: '회사 규정에 따라 다릅니다. 퇴직자에게 경력증명서를 발급하는 절차가 있으면 인사 담당자에게 문의하세요.',
    },
    {
      q: '주민등록번호를 꼭 써야 하나요?',
      a: '기관에 따라 요구할 수 있지만, 이 양식은 생년월일만 입력하도록 했습니다. 주민등록번호 전체가 필요하면 출력 후 직접 적고, 제출 후 안전하게 파기하세요.',
    },
    {
      q: '회사 직인 없이도 효력이 있나요?',
      a: '효력은 회사 규정과 제출 기관의 요구에 따릅니다. 이 양식은 회사 로고와 직인 이미지를 넣을 수 있지만, 최종 효력은 회사의 발급 절차와 직인 날인으로 완성됩니다.',
    },
  ],
  sources: [
    {
      label: '고용노동부 — 근로기준 안내',
      href: 'https://www.moel.go.kr/',
    },
    {
      label: '개인정보보호위원회 — 개인정보 안전성 확보조치',
      href: 'https://www.pipc.go.kr/',
    },
  ],
  related: [
    { label: '재직증명서 양식', href: '/forms/employment-certificate/' },
    { label: '퇴직증명서 양식', href: '/forms/resignation-certificate/' },
    { label: 'PDF 서명·도장 넣기', href: '/tools/pdf-sign/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
