import {
  type CsvCleanOptions,
  cleanTable,
  FILTER_OPERATORS,
  type FilterOperator,
  headerLabels,
  toCsv,
} from '@/lib/csv-clean';
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

export function initCsvClean(): void {
  const input = byId<HTMLInputElement>('cc-input');
  const drop = byId<HTMLElement>('cc-drop');
  const panel = byId<HTMLElement>('cc-panel');
  const fileInfo = byId<HTMLElement>('cc-file-info');
  const trim = byId<HTMLInputElement>('cc-trim');
  const removeEmpty = byId<HTMLInputElement>('cc-remove-empty');
  const dedupe = byId<HTMLInputElement>('cc-dedupe');
  const sortColumn = byId<HTMLSelectElement>('cc-sort-column');
  const sortDirection = byId<HTMLSelectElement>('cc-sort-direction');
  const numericSort = byId<HTMLInputElement>('cc-numeric');
  const filterColumn = byId<HTMLSelectElement>('cc-filter-column');
  const filterOperator = byId<HTMLSelectElement>('cc-filter-operator');
  const filterValue = byId<HTMLInputElement>('cc-filter-value');
  const preview = byId<HTMLTableElement>('cc-preview');
  const previewNote = byId<HTMLElement>('cc-preview-note');
  const stats = {
    input: byId<HTMLElement>('cc-stat-input'),
    output: byId<HTMLElement>('cc-stat-output'),
    empty: byId<HTMLElement>('cc-stat-empty'),
    duplicate: byId<HTMLElement>('cc-stat-duplicate'),
    filtered: byId<HTMLElement>('cc-stat-filtered'),
  };
  const csvDownload = byId<HTMLAnchorElement>('cc-csv');
  const xlsxDownload = byId<HTMLAnchorElement>('cc-xlsx');
  const runButton = byId<HTMLButtonElement>('cc-run');
  const result = byId<HTMLElement>('cc-result');
  const clearButton = byId<HTMLButtonElement>('cc-clear');
  const status = byId<HTMLElement>('cc-status');
  const error = byId<HTMLElement>('cc-error');

  if (
    !input ||
    !drop ||
    !panel ||
    !trim ||
    !removeEmpty ||
    !dedupe ||
    !sortColumn ||
    !sortDirection ||
    !filterColumn ||
    !filterOperator ||
    !filterValue ||
    !preview ||
    !runButton ||
    !status ||
    !error
  ) {
    return;
  }

  for (const operator of FILTER_OPERATORS) {
    const option = document.createElement('option');
    option.value = operator.value;
    option.textContent = operator.label;
    filterOperator.append(option);
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

  const options = (): CsvCleanOptions => ({
    trim: trim.checked,
    removeEmptyRows: removeEmpty.checked,
    dedupe: dedupe.checked,
    sortColumn: Number(sortColumn.value),
    sortDirection: sortDirection.value === 'desc' ? 'desc' : 'asc',
    numericSort: numericSort?.checked ?? false,
    filterColumn: Number(filterColumn.value),
    filterOperator: filterOperator.value as FilterOperator,
    filterValue: filterValue.value,
  });

  const fillColumns = () => {
    if (!state) return;
    const labels = headerLabels(state.rows[0] ?? []);
    const previousSort = sortColumn.value;
    const previousFilter = filterColumn.value;
    sortColumn.replaceChildren();
    filterColumn.replaceChildren();

    const noneSort = document.createElement('option');
    noneSort.value = '-1';
    noneSort.textContent = '정렬 안 함';
    sortColumn.append(noneSort);

    const noneFilter = document.createElement('option');
    noneFilter.value = '-1';
    noneFilter.textContent = '필터 안 함';
    filterColumn.append(noneFilter);

    labels.forEach((label, index) => {
      const sortOption = document.createElement('option');
      sortOption.value = String(index);
      sortOption.textContent = label;
      sortColumn.append(sortOption);
      const filterOption = document.createElement('option');
      filterOption.value = String(index);
      filterOption.textContent = label;
      filterColumn.append(filterOption);
    });
    sortColumn.value = previousSort;
    filterColumn.value = previousFilter;
  };

  const renderTable = (rows: string[][]) => {
    preview.replaceChildren();
    if (rows.length === 0) return;
    const header = rows[0] ?? [];
    const visibleColumns = Math.min(header.length, 12);
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (let column = 0; column < visibleColumns; column += 1) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = header[column] ?? '';
      headerRow.append(th);
    }
    thead.append(headerRow);
    preview.append(thead);

    const tbody = document.createElement('tbody');
    for (const row of rows.slice(1, 51)) {
      const tr = document.createElement('tr');
      for (let column = 0; column < visibleColumns; column += 1) {
        const td = document.createElement('td');
        td.textContent = row[column] ?? '';
        tr.append(td);
      }
      tbody.append(tr);
    }
    preview.append(tbody);

    if (previewNote) {
      const total = rows.length - 1;
      const hiddenColumns = header.length - visibleColumns;
      const notes = [`상위 ${Math.min(50, total)}행 미리보기`];
      if (total > 50) notes.push(`전체 ${total}행`);
      if (hiddenColumns > 0) notes.push(`${hiddenColumns}개 열 숨김`);
      previewNote.textContent = notes.join(' · ');
    }
  };

  const run = () => {
    const loaded = state;
    if (!loaded) return;
    revoke();
    showError('');
    const cleaned = cleanTable(loaded.rows, options());
    renderTable(cleaned.rows);
    if (stats.input) stats.input.textContent = String(cleaned.stats.inputRows);
    if (stats.output) stats.output.textContent = String(cleaned.stats.outputRows);
    if (stats.empty) stats.empty.textContent = String(cleaned.stats.emptyRemoved);
    if (stats.duplicate) stats.duplicate.textContent = String(cleaned.stats.duplicatesRemoved);
    if (stats.filtered) stats.filtered.textContent = String(cleaned.stats.filteredOut);

    const base = safeFileName(loaded.file.name.replace(/\.[^.]+$/, '')) || 'data';
    const csvText = `\uFEFF${toCsv(cleaned.rows)}`;
    loaded.csvUrl = URL.createObjectURL(new Blob([csvText], { type: 'text/csv;charset=utf-8' }));
    if (csvDownload) {
      csvDownload.href = loaded.csvUrl;
      csvDownload.download = `${base}-cleaned.csv`;
      csvDownload.textContent = '정리된 CSV';
      csvDownload.hidden = false;
    }

    void (async () => {
      try {
        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(cleaned.rows), '정리');
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
          xlsxDownload.download = `${base}-cleaned.xlsx`;
          xlsxDownload.textContent = '정리된 XLSX';
          xlsxDownload.hidden = false;
        }
      } catch (cause) {
        console.error(cause);
        if (stats.filtered) stats.filtered.textContent = String(cleaned.stats.filteredOut);
        showError('XLSX를 만들지 못했습니다. CSV로 내려받으세요.');
      }
    })();

    status.textContent = `${cleaned.stats.inputRows}행 → ${cleaned.stats.outputRows}행으로 정리했습니다.`;
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

      if (state?.csvUrl) URL.revokeObjectURL(state.csvUrl);
      if (state?.xlsxUrl) URL.revokeObjectURL(state.xlsxUrl);
      state = { file, rows };
      if (fileInfo) {
        fileInfo.textContent = `${file.name} · ${sheetName} 시트 · ${Math.max(0, rows.length - 1)}행 · ${formatBytes(file.size)}`;
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
    controls: [
      trim,
      removeEmpty,
      dedupe,
      sortColumn,
      sortDirection,
      numericSort,
      filterColumn,
      filterOperator,
      filterValue,
    ],
    run,
    onInvalidate: revoke,
  });

  clearButton?.addEventListener('click', () => {
    revoke();
    gate.reset();
    state = null;
    panel.hidden = true;
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
