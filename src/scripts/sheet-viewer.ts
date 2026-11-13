import type { CellObject, Range, WorkBook, WorkSheet } from 'xlsx';
import { formatBytes, MAX_TOTAL_BYTES } from '@/lib/files';
import { columnLabel, formatCellValue, isNumericCell, paginate, sheetFileName } from '@/lib/sheet';

type Encoding = 'auto' | 'utf-8' | 'euc-kr';

interface Loaded {
  file: File;
  xlsx: typeof import('xlsx');
  workbook: WorkBook;
  sheetName: string;
  sheet: WorkSheet;
  range: Range;
  totalRows: number;
  totalCols: number;
  page: number;
  pageSize: number;
  parseMs: number;
  csvUrl?: string;
  jsonUrl?: string;
}

const MAX_COLS = 100;

let state: Loaded | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function isSpreadsheet(file: File): boolean {
  return /\.(csv|xlsx|xls|ods)$/i.test(file.name);
}

function isCsv(file: File): boolean {
  return /\.csv$/i.test(file.name);
}

async function decodeCsv(file: File, encoding: Encoding): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (encoding === 'utf-8') return new TextDecoder('utf-8').decode(buffer);
  if (encoding === 'euc-kr') return new TextDecoder('euc-kr').decode(buffer);

  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(buffer);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('euc-kr').decode(buffer);
  }
}

export function initSheetViewer(): void {
  const input = byId<HTMLInputElement>('sv-input');
  const drop = byId<HTMLElement>('sv-drop');
  const panel = byId<HTMLElement>('sv-panel');
  const info = byId<HTMLElement>('sv-file-info');
  const encodingWrap = byId<HTMLElement>('sv-encoding-wrap');
  const encodingSelect = byId<HTMLSelectElement>('sv-encoding');
  const tabs = byId<HTMLElement>('sv-tabs');
  const table = byId<HTMLTableElement>('sv-table');
  const warning = byId<HTMLElement>('sv-col-warning');
  const pageInfo = byId<HTMLElement>('sv-page-info');
  const prev = byId<HTMLButtonElement>('sv-prev');
  const next = byId<HTMLButtonElement>('sv-next');
  const first = byId<HTMLButtonElement>('sv-first');
  const last = byId<HTMLButtonElement>('sv-last');
  const pageSize = byId<HTMLSelectElement>('sv-page-size');
  const csvButton = byId<HTMLButtonElement>('sv-csv');
  const jsonButton = byId<HTMLButtonElement>('sv-json');
  const resetButton = byId<HTMLButtonElement>('sv-reset');
  const status = byId<HTMLElement>('sv-status');
  const error = byId<HTMLElement>('sv-error');

  if (
    !input ||
    !drop ||
    !panel ||
    !tabs ||
    !table ||
    !pageInfo ||
    !prev ||
    !next ||
    !first ||
    !last ||
    !status ||
    !error
  ) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearUrls = () => {
    if (state?.csvUrl) URL.revokeObjectURL(state.csvUrl);
    if (state?.jsonUrl) URL.revokeObjectURL(state.jsonUrl);
    if (state) {
      state.csvUrl = undefined;
      state.jsonUrl = undefined;
    }
    csvButton?.removeAttribute('data-href');
    jsonButton?.removeAttribute('data-href');
  };

  const cellText = (sheet: WorkSheet, row: number, column: number): string => {
    const cell = sheet[`${columnLabel(column)}${row + 1}`] as CellObject | undefined;
    if (!cell) return '';
    return cell.w ?? formatCellValue(cell.v);
  };

  const renderTable = () => {
    if (!state) return;
    const { sheet, range, totalRows, totalCols } = state;
    const columnCount = Math.min(totalCols, MAX_COLS);
    const dataRows = Math.max(0, totalRows - 1);
    const pagination = paginate(dataRows, state.pageSize, state.page);
    state.page = pagination.page;

    table.replaceChildren();
    if (dataRows === 0) {
      if (pageInfo) pageInfo.textContent = '데이터가 없습니다.';
      prev.disabled = true;
      first.disabled = true;
      next.disabled = true;
      last.disabled = true;
      return;
    }

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const corner = document.createElement('th');
    corner.className = 'row-number';
    corner.scope = 'col';
    corner.textContent = '#';
    headRow.append(corner);

    const headerRowIndex = range.s.r;
    for (let column = 0; column < columnCount; column += 1) {
      const th = document.createElement('th');
      th.scope = 'col';
      const label = document.createElement('span');
      label.className = 'col-label';
      label.textContent = columnLabel(range.s.c + column);
      const value = document.createElement('span');
      value.className = 'col-value';
      value.textContent = cellText(sheet, headerRowIndex, range.s.c + column);
      th.append(label, value);
      headRow.append(th);
    }
    thead.append(headRow);
    table.append(thead);

    const tbody = document.createElement('tbody');
    for (let row = pagination.start; row < pagination.end; row += 1) {
      const sheetRow = range.s.r + 1 + row;
      const tr = document.createElement('tr');
      const rowNumber = document.createElement('th');
      rowNumber.className = 'row-number';
      rowNumber.scope = 'row';
      rowNumber.textContent = String(sheetRow + 1);
      tr.append(rowNumber);

      for (let column = 0; column < columnCount; column += 1) {
        const td = document.createElement('td');
        const text = cellText(sheet, sheetRow, range.s.c + column);
        td.textContent = text;
        if (isNumericCell(text)) td.classList.add('numeric');
        tr.append(td);
      }
      tbody.append(tr);
    }
    table.append(tbody);

    if (pageInfo) {
      pageInfo.textContent = `${pagination.start + 1}–${pagination.end} / ${dataRows}행 · ${pagination.page}/${pagination.pageCount}페이지`;
    }
    prev.disabled = pagination.page <= 1;
    first.disabled = pagination.page <= 1;
    next.disabled = pagination.page >= pagination.pageCount;
    last.disabled = pagination.page >= pagination.pageCount;

    if (warning) {
      warning.hidden = totalCols <= MAX_COLS;
      warning.textContent =
        totalCols > MAX_COLS
          ? `열이 ${totalCols}개입니다. 화면에는 앞 ${MAX_COLS}개만 표시합니다. 내려받기는 전체 열을 포함합니다.`
          : '';
    }
  };

  const renderTabs = () => {
    if (!state) return;
    tabs.replaceChildren();
    for (const name of state.workbook.SheetNames) {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', name === state.sheetName ? 'true' : 'false');
      button.textContent = name;
      button.addEventListener('click', () => {
        if (!state) return;
        const sheet = state.workbook.Sheets[name];
        const nextRange = parseRange(name);
        if (!sheet || !nextRange) return;
        state.sheetName = name;
        state.sheet = sheet;
        state.range = nextRange;
        state.totalRows = nextRange.e.r - nextRange.s.r + 1;
        state.totalCols = nextRange.e.c - nextRange.s.c + 1;
        state.page = 1;
        renderTabs();
        renderTable();
      });
      tabs.append(button);
    }
  };

  const parseRange = (name: string): Range | null => {
    if (!state) return null;
    const sheet = state.workbook.Sheets[name];
    const ref = sheet?.['!ref'];
    if (!sheet || !ref) return null;
    return state.xlsx.utils.decode_range(ref);
  };

  const load = async (file: File) => {
    showError('');
    clearUrls();
    panel.hidden = true;
    status.textContent = '파일을 분석하는 중…';

    if (!isSpreadsheet(file)) {
      showError('CSV·XLSX·XLS·ODS 파일만 열 수 있습니다.');
      status.textContent = '';
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showError(`파일이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다. 더 작은 파일을 사용하세요.`);
      status.textContent = '';
      return;
    }

    // 상태 표시가 먼저 그려지도록 한 프레임 양보
    await new Promise((resolve) => window.setTimeout(resolve, 30));

    try {
      const started = performance.now();
      const XLSX = await import('xlsx');
      const csv = isCsv(file);
      const encoding = (encodingSelect?.value as Encoding) ?? 'auto';

      let workbook: WorkBook;
      if (csv) {
        const text = await decodeCsv(file, encoding);
        workbook = XLSX.read(text, { type: 'string', cellDates: true });
      } else {
        workbook = XLSX.read(new Uint8Array(await file.arrayBuffer()), {
          type: 'array',
          cellDates: true,
        });
      }

      const firstName = workbook.SheetNames[0];
      const sheet = firstName ? workbook.Sheets[firstName] : undefined;
      if (!firstName || !sheet) {
        showError('시트를 찾을 수 없습니다.');
        status.textContent = '';
        return;
      }

      state = {
        file,
        xlsx: XLSX,
        workbook,
        sheetName: firstName,
        sheet,
        range: { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } },
        totalRows: 0,
        totalCols: 0,
        page: 1,
        pageSize: Number(pageSize?.value ?? 50),
        parseMs: performance.now() - started,
      };
      const firstRange = parseRange(firstName);
      if (!firstRange) {
        state = null;
        showError('시트에 데이터가 없습니다.');
        status.textContent = '';
        return;
      }
      state.range = firstRange;
      state.totalRows = firstRange.e.r - firstRange.s.r + 1;
      state.totalCols = firstRange.e.c - firstRange.s.c + 1;

      if (encodingWrap) encodingWrap.hidden = !csv;
      if (info) {
        info.textContent = `${file.name} · ${formatBytes(file.size)} · 시트 ${workbook.SheetNames.length}개 · ${Math.round(state.parseMs)}ms`;
      }
      panel.hidden = false;
      renderTabs();
      renderTable();
      status.textContent = '시트 탭을 눌러 다른 시트를 볼 수 있습니다.';
    } catch (cause) {
      console.error(cause);
      state = null;
      panel.hidden = true;
      const message = cause instanceof Error ? cause.message : '';
      showError(
        /password/i.test(message)
          ? '암호가 걸린 문서입니다. 암호를 해제한 뒤 다시 시도하세요.'
          : '파일을 읽지 못했습니다. 형식이 올바른지 확인하세요.',
      );
      status.textContent = '';
    }
  };

  const setupDownload = (kind: 'csv' | 'json') => {
    if (!state) return;
    const XLSXPromise = import('xlsx');
    void XLSXPromise.then((XLSX) => {
      if (!state) return;
      const name = sheetFileName(state.file.name, state.sheetName, kind);
      let blob: Blob;

      if (kind === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(state.sheet);
        blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
      } else {
        const json = XLSX.utils.sheet_to_json(state.sheet, { defval: '' });
        blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      }

      const url = URL.createObjectURL(blob);
      if (kind === 'csv' && state.csvUrl) URL.revokeObjectURL(state.csvUrl);
      if (kind === 'json' && state.jsonUrl) URL.revokeObjectURL(state.jsonUrl);
      if (kind === 'csv') {
        state.csvUrl = url;
        csvButton?.setAttribute('data-href', url);
      } else {
        state.jsonUrl = url;
        jsonButton?.setAttribute('data-href', url);
      }

      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
    });
  };

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
    if (file) void load(file);
  });

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void load(file);
    input.value = '';
  });

  encodingSelect?.addEventListener('change', () => {
    if (state && isCsv(state.file)) void load(state.file);
  });

  pageSize?.addEventListener('change', () => {
    if (!state) return;
    state.pageSize = Number(pageSize.value) || 50;
    state.page = 1;
    renderTable();
  });

  const go = (target: number) => {
    if (!state) return;
    state.page = target;
    renderTable();
  };

  first.addEventListener('click', () => go(1));
  prev.addEventListener('click', () => go((state?.page ?? 1) - 1));
  next.addEventListener('click', () => go((state?.page ?? 1) + 1));
  last.addEventListener('click', () => {
    if (!state) return;
    go(paginate(Math.max(0, state.totalRows - 1), state.pageSize, 1).pageCount);
  });

  csvButton?.addEventListener('click', () => setupDownload('csv'));
  jsonButton?.addEventListener('click', () => setupDownload('json'));

  resetButton?.addEventListener('click', () => {
    clearUrls();
    state = null;
    panel.hidden = true;
    status.textContent = '';
    showError('');
  });

  if (warning) warning.hidden = true;

  window.addEventListener('pagehide', () => {
    clearUrls();
    state = null;
  });
}
