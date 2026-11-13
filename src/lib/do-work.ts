/**
 * 도구 실행 버튼을 작업 진행 체크리스트로 감싼다(docs/scale-plan.md §4).
 *
 * - 도구 슬러그는 <article class="tool" data-tool-slug> 에서 읽고, 단계는 src/data/work-steps.ts 에서 찾는다.
 * - 진행 중에는 .tool[data-working] 로 결과 영역을 숨겨 두었다가 체크리스트가 끝나면 연다.
 * - 처리가 입력 오류로 바로 끝났거나(오류 문구가 보임) 결과가 나오지 않았으면 기다리지 않고 바로 닫는다.
 */
import { WORK_STEPS } from '../data/work-steps';
import { runWithProgress } from './work-progress';

class NoResult extends Error {}

/** 실행 결과가 나왔을 때 window 에 보내는 이벤트(결과 아래 광고 자리가 듣는다). */
export const RESULT_EVENT = 'officekit:result';

const visible = (scope: ParentNode, selector: string) =>
  Array.from(scope.querySelectorAll<HTMLElement>(selector)).some(
    (element) =>
      !element.hidden && !element.closest('[hidden]') && (element.textContent ?? '').trim() !== '',
  );

function hostFor(trigger: HTMLElement, scope: HTMLElement): HTMLElement {
  const existing = scope.querySelector<HTMLElement>('[data-work-host]');
  if (existing) return existing;
  const host = document.createElement('div');
  host.className = 'work-progress';
  host.dataset.workHost = '';
  host.hidden = true;
  const anchor = trigger.closest('.tool-actions') ?? trigger;
  anchor.after(host);
  return host;
}

export interface DoWorkOptions {
  /**
   * true(기본): 처리 뒤 결과가 보이지 않으면(입력 오류·할 일 없음) 체크리스트를 바로 닫는다.
   * false: 결과를 처리 함수 밖에서 여는 경우(run-gate).
   */
  expectResult?: boolean;
}

export async function doWork(
  trigger: HTMLElement,
  task: () => unknown,
  options: DoWorkOptions = {},
): Promise<void> {
  const scope =
    typeof trigger.closest === 'function' ? trigger.closest<HTMLElement>('article.tool') : null;
  const spec = scope ? WORK_STEPS[scope.dataset.toolSlug ?? ''] : undefined;
  if (!scope || !spec) {
    await task();
    return;
  }

  // 체크리스트가 도는 동안 다시 누르면 무시한다(처리 함수가 버튼을 먼저 다시 켜기 때문).
  if (scope.dataset.working === 'true') return;
  const expectResult = options.expectResult ?? true;
  const host = hostFor(trigger, scope);
  scope.dataset.working = 'true';
  const button = trigger instanceof HTMLButtonElement ? trigger : null;
  try {
    await runWithProgress(host, {
      title: spec.title,
      steps: spec.steps,
      units: spec.units,
      task: async () => {
        await task();
        if (button) button.disabled = true;
        if (visible(scope, '.error[role="alert"]')) throw new NoResult();
        if (expectResult && !visible(scope, '.result-panel, [data-work-result]'))
          throw new NoResult();
      },
    });
    delete scope.dataset.working;
    scope
      .querySelector<HTMLElement>('.result-panel:not([hidden])')
      ?.focus({ preventScroll: false });
  } catch (cause) {
    host.hidden = true;
    if (!(cause instanceof NoResult)) throw cause;
  } finally {
    delete scope.dataset.working;
    if (button) button.disabled = false;
  }
}
