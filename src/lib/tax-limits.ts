/**
 * 세무 증빙 양식의 공통 경고. 경고는 PDF 생성을 막지 않는다.
 *
 * - 부가가치세법 제32조: 세금계산서 필요적 기재사항(공급자 등록번호·성명, 공급받는자 등록번호,
 *   공급가액·세액, 작성 연월일). 빠지거나 틀리면 가산세(제60조)와 매입세액 불공제 사유가 된다.
 * - 법인세법 제116조·소득세법 제160조의2: 건당 3만 원을 넘는 사업 경비는 세금계산서·계산서·
 *   신용카드 매출전표·현금영수증 같은 적격증빙을 받아야 하며, 아니면 증빙불비가산세 2%가 붙는다.
 */
import { isValidBizNo } from '@/lib/doc/format';

/** 적격증빙 없이 경비로 처리할 수 있는 건당 한도(원). 이 금액을 넘으면 적격증빙이 필요하다. */
export const SIMPLE_RECEIPT_LIMIT = 30_000;

/** 입력된 사업자등록번호 중 체크섬이 맞지 않는 것을 알린다. 비어 있으면 넘어간다. */
export function bizNoWarnings(
  values: Record<string, string | undefined>,
  fields: readonly (readonly [field: string, label: string])[],
): string[] {
  const warnings: string[] = [];
  for (const [field, label] of fields) {
    const value = (values[field] ?? '').trim();
    if (value && !isValidBizNo(value)) {
      warnings.push(
        `${label} 사업자등록번호가 올바른 번호가 아닙니다. 숫자 10자리를 다시 확인하세요.`,
      );
    }
  }
  return warnings;
}

/** 세금계산서·계산서의 필요적 기재사항 중 등록번호 누락을 알린다. */
export function invoiceRequiredWarnings(
  values: Record<string, string | undefined>,
  what: '세금계산서' | '계산서',
): string[] {
  const missing = [
    ['supplierBiz', '공급자 등록번호'],
    ['supplierCeo', '공급자 성명'],
    ['buyerBiz', '공급받는자 등록번호'],
  ]
    .filter(([field]) => !(values[field ?? ''] ?? '').trim())
    .map(([, label]) => label);
  if (missing.length === 0) return [];
  const basis = what === '세금계산서' ? '부가가치세법 제32조' : '소득세법 제163조·법인세법 제121조';
  return [
    `${missing.join(', ')}이(가) 비어 있습니다. ${what}의 필요적 기재사항이라 빠지면 가산세 대상이 됩니다${what === '세금계산서' ? '. 상대방은 매입세액을 공제받지 못할 수 있습니다' : ''}(${basis}). 공급받는자가 사업자가 아니면 고유번호나 주민등록번호를 적습니다.`,
  ];
}

/** 간이영수증 금액이 적격증빙 기준을 넘으면 알린다. */
export function simpleReceiptWarnings(amount: number): string[] {
  if (!(amount > SIMPLE_RECEIPT_LIMIT)) return [];
  return [
    '3만 원을 넘는 금액입니다. 사업 경비라면 간이영수증만으로는 증빙이 부족해 증빙불비가산세(2%)가 붙을 수 있습니다. 세금계산서·계산서·카드 매출전표·현금영수증을 함께 받으세요(법인세법 제116조, 소득세법 제160조의2).',
  ];
}
