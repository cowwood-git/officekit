/**
 * 접어 둔 "세부 설정"(details[data-tool-advanced]).
 * - 요약 줄에 기본값에서 바꾼 항목 수를 보여 줘서, 접혀 있어도 무엇이 바뀌었는지 알 수 있다.
 * - 펼침 상태는 이 브라우저에만 기억한다(도구별). 저장소가 막혀 있어도 그대로 동작한다.
 */

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isChanged(control: Control): boolean {
  if (control instanceof HTMLSelectElement) {
    const options = Array.from(control.options);
    const initial = Math.max(
      0,
      options.findIndex((option) => option.defaultSelected),
    );
    return control.selectedIndex !== initial;
  }
  if (control instanceof HTMLInputElement) {
    if (control.type === 'file' || control.type === 'button') return false;
    if (control.type === 'checkbox' || control.type === 'radio') {
      return control.checked !== control.defaultChecked;
    }
  }
  return control.value.toLowerCase() !== control.defaultValue.toLowerCase();
}

function storageKey(slug: string, index: number): string {
  return `officekit:advanced:${slug}:${index}`;
}

function setupAdvanced(details: HTMLDetailsElement, slug: string, index: number) {
  const state = details.querySelector<HTMLElement>('[data-advanced-state]');
  const controls = (): Control[] =>
    Array.from(details.querySelectorAll<Control>('input, select, textarea'));

  const update = () => {
    if (!state) return;
    const changed = controls().filter(isChanged).length;
    state.textContent = changed > 0 ? `${changed}개 바꿈` : '기본값';
    state.toggleAttribute('data-changed', changed > 0);
  };

  try {
    if (localStorage.getItem(storageKey(slug, index)) === 'open') details.open = true;
  } catch {
    // 저장소를 쓸 수 없으면 접힌 채로 둔다.
  }

  details.addEventListener('toggle', () => {
    try {
      if (details.open) localStorage.setItem(storageKey(slug, index), 'open');
      else localStorage.removeItem(storageKey(slug, index));
    } catch {
      // 기억하지 못해도 동작에는 문제없다.
    }
  });
  details.addEventListener('input', update);
  details.addEventListener('change', update);
  // 도구 스크립트가 값을 직접 바꾸는 경우(다시 선택·초기화 등)도 따라간다.
  document.addEventListener('click', () => requestAnimationFrame(update));
  update();
  details.dataset.advancedReady = '';
}

const article = document.querySelector<HTMLElement>('article.tool[data-tool-slug]');
const slug = article?.dataset.toolSlug ?? location.pathname;
const panels = document.querySelectorAll<HTMLDetailsElement>('details[data-tool-advanced]');
for (const [index, details] of Array.from(panels).entries()) {
  setupAdvanced(details, slug, index);
}
