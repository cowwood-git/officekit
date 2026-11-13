/**
 * 실행 관문 — 파일 도구는 [실행]을 눌러야 처리한다(docs/scale-plan.md §4).
 *
 * - 파일을 고르면 ready(): 버튼을 켜고 결과는 숨긴 채 "설정 확인 후 실행" 안내.
 * - 설정을 바꾸면 invalidate(): 이전 결과를 숨겨 지금 설정과 다른 결과가 남지 않게 한다.
 * - [실행]을 누르면 run() 후 결과를 보여 준다.
 */

import { doWork } from './do-work';

export interface RunGateOptions {
  button: HTMLButtonElement;
  /** 실행 후에만 보이는 결과 영역 */
  result: HTMLElement | null;
  status: HTMLElement;
  /** 바뀌면 결과를 무효로 만드는 설정 컨트롤 */
  controls: Iterable<Element | null | undefined>;
  /** 처리. false 를 돌려주면 결과를 보여 주지 않는다(입력 오류 등). */
  run: () => unknown;
  /** 결과가 무효가 될 때 다운로드 URL 정리 등 */
  onInvalidate?: () => void;
}

export interface RunGate {
  ready(message?: string): void;
  invalidate(): void;
  reset(): void;
}

export function runLabel(button: HTMLButtonElement): string {
  return button.textContent?.trim() || '실행';
}

export function readyMessage(label: string): string {
  return `설정을 확인한 뒤 [${label}]을 누르세요.`;
}

export function staleMessage(label: string): string {
  return `설정이 바뀌었습니다. [${label}]을 다시 누르세요.`;
}

export function createRunGate(options: RunGateOptions): RunGate {
  const { button, result, status, controls, run, onInvalidate } = options;
  const label = runLabel(button);
  let loaded = false;
  let shown = false;

  const isError = () =>
    typeof document !== 'undefined' &&
    Array.from(document.querySelectorAll<HTMLElement>('.error[role="alert"]')).some(
      (element) => !element.hidden && (element.textContent ?? '').trim() !== '',
    );

  const hideResult = () => {
    if (result) result.hidden = true;
    shown = false;
  };

  const gate: RunGate = {
    ready(message) {
      loaded = true;
      button.disabled = false;
      hideResult();
      status.textContent = message ?? readyMessage(label);
    },
    invalidate() {
      if (!loaded || !shown) return;
      hideResult();
      onInvalidate?.();
      status.textContent = staleMessage(label);
    },
    reset() {
      loaded = false;
      button.disabled = true;
      hideResult();
    },
  };

  for (const control of controls) {
    control?.addEventListener('input', gate.invalidate);
    control?.addEventListener('change', gate.invalidate);
  }

  button.addEventListener('click', async () => {
    if (!loaded || button.disabled) return;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      let ok: unknown;
      // 진행 체크리스트를 거친 뒤 결과를 연다(단계가 등록된 도구만, src/data/work-steps.ts).
      await doWork(
        button,
        async () => {
          ok = await run();
        },
        { expectResult: false },
      );
      if (ok === false) return;
      if (isError()) return;
      if (result) result.hidden = false;
      shown = true;
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });

  button.disabled = true;
  hideResult();
  return gate;
}
