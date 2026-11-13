import { describe, expect, it } from 'vitest';
import { createRunGate, readyMessage, staleMessage } from '../src/lib/run-gate';

/** DOM 없이 돌리기 위한 최소 가짜 요소 (Node 의 EventTarget 사용). */
class FakeElement extends EventTarget {
  hidden = false;
  disabled = false;
  textContent: string | null = '';
  attrs = new Map<string, string>();
  setAttribute(name: string, value: string) {
    this.attrs.set(name, value);
  }
  removeAttribute(name: string) {
    this.attrs.delete(name);
  }
}

const setup = (run: () => unknown = () => undefined) => {
  const button = new FakeElement();
  button.textContent = '정리하기';
  const result = new FakeElement();
  const status = new FakeElement();
  const control = new FakeElement();
  let invalidated = 0;
  const gate = createRunGate({
    button: button as unknown as HTMLButtonElement,
    result: result as unknown as HTMLElement,
    status: status as unknown as HTMLElement,
    controls: [control as unknown as Element],
    run,
    onInvalidate: () => {
      invalidated += 1;
    },
  });
  const click = async () => {
    button.dispatchEvent(new Event('click'));
    await new Promise((resolve) => setTimeout(resolve, 0));
  };
  return { gate, button, result, status, control, click, invalidated: () => invalidated };
};

describe('createRunGate', () => {
  it('파일을 고르기 전에는 실행 버튼이 꺼져 있고 결과가 숨겨진다', () => {
    const { button, result } = setup();
    expect(button.disabled).toBe(true);
    expect(result.hidden).toBe(true);
  });

  it('파일을 고르면 실행하지 않고 안내만 한다', () => {
    let runs = 0;
    const { gate, button, result, status } = setup(() => {
      runs += 1;
    });
    gate.ready();
    expect(runs).toBe(0);
    expect(button.disabled).toBe(false);
    expect(result.hidden).toBe(true);
    expect(status.textContent).toBe(readyMessage('정리하기'));
  });

  it('실행을 누르면 처리하고 결과를 보여 준다', async () => {
    let runs = 0;
    const { gate, result, click } = setup(() => {
      runs += 1;
    });
    gate.ready();
    await click();
    expect(runs).toBe(1);
    expect(result.hidden).toBe(false);
  });

  it('run 이 false 를 돌려주면 결과를 보여 주지 않는다', async () => {
    const { gate, result, click } = setup(() => false);
    gate.ready();
    await click();
    expect(result.hidden).toBe(true);
  });

  it('결과가 나온 뒤 설정을 바꾸면 결과를 숨기고 다시 누르라고 한다', async () => {
    const { gate, result, status, control, click, invalidated } = setup();
    gate.ready();
    await click();
    control.dispatchEvent(new Event('change'));
    expect(result.hidden).toBe(true);
    expect(invalidated()).toBe(1);
    expect(status.textContent).toBe(staleMessage('정리하기'));
  });

  it('결과가 없을 때 설정을 바꾸면 안내를 덮어쓰지 않는다', () => {
    const { gate, status, control, invalidated } = setup();
    gate.ready();
    control.dispatchEvent(new Event('input'));
    expect(invalidated()).toBe(0);
    expect(status.textContent).toBe(readyMessage('정리하기'));
  });

  it('reset 하면 버튼이 다시 꺼진다', async () => {
    let runs = 0;
    const { gate, button, click } = setup(() => {
      runs += 1;
    });
    gate.ready();
    gate.reset();
    expect(button.disabled).toBe(true);
    await click();
    expect(runs).toBe(0);
  });
});
