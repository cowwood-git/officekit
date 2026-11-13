import { formatBytes } from '@/lib/files';
import {
  MAX_MERGE_BYTES,
  MAX_MERGE_FILES,
  MAX_MERGE_ROWS,
  type MergeInput,
  type MergeResult,
  mergeFileName,
  mergeTables,
  mergeToCsv,
} from '@/lib/merge-tables';
import { readWorkbookSheets, type SheetData } from '@/lib/table-file';
import { bindDrop, byId } from './kit';

interface MergeFile {
  file: File;
  sheets: SheetData[];
  sheetIndex: number;
}

export function initMergeTables(): void {
  const drop = byId<HTMLElement>('mt-drop');
  const input = byId<HTMLInputElement>('mt-input');
  const panel = byId<HTMLElement>('mt-panel');
  const fileList = byId<HTMLUListElement>('mt-files');
  const fileCount = byId<HTMLElement>('mt-file-count');
  const headerCheck = byId<HTMLInputElement>('mt-header');
  const dedupeCheck = byId<HTMLInputElement>('mt-dedupe');
  const run = byId<HTMLButtonElement>('mt-run');
  const reset = byId<HTMLButtonElement>('mt-reset');
  const status = byId<HTMLElement>('mt-status');
  const error = byId<HTMLElement>('mt-error');
  const result = byId<HTMLElement>('mt-result');
  const summary = byId<HTMLElement>('mt-summary');
  const preview = byId<HTMLTableElement>('mt-preview');
  const csvLink = byId<HTMLAnchorElement>('mt-csv');
  const xlsxLink = byId<HTMLAnchorElement>('mt-xlsx');

  if (
    !drop ||
    !input ||
    !panel ||
    !fileList ||
    !fileCount ||
    !headerCheck ||
    !dedupeCheck ||
    !run ||
    !reset ||
    !status ||
    !error ||
    !result ||
    !summary ||
    !preview ||
    !csvLink ||
    !xlsxLink
  ) {
    return;
  }

  let files: MergeFile[] = [];
  let csvUrl: string | null = null;
  let xlsxUrl: string | null = null;
  let running = false;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const setStatus = (message: string) => {
    status.textContent = message;
  };

  const clearResult = () => {
    if (csvUrl) URL.revokeObjectURL(csvUrl);
    if (xlsxUrl) URL.revokeObjectURL(xlsxUrl);
    csvUrl = null;
    xlsxUrl = null;
    result.hidden = true;
    summary.textContent = '';
    preview.replaceChildren();
    csvLink.hidden = true;
    csvLink.removeAttribute('href');
    xlsxLink.hidden = true;
    xlsxLink.removeAttribute('href');
  };

  const renderFiles = () => {
    fileList.replaceChildren();
    files.forEach((item, index) => {
      const row = document.createElement('li');
      row.className = 'mt-file';

      const name = document.createElement('span');
      name.className = 'mt-file-name';
      name.textContent = item.file.name;
      name.title = item.file.name;

      const select = document.createElement('select');
      select.setAttribute('aria-label', `${item.file.name} 시트`);
      item.sheets.forEach((sheet, sheetIndex) => {
        const option = document.createElement('option');
        option.value = String(sheetIndex);
        option.textContent = `${sheet.name} (${sheet.rows.length}행)`;
        select.append(option);
      });
      select.value = String(item.sheetIndex);
      select.addEventListener('change', () => {
        item.sheetIndex = Number(select.value);
        clearResult();
        setStatus('시트를 바꿨습니다. 표 합치기를 다시 눌러 주세요.');
      });

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'mt-remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `${item.file.name} 삭제`);
      remove.addEventListener('click', () => {
        files.splice(index, 1);
        clearResult();
        renderFiles();
      });

      row.append(name, select, remove);
      fileList.append(row);
    });
    fileCount.textContent = `${files.length}개`;
    run.disabled = files.length === 0 || running;
  };

  const addFiles = async (incoming: File[]) => {
    if (incoming.length === 0 || running) return;
    const next = [...files];
    for (const file of incoming) {
      if (next.length >= MAX_MERGE_FILES) {
        showError(`한 번에 최대 ${MAX_MERGE_FILES}개 파일까지 합칠 수 있습니다.`);
        break;
      }
      if (file.size > MAX_MERGE_BYTES) {
        showError(`${file.name} 파일이 ${formatBytes(MAX_MERGE_BYTES)}를 넘습니다.`);
        continue;
      }
      if (next.some((item) => item.file === file)) continue;
      try {
        const sheets = await readWorkbookSheets(file);
        next.push({ file, sheets, sheetIndex: 0 });
      } catch (cause) {
        showError(cause instanceof Error ? cause.message : `${file.name} 파일을 읽지 못했습니다.`);
      }
    }
    files = next;
    if (files.length > 0) {
      panel.hidden = false;
      drop.hidden = true;
    }
    renderFiles();
    setStatus(files.length > 0 ? `${files.length}개 파일을 불러왔습니다.` : '');
  };

  const renderPreview = (merged: MergeResult) => {
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (const header of merged.headers) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = header;
      headRow.append(th);
    }
    thead.append(headRow);

    const tbody = document.createElement('tbody');
    for (const row of merged.rows.slice(0, 50)) {
      const tr = document.createElement('tr');
      for (const cell of row) {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.append(td);
      }
      tbody.append(tr);
    }
    preview.replaceChildren(thead, tbody);
  };

  const runMerge = async () => {
    if (running || files.length === 0) return;
    const headerRow = headerCheck.checked;
    const inputs: MergeInput[] = files.map((item) => {
      const sheet = item.sheets[item.sheetIndex] ?? item.sheets[0];
      const rows = sheet?.rows ?? [];
      return {
        name: item.file.name,
        sheetName: sheet?.name,
        headers: headerRow ? (rows[0] ?? []) : [],
        rows: headerRow ? rows.slice(1) : rows,
      };
    });

    const sourceRows = inputs.reduce((total, table) => total + table.rows.length, 0);
    if (sourceRows > MAX_MERGE_ROWS) {
      showError(`한 번에 최대 ${MAX_MERGE_ROWS.toLocaleString('ko-KR')}행까지 합칠 수 있습니다.`);
      return;
    }

    running = true;
    run.disabled = true;
    clearResult();
    showError('');
    setStatus('표를 합치는 중…');

    try {
      const merged = mergeTables(inputs, { dedupe: dedupeCheck.checked });
      if (merged.rows.length === 0) throw new Error('합칠 데이터가 없습니다.');
      renderPreview(merged);
      summary.textContent = `${files.length}개 파일 · ${sourceRows.toLocaleString('ko-KR')}행 → ${merged.rows.length.toLocaleString('ko-KR')}행 · ${merged.headers.length}열${merged.duplicateRows > 0 ? ` · 중복 ${merged.duplicateRows.toLocaleString('ko-KR')}행 제거` : ''}`;

      const csv = `\uFEFF${mergeToCsv(merged)}`;
      csvUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      csvLink.href = csvUrl;
      csvLink.download = mergeFileName('csv');
      csvLink.hidden = false;

      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([merged.headers, ...merged.rows]);
      XLSX.utils.book_append_sheet(workbook, worksheet, '합친표');
      const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
      xlsxUrl = URL.createObjectURL(
        new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      );
      xlsxLink.href = xlsxUrl;
      xlsxLink.download = mergeFileName('xlsx');
      xlsxLink.hidden = false;

      result.hidden = false;
      result.focus();
      setStatus('표를 합쳤습니다. CSV 또는 XLSX로 내려받으세요.');
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : '표를 합치지 못했습니다.');
      setStatus('');
    } finally {
      running = false;
      run.disabled = files.length === 0;
    }
  };

  const resetAll = () => {
    files = [];
    input.value = '';
    panel.hidden = true;
    drop.hidden = false;
    clearResult();
    renderFiles();
    showError('');
    setStatus('');
  };

  bindDrop(input, drop, (incoming) => void addFiles(incoming));
  headerCheck.addEventListener('change', () => {
    clearResult();
    setStatus('머리글 설정을 바꿨습니다. 표 합치기를 다시 눌러 주세요.');
  });
  dedupeCheck.addEventListener('change', () => {
    clearResult();
    setStatus('중복 제거 설정을 바꿨습니다. 표 합치기를 다시 눌러 주세요.');
  });
  run.addEventListener('click', () => void runMerge());
  reset.addEventListener('click', resetAll);

  window.addEventListener('pagehide', () => {
    clearResult();
    files = [];
  });

  renderFiles();
}
