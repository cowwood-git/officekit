import { formatDateDot } from '@/lib/doc/format';
import type { FormField, FormTemplate, LabelSlot } from '@/lib/doc/types';

const fields: FormField[] = [
  {
    id: 'eventTitle',
    label: '행사명',
    type: 'text',
    group: '행사 정보',
    placeholder: '예: 2026 옷깃 고객 감사행사',
    required: true,
    maxLength: 100,
    span: 2,
  },
  {
    id: 'host',
    label: '주최',
    type: 'text',
    group: '행사 정보',
    placeholder: '옷깃 주식회사',
    maxLength: 60,
  },
  {
    id: 'eventDate',
    label: '날짜',
    type: 'date',
    group: '행사 정보',
    required: true,
  },
  {
    id: 'eventTime',
    label: '시간',
    type: 'text',
    group: '행사 정보',
    placeholder: '예: 오후 6시 30분',
    maxLength: 40,
  },
  {
    id: 'place',
    label: '장소',
    type: 'text',
    group: '행사 정보',
    placeholder: '예: 서울 강남구 그랜드홀',
    maxLength: 100,
    span: 2,
  },
  {
    id: 'message',
    label: '초대 문구',
    type: 'textarea',
    group: '초대 문구',
    placeholder: '초대의 마음을 담은 문구를 적습니다.',
    required: true,
    maxLength: 400,
    rows: 3,
    span: 3,
  },
  {
    id: 'rsvp',
    label: '회신',
    type: 'text',
    group: '초대 문구',
    placeholder: '예: 12월 10일까지 02-123-4567로 회신',
    maxLength: 120,
    span: 2,
  },
  {
    id: 'contact',
    label: '문의',
    type: 'text',
    group: '초대 문구',
    placeholder: '담당자·연락처',
    maxLength: 80,
  },
];

export const invitation: FormTemplate = {
  slug: 'invitation',
  title: '초대장',
  family: 'label',
  category: 'print',
  description:
    '행사명·일시·장소·초대 문구를 A4 2쪽 초대장으로 인쇄하는 양식입니다. 브라우저에서 만들고 PDF·HWPX로 저장합니다.',
  keywords: [
    '초대장 양식',
    '초대장 만들기',
    '행사 초대장',
    '고객 초대장',
    '초대장 인쇄',
    '초대장 PDF',
  ],
  updated: '2026-11-18',
  docPrefix: 'INV',
  lead: '이중 테두리와 넉넉한 여백을 살린 초대장입니다. A4 한 장에 2쪽을 배치해 반으로 잘라 사용할 수 있습니다.',
  useCases: [
    '고객·거래처 감사행사 초대장을 만들 때',
    '세미나·전시회 초대장이 필요할 때',
    '사내 행사·워크숍 초대장을 인쇄할 때',
    '소규모 모임의 초대 카드를 만들 때',
  ],
  howTo: [
    '행사명과 주최, 날짜·시간·장소를 적습니다.',
    '초대 문구와 회신 방법을 입력합니다.',
    '미리보기에서 2쪽 배치를 확인합니다.',
    'PDF로 내려받아 A4에 인쇄하고 가운데 선을 따라 자릅니다.',
  ],
  notes: [
    'A4 한 장에 초대장 2쪽을 배치합니다. 인쇄 후 가운데 재단선을 따라 자르세요.',
    '행사 장소와 시간은 참석자가 찾기 쉽게 구체적으로 적으세요.',
    '회신 기한과 연락처를 넣으면 참석 인원을 파악하기 쉽습니다.',
    '입력값은 이 브라우저에만 임시 저장됩니다. 공용 PC에서는 사용 후 초기화하세요.',
  ],
  fields,
  showFooter: false,
  blocks: [
    {
      kind: 'labelGrid',
      design: 'invitation',
      columns: 2,
      rows: 1,
      gap: 4,
      padding: 8,
      cutLines: true,
      rowHeight: 120,
      slots: (values): LabelSlot[] => {
        const slot: LabelSlot = {
          eyebrow: 'I N V I T A T I O N',
          title: (values.eventTitle ?? '').trim() || '초대합니다',
          subtitle: (values.host ?? '').trim(),
          lines: [
            [values.eventDate ? formatDateDot(values.eventDate) : '', values.eventTime ?? '']
              .filter(Boolean)
              .join(' '),
            (values.place ?? '').trim(),
            (values.message ?? '').trim(),
            (values.rsvp ?? '').trim(),
            (values.contact ?? '').trim(),
          ].filter(Boolean),
        };
        return [slot, { ...slot }];
      },
    },
  ],
  validate: (values) =>
    (values.message ?? '').trim().length < 10 ? ['초대 문구를 10자 이상 적어 주세요.'] : [],
  sample: {
    eventTitle: '2026 옷깃 고객 감사행사',
    host: '옷깃 주식회사',
    eventDate: '2026-12-18',
    eventTime: '오후 6시 30분',
    place: '서울 강남구 그랜드홀 3층',
    message:
      '한 해 동안 보내 주신 관심과 성원에 감사드립니다.\n작은 자리지만 함께해 주시면 큰 기쁨이 되겠습니다.',
    rsvp: '12월 10일까지 02-123-4567로 회신 부탁드립니다.',
    contact: '담당 김옷깃 · 02-123-4567',
  },
  faq: [
    {
      q: '초대장을 몇 장 인쇄할 수 있나요?',
      a: 'A4 한 장에 2쪽이 들어갑니다. 여러 장 필요하면 인쇄 매수를 늘리세요.',
    },
    {
      q: '초대장 크기를 바꿀 수 있나요?',
      a: '이 양식은 A4 2쪽 기준입니다. 다른 크기가 필요하면 인쇄 배율을 조정하거나 별도 디자인을 사용하세요.',
    },
    {
      q: '회신 기한은 어떻게 적나요?',
      a: '참석 여부를 받을 날짜와 연락처를 함께 적습니다. 행사 준비 일정에서 역산해 여유 있게 정하세요.',
    },
    {
      q: '입력한 내용이 서버로 전송되나요?',
      a: '아니요. 입력과 PDF 생성이 모두 브라우저 안에서 이루어지며 파일은 서버에 저장되지 않습니다. 입력값은 이 브라우저에만 임시 저장됩니다.',
    },
  ],
  sources: [
    {
      label: '행정안전부 — 행사 초대·안내 자료',
      href: 'https://www.mois.go.kr/',
    },
  ],
  related: [
    { label: '티켓 양식', href: '/forms/ticket/' },
    { label: '명찰 양식', href: '/forms/name-badge/' },
    { label: '물류 라벨 양식', href: '/forms/shipping-label/' },
    { label: '양식 전체 보기', href: '/forms/' },
  ],
};
