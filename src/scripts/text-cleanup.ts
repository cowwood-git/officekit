import {
  type CleanupOptions,
  cleanText,
  cleanupFileName,
  cleanupStats,
  type NumberingMode,
  type SortMode,
} from '@/lib/text-cleanup';

let downloadUrl: string | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initTextCleanup(): void {
  const input = byId<HTMLTextAreaElement>('tc-input');
  const output = byId<HTMLTextAreaElement>('tc-output');
  const trim = byId<HTMLInputElement>('tc-trim');
  const removeEmpty = byId<HTMLInputElement>('tc-remove-empty');
  const dedupe = byId<HTMLInputElement>('tc-dedupe');
  const collapse = byId<HTMLInputElement>('tc-collapse');
  const sort = byId<HTMLSelectElement>('tc-sort');
  const numbering = byId<HTMLSelectElement>('tc-numbering');
  const copyButton = byId<HTMLButtonElement>('tc-copy');
  const download = byId<HTMLAnchorElement>('tc-download');
  const clearButton = byId<HTMLButtonElement>('tc-clear');
  const swapButton = byId<HTMLButtonElement>('tc-swap');
  const status = byId<HTMLElement>('tc-status');
  const stats = {
    input: byId<HTMLElement>('tc-stat-input'),
    output: byId<HTMLElement>('tc-stat-output'),
    removed: byId<HTMLElement>('tc-stat-removed'),
    duplicate: byId<HTMLElement>('tc-stat-duplicate'),
  };

  if (
    !input ||
    !output ||
    !trim ||
    !removeEmpty ||
    !dedupe ||
    !collapse ||
    !sort ||
    !numbering ||
    !status
  ) {
    return;
  }

  const options = (): CleanupOptions => ({
    trim: trim.checked,
    removeEmpty: removeEmpty.checked,
    dedupe: dedupe.checked,
    collapseSpaces: collapse.checked,
    sort: sort.value as SortMode,
    numbering: numbering.value as NumberingMode,
  });

  const run = () => {
    const cleaned = cleanText(input.value, options());
    output.value = cleaned;
    const summary = cleanupStats(input.value, cleaned);
    if (stats.input) stats.input.textContent = String(summary.inputLines);
    if (stats.output) stats.output.textContent = String(summary.outputLines);
    if (stats.removed) stats.removed.textContent = String(summary.removedLines);
    if (stats.duplicate) stats.duplicate.textContent = String(summary.duplicateLines);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      downloadUrl = null;
    }
    if (download) {
      if (cleaned === '') {
        download.hidden = true;
        download.removeAttribute('href');
      } else {
        downloadUrl = URL.createObjectURL(
          new Blob([cleaned], { type: 'text/plain;charset=utf-8' }),
        );
        download.href = downloadUrl;
        download.download = cleanupFileName();
        download.textContent = 'TXT로 내려받기';
        download.hidden = false;
      }
    }
    status.textContent =
      cleaned === '' ? '정리할 내용을 입력하세요.' : `${summary.outputLines}줄로 정리했습니다.`;
  };

  for (const control of [trim, removeEmpty, dedupe, collapse, sort, numbering]) {
    control.addEventListener('change', run);
  }
  input.addEventListener('input', run);

  copyButton?.addEventListener('click', async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = '결과 복사';
      }, 1500);
    } catch {
      status.textContent = '자동 복사가 차단되었습니다. 결과를 선택해 복사하세요.';
    }
  });

  clearButton?.addEventListener('click', () => {
    input.value = '';
    run();
    input.focus();
  });

  swapButton?.addEventListener('click', () => {
    if (!output.value) return;
    input.value = output.value;
    run();
  });

  run();
  window.addEventListener('pagehide', () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  });
}
