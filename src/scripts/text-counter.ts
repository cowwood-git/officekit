import { countText } from '@/lib/text-stats';

export function initTextCounter(): void {
  const input = document.getElementById('text-input');
  if (!(input instanceof HTMLTextAreaElement)) return;

  const outputs = document.querySelectorAll<HTMLElement>('[data-stat]');
  if (outputs.length === 0) return;

  const render = () => {
    const stats = countText(input.value);
    const values: Record<string, number> = {
      chars: stats.charsWithSpaces,
      charsNoSpace: stats.charsWithoutSpaces,
      words: stats.words,
      lines: stats.lines,
      sentences: stats.sentences,
      korean: stats.koreanChars,
      bytes: stats.bytes,
    };

    outputs.forEach((node) => {
      const key = node.dataset.stat;
      if (!key) return;
      const value = values[key];
      node.textContent = new Intl.NumberFormat('ko-KR').format(value ?? 0);
    });
  };

  input.addEventListener('input', render);
  render();
}
