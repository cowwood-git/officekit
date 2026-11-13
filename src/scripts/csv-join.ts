import { type JoinType, joinFileName, joinTables, joinToCsv } from '@/lib/csv-join';
import { formatBytes, MAX_TOTAL_BYTES, safeFileName } from '@/lib/files';
import { createRunGate } from '@/lib/run-gate';
import { readTableFile } from '@/lib/table-file';

interface Side {
  file?: File;
  rows: string[][];
  csvUrl?: string;
  xlsxUrl?: string;
}

const left: Side = { rows: [] };
const right: Side = { rows: [] };

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function headersOf(side: Side): string[] {
  return side.rows[0] ?? [];
}

export function initCsvJoin(): void {
  const leftInput = byId<HTMLInputElement>('cj-left-input');
  const rightInput = byId<HTMLInputElement>('cj-right-input');
  const leftDrop = byId<HTMLElement>('cj-left-drop');
  const rightDrop = byId<HTMLElement>('cj-right-drop');
  const leftInfo = byId<HTMLElement>('cj-left-info');
  const rightInfo = byId<HTMLElement>('cj-right-info');
  const leftKey = byId<HTMLSelectElement>('cj-left-key');
  const rightKey = byId<HTMLSelectElement>('cj-right-key');
  const joinType = byId<HTMLSelectElement>('cj-type');
  const preview = byId<HTMLTableElement>('cj-preview');
  const stats = byId<HTMLElement>('cj-stats');
  const csvDownload = byId<HTMLAnchorElement>('cj-csv');
  const xlsxDownload = byId<HTMLAnchorElement>('cj-xlsx');
  const runButton = byId<HTMLButtonElement>('cj-run');
  const result = byId<HTMLElement>('cj-result');
  const clearButton = byId<HTMLButtonElement>('cj-clear');
  const status = byId<HTMLElement>('cj-status');
  const error = byId<HTMLElement>('cj-error');
  const panel = byId<HTMLElement>('cj-panel');

  if (
    !leftInput ||
    !rightInput ||
    !leftDrop ||
    !rightDrop ||
    !leftKey ||
    !rightKey ||
    !joinType ||
    !preview ||
    !runButton ||
    !status ||
    !error ||
    !panel
  ) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const revoke = () => {
    for (const side of [left, right]) {
      if (side.csvUrl) URL.revokeObjectURL(side.csvUrl);
      if (side.xlsxUrl) URL.revokeObjectURL(side.xlsxUrl);
      side.csvUrl = undefined;
      side.xlsxUrl = undefined;
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
    if (left.rows.length === 0 || right.rows.length === 0) return;
    revoke();
    showError('');
    const result = joinTables(left.rows, right.rows, {
      leftKey: Number(leftKey.value),
      rightKey: Number(rightKey.value),
      type: (joinType.value as JoinType) ?? 'inner',
    });
    renderTable(result.headers, result.rows);
    if (stats) {
      stats.textContent = `${result.rows.length}행 · 일치 ${result.matched} · 왼쪽만 ${result.leftOnly} · 오른쪽만 ${result.rightOnly}`;
    }
    if (result.rows.length === 0) {
      status.textContent = '조건에 맞는 행이 없습니다.';
      return;
    }

    const base = safeFileName(
      left.file?.name.replace(/\.[^.]+$/, '') ?? right.file?.name.replace(/\.[^.]+$/, '') ?? 'join',
    );
    const csv = joinToCsv(result);
    left.csvUrl = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
    );
    if (csvDownload) {
      csvDownload.href = left.csvUrl;
      csvDownload.download = joinFileName(base);
      csvDownload.textContent = '조인 CSV';
      csvDownload.hidden = false;
    }

    void (async () => {
      try {
        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.aoa_to_sheet([result.headers, ...result.rows]),
          '조인',
        );
        const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
        if (left.csvUrl === undefined) return;
        left.xlsxUrl = URL.createObjectURL(
          new Blob([bytes], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
        );
        if (xlsxDownload) {
          xlsxDownload.href = left.xlsxUrl;
          xlsxDownload.download = `${base}-joined.xlsx`;
          xlsxDownload.textContent = '조인 XLSX';
          xlsxDownload.hidden = false;
        }
      } catch (cause) {
        console.error(cause);
      }
    })();

    status.textContent = '두 표를 합쳤습니다.';
  };

  const fillKeys = (side: Side, select: HTMLSelectElement) => {
    const previous = select.value;
    select.replaceChildren();
    headersOf(side).forEach((header, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = header.trim() || `열 ${index + 1}`;
      select.append(option);
    });
    select.value = previous || '0';
  };

  const acceptFile = async (which: 'left' | 'right', file: File) => {
    showError('');
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
      const { rows } = await readTableFile(file);
      if (rows.length < 2) throw new Error('데이터가 부족합니다.');

      const target = which === 'left' ? left : right;
      target.file = file;
      target.rows = rows;
      const info = which === 'left' ? leftInfo : rightInfo;
      if (info) {
        info.textContent = `${file.name} · ${rows.length - 1}행`;
      }
      fillKeys(target, which === 'left' ? leftKey : rightKey);
      panel.hidden = false;
      if (left.rows.length > 0 && right.rows.length > 0) {
        gate.ready();
      } else {
        gate.reset();
        status.textContent = which === 'left' ? '오른쪽 표를 추가하세요.' : '왼쪽 표를 추가하세요.';
      }
    } catch (cause) {
      console.error(cause);
      showError('표를 읽지 못했습니다. 파일 형식과 인코딩을 확인하세요.');
      status.textContent = '';
    }
  };

  const bindDrop = (drop: HTMLElement, input: HTMLInputElement, which: 'left' | 'right') => {
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
      if (file) void acceptFile(which, file);
    });
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) void acceptFile(which, file);
      input.value = '';
    });
  };

  bindDrop(leftDrop, leftInput, 'left');
  bindDrop(rightDrop, rightInput, 'right');

  const gate = createRunGate({
    button: runButton,
    result,
    status,
    controls: [leftKey, rightKey, joinType],
    run,
    onInvalidate: revoke,
  });

  clearButton?.addEventListener('click', () => {
    revoke();
    gate.reset();
    left.rows = [];
    right.rows = [];
    left.file = undefined;
    right.file = undefined;
    panel.hidden = true;
    preview.replaceChildren();
    if (leftInfo) leftInfo.textContent = '';
    if (rightInfo) rightInfo.textContent = '';
    status.textContent = '';
    showError('');
  });

  window.addEventListener('pagehide', revoke);
}
