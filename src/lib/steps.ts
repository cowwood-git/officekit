/**
 * 단계 UI — 01 파일 → 02 설정 → 03 결과 (docs/design.md §4, docs/scale-plan.md §4).
 *
 * 마법사형: 완료 단계는 한 줄 요약 + [수정], 현재 단계만 펼침, 예정 단계는 흐린 제목 + 안내.
 * 안내형(작업대형): 번호 머리만 보여 주고 모든 단계를 펼친다 — 이 컨트롤러를 쓰지 않는다.
 */

export type StepState = 'done' | 'current' | 'upcoming';

/** 현재 단계(1부터)에 따른 각 단계의 상태 */
export function stepStates(count: number, current: number): StepState[] {
  const at = Math.min(Math.max(current, 1), count);
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    if (n < at) return 'done';
    if (n === at) return 'current';
    return 'upcoming';
  });
}

export interface Steps {
  readonly current: number;
  go(n: number, options?: { focus?: boolean }): void;
  summary(n: number, text: string): void;
}

export function createSteps(root: HTMLElement): Steps {
  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
  let current = 1;

  const apply = (focus: boolean) => {
    const states = stepStates(sections.length, current);
    sections.forEach((section, index) => {
      const state = states[index] ?? 'upcoming';
      section.dataset.state = state;
      if (state === 'current') section.setAttribute('aria-current', 'step');
      else section.removeAttribute('aria-current');
      const body = section.querySelector<HTMLElement>('[data-step-body]');
      if (body) body.hidden = state !== 'current';
      const edit = section.querySelector<HTMLElement>('[data-step-edit]');
      if (edit) edit.hidden = state !== 'done';
    });
    if (focus) {
      const head = sections[current - 1]?.querySelector<HTMLElement>('[data-step-title]');
      head?.focus({ preventScroll: false });
    }
  };

  root.addEventListener('click', (event) => {
    const edit = (event.target as Element | null)?.closest<HTMLElement>('[data-step-edit]');
    if (!edit) return;
    const section = edit.closest<HTMLElement>('[data-step]');
    const n = Number(section?.dataset.step);
    if (n) steps.go(n, { focus: true });
  });

  const steps: Steps = {
    get current() {
      return current;
    },
    go(n, options) {
      const next = Math.min(Math.max(n, 1), sections.length);
      if (next === current && root.dataset.ready === 'true') return;
      current = next;
      apply(options?.focus ?? false);
    },
    summary(n, text) {
      const target = sections[n - 1]?.querySelector<HTMLElement>('[data-step-summary]');
      if (target) target.textContent = text;
    },
  };

  apply(false);
  root.dataset.ready = 'true';
  return steps;
}
