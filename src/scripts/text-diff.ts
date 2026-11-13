import { type DiffResult, diffFileName, diffLines, diffSummary, toDiffText } from '@/lib/text-diff';
import { renderDiffRows } from './diff-view';

let downloadUrl: string | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initTextDiff(): void {
  const oldInput = byId<HTMLTextAreaElement>('td-old');
  const newInput = byId<HTMLTextAreaElement>('td-new');
  const ignoreSpace = byId<HTMLInputElement>('td-ignore-space');
  const ignoreCase = byId<HTMLInputElement>('td-ignore-case');
  const onlyChanged = byId<HTMLInputElement>('td-only-changed');
  const runButton = byId<HTMLButtonElement>('td-run');
  const swapButton = byId<HTMLButtonElement>('td-swap');
  const clearButton = byId<HTMLButtonElement>('td-clear');
  const status = byId<HTMLElement>('td-status');
  const error = byId<HTMLElement>('td-error');
  const result = byId<HTMLElement>('td-result');
  const summary = byId<HTMLElement>('td-summary');
  const list = byId<HTMLOListElement>('td-list');
  const note = byId<HTMLElement>('td-note');
  const copyButton = byId<HTMLButtonElement>('td-copy');
  const download = byId<HTMLAnchorElement>('td-download');
  const stats = {
    added: byId<HTMLElement>('td-stat-added'),
    removed: byId<HTMLElement>('td-stat-removed'),
    changed: byId<HTMLElement>('td-stat-changed'),
    unchanged: byId<HTMLElement>('td-stat-unchanged'),
  };

  if (
    !oldInput ||
    !newInput ||
    !ignoreSpace ||
    !ignoreCase ||
    !onlyChanged ||
    !runButton ||
    !status ||
    !error ||
    !result ||
    !summary ||
    !list
  ) {
    return;
  }

  let last: DiffResult | null = null;
  let dirty = false;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const revoke = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = null;
    if (download) {
      download.hidden = true;
      download.removeAttribute('href');
    }
  };

  const renderRows = () => {
    if (!last) return;
    const rendered = renderDiffRows(list, last.rows, {
      onlyChanged: onlyChanged.checked,
      maxRows: 4000,
    });
    if (note) {
      if (rendered.total === 0) {
        note.hidden = false;
        note.textContent = last.identical ? '두 텍스트가 같습니다.' : '표시할 바뀐 줄이 없습니다.';
      } else if (rendered.truncated) {
        note.hidden = false;
        note.textContent = `화면에는 ${rendered.shown.toLocaleString('ko-KR')}줄만 표시합니다. 전체 결과는 TXT로 내려받으세요.`;
      } else {
        note.hidden = true;
        note.textContent = '';
      }
    }
  };

  const updateStats = (value: DiffResult) => {
    if (stats.added) stats.added.textContent = String(value.stats.added);
    if (stats.removed) stats.removed.textContent = String(value.stats.removed);
    if (stats.changed) stats.changed.textContent = String(value.stats.changed);
    if (stats.unchanged) stats.unchanged.textContent = String(value.stats.unchanged);
    summary.textContent = diffSummary(value.stats);
  };

  const updateDownload = (value: DiffResult) => {
    revoke();
    if (!download) return;
    const text = [
      `원본 ${value.stats.oldLines}줄 → 수정본 ${value.stats.newLines}줄`,
      diffSummary(value.stats),
      '',
      toDiffText(value.rows),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadUrl = URL.createObjectURL(blob);
    download.href = downloadUrl;
    download.download = diffFileName('원본', '수정본');
    download.textContent = 'TXT로 내려받기';
    download.hidden = false;
  };

  const run = () => {
    showError('');
    if (oldInput.value === '' && newInput.value === '') {
      showError('비교할 두 텍스트를 입력하세요.');
      result.hidden = true;
      status.textContent = '';
      return;
    }

    runButton.disabled = true;
    runButton.setAttribute('aria-busy', 'true');
    try {
      const value = diffLines(oldInput.value, newInput.value, {
        ignoreWhitespace: ignoreSpace.checked,
        ignoreCase: ignoreCase.checked,
      });
      last = value;
      dirty = false;
      updateStats(value);
      renderRows();
      updateDownload(value);
      result.hidden = false;
      status.textContent = value.identical
        ? '두 텍스트가 같습니다.'
        : '비교했습니다. 아래에서 바뀐 줄을 확인하세요.';
    } catch (cause) {
      console.error(cause);
      last = null;
      result.hidden = true;
      showError(cause instanceof Error ? cause.message : '텍스트를 비교하지 못했습니다.');
      status.textContent = '';
    } finally {
      runButton.disabled = false;
      runButton.removeAttribute('aria-busy');
    }
  };

  const markDirty = () => {
    if (!last || dirty) return;
    dirty = true;
    status.textContent = '내용이 바뀌었습니다. [비교하기]를 다시 누르세요.';
  };

  for (const control of [oldInput, newInput, ignoreSpace, ignoreCase]) {
    control.addEventListener('input', markDirty);
    control.addEventListener('change', markDirty);
  }

  onlyChanged.addEventListener('change', renderRows);
  runButton.addEventListener('click', run);

  swapButton?.addEventListener('click', () => {
    const oldValue = oldInput.value;
    oldInput.value = newInput.value;
    newInput.value = oldValue;
    if (oldInput.value !== '' || newInput.value !== '') run();
  });

  clearButton?.addEventListener('click', () => {
    oldInput.value = '';
    newInput.value = '';
    last = null;
    dirty = false;
    result.hidden = true;
    revoke();
    showError('');
    status.textContent = '';
    oldInput.focus();
  });

  copyButton?.addEventListener('click', async () => {
    if (!last) return;
    try {
      await navigator.clipboard.writeText(toDiffText(last.rows));
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = '결과 복사';
      }, 1500);
    } catch {
      showError('자동 복사가 차단되었습니다. 결과를 선택해 복사하세요.');
    }
  });

  for (const area of [oldInput, newInput]) {
    area.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        run();
      }
    });
  }

  window.addEventListener('pagehide', revoke);
}
