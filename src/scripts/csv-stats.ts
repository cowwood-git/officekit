import {
  analyzeTable,
  type ColumnSummary,
  MAX_STATS_BYTES,
  MAX_STATS_ROWS,
  statsFileName,
  statsToCsv,
  type TableStats,
} from '@/lib/csv-stats';
import { formatBytes } from '@/lib/files';
import { readWorkbookSheets, type SheetData } from '@/lib/table-file';
import { bindDrop, byId } from './kit';

const numberFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });

function formatNumber(value: number): string {
  return numberFormat.format(value);
}

function typeLabel(column: ColumnSummary): string {
  if (column.type === 'numeric') return '숫자';
  if (column.type === 'text') return '문자';
  return '빈 열';
}

export function initCsvStats(): void {
  const drop = byId<HTMLElement>('cs-drop');
  const input = byId<HTMLInputElement>('cs-input');
  const panel = byId<HTMLElement>('cs-panel');
  const fileInfo = byId<HTMLElement>('cs-file');
  const sheetSelect = byId<HTMLSelectElement>('cs-sheet');
  const headerCheck = byId<HTMLInputElement>('cs-header');
  const run = byId<HTMLButtonElement>('cs-run');
  const reset = byId<HTMLButtonElement>('cs-reset');
  const status = byId<HTMLElement>('cs-status');
  const error = byId<HTMLElement>('cs-error');
  const result = byId<HTMLElement>('cs-result');
  const summary = byId<HTMLElement>('cs-summary');
  const download = byId<HTMLAnchorElement>('cs-download');
  const columnsBox = byId<HTMLElement>('cs-columns');
  const correlationSection = byId<HTMLElement>('cs-correlation-section');
  const correlationTable = byId<HTMLTableElement>('cs-correlation');

  if (
    !drop ||
    !input ||
    !panel ||
    !fileInfo ||
    !sheetSelect ||
    !headerCheck ||
    !run ||
    !reset ||
    !status ||
    !error ||
    !result ||
    !summary ||
    !download ||
    !columnsBox ||
    !correlationSection ||
    !correlationTable
  ) {
    return;
  }

  let sheets: SheetData[] = [];
  let fileName = '';
  let resultUrl: string | null = null;
  let running = false;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const setStatus = (message: string) => {
    status.textContent = message;
  };

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    result.hidden = true;
    download.hidden = true;
    download.removeAttribute('href');
    columnsBox.replaceChildren();
    correlationTable.replaceChildren();
    correlationSection.hidden = true;
    summary.textContent = '';
  };

  const currentSheet = (): SheetData | undefined => sheets[Number(sheetSelect.value)];

  const updateFileInfo = () => {
    const sheet = currentSheet();
    fileInfo.textContent = sheet
      ? `${fileName} · ${sheet.name} · ${sheet.rows.length}행`
      : fileName;
  };

  const statRow = (label: string, value: string): HTMLElement => {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    row.append(dt, dd);
    return row;
  };

  const renderColumn = (column: ColumnSummary): HTMLElement => {
    const card = document.createElement('article');
    card.className = 'cs-card';

    const head = document.createElement('div');
    head.className = 'cs-card-head';
    const title = document.createElement('h3');
    title.textContent = column.header;
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = typeLabel(column);
    head.append(title, badge);

    const statsList = document.createElement('dl');
    statsList.className = 'cs-card-stats';
    statsList.append(
      statRow('값 수', formatNumber(column.nonEmpty)),
      statRow('결측', formatNumber(column.missing)),
      statRow('고유값', formatNumber(column.unique)),
    );

    if (column.type === 'numeric' && column.numeric) {
      const numeric = column.numeric;
      statsList.append(
        statRow('최소', formatNumber(numeric.min)),
        statRow('최대', formatNumber(numeric.max)),
        statRow('평균', formatNumber(numeric.mean)),
        statRow('중앙값', formatNumber(numeric.median)),
        statRow('표준편차', formatNumber(numeric.stddev)),
        statRow('Q1', formatNumber(numeric.q1)),
        statRow('Q3', formatNumber(numeric.q3)),
      );
    }

    card.append(head, statsList);

    if (column.top.length > 0) {
      const list = document.createElement('ul');
      list.className = 'cs-top';
      for (const item of column.top) {
        const li = document.createElement('li');
        const value = document.createElement('span');
        value.textContent = item.value;
        value.title = item.value;
        const count = document.createElement('span');
        count.textContent = `${formatNumber(item.count)} · ${formatNumber(item.percent)}%`;
        li.append(value, count);
        list.append(li);
      }
      card.append(list);
    }

    if (column.type === 'empty') {
      const empty = document.createElement('p');
      empty.className = 'hint';
      empty.textContent = '값이 없습니다.';
      card.append(empty);
    }

    return card;
  };

  const renderColumns = (data: TableStats) => {
    columnsBox.replaceChildren(...data.columns.map(renderColumn));
  };

  const renderCorrelation = (data: TableStats) => {
    const headers = data.numericHeaders;
    if (data.correlations.length === 0 || headers.length < 2) {
      correlationSection.hidden = true;
      correlationTable.replaceChildren();
      return;
    }

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const corner = document.createElement('th');
    corner.scope = 'col';
    corner.textContent = '';
    headRow.append(corner);
    for (const header of headers) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = header;
      headRow.append(th);
    }
    thead.append(headRow);

    const tbody = document.createElement('tbody');
    for (const x of headers) {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = x;
      tr.append(th);
      for (const y of headers) {
        const td = document.createElement('td');
        if (x === y) {
          td.textContent = '1.00';
        } else {
          const found = data.correlations.find(
            (item) => (item.x === x && item.y === y) || (item.x === y && item.y === x),
          );
          if (!found || found.r === null) {
            td.textContent = '—';
          } else {
            td.textContent = found.r.toFixed(2);
            td.className = found.r > 0 ? 'cs-positive' : found.r < 0 ? 'cs-negative' : '';
          }
        }
        tr.append(td);
      }
      tbody.append(tr);
    }

    correlationTable.replaceChildren(thead, tbody);
    correlationSection.hidden = false;
  };

  const analyze = () => {
    if (running) return;
    const sheet = currentSheet();
    if (!sheet) {
      showError('분석할 시트를 선택하세요.');
      return;
    }
    if (sheet.rows.length > MAX_STATS_ROWS + 1) {
      showError(`한 번에 최대 ${formatNumber(MAX_STATS_ROWS)}행까지 분석합니다.`);
      return;
    }

    running = true;
    run.disabled = true;
    showError('');
    setStatus('통계를 계산하는 중…');
    clearResult();
    updateFileInfo();

    try {
      const data = analyzeTable(sheet.rows, { headerRow: headerCheck.checked });
      if (data.rowCount === 0) throw new Error('데이터 행이 없습니다.');
      summary.textContent = `${formatNumber(data.rowCount)}행 · ${formatNumber(data.columns.length)}열 · 숫자 열 ${formatNumber(data.numericHeaders.length)}개`;
      renderColumns(data);
      renderCorrelation(data);

      const csv = `\uFEFF${statsToCsv(data)}`;
      resultUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      download.href = resultUrl;
      download.download = statsFileName(fileName);
      download.hidden = false;
      result.hidden = false;
      result.focus();
      setStatus('통계 분석이 끝났습니다.');
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : '통계를 계산하지 못했습니다.');
      setStatus('');
    } finally {
      running = false;
      run.disabled = false;
    }
  };

  const loadFile = async (file: File | undefined) => {
    if (!file || running) return;
    if (file.size > MAX_STATS_BYTES) {
      showError(`파일은 ${formatBytes(MAX_STATS_BYTES)} 이하만 분석할 수 있습니다.`);
      return;
    }

    showError('');
    setStatus('파일을 읽는 중…');
    try {
      const loaded = await readWorkbookSheets(file);
      sheets = loaded;
      fileName = file.name;
      sheetSelect.replaceChildren(
        ...loaded.map((sheet, index) => {
          const option = document.createElement('option');
          option.value = String(index);
          option.textContent = `${sheet.name} (${sheet.rows.length}행)`;
          return option;
        }),
      );
      sheetSelect.value = '0';
      panel.hidden = false;
      drop.hidden = true;
      clearResult();
      updateFileInfo();
      setStatus('파일을 읽었습니다. 통계 분석을 눌러 주세요.');
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : '파일을 읽지 못했습니다.');
      setStatus('');
      sheets = [];
      fileName = '';
    }
  };

  const resetAll = () => {
    sheets = [];
    fileName = '';
    input.value = '';
    panel.hidden = true;
    drop.hidden = false;
    clearResult();
    showError('');
    setStatus('');
  };

  bindDrop(input, drop, (files) => void loadFile(files[0]));
  sheetSelect.addEventListener('change', () => {
    clearResult();
    updateFileInfo();
    setStatus('시트를 바꿨습니다. 통계 분석을 다시 눌러 주세요.');
  });
  headerCheck.addEventListener('change', () => {
    clearResult();
    setStatus('머리글 설정을 바꿨습니다. 통계 분석을 다시 눌러 주세요.');
  });
  run.addEventListener('click', analyze);
  reset.addEventListener('click', resetAll);

  window.addEventListener('pagehide', () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    sheets = [];
  });
}
