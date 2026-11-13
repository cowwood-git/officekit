import {
  type TableAlign,
  type TableOptions,
  tableFileName,
  toHtmlTable,
  toMarkdownTable,
} from '@/lib/csv-table';
import { formatBytes, MAX_TOTAL_BYTES, safeFileName } from '@/lib/files';
import { createRunGate } from '@/lib/run-gate';
import { readTableFile } from '@/lib/table-file';

interface State {
  file: File;
  rows: string[][];
  outputUrl?: string;
}

let state: State | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initCsvTable(): void {
  const input = byId<HTMLInputElement>('ct-input');
  const drop = byId<HTMLElement>('ct-drop');
  const panel = byId<HTMLElement>('ct-panel');
  const fileInfo = byId<HTMLElement>('ct-file-info');
  const headerCheck = byId<HTMLInputElement>('ct-header');
  const alignSelect = byId<HTMLSelectElement>('ct-align');
  const formatSelect = byId<HTMLSelectElement>('ct-format');
  const preview = byId<HTMLElement>('ct-preview');
  const previewNote = byId<HTMLElement>('ct-preview-note');
  const code = byId<HTMLTextAreaElement>('ct-code');
  const copyButton = byId<HTMLButtonElement>('ct-copy');
  const download = byId<HTMLAnchorElement>('ct-download');
  const runButton = byId<HTMLButtonElement>('ct-run');
  const result = byId<HTMLElement>('ct-result');
  const clearButton = byId<HTMLButtonElement>('ct-clear');
  const status = byId<HTMLElement>('ct-status');
  const error = byId<HTMLElement>('ct-error');

  if (
    !input ||
    !drop ||
    !panel ||
    !headerCheck ||
    !alignSelect ||
    !formatSelect ||
    !preview ||
    !code ||
    !runButton ||
    !status ||
    !error
  ) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const revoke = () => {
    if (state?.outputUrl) URL.revokeObjectURL(state.outputUrl);
    if (state) state.outputUrl = undefined;
    if (download) {
      download.hidden = true;
      download.removeAttribute('href');
    }
  };

  const options = (): TableOptions => ({
    header: headerCheck.checked,
    align: alignSelect.value as TableAlign,
  });

  const run = () => {
    const loaded = state;
    if (!loaded) return;
    revoke();
    showError('');
    const tableOptions = options();
    const isMarkdown = formatSelect.value === 'markdown';
    const full = isMarkdown
      ? toMarkdownTable(loaded.rows, tableOptions)
      : toHtmlTable(loaded.rows, tableOptions);
    const previewRows = [loaded.rows[0] ?? [], ...loaded.rows.slice(1, 51)];
    preview.innerHTML = toHtmlTable(previewRows, tableOptions);
    code.value = full;

    if (previewNote) {
      const total = Math.max(0, loaded.rows.length - 1);
      const hidden = total - Math.min(50, total);
      previewNote.textContent =
        hidden > 0 ? `상위 ${Math.min(50, total)}행 미리보기 · 전체 ${total}행` : `전체 ${total}행`;
    }

    const base = safeFileName(loaded.file.name.replace(/\.[^.]+$/, '')) || 'table';
    const extension = isMarkdown ? 'md' : 'html';
    loaded.outputUrl = URL.createObjectURL(
      new Blob([full], {
        type: isMarkdown ? 'text/markdown;charset=utf-8' : 'text/html;charset=utf-8',
      }),
    );
    if (download) {
      download.href = loaded.outputUrl;
      download.download = tableFileName(base, extension);
      download.textContent = isMarkdown ? 'Markdown 내려받기' : 'HTML 내려받기';
      download.hidden = false;
    }
    status.textContent = `${loaded.rows.length - 1}행을 ${isMarkdown ? 'Markdown' : 'HTML'} 표로 만들었습니다.`;
  };

  const acceptFile = async (file: File) => {
    showError('');
    revoke();
    if (!/\.(csv|tsv|xlsx|xls|ods)$/i.test(file.name)) {
      showError('CSV·TSV·XLSX·XLS·ODS 파일만 사용할 수 있습니다.');
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showError(`파일이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다.`);
      return;
    }

    status.textContent = '표를 읽는 중…';
    try {
      const { rows, sheetName } = await readTableFile(file);
      if (rows.length === 0) throw new Error('데이터가 없습니다.');

      state = { file, rows };
      if (fileInfo) {
        fileInfo.textContent = `${file.name} · ${sheetName} 시트 · ${Math.max(0, rows.length - 1)}행 · ${formatBytes(file.size)}`;
      }
      panel.hidden = false;
      gate.ready();
    } catch (cause) {
      console.error(cause);
      state = null;
      panel.hidden = true;
      showError('표를 읽지 못했습니다. 파일 형식과 인코딩을 확인하세요.');
      status.textContent = '';
    }
  };

  const gate = createRunGate({
    button: runButton,
    result,
    status,
    controls: [headerCheck, alignSelect, formatSelect],
    run,
    onInvalidate: revoke,
  });

  copyButton?.addEventListener('click', async () => {
    if (!code.value) return;
    try {
      await navigator.clipboard.writeText(code.value);
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = '코드 복사';
      }, 1500);
    } catch {
      status.textContent = '자동 복사가 차단되었습니다. 코드를 선택해 복사하세요.';
    }
  });

  clearButton?.addEventListener('click', () => {
    revoke();
    gate.reset();
    state = null;
    panel.hidden = true;
    code.value = '';
    preview.replaceChildren();
    status.textContent = '';
    showError('');
  });

  drop.addEventListener('dragover', (event) => {
    event.preventDefault();
    drop.dataset.drag = 'true';
  });
  drop.addEventListener('dragleave', () => {
    drop.dataset.drag = 'false';
  });
  drop.addEventListener('drop', (event) => {
    event.preventDefault();
    drop.dataset.drag = 'false';
    const file = event.dataTransfer?.files?.[0];
    if (file) void acceptFile(file);
  });
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void acceptFile(file);
    input.value = '';
  });

  window.addEventListener('pagehide', revoke);
}
