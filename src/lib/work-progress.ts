/**
 * 작업 진행 체크리스트 — 실제 처리 단계를 하나씩 체크하며 보여 준다.
 *
 * 왜: 브라우저 처리는 0.1초 만에 끝나기도 해서 "아무 일도 안 한 것처럼" 보인다.
 * 실제로 하는 단계(구조 확인 → 분리 → 생성 → 묶기)를 차례로 보여 주고,
 * 최소 시간(파일 크기에 비례, 최대 4초)을 채운 뒤 결과를 연다.
 *
 * 원칙:
 * - 단계 이름은 실제로 하는 일만 쓴다(없는 "AI 분석" 같은 단계 금지).
 * - 실제 처리가 더 오래 걸리면 마지막 단계에서 진짜 끝날 때까지 기다린다.
 * - 오류가 나면 그 즉시 멈추고 알린다(가짜로 기다리게 하지 않는다).
 * - 이 패널 안에는 광고를 넣지 않는다(docs/ad-policy.md).
 */

const MIN_MS = 1200;
const PER_UNIT_MS = 60;
const MAX_MS = 4000;

/** 처리 단위(쪽·장·행 묶음 수)에 따른 최소 표시 시간 */
export function workDuration(units: number): number {
  const n = Number.isFinite(units) && units > 0 ? units : 1;
  return Math.min(MAX_MS, Math.round(MIN_MS + n * PER_UNIT_MS));
}

/** 각 단계가 시작되는 시각(ms). 단계를 고르게 나눈다. */
export function stepSchedule(count: number, totalMs: number): number[] {
  if (count <= 0) return [];
  const each = totalMs / count;
  return Array.from({ length: count }, (_, index) => Math.round(index * each));
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms)));

export interface WorkOptions<T> {
  /** 체크리스트에 보일 실제 단계 이름 */
  steps: string[];
  /** 처리 단위 수(쪽·장 등) → 최소 표시 시간 */
  units: number;
  task: () => Promise<T>;
  title?: string;
}

/** host 안에 체크리스트를 그리고 task 를 실행한다. 결과(또는 오류)는 최소 시간이 지난 뒤 돌려준다. */
export async function runWithProgress<T>(host: HTMLElement, options: WorkOptions<T>): Promise<T> {
  const { steps, units, task, title = '작업 중' } = options;
  const total = workDuration(units);
  const schedule = stepSchedule(steps.length, total);

  const heading = document.createElement('p');
  heading.className = 'work-title';
  heading.textContent = title;
  const bar = document.createElement('div');
  bar.className = 'work-bar';
  const fill = document.createElement('span');
  bar.append(fill);
  const list = document.createElement('ol');
  list.className = 'work-steps';
  const items = steps.map((label) => {
    const li = document.createElement('li');
    li.dataset.state = 'pending';
    const mark = document.createElement('span');
    mark.className = 'work-mark';
    mark.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.textContent = label;
    li.append(mark, text);
    list.append(li);
    return li;
  });
  const live = document.createElement('p');
  live.className = 'visually-hidden';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');

  host.replaceChildren(heading, bar, list, live);
  host.hidden = false;
  host.dataset.state = 'running';

  const setFill = (ratio: number, ms: number) => {
    fill.style.transitionDuration = `${ms}ms`;
    fill.style.width = `${Math.round(ratio * 100)}%`;
  };

  const started = performance.now();
  const elapsed = () => performance.now() - started;

  let value: T | undefined;
  let failure: unknown;
  let failed = false;
  let notifyFail: () => void = () => {};
  const failSignal = new Promise<void>((resolve) => {
    notifyFail = resolve;
  });
  const work = task().then(
    (result) => {
      value = result;
    },
    (cause) => {
      failure = cause;
      failed = true;
      notifyFail();
    },
  );

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] as HTMLLIElement;
    item.dataset.state = 'active';
    live.textContent = `${index + 1}/${items.length} ${steps[index]}`;
    const last = index === items.length - 1;
    const until = last ? total : (schedule[index + 1] ?? total);
    setFill((index + (last ? 0.92 : 1)) / items.length, Math.max(0, until - elapsed()));

    await Promise.race([sleep(until - elapsed()), failSignal]);
    if (last) await Promise.race([work, failSignal]);

    if (failed) {
      item.dataset.state = 'failed';
      host.dataset.state = 'failed';
      heading.textContent = '작업을 끝내지 못했습니다';
      live.textContent = '오류가 발생했습니다';
      throw failure;
    }
    item.dataset.state = 'done';
  }

  setFill(1, 200);
  host.dataset.state = 'done';
  heading.textContent = '완료';
  live.textContent = '완료했습니다';
  await sleep(350);
  host.hidden = true;
  return value as T;
}
