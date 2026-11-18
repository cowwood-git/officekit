import type { LabelDesign, LabelSlot } from './types';

/** 빈 양식으로 인쇄할 때 카드에 남겨 두는 안내 문구. */
export function defaultLabelSlot(design: LabelDesign | undefined): LabelSlot {
  if (design === 'badge') {
    return {
      eyebrow: 'NAME BADGE',
      title: '이름',
      subtitle: '소속 · 직위',
      lines: ['회사·기관', '날짜'],
      tag: '참가자',
    };
  }
  if (design === 'invitation') {
    return {
      eyebrow: 'I N V I T A T I O N',
      title: '초대합니다',
      subtitle: '주최',
      lines: ['날짜 · 시간', '장소', '초대 문구를 적습니다.', '회신', '문의'],
    };
  }
  if (design === 'ticket') {
    return {
      eyebrow: 'ADMIT ONE',
      title: '행사명',
      subtitle: '일시',
      lines: ['장소', '이름', '안내'],
      tag: '000',
      note: '좌석',
    };
  }
  return {
    title: '받는 곳',
    lines: ['주소', '연락처', '주문번호'],
    note: '보내는 곳',
  };
}
