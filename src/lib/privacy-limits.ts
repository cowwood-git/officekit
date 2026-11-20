/**
 * 개인정보 수집 항목에서 별도 동의·법령 근거가 필요한 정보를 찾는다.
 * 개인정보 수집·이용 동의서의 경고에 쓴다. 경고는 PDF 생성을 막지 않는다.
 *
 * - 제24조의2: 주민등록번호는 법령 근거가 있을 때만 처리할 수 있고, 동의로는 수집할 수 없다.
 * - 제23조: 민감정보는 다른 개인정보와 구분해 별도로 동의를 받아야 한다.
 * - 제24조: 여권·운전면허·외국인등록번호 같은 고유식별정보도 별도 동의(또는 법령 근거)가 필요하다.
 * - 제22조의2: 만 14세 미만 아동은 법정대리인의 동의를 받아야 한다.
 */
import { ageAt } from '@/lib/labor-limits';

const RRN = /주민\s?(등록)?\s?번호/;
const SENSITIVE =
  /건강|병력|질병|진단|장애|종교|신념|정치|정당|노조|노동조합|성생활|성적\s?지향|유전|범죄|전과|생체|지문|홍채|안면\s?인식|얼굴\s?인식|인종|민족/;
const UNIQUE_ID = /여권\s?번호|운전\s?면허\s?번호|외국인\s?등록\s?번호/;

export function privacyItemWarnings(items: string | undefined): string[] {
  const text = items ?? '';
  const warnings: string[] = [];
  if (RRN.test(text)) {
    warnings.push(
      '주민등록번호는 법령에 근거가 있을 때만 처리할 수 있고, 동의를 받아도 수집할 수 없습니다(개인정보 보호법 제24조의2). 본인 확인이 목적이면 생년월일로 바꾸세요.',
    );
  }
  if (SENSITIVE.test(text)) {
    warnings.push(
      '건강·종교·정치·노조·범죄경력·생체정보 같은 민감정보는 다른 항목과 구분해 별도로 동의를 받아야 합니다(개인정보 보호법 제23조).',
    );
  }
  if (UNIQUE_ID.test(text)) {
    warnings.push(
      '여권·운전면허·외국인등록번호는 고유식별정보라 별도 동의나 법령 근거가 있어야 처리할 수 있습니다(개인정보 보호법 제24조).',
    );
  }
  return warnings;
}

export function childConsentWarning(birth: string | undefined, on: string | undefined): string[] {
  const age = ageAt(birth, on);
  if (age === null || age >= 14) return [];
  return [
    `동의일에 만 ${age}세입니다. 만 14세 미만 아동의 개인정보는 법정대리인의 동의를 받아야 합니다(개인정보 보호법 제22조의2). 서명란에 법정대리인 성명·관계를 함께 받으세요.`,
  ];
}
