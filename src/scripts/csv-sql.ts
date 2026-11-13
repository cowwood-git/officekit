import { buildSql, type SqlDialect, sqlFileName } from '@/lib/csv-sql';
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

export function initCsvSql(): void {
  const input = byId<HTMLInputElement>('cs-input');
  const drop = byId<HTMLElement>('cs-drop');
  const panel = byId<HTMLElement>('cs-panel');
  const fileInfo = byId<HTMLElement>('cs-file-info');
  const tableInput = byId<HTMLInputElement>('cs-table');
  const dialectSelect = byId<HTMLSelectElement>('cs-dialect');
  const nullCheck = byId<HTMLInputElement>('cs-null');
  const batchInput = byId<HTMLInputElement>('cs-batch');
  const code = byId<HTMLTextAreaElement>('cs-code');
  const stats = byId<HTMLElement>('cs-stats');
  const copyButton = byId<HTMLButtonElement>('cs-copy');
  const download = byId<HTMLAnchorElement>('cs-download');
  const runButton = byId<HTMLButtonElement>('cs-run');
  const result = byId<HTMLElement>('cs-result');
  const clearButton = byId<HTMLButtonElement>('cs-clear');
  const status = byId<HTMLElement>('cs-status');
  const error = byId<HTMLElement>('cs-error');

  if (
    !input ||
    !drop ||
    !panel ||
    !tableInput ||
    !dialectSelect ||
    !nullCheck ||
    !batchInput ||
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

  const run = () => {
    const loaded = state;
    if (!loaded) return;
    revoke();
    showError('');
    const sql = buildSql(loaded.rows, {
      table: tableInput.value || 'table_name',
      dialect: (dialectSelect.value as SqlDialect) ?? 'postgres',
      nullEmpty: nullCheck.checked,
      batchSize: Number(batchInput.value) || 100,
    });
    code.value = sql.full;
    if (stats) {
      stats.textContent = `${Math.max(0, loaded.rows.length - 1)}행 · ${Math.max(0, loaded.rows[0]?.length ?? 0)}열`;
    }
    if (download) {
      loaded.outputUrl = URL.createObjectURL(
        new Blob([sql.full], { type: 'application/sql;charset=utf-8' }),
      );
      download.href = loaded.outputUrl;
      download.download = sqlFileName(loaded.file.name);
      download.textContent = 'SQL 내려받기';
      download.hidden = false;
    }
    status.textContent = 'SQL을 만들었습니다. 코드를 복사하거나 내려받으세요.';
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
      tableInput.value = safeFileName(file.name.replace(/\.[^.]+$/, '')) || 'table_name';
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
    controls: [tableInput, dialectSelect, nullCheck, batchInput],
    run,
    onInvalidate: revoke,
  });

  copyButton?.addEventListener('click', async () => {
    if (!code.value) return;
    try {
      await navigator.clipboard.writeText(code.value);
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = 'SQL 복사';
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
