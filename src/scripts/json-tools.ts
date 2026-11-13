import {
  diffJson,
  diffText,
  formatJson,
  type JsonResult,
  minifyJson,
  validateJson,
} from '@/lib/json-tools';

type Operation = 'format' | 'minify' | 'validate' | 'diff';

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initJsonTools(): void {
  const operation = byId<HTMLSelectElement>('jt-operation');
  const indent = byId<HTMLSelectElement>('jt-indent');
  const sortKeys = byId<HTMLInputElement>('jt-sort');
  const inputA = byId<HTMLTextAreaElement>('jt-input-a');
  const inputB = byId<HTMLTextAreaElement>('jt-input-b');
  const labelA = byId<HTMLElement>('jt-label-a');
  const labelB = byId<HTMLElement>('jt-label-b');
  const optionsRow = byId<HTMLElement>('jt-options');
  const output = byId<HTMLTextAreaElement>('jt-output');
  const copyButton = byId<HTMLButtonElement>('jt-copy');
  const download = byId<HTMLAnchorElement>('jt-download');
  const clearButton = byId<HTMLButtonElement>('jt-clear');
  const status = byId<HTMLElement>('jt-status');
  const error = byId<HTMLElement>('jt-error');
  const stats = byId<HTMLElement>('jt-stats');

  if (!operation || !indent || !sortKeys || !inputA || !inputB || !output || !status || !error) {
    return;
  }

  let timer: number | undefined;
  let outputUrl: string | null = null;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearDownload = () => {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl = null;
    if (download) {
      download.hidden = true;
      download.removeAttribute('href');
    }
  };

  const showResult = (result: JsonResult, label: string) => {
    if (!result.ok) {
      output.value = '';
      showError(
        `${result.error ?? 'JSON 오류'}${result.line ? ` (${result.line}행 ${result.column ?? 1}열)` : ''}`,
      );
      status.textContent = '';
      clearDownload();
      return;
    }
    output.value = result.text;
    showError('');
    status.textContent = `${label} 완료 · ${result.bytes.toLocaleString()}바이트`;
    if (stats) stats.textContent = `${inputA.value.length.toLocaleString()}자 입력`;
    clearDownload();
    outputUrl = URL.createObjectURL(new Blob([result.text], { type: 'application/json' }));
    if (download) {
      download.href = outputUrl;
      download.download = operation.value === 'diff' ? 'json-diff.txt' : 'output.json';
      download.textContent = '결과 내려받기';
      download.hidden = false;
    }
  };

  const run = () => {
    const selected = operation.value as Operation;
    const isDiff = selected === 'diff';
    inputB.hidden = !isDiff;
    if (labelB) labelB.hidden = !isDiff;
    if (labelA) labelA.textContent = isDiff ? '첫 번째 JSON' : 'JSON 입력';
    if (optionsRow) optionsRow.hidden = selected !== 'format';

    if (selected === 'diff') {
      const result = diffJson(inputA.value, inputB.value);
      if (!result.ok) {
        output.value = '';
        showError(result.error ?? 'JSON 비교 오류');
        status.textContent = '';
        clearDownload();
        return;
      }
      const text = diffText(result.entries);
      output.value = text;
      showError('');
      status.textContent =
        result.entries.length === 0
          ? '두 JSON이 같습니다.'
          : `${result.entries.length}개 차이를 찾았습니다.`;
      if (stats) stats.textContent = `${result.entries.length}개 차이`;
      clearDownload();
      outputUrl = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      if (download) {
        download.href = outputUrl;
        download.download = 'json-diff.txt';
        download.textContent = '차이 내려받기';
        download.hidden = false;
      }
      return;
    }

    if (selected === 'format') {
      showResult(
        formatJson(inputA.value, {
          indent: Number(indent.value) || 2,
          sortKeys: sortKeys.checked,
        }),
        '포맷',
      );
    } else if (selected === 'minify') {
      showResult(minifyJson(inputA.value), '압축');
    } else {
      const checked = validateJson(inputA.value);
      if (checked.ok) {
        output.value = '유효한 JSON입니다.';
        showError('');
        status.textContent = `유효한 JSON · ${checked.bytes.toLocaleString()}바이트`;
        clearDownload();
      } else {
        output.value = '';
        showError(
          `${checked.error ?? 'JSON 오류'}${checked.line ? ` (${checked.line}행 ${checked.column ?? 1}열)` : ''}`,
        );
        status.textContent = '';
        clearDownload();
      }
    }
  };

  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(run, 150);
  };

  for (const control of [operation, indent, sortKeys, inputA, inputB]) {
    control.addEventListener('input', schedule);
    control.addEventListener('change', schedule);
  }

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
    inputA.value = '';
    inputB.value = '';
    output.value = '';
    status.textContent = '';
    showError('');
    clearDownload();
    inputA.focus();
  });

  run();
  window.addEventListener('pagehide', clearDownload);
}
