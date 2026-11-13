import { type Aggregate, pivotFileName, pivotTable, pivotToCsv } from '@/lib/csv-pivot';
import { formatBytes, MAX_TOTAL_BYTES, safeFileName } from '@/lib/files';
import { createRunGate } from '@/lib/run-gate';
import { readTableFile } from '@/lib/table-file';

interface State {
  file: File;
  rows: string[][];
  csvUrl?: string;
  xlsxUrl?: string;
}

let state: State | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initCsvPivot(): void {
  const input = byId<HTMLInputElement>('cpv-input');
  const drop = byId<HTMLElement>('cpv-drop');
  const panel = byId<HTMLElement>('cpv-panel');
  const fileInfo = byId<HTMLElement>('cpv-file-info');
  const rowSelect = byId<HTMLSelectElement>('cpv-row');
  const columnSelect = byId<HTMLSelectElement>('cpv-column');
  const valueSelect = byId<HTMLSelectElement>('cpv-value');
  const aggregateSelect = byId<HTMLSelectElement>('cpv-aggregate');
  const totalsCheck = byId<HTMLInputElement>('cpv-totals');
  const preview = byId<HTMLTableElement>('cpv-preview');
  const stats = byId<HTMLElement>('cpv-stats');
  const csvDownload = byId<HTMLAnchorElement>('cpv-csv');
  const xlsxDownload = byId<HTMLAnchorElement>('cpv-xlsx');
  const runButton = byId<HTMLButtonElement>('cpv-run');
  const result = byId<HTMLElement>('cpv-result');
  const clearButton = byId<HTMLButtonElement>('cpv-clear');
  const status = byId<HTMLElement>('cpv-status');
  const error = byId<HTMLElement>('cpv-error');

  if (
    !input ||
    !drop ||
    !panel ||
    !rowSelect ||
    !columnSelect ||
    !valueSelect ||
    !aggregateSelect ||
    !totalsCheck ||
    !preview ||
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
    if (state?.csvUrl) URL.revokeObjectURL(state.csvUrl);
    if (state?.xlsxUrl) URL.revokeObjectURL(state.xlsxUrl);
    if (state) {
      state.csvUrl = undefined;
      state.xlsxUrl = undefined;
    }
    if (csvDownload) {
      csvDownload.hidden = true;
      csvDownload.removeAttribute('href');
    }
    if (xlsxDownload) {
      xlsxDownload.hidden = true;
      xlsxDownload.removeAttribute('href');
    }
  };

  const renderTable = (headers: string[], rows: string[][]) => {
    preview.replaceChildren();
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const header of headers) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = header;
      headerRow.append(th);
    }
    thead.append(headerRow);
    preview.append(thead);

    const tbody = document.createElement('tbody');
    for (const row of rows.slice(0, 60)) {
      const tr = document.createElement('tr');
      for (const cell of row) {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.append(td);
      }
      tbody.append(tr);
    }
    preview.append(tbody);
  };

  const run = () => {
    const loaded = state;
    if (!loaded) return;
    revoke();
    showError('');
    const result = pivotTable(loaded.rows, {
      rowColumn: Number(rowSelect.value),
      columnColumn: Number(columnSelect.value),
      valueColumn: Number(valueSelect.value),
      aggregate: (aggregateSelect.value as Aggregate) ?? 'sum',
      includeTotals: totalsCheck.checked,
    });
    renderTable(result.headers, result.rows);
    if (stats) {
      stats.textContent = `${result.rowLabels.length}행 × ${result.columnLabels.length}열 · ${result.rows.length}개 결과`;
    }
    if (result.rows.length === 0) {
      status.textContent = '집계할 데이터가 없습니다.';
      return;
    }

    const base = safeFileName(loaded.file.name.replace(/\.[^.]+$/, '')) || 'pivot';
    const csv = pivotToCsv(result);
    loaded.csvUrl = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
    );
    if (csvDownload) {
      csvDownload.href = loaded.csvUrl;
      csvDownload.download = pivotFileName(base);
      csvDownload.textContent = '피벗 CSV';
      csvDownload.hidden = false;
    }

    void (async () => {
      try {
        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.aoa_to_sheet([result.headers, ...result.rows]),
          '피벗',
        );
        const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
        if (state !== loaded) return;
        if (loaded.xlsxUrl) URL.revokeObjectURL(loaded.xlsxUrl);
        loaded.xlsxUrl = URL.createObjectURL(
          new Blob([bytes], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
        );
        if (xlsxDownload) {
          xlsxDownload.href = loaded.xlsxUrl;
          xlsxDownload.download = `${base}-pivot.xlsx`;
          xlsxDownload.textContent = '피벗 XLSX';
          xlsxDownload.hidden = false;
        }
      } catch (cause) {
        console.error(cause);
      }
    })();

    status.textContent = '피벗 표를 만들었습니다.';
  };

  const fillColumns = () => {
    if (!state) return;
    const headers = state.rows[0] ?? [];
    const options = headers.map((header, index) => ({
      value: String(index),
      label: header.trim() || `열 ${index + 1}`,
    }));
    const previousRow = rowSelect.value;
    const previousColumn = columnSelect.value;
    const previousValue = valueSelect.value;
    rowSelect.replaceChildren();
    columnSelect.replaceChildren();
    valueSelect.replaceChildren();
    for (const option of options) {
      for (const select of [rowSelect, columnSelect, valueSelect]) {
        const element = document.createElement('option');
        element.value = option.value;
        element.textContent = option.label;
        select.append(element);
      }
    }
    rowSelect.value = previousRow || '0';
    columnSelect.value = previousColumn || '1';
    valueSelect.value = previousValue || String(Math.min(headers.length - 1, 2));
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
      if (rows.length < 2) throw new Error('데이터가 부족합니다.');
      state = { file, rows };
      if (fileInfo) {
        fileInfo.textContent = `${file.name} · ${sheetName} 시트 · ${rows.length - 1}행 · ${formatBytes(file.size)}`;
      }
      panel.hidden = false;
      fillColumns();
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
    controls: [rowSelect, columnSelect, valueSelect, aggregateSelect, totalsCheck],
    run,
    onInvalidate: revoke,
  });

  clearButton?.addEventListener('click', () => {
    revoke();
    gate.reset();
    state = null;
    panel.hidden = true;
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
