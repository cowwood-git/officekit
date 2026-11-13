import { describe, expect, it } from 'vitest';
import {
  type AngleMode,
  CalcError,
  chainPrefix,
  closeParens,
  evaluate,
  formatResult,
  lastOperation,
  resultToInput,
} from '../src/lib/calculator';

// 화면에 보이는 값(formatResult)으로 검증한다 — 사용자가 실제로 읽는 숫자.
const shown = (expr: string, angle: AngleMode = 'deg') => formatResult(evaluate(expr, angle));
const p15 = (value: number) => formatResult(Number(value.toPrecision(15)));

describe('기본 계산 — 화면 값', () => {
  it.each([
    ['1+2×3', '7'],
    ['10−4−3', '3'],
    ['100÷4÷5', '5'],
    ['2×3+4×5', '26'],
    ['7÷2', '3.5'],
    ['0.1+0.2', '0.3'],
    ['1.1×3', '3.3'],
    ['1÷3×3', '1'],
    ['1.005×1000', '1,005'],
    ['0÷5', '0'],
    ['3×(−5)+2', '-13'],
    ['−5+3', '-2'],
    ['6÷2(1+2)', '9'],
    ['1÷1000000×3', '0.000003'],
  ])('%s = %s', (expr, want) => expect(shown(expr)).toBe(want));

  it('큰 금액도 끝자리까지 정확하다(안전 정수 범위)', () => {
    expect(shown('1234567890123+1')).toBe('1,234,567,890,124');
    expect(shown('999999999999×9')).toBe('8,999,999,999,991');
    expect(shown('12345678901.25+0.01')).toBe('12,345,678,901.26');
  });

  it('1÷3 은 15자리까지 보인다', () => {
    expect(shown('1÷3')).toBe('0.333333333333333');
  });
});

describe('퍼센트 — 아이폰·일반 계산기와 같은 규칙', () => {
  it.each([
    ['10000+10%', '11,000'],
    ['10000−10%', '9,000'],
    ['200×15%', '30'],
    ['50÷10%', '500'],
    ['10%', '0.1'],
    ['(200+10%)×2', '440'],
    ['50000+10%+10%', '60,500'],
  ])('%s = %s', (expr, want) => expect(shown(expr)).toBe(want));
});

describe('공학 계산 — 도(deg)', () => {
  it.each([
    ['sin(30)', '0.5'],
    ['cos(60)', '0.5'],
    ['tan(45)', '1'],
    ['sin(90)', '1'],
    ['cos(90)', '0'],
    ['sin(180)', '0'],
    ['tan(−45)', '-1'],
    ['sin(−30)', '-0.5'],
    ['asin(1)', '90'],
    ['acos(0.5)', '60'],
    ['atan(1)', '45'],
    ['2sin(30)', '1'],
  ])('%s = %s', (expr, want) => expect(shown(expr)).toBe(want));
});

describe('공학 계산 — 라디안(rad)', () => {
  it.each([
    ['sin(π÷2)', '1'],
    ['cos(π)', '-1'],
    ['sin(π)', '0'],
  ])('%s = %s', (expr, want) => expect(shown(expr, 'rad')).toBe(want));
  it('asin(1) = π/2', () => expect(shown('asin(1)', 'rad')).toBe(p15(Math.PI / 2)));
});

describe('공학 계산 — 로그·거듭제곱·근·팩토리얼·상수', () => {
  it.each([
    ['log(100)', '2'],
    ['ln(e)', '1'],
    ['ln(1)', '0'],
    ['√(16)', '4'],
    ['∛(27)', '3'],
    ['∛(−8)', '-2'],
    ['2^10', '1,024'],
    ['2^3^2', '512'],
    ['−2^2', '-4'],
    ['10^(3)', '1,000'],
    ['4^(−1)', '0.25'],
    ['5!', '120'],
    ['0!', '1'],
    ['10!', '3,628,800'],
    ['3!^2', '36'],
    ['2(3+4)', '14'],
    ['(1+2)(3+4)', '21'],
    ['3√(4)', '6'],
  ])('%s = %s', (expr, want) => expect(shown(expr)).toBe(want));

  it('무리수는 15자리로 보인다', () => {
    expect(shown('log(74)')).toBe(p15(Math.log10(74)));
    expect(shown('√(2)')).toBe(p15(Math.SQRT2));
    expect(shown('2^0.5')).toBe(p15(Math.SQRT2));
    expect(shown('e^(1)')).toBe(p15(Math.E));
    expect(shown('2π')).toBe(p15(2 * Math.PI));
  });

  it('2 e 3 을 누르면 2×e×3 이다(지수 표기로 읽지 않는다)', () => {
    expect(shown('2e')).toBe(p15(2 * Math.E));
    expect(shown('2e3')).toBe(p15(6 * Math.E));
  });
});

describe('오류', () => {
  it.each([
    '5÷0',
    'log(0)',
    'ln(−1)',
    '10^400',
    'asin(2)',
    '3.5!',
    '171!',
    'tan(90)',
    '√(−4)',
    '1+',
    '()',
  ])('%s 는 오류', (expr) => expect(() => evaluate(expr)).toThrow(CalcError));
});

describe('화면 보조', () => {
  it('닫지 않은 괄호를 닫는다', () => {
    expect(closeParens('log(74')).toBe('log(74)');
    expect(closeParens('sin(cos(30')).toBe('sin(cos(30))');
    expect(closeParens('(1+2)')).toBe('(1+2)');
  });

  it('= 을 다시 누를 때 되풀이할 마지막 연산', () => {
    expect(lastOperation('2+3')).toBe('+3');
    expect(lastOperation('2×3+4')).toBe('+4');
    expect(lastOperation('10÷2')).toBe('÷2');
    expect(lastOperation('3×−5')).toBe('×−5');
    expect(lastOperation('(1+2)×(3−1)')).toBe('×(3−1)');
    expect(lastOperation('sin(30)')).toBeNull();
    expect(lastOperation('−5')).toBeNull();
  });

  it('결과를 식에 다시 넣어도 같은 값이다', () => {
    for (const value of [-5, 1.5e-12, 2e20, 0.1 + 0.2, 1234567890123, -0.25]) {
      expect(evaluate(`${resultToInput(value)}×1`)).toBeCloseTo(Number(value.toPrecision(15)), 10);
    }
    expect(resultToInput(-5)).toBe('(−5)');
    expect(resultToInput(1.5e-12)).toBe('(1.5×10^(−12))');
  });
});

describe('결과에 이어 계산 — 앞 식을 살리되 뜻은 그대로', () => {
  it.each([
    ['5154×6', '×6', '5154×6×6'],
    ['2+3', '×4', '(2+3)×4'],
    ['2+3', '−1', '2+3−1'],
    ['10000+10%', '+10%', '10000+10%+10%'],
    ['10÷2', '÷5', '10÷2÷5'],
    ['3×−5', '×2', '3×−5×2'],
    ['−5', '×2', '−5×2'],
    ['5154×6', '^2', '(5154×6)^2'],
    ['−5', '^2', '(−5)^2'],
    ['30', '^2', '30^2'],
    ['sin(30)', '^2', 'sin(30)^2'],
    ['(1+2)×(3)', '^2', '((1+2)×(3))^2'],
    ['5154×6', '%', '(5154×6)%'],
    ['log(100)', '×3', 'log(100)×3'],
  ])('%s 다음 %s → %s', (expr, next, want) => {
    expect(chainPrefix(expr, next) + next).toBe(want);
  });

  it('이어 쓴 식의 값은 앞 결과에 이어 계산한 값과 같다', () => {
    const cases: [string, string][] = [
      ['5154×6', '×6'],
      ['2+3', '×4'],
      ['2+3', '−1'],
      ['10000+10%', '+10%'],
      ['10000+10%', '×2'],
      ['5154×6', '^2'],
      ['−5', '^2'],
      ['sin(30)', '^2'],
      ['5154×6', '%'],
      ['2^3', '^2'],
      ['8÷2', '÷2'],
      ['3!', '!'],
    ];
    for (const [expr, next] of cases) {
      const viaAns = evaluate(resultToInput(evaluate(expr)) + next);
      expect(evaluate(chainPrefix(expr, next) + next), `${expr} ${next}`).toBeCloseTo(viaAns, 9);
    }
  });
});
