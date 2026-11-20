/**
 * CSV 셀 직렬화 공통 규칙.
 *
 * 엑셀은 =, @ 또는 +·- 뒤에 함수·명령이 오는 셀을 수식으로 실행한다(CSV 수식 주입,
 * OWASP “CSV Injection”). 외부에서 받은 주소록·거래처 목록을 정리해 내려받은 CSV를
 * 엑셀로 열 때 위험하므로, 그런 값만 앞에 작은따옴표(')를 붙여 글자로 열리게 한다.
 * 전화번호(+82…)·음수(-1,200)처럼 숫자로 시작하는 값은 건드리지 않는다.
 */
const FORMULA_START = /^(?:[=@\t\r]|[+-][^\d.,\s])/;

export function isFormulaLike(value: string): boolean {
  return FORMULA_START.test(value);
}

export function csvCell(value: string, options: { quoteAll?: boolean } = {}): string {
  const safe = isFormulaLike(value) ? `'${value}` : value;
  if (options.quoteAll || /[",\r\n]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

export function rowsToCsv(
  rows: readonly (readonly string[])[],
  options: { eol?: '\n' | '\r\n'; quoteAll?: boolean } = {},
): string {
  return rows
    .map((row) => row.map((value) => csvCell(value, options)).join(','))
    .join(options.eol ?? '\n');
}
