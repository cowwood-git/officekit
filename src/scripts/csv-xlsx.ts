import type { WorkBook, WorkSheet } from 'xlsx';
import {
  type ConversionDirection,
  type CsvDelimiter,
  type CsvEncoding,
  conversionDirection,
  csvFileName,
  defaultSheetName,
  delimiterChar,
  directionLabel,
  previewWindow,
  trimEmptyEdges,
  withBom,
  xlsxFileName,
} from '@/lib/csv-xlsx';
import { formatBytes, MAX_TOTAL_BYTES } from '@/lib/files';
import { createRunGate } from '@/lib/run-gate';
import { decodeDelimited } from '@/lib/table-file';

interface State {
  file: File;
  bytes: ArrayBuffer;
  direction: ConversionDirection;
  xlsx: typeof import('xlsx');
  workbook: WorkBook;
  sheetNames: string[];
  sheetName: string;
  rows: string[][];
  downloadUrl?: string;
}

let state: State | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initCsvXlsx(): void {
  const input = byId<HTMLInputElement>('cx-input');
  const drop = byId<HTMLElement>('cx-drop');
  const panel = byId<HTMLElement>('cx-panel');
  const info = byId<HTMLElement>('cx-file-info');
  const direction = byId<HTMLElement>('cx-direction');
  const sheetNameWrap = byId<HTMLElement>('cx-sheet-name-wrap');
  const sheetName = byId<HTMLInputElement>('cx-sheet-name');
  const encodingWrap = byId<HTMLElement>('cx-encoding-wrap');
  const encoding = byId<HTMLSelectElement>('cx-encoding');
  const sheetWrap = byId<HTMLElement>('cx-sheet-wrap');
  const sheetSelect = byId<HTMLSelectElement>('cx-sheet-select');
  const delimiterWrap = byId<HTMLElement>('cx-delimiter-wrap');
  const delimiter = byId<HTMLSelectElement>('cx-delimiter');
  const bomWrap = byId<HTMLElement>('cx-bom-wrap');
  const bom = byId<HTMLInputElement>('cx-bom');
  const runButton = byId<HTMLButtonElement>('cx-run');
  const clearButton = byId<HTMLButtonElement>('cx-clear');
  const status = byId<HTMLElement>('cx-status');
  const error = byId<HTMLElement>('cx-error');
  const result = byId<HTMLElement>('cx-result');
  const resultValue = byId<HTMLElement>('cx-result-value');
  const resultSummary = byId<HTMLElement>('cx-result-summary');
  const download = byId<HTMLAnchorElement>('cx-download');
  const preview = byId<HTMLTableElement>('cx-preview');
  const previewNote = byId<HTMLElement>('cx-preview-note');

  if (
    !input ||
    !drop ||
    !panel ||
    !direction ||
    !sheetName ||
    !encoding ||
    !sheetSelect ||
    !delimiter ||
    !bom ||
    !runButton ||
    !status ||
    !error ||
    !result ||
    !preview
  ) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const revoke = () => {
    if (state?.downloadUrl) URL.revokeObjectURL(state.downloadUrl);
    if (state) state.downloadUrl = undefined;
    if (download) {
      download.removeAttribute('href');
      download.hidden = true;
    }
  };

  const gate = createRunGate({
    button: runButton,
    result,
    status,
    controls: [sheetName, encoding, sheetSelect, delimiter, bom],
    run: () => convert(),
    onInvalidate: revoke,
  });

  const sheetsFor = (workbook: WorkBook) =>
    workbook.SheetNames.filter((name) => Boolean(workbook.Sheets[name]));

  const rowsFromSheet = (xlsx: typeof import('xlsx'), sheet: WorkSheet): string[][] =>
    trimEmptyEdges(
      xlsx.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        raw: false,
        defval: '',
      }),
    );

  const renderPreview = () => {
    if (!state) return;
    const rows = state.rows;
    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const window = previewWindow(rows.length, columnCount);
    preview.replaceChildren();

    if (rows.length === 0) {
      if (previewNote) {
        previewNote.hidden = false;
        previewNote.textContent = '표에 데이터가 없습니다.';
      }
      return;
    }

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (let column = 0; column < window.columns; column += 1) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = rows[0]?.[column] || `열 ${column + 1}`;
      headRow.append(th);
    }
    thead.append(headRow);
    preview.append(thead);

    const tbody = document.createElement('tbody');
    for (let row = 1; row < window.rows; row += 1) {
      const tr = document.createElement('tr');
      for (let column = 0; column < window.columns; column += 1) {
        const td = document.createElement('td');
        td.textContent = rows[row]?.[column] ?? '';
        tr.append(td);
      }
      tbody.append(tr);
    }
    preview.append(tbody);

    if (previewNote) {
      previewNote.hidden = false;
      previewNote.textContent = `${rows.length.toLocaleString('ko-KR')}행 × ${columnCount.toLocaleString('ko-KR')}열${
        window.truncated ? ` · 화면에는 ${window.rows}행 × ${window.columns}열만 표시` : ''
      }`;
    }
  };

  const fillSheetSelect = () => {
    if (!state) return;
    sheetSelect.replaceChildren();
    for (const name of state.sheetNames) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      option.selected = name === state.sheetName;
      sheetSelect.append(option);
    }
  };

  const updateRows = () => {
    if (!state) return;
    const sheet = state.workbook.Sheets[state.sheetName];
    if (!sheet) {
      showError('시트를 읽지 못했습니다.');
      return;
    }
    state.rows = rowsFromSheet(state.xlsx, sheet);
    renderPreview();
  };

  const applyDirectionUi = () => {
    if (!state) return;
    const toXlsx = state.direction === 'to-xlsx';
    direction.textContent = directionLabel(state.direction, state.file.name);
    if (sheetNameWrap) sheetNameWrap.hidden = !toXlsx;
    if (encodingWrap) encodingWrap.hidden = !toXlsx;
    if (sheetWrap) sheetWrap.hidden = toXlsx;
    if (delimiterWrap) delimiterWrap.hidden = toXlsx;
    if (bomWrap) bomWrap.hidden = toXlsx;
    runButton.textContent = toXlsx ? 'XLSX로 변환' : 'CSV로 변환';
  };

  const acceptFile = async (file: File) => {
    showError('');
    revoke();
    gate.reset();

    const kind = conversionDirection(file.name);
    if (!kind) {
      showError('CSV·TSV·XLSX·XLS·ODS 파일만 변환할 수 있습니다.');
      panel.hidden = true;
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showError(`파일이 너무 큽니다. ${formatBytes(MAX_TOTAL_BYTES)} 이하 파일을 사용하세요.`);
      panel.hidden = true;
      return;
    }

    status.textContent = '파일을 읽는 중…';
    try {
      const bytes = await file.arrayBuffer();
      const xlsx = await import('xlsx');
      let workbook: WorkBook;

      if (kind === 'to-xlsx') {
        const text = decodeDelimited(new Uint8Array(bytes), encoding.value as CsvEncoding);
        workbook = xlsx.read(text, {
          type: 'string',
          ...(file.name.toLowerCase().endsWith('.tsv') ? { FS: '\t' } : {}),
        });
      } else {
        workbook = xlsx.read(bytes, { type: 'array' });
      }

      const sheetNames = sheetsFor(workbook);
      if (sheetNames.length === 0) throw new Error('읽을 수 있는 시트가 없습니다.');

      const firstSheet = sheetNames[0] as string;
      state = {
        file,
        bytes,
        direction: kind,
        xlsx,
        workbook,
        sheetNames,
        sheetName: firstSheet,
        rows: [],
      };
      if (kind === 'to-xlsx') sheetName.value = defaultSheetName(file.name);
      updateRows();
      fillSheetSelect();
      applyDirectionUi();

      if (info) {
        info.textContent = `${file.name} · ${formatBytes(file.size)} · ${sheetNames.length}시트`;
      }
      panel.hidden = false;
      gate.ready(
        state.direction === 'to-xlsx'
          ? '시트 이름과 인코딩을 확인한 뒤 [XLSX로 변환]을 누르세요.'
          : '시트와 구분자를 확인한 뒤 [CSV로 변환]을 누르세요.',
      );
    } catch (cause) {
      console.error(cause);
      state = null;
      panel.hidden = true;
      status.textContent = '';
      showError(
        cause instanceof Error
          ? cause.message
          : '파일을 읽지 못했습니다. 다른 프로그램에서 열려 있지 않은지 확인하세요.',
      );
    }
  };

  const reloadDelimited = async () => {
    if (state?.direction !== 'to-xlsx') return;
    showError('');
    revoke();
    try {
      const text = decodeDelimited(new Uint8Array(state.bytes), encoding.value as CsvEncoding);
      state.workbook = state.xlsx.read(text, {
        type: 'string',
        ...(state.file.name.toLowerCase().endsWith('.tsv') ? { FS: '\t' } : {}),
      });
      const sheetNames = sheetsFor(state.workbook);
      const firstSheet = sheetNames[0];
      if (!firstSheet) throw new Error('읽을 수 있는 시트가 없습니다.');
      state.sheetNames = sheetNames;
      state.sheetName = firstSheet;
      updateRows();
      fillSheetSelect();
      gate.ready('인코딩을 바꿨습니다. [XLSX로 변환]을 누르세요.');
    } catch (cause) {
      console.error(cause);
      showError(cause instanceof Error ? cause.message : '인코딩을 바꿔 읽지 못했습니다.');
    }
  };

  const convert = async (): Promise<boolean> => {
    if (!state) return false;
    showError('');
    revoke();

    try {
      const xlsx = state.xlsx;
      let blob: Blob;
      let fileName: string;
      let summary: string;

      if (state.direction === 'to-xlsx') {
        const rows = state.rows;
        if (rows.length === 0) throw new Error('내보낼 데이터가 없습니다.');
        const workbook = xlsx.utils.book_new();
        const sheet = xlsx.utils.aoa_to_sheet(rows);
        xlsx.utils.book_append_sheet(
          workbook,
          sheet,
          (sheetName.value.trim() || defaultSheetName(state.file.name)).slice(0, 31),
        );
        const output = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
        blob = new Blob([output], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        fileName = xlsxFileName(state.file.name);
        summary = `${rows.length.toLocaleString('ko-KR')}행 · 시트 “${
          sheetName.value.trim() || defaultSheetName(state.file.name)
        }” · ${formatBytes(blob.size)}`;
      } else {
        const sheet = state.workbook.Sheets[state.sheetName];
        if (!sheet) throw new Error('선택한 시트를 읽지 못했습니다.');
        const csv = xlsx.utils.sheet_to_csv(sheet, {
          FS: delimiterChar(delimiter.value as CsvDelimiter),
        });
        const text = withBom(csv, bom.checked);
        blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
        fileName = csvFileName(state.file.name, state.sheetName);
        summary = `${state.rows.length.toLocaleString('ko-KR')}행 · 시트 “${state.sheetName}” · ${formatBytes(blob.size)}`;
      }

      state.downloadUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = state.downloadUrl;
        download.download = fileName;
        download.textContent = `${fileName} 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultValue) {
        resultValue.textContent =
          state.direction === 'to-xlsx' ? 'XLSX 파일이 준비됐습니다' : 'CSV 파일이 준비됐습니다';
      }
      if (resultSummary) resultSummary.textContent = summary;
      status.textContent = '변환했습니다. 아래에서 내려받으세요.';
      return true;
    } catch (cause) {
      console.error(cause);
      showError(cause instanceof Error ? cause.message : '변환하지 못했습니다. 다시 시도하세요.');
      return false;
    }
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
    if (file) void acceptFile(file);
  });
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void acceptFile(file);
    input.value = '';
  });

  encoding.addEventListener('change', () => void reloadDelimited());
  sheetSelect.addEventListener('change', () => {
    if (!state) return;
    state.sheetName = sheetSelect.value;
    updateRows();
    revoke();
    gate.ready(`시트 “${state.sheetName}”을 선택했습니다. [CSV로 변환]을 누르세요.`);
  });

  clearButton?.addEventListener('click', () => {
    if (state?.downloadUrl) URL.revokeObjectURL(state.downloadUrl);
    state = null;
    panel.hidden = true;
    gate.reset();
    showError('');
    status.textContent = '';
    preview.replaceChildren();
    if (previewNote) previewNote.textContent = '';
    input.value = '';
    input.focus();
  });

  window.addEventListener('pagehide', revoke);
}
