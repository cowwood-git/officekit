import {
  type AngleMode,
  CalcError,
  chainPrefix,
  closeParens,
  evaluate,
  formatResult,
  lastOperation,
  resultToInput,
} from '@/lib/calculator';

const MODE_KEY = 'officekit-calc-mode';
const ANGLE_KEY = 'officekit-calc-angle';
const HISTORY_LIMIT = 10;
/** 기록 한 칸에 쌓는 이어 계산 단계 수 */
const STEP_LIMIT = 30;

type Mode = 'basic' | 'sci';

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function save(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 저장이 막힌 브라우저(사생활 보호 모드 등)에서도 계산은 된다.
  }
}

/** 2nd 를 누르면 바뀌는 키: 삼각함수 → 역삼각함수 */
const SECOND: Record<string, { label: string; insert: string }> = {
  'sin(': { label: 'sin⁻¹', insert: 'asin(' },
  'cos(': { label: 'cos⁻¹', insert: 'acos(' },
  'tan(': { label: 'tan⁻¹', insert: 'atan(' },
};

export function initCalculator(): void {
  const root = byId<HTMLElement>('calc');
  const exprView = byId<HTMLElement>('calc-expr');
  const resultView = byId<HTMLElement>('calc-result');
  const historyList = byId<HTMLOListElement>('calc-history');
  const historyEmpty = byId<HTMLElement>('calc-history-empty');
  const copyButton = byId<HTMLButtonElement>('calc-copy');
  const historyClear = byId<HTMLButtonElement>('calc-history-clear');
  if (!root || !exprView || !resultView) return;

  let expr = '';
  let ans = 0;
  /** = 직후: 숫자를 누르면 새 식, 연산자를 누르면 결과에 이어서 */
  let justEvaluated = false;
  let second = false;
  let angle: AngleMode = load(ANGLE_KEY) === 'rad' ? 'rad' : 'deg';
  /** 기록 한 칸 = 이어서 한 계산 묶음. 첫 단계는 식 전체, 다음 단계는 덧붙인 부분(× 6). */
  type Entry = { steps: { expr: string; value: number }[] };
  const history: Entry[] = [];
  /** 결과에 이어 계산 중일 때: 앞 식(prefix)과 그 결과가 담긴 기록 칸 */
  let chain: { prefix: string; entry: Entry } | null = null;
  /** 마지막 = 때의 각도 단위. 바뀌었으면 삼각함수 식을 다시 계산하지 않고 결과값에서 잇는다. */
  let evaluatedAngle: AngleMode = angle;

  const setMode = (mode: Mode) => {
    root.dataset.mode = mode;
    for (const tab of root.querySelectorAll<HTMLButtonElement>('[data-mode-tab]')) {
      tab.setAttribute('aria-pressed', String(tab.dataset.modeTab === mode));
    }
    save(MODE_KEY, mode);
  };

  const syncAngle = () => {
    const button = root.querySelector<HTMLButtonElement>('[data-action="angle"]');
    if (button) {
      button.textContent = angle === 'deg' ? 'Deg' : 'Rad';
      button.setAttribute(
        'aria-label',
        angle === 'deg' ? '각도 단위: 도. 누르면 라디안' : '각도 단위: 라디안. 누르면 도',
      );
    }
    root.dataset.angle = angle;
  };

  const syncSecond = () => {
    root.dataset.second = String(second);
    for (const key of root.querySelectorAll<HTMLButtonElement>('[data-insert]')) {
      const base = key.dataset.base ?? key.dataset.insert ?? '';
      if (!key.dataset.base) key.dataset.base = base;
      if (!key.dataset.baseLabel) key.dataset.baseLabel = key.textContent ?? '';
      const alt = SECOND[base];
      if (!alt) continue;
      key.dataset.insert = second ? alt.insert : base;
      key.textContent = second ? alt.label : (key.dataset.baseLabel ?? '');
    }
    root.querySelector('[data-action="second"]')?.setAttribute('aria-pressed', String(second));
  };

  /** 식을 읽기 쉽게: 연산자 앞뒤에 얇은 공백(기록·윗줄에만 쓴다). */
  const spaced = (text: string) => text.replace(/\s*([+−×÷])\s*/g, '\u2009$1\u2009').trim();

  /** 큰 줄은 한 줄로 두고, 넘치면 글자를 줄인다(아이폰처럼). 최소 크기에서도 넘치면 끝부분을 보여 준다. */
  const fitResult = () => {
    resultView.style.fontSize = '';
    resultView.removeAttribute('data-overflow');
    const width = resultView.clientWidth;
    if (!width || resultView.scrollWidth <= width) return;
    const base = Number.parseFloat(getComputedStyle(resultView).fontSize);
    const min = 20;
    const size = Math.max(min, Math.floor((base * width) / resultView.scrollWidth));
    resultView.style.fontSize = `${size}px`;
    resultView.scrollLeft = resultView.scrollWidth;
    resultView.toggleAttribute(
      'data-overflow',
      resultView.scrollWidth > resultView.clientWidth + 1,
    );
  };

  /**
   * 아이폰 계산기(iOS 18)처럼 = 을 누르기 전에는 계산하지 않는다.
   * - 입력 중: 큰 줄에 지금까지 입력한 식, 윗줄은 비움
   * - = 뒤: 윗줄에 "식 =", 큰 줄에 결과
   */
  const render = (final?: { expr: string; text: string; error?: boolean }) => {
    if (final) {
      exprView.textContent = `${spaced(final.expr)} =`;
      resultView.dataset.state = final.error ? 'error' : 'final';
      resultView.textContent = final.text;
    } else {
      exprView.textContent = '\u00a0';
      resultView.dataset.state = 'input';
      resultView.textContent = expr || '0';
    }
    exprView.scrollLeft = exprView.scrollWidth;
    // 이어 쓴 식이 길면 앞부분을 흐리게 잘라 끝(최근 연산)이 보이게 한다.
    exprView.toggleAttribute('data-overflow', exprView.scrollWidth > exprView.clientWidth + 1);
    if (copyButton) copyButton.disabled = resultView.dataset.state !== 'final';
    fitResult();
  };

  const historyButton = (step: { expr: string; value: number }, first: boolean) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = first ? 'calc-history-item' : 'calc-history-item is-step';
    button.dataset.value = resultToInput(step.value);
    const top = document.createElement('span');
    top.className = 'calc-history-expr';
    top.textContent = `${spaced(step.expr)} =`;
    const bottom = document.createElement('span');
    bottom.className = 'calc-history-value';
    bottom.textContent = formatResult(step.value);
    button.append(top, bottom);
    button.setAttribute('aria-label', `${step.expr} = ${formatResult(step.value)}, 식에 넣기`);
    return button;
  };

  const renderHistory = () => {
    if (!historyList) return;
    historyList.replaceChildren(
      ...history.map((entry) => {
        const li = document.createElement('li');
        li.append(...entry.steps.map((step, index) => historyButton(step, index === 0)));
        return li;
      }),
    );
    if (historyEmpty) historyEmpty.hidden = history.length > 0;
    if (historyClear) historyClear.hidden = history.length === 0;
  };

  /** 결과에 이어 계산: 앞 식을 살려 이어 쓴다(5154×6 → 5154×6×6). */
  const continueFrom = (next: string) => {
    const trig = /sin|cos|tan/.test(expr);
    const prefix = trig && angle !== evaluatedAngle ? resultToInput(ans) : chainPrefix(expr, next);
    const entry = history[0];
    chain = entry ? { prefix, entry } : null;
    expr = prefix;
  };

  const insert = (text: string) => {
    const startsValue = /^[0-9.(πe√∛a-z]/.test(text);
    if (justEvaluated) {
      // 결과 다음에 숫자·함수를 누르면 새 식, 연산자면 앞 식에 이어서 계산
      if (startsValue) {
        expr = '';
        chain = null;
      } else {
        continueFrom(text);
      }
      justEvaluated = false;
    }
    // ± 로 만든 (−5) 뒤에 숫자를 이어 치면 괄호 안으로 넣는다: (−5) 3 → (−53)
    const negated = /\(−[0-9.]*\)$/.exec(expr);
    if (negated && /^[0-9.]$/.test(text)) expr = `${expr.slice(0, -1)}${text})`;
    else expr += text;
    render();
  };

  const equals = () => {
    if (!expr) return;
    if (justEvaluated) {
      // = 을 다시 누르면 마지막 연산을 되풀이한다(2+3 = = → 8). 연산이 없으면 그대로.
      const repeat = lastOperation(expr);
      if (!repeat) return;
      continueFrom(repeat);
      expr += repeat;
    }
    // 닫지 않은 괄호는 닫아서 계산하고, 기록에도 닫힌 식으로 남긴다.
    expr = closeParens(expr);
    try {
      const value = evaluate(expr, angle);
      const linked =
        chain &&
        chain.entry === history[0] &&
        expr.startsWith(chain.prefix) &&
        expr.length > chain.prefix.length;
      if (linked && chain) {
        // 이어서 한 계산은 같은 기록 칸에 단계로 쌓는다: 5154 × 6 = 30,924 / × 6 = 185,544
        chain.entry.steps.push({ expr: expr.slice(chain.prefix.length), value });
        chain.entry.steps.splice(0, chain.entry.steps.length - STEP_LIMIT);
      } else {
        history.unshift({ steps: [{ expr, value }] });
        history.splice(HISTORY_LIMIT);
      }
      chain = null;
      evaluatedAngle = angle;
      ans = value;
      justEvaluated = true;
      render({ expr, text: formatResult(value) });
      renderHistory();
    } catch (cause) {
      const text = cause instanceof CalcError ? cause.message : '계산할 수 없습니다';
      render({ expr, text, error: true });
    }
  };

  const backspace = () => {
    if (justEvaluated) {
      justEvaluated = false;
      render();
      return;
    }
    // 함수 이름은 한 번에 지운다(sin( → 통째로)
    const fn = /(asin|acos|atan|sin|cos|tan|ln|log|sqrt|cbrt|abs|exp|√|∛)\($/.exec(expr);
    expr = fn ? expr.slice(0, -fn[0].length) : expr.slice(0, -1);
    render();
  };

  const clear = () => {
    expr = '';
    chain = null;
    justEvaluated = false;
    render();
  };

  /** ± : 마지막 숫자(또는 결과)의 부호를 바꾼다 */
  const negate = () => {
    if (justEvaluated) {
      ans = -ans;
      expr = resultToInput(ans);
      chain = null;
      justEvaluated = false;
      render();
      return;
    }
    // 괄호까지 닫아서 바꾼다: 3×5 → 3×(−5), 다시 누르면 3×5. 열린 괄호로 두면 3×(−5+2 처럼 뒤 식이 묶인다.
    const wrapped = /\(−([0-9.]+)\)$/.exec(expr);
    const plain = /([0-9.]+)$/.exec(expr);
    if (wrapped) expr = expr.slice(0, -wrapped[0].length) + (wrapped[1] ?? '');
    else if (plain) expr = `${expr.slice(0, -plain[0].length)}(−${plain[1] ?? ''})`;
    else expr += '−';
    render();
  };

  root.addEventListener('click', (event) => {
    const key = (event.target as Element | null)?.closest<HTMLButtonElement>('button');
    if (!key || !root.contains(key)) return;
    // 마우스로 누른 키에 포커스가 남으면 키보드 Enter 가 = 대신 그 키를 다시 누른다.
    // 마우스 클릭(detail > 0)일 때만 포커스를 놓고, Tab 으로 고른 키보드 사용자는 그대로 둔다.
    if (event.detail > 0) key.blur();
    if (key.dataset.modeTab) {
      setMode(key.dataset.modeTab as Mode);
      return;
    }
    if (key.dataset.insert !== undefined) {
      insert(key.dataset.insert);
      if (second && SECOND[key.dataset.base ?? '']) {
        second = false;
        syncSecond();
      }
      return;
    }
    switch (key.dataset.action) {
      case 'equals':
        equals();
        break;
      case 'clear':
        clear();
        break;
      case 'back':
        backspace();
        break;
      case 'negate':
        negate();
        break;
      case 'ans':
        insert(resultToInput(ans));
        break;
      case 'angle':
        angle = angle === 'deg' ? 'rad' : 'deg';
        save(ANGLE_KEY, angle);
        syncAngle();
        // 결과를 보고 있을 때는 그대로 둔다(단위는 다음 = 부터 적용).
        if (!justEvaluated) render();
        break;
      case 'second':
        second = !second;
        syncSecond();
        break;
    }
  });

  historyList?.addEventListener('click', (event) => {
    const item = (event.target as Element | null)?.closest<HTMLButtonElement>('.calc-history-item');
    if (item?.dataset.value) insert(item.dataset.value);
  });

  historyClear?.addEventListener('click', () => {
    history.length = 0;
    chain = null;
    renderHistory();
  });

  window.addEventListener('resize', fitResult);

  copyButton?.addEventListener('click', async () => {
    const text =
      resultView.dataset.state === 'final'
        ? (resultView.textContent ?? '').replaceAll(',', '')
        : '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copyButton.textContent = '복사됨';
      setTimeout(() => {
        copyButton.textContent = '결과 복사';
      }, 1200);
    } catch {
      copyButton.textContent = '복사 실패';
    }
  });

  // 키보드: 계산기 영역 밖의 입력란에서 치는 글자는 건드리지 않는다.
  // capture 단계에서 먼저 받아 '/'(나누기)가 사이트 검색 단축키보다 앞서게 한다.
  window.addEventListener(
    'keydown',
    (event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], dialog')) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const k = event.key;
      // 키 버튼에 포커스가 있을 때 Enter·Space 는 그 버튼을 누르는 것으로 둔다.
      if ((k === 'Enter' || k === ' ') && target?.closest('button, a')) return;
      let handled = true;
      if (/^[0-9.]$/.test(k)) insert(k);
      else if (k === '+') insert('+');
      else if (k === '-') insert('−');
      else if (k === '*' || k === 'x') insert('×');
      else if (k === '/') insert('÷');
      else if (k === '^' || k === '(' || k === ')' || k === '%' || k === '!') insert(k);
      else if (k === 'Enter' || k === '=') equals();
      else if (k === 'Backspace') backspace();
      else if (k === 'Escape' || k === 'Delete') clear();
      else handled = false;
      if (handled) event.preventDefault();
    },
    { capture: true },
  );

  setMode(load(MODE_KEY) === 'sci' ? 'sci' : 'basic');
  syncAngle();
  syncSecond();
  render();
  renderHistory();
}
