/**
 * 계산기 엔진 — 수식 문자열을 직접 해석한다(eval 금지: CSP 와 안전 때문).
 *
 * 문법(우선순위 낮은 → 높은 순):
 *   식     = 항 (('+' | '-') 항)*
 *   항     = 단항 (('*' | '/') 단항 | 암시적 곱)*
 *   단항   = ('-' | '+') 단항 | 거듭
 *   거듭   = 후위 ('^' 단항)?            ← 오른쪽 결합, -2^2 = -4
 *   후위   = 기본 ('!' | '%')*
 *   기본   = 숫자 | 상수 | 함수 '(' 식 ')' | '(' 식 ')'
 *
 * 암시적 곱: 2π, 2(3), (1+2)(3), 2sin(30), 2e 처럼 숫자·괄호 뒤에 바로 오는 항.
 * 화면 기호(×, ÷, −, π, √)도 그대로 받는다.
 *
 * 퍼센트는 아이폰·일반 계산기와 같다:
 *   a + b% = a + a×b/100 (10000+10% = 11000),  a − b% = a − a×b/100
 *   a × b% = a×b/100,  a ÷ b% = a÷(b/100),  b% 단독 = b/100
 *
 * 지수 표기(1e3)는 받지 않는다: 2 e 3 을 누르면 2×e×3 이어야 하기 때문.
 */

export type AngleMode = 'deg' | 'rad';

export const FUNCTIONS = [
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'ln',
  'log',
  'sqrt',
  'cbrt',
  'abs',
  'exp',
] as const;
export type FunctionName = (typeof FUNCTIONS)[number];

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' | '^' | '!' | '%' }
  | { kind: 'lparen' }
  | { kind: 'rparen' }
  | { kind: 'const'; value: number }
  | { kind: 'fn'; value: FunctionName };

export class CalcError extends Error {}

const SYMBOLS: Record<string, string> = {
  '×': '*',
  '÷': '/',
  '−': '-',
  '–': '-',
  '√': 'sqrt',
  '∛': 'cbrt',
  π: 'pi',
};

function normalize(input: string): string {
  let out = '';
  for (const ch of input) out += SYMBOLS[ch] ?? ch;
  return out.replace(/\s+/g, '').toLowerCase();
}

export function tokenize(input: string): Token[] {
  const s = normalize(input);
  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s.charAt(i);
    if (/[0-9.]/.test(ch)) {
      const match = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (!match) throw new CalcError('숫자 형식이 올바르지 않습니다.');
      tokens.push({ kind: 'num', value: Number(match[0]) });
      i += match[0].length;
      continue;
    }
    if ('+-*/^!%'.includes(ch)) {
      tokens.push({ kind: 'op', value: ch as '+' });
      i += 1;
      continue;
    }
    if (ch === '(') {
      tokens.push({ kind: 'lparen' });
      i += 1;
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen' });
      i += 1;
      continue;
    }
    const word = /^[a-z]+/.exec(s.slice(i))?.[0];
    if (word) {
      // 가장 긴 이름부터 맞춘다(asin 이 sin 보다 먼저).
      const fn = [...FUNCTIONS]
        .sort((a, b) => b.length - a.length)
        .find((name) => word.startsWith(name));
      if (word.startsWith('pi')) {
        tokens.push({ kind: 'const', value: Math.PI });
        i += 2;
        continue;
      }
      if (fn) {
        tokens.push({ kind: 'fn', value: fn });
        i += fn.length;
        continue;
      }
      if (word.startsWith('e')) {
        tokens.push({ kind: 'const', value: Math.E });
        i += 1;
        continue;
      }
    }
    throw new CalcError(`알 수 없는 기호: ${ch}`);
  }
  return tokens;
}

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new CalcError('팩토리얼은 0 이상의 정수만 됩니다.');
  if (n > 170) throw new CalcError('계산 범위를 넘었습니다.');
  let out = 1;
  for (let k = 2; k <= n; k += 1) out *= k;
  return out;
}

/** 삼각함수 결과의 부동소수 찌꺼기 정리: sin(180°) = 0, cos(90°) = 0 */
function clean(value: number): number {
  return Math.abs(value) < 1e-15 ? 0 : value;
}

function applyFn(name: FunctionName, x: number, angle: AngleMode): number {
  const toRad = (v: number) => (angle === 'deg' ? (v * Math.PI) / 180 : v);
  const fromRad = (v: number) => (angle === 'deg' ? (v * 180) / Math.PI : v);
  switch (name) {
    case 'sin':
      return clean(Math.sin(toRad(x)));
    case 'cos':
      return clean(Math.cos(toRad(x)));
    case 'tan': {
      if (angle === 'deg' && Math.abs(x % 180) === 90)
        throw new CalcError('tan 90°는 정의되지 않습니다.');
      return clean(Math.tan(toRad(x)));
    }
    case 'asin':
      return fromRad(Math.asin(x));
    case 'acos':
      return fromRad(Math.acos(x));
    case 'atan':
      return fromRad(Math.atan(x));
    case 'ln':
      return Math.log(x);
    case 'log':
      return Math.log10(x);
    case 'sqrt':
      return Math.sqrt(x);
    case 'cbrt':
      return Math.cbrt(x);
    case 'abs':
      return Math.abs(x);
    case 'exp':
      return Math.exp(x);
  }
}

export function evaluate(input: string, angle: AngleMode = 'deg'): number {
  const tokens = tokenize(input);
  if (tokens.length === 0) throw new CalcError('식을 입력하세요.');
  let pos = 0;
  /** 바로 앞 후위 연산이 % 였는가(+·− 의 퍼센트 처리용) */
  let lastPercent = false;
  /** 바로 앞 항이 "b%" 하나뿐이었는가 */
  let termIsPercent = false;

  const peek = () => tokens[pos];
  const isOp = (value: string) => {
    const t = peek();
    return t?.kind === 'op' && t.value === value;
  };

  // 다음 토큰이 암시적 곱의 시작인가: 숫자·상수·함수·여는 괄호
  const startsImplicit = () => {
    const t = peek();
    return (
      t !== undefined &&
      (t.kind === 'num' || t.kind === 'const' || t.kind === 'fn' || t.kind === 'lparen')
    );
  };

  const primary = (): number => {
    const t = peek();
    if (!t) throw new CalcError('식이 끝나지 않았습니다.');
    if (t.kind === 'num' || t.kind === 'const') {
      pos += 1;
      return t.value;
    }
    if (t.kind === 'lparen') {
      pos += 1;
      const value = expression();
      // 닫는 괄호가 없으면 끝에서 자동으로 닫는다(계산기에서 흔한 입력).
      if (peek()?.kind === 'rparen') pos += 1;
      else if (peek() !== undefined) throw new CalcError('괄호가 맞지 않습니다.');
      return value;
    }
    if (t.kind === 'fn') {
      pos += 1;
      // sin30 처럼 괄호 없이 숫자가 오면 그 숫자(와 후위 연산)만 인자로 쓴다.
      const arg = peek()?.kind === 'lparen' ? primary() : postfix();
      return applyFn(t.value, arg, angle);
    }
    throw new CalcError('식이 올바르지 않습니다.');
  };

  const postfix = (): number => {
    let value = primary();
    lastPercent = false;
    while (isOp('!') || isOp('%')) {
      const op = peek() as { value: string };
      pos += 1;
      value = op.value === '!' ? factorial(value) : value / 100;
      lastPercent = op.value === '%';
    }
    return value;
  };

  const power = (): number => {
    const base = postfix();
    if (isOp('^')) {
      pos += 1;
      const value = base ** unary();
      lastPercent = false;
      return value;
    }
    return base;
  };

  const unary = (): number => {
    if (isOp('-')) {
      pos += 1;
      return -unary();
    }
    if (isOp('+')) {
      pos += 1;
      return unary();
    }
    return power();
  };

  const term = (): number => {
    let value = unary();
    let single = true;
    let percent = lastPercent;
    for (;;) {
      if (isOp('*')) {
        pos += 1;
        value *= unary();
      } else if (isOp('/')) {
        pos += 1;
        const divisor = unary();
        if (divisor === 0) throw new CalcError('0으로 나눌 수 없습니다.');
        value /= divisor;
      } else if (startsImplicit()) {
        value *= power();
      } else {
        termIsPercent = single && percent;
        return value;
      }
      single = false;
      percent = false;
    }
  };

  const expression = (): number => {
    let value = term();
    for (;;) {
      if (isOp('+')) {
        pos += 1;
        const right = term();
        value += termIsPercent ? value * right : right;
      } else if (isOp('-')) {
        pos += 1;
        const right = term();
        value -= termIsPercent ? value * right : right;
      } else {
        return value;
      }
    }
  };

  const value = expression();
  if (pos < tokens.length) throw new CalcError('식이 올바르지 않습니다.');
  if (Number.isNaN(value)) throw new CalcError('정의되지 않은 값입니다.');
  if (!Number.isFinite(value)) {
    throw new CalcError(
      tokens.some((t) => t.kind === 'fn' && (t.value === 'log' || t.value === 'ln'))
        ? '정의되지 않은 값입니다.'
        : '계산 범위를 넘었습니다.',
    );
  }
  return value;
}

/** 화면에 남길 유효숫자. 배정밀도(약 15.9자리) 안에서 부동소수 오차(0.1+0.2)만 걷어 낸다. */
const PRECISION = 15;

/** 정수는 안전 범위(약 9천조)까지 그대로, 그 밖은 15자리로 정리한다. */
function tidy(value: number): number {
  if (Number.isSafeInteger(value)) return value;
  return Number(value.toPrecision(PRECISION));
}

/**
 * 화면 표시용 숫자. 아주 크거나 작으면 지수 표기, 그 밖에는 천 단위 쉼표.
 */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '-∞';
  if (value === 0) return '0';
  const rounded = tidy(value);
  const abs = Math.abs(rounded);
  if (abs >= 1e16 || abs < 1e-9) {
    return rounded.toExponential(10).replace(/\.?0+e/, 'e');
  }
  // 1e-7 처럼 String 이 지수로 바꾸는 작은 수만 자릿수를 정해 풀어 쓴다.
  let plain = String(rounded);
  if (plain.includes('e')) {
    const decimals = Math.min(100, PRECISION - 1 - Math.floor(Math.log10(abs)));
    plain = rounded.toFixed(decimals).replace(/\.?0+$/, '');
  }
  const [int = '0', frac] = plain.split('.');
  const sign = int.startsWith('-') ? '-' : '';
  const digits = int.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${digits}${frac ? `.${frac}` : ''}`;
}

/**
 * 결과를 다시 식에 넣을 때 쓰는 값(쉼표 없음). 식은 지수 표기를 받지 않으므로
 * 아주 크거나 작은 수는 (1.5×10^(−12)) 꼴로 넣는다.
 */
export function resultToInput(value: number): string {
  if (!Number.isFinite(value)) return '';
  const rounded = tidy(value);
  const text = String(rounded);
  const match = /^(-?[\d.]+)e([+-]\d+)$/.exec(text);
  const minus = (t: string) => t.replace('-', '−');
  if (match) return `(${minus(match[1] ?? '')}×10^(${minus(String(Number(match[2])))}))`;
  return text.startsWith('-') ? `(${minus(text)})` : text;
}

/** 닫지 않은 괄호를 끝에서 닫는다: log(74 → log(74) */
export function closeParens(expr: string): string {
  let depth = 0;
  for (const ch of expr) {
    if (ch === '(') depth += 1;
    else if (ch === ')' && depth > 0) depth -= 1;
  }
  return expr + ')'.repeat(depth);
}

/**
 * = 을 다시 누르면 마지막 연산을 되풀이한다(아이폰과 같다): 2+3 = = → 8.
 * 식의 맨 바깥 마지막 이항 연산자와 그 뒤 피연산자를 돌려준다. 없으면 null.
 */
export function lastOperation(expr: string): string | null {
  let depth = 0;
  for (let i = expr.length - 1; i > 0; i -= 1) {
    const ch = expr.charAt(i);
    if (ch === ')') depth += 1;
    else if (ch === '(') depth -= 1;
    else if (depth === 0 && '+−-×÷*/'.includes(ch)) {
      const before = expr.charAt(i - 1);
      // 앞이 연산자·여는 괄호면 부호(단항)라 건너뛴다.
      if ('+−-×÷*/(^'.includes(before)) continue;
      const operand = expr.slice(i + 1);
      return operand ? ch + operand : null;
    }
  }
  return null;
}

const OPERATORS = '+−-×÷*/';

/** 식의 맨 바깥(괄호 밖)에 있는 이항 연산자들. 부호(단항)는 빼고 센다. */
function topLevelOperators(expr: string): Set<string> {
  const found = new Set<string>();
  let depth = 0;
  for (let i = 0; i < expr.length; i += 1) {
    const ch = expr.charAt(i);
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (depth === 0 && i > 0 && OPERATORS.includes(ch)) {
      const before = expr.charAt(i - 1);
      if (!`${OPERATORS}(^`.includes(before)) found.add(ch);
    }
  }
  return found;
}

/** 통째로 하나의 값인가: 숫자, 바깥 괄호 한 쌍, 함수 호출 sin(…) */
function isAtom(expr: string): boolean {
  if (/^[0-9.]+$/.test(expr)) return true;
  const open = /^[a-z√∛]*\(/.exec(expr);
  if (!open || !expr.endsWith(')')) return false;
  let depth = 0;
  for (let i = open[0].length - 1; i < expr.length; i += 1) {
    const ch = expr.charAt(i);
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      // 첫 여는 괄호가 마지막 글자에서야 닫혀야 한 덩어리다: (1+2)×(3) 은 아니다.
      if (depth === 0) return i === expr.length - 1;
    }
  }
  return false;
}

/**
 * 결과 다음에 연산자를 누르면 앞 식을 그대로 살려 이어 쓴다(5154×6 → 5154×6×6).
 * 뜻이 바뀌지 않도록 필요할 때만 괄호로 감싼다:
 *   + −       → 그대로 (2+3 → 2+3−1)
 *   × ÷       → 바깥에 + − 가 있으면 감싼다 (2+3 → (2+3)×4)
 *   ^ ! % 등   → 한 덩어리가 아니면 감싼다 (5154×6 → (5154×6)^2)
 */
export function chainPrefix(expr: string, next: string): string {
  const op = next.charAt(0);
  if ('+−-'.includes(op)) return expr;
  const ops = topLevelOperators(expr);
  const leadingMinus = /^[−-]/.test(expr);
  if ('×÷*/'.includes(op)) {
    return ops.has('+') || ops.has('−') || ops.has('-') ? `(${expr})` : expr;
  }
  return isAtom(expr) && !leadingMinus ? expr : `(${expr})`;
}
