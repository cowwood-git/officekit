import type { DiffRow, DiffRowType } from '@/lib/text-diff';

const TYPE_LABEL: Record<DiffRowType, string> = {
  same: '같음',
  add: '추가',
  remove: '삭제',
  change: '변경',
};

export interface DiffViewOptions {
  /** 바뀐 줄만 남긴다. */
  onlyChanged?: boolean;
  /** 한 번에 DOM으로 그릴 최대 줄 수. 나머지는 TXT 저장으로 안내한다. */
  maxRows?: number;
}

export interface DiffViewResult {
  shown: number;
  total: number;
  truncated: boolean;
}

function lineNumber(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

function rowElement(row: DiffRow): HTMLLIElement {
  const item = document.createElement('li');
  item.className = `td-row td-row-${row.type}`;
  item.setAttribute('aria-label', `${TYPE_LABEL[row.type]} 줄`);

  const oldNo = document.createElement('span');
  oldNo.className = 'td-no';
  oldNo.textContent = lineNumber(row.oldLine);
  oldNo.setAttribute('aria-hidden', 'true');

  const newNo = document.createElement('span');
  newNo.className = 'td-no';
  newNo.textContent = lineNumber(row.newLine);
  newNo.setAttribute('aria-hidden', 'true');

  const content = document.createElement('span');
  content.className = 'td-content';

  if (row.type === 'change') {
    const oldPart = document.createElement('span');
    oldPart.className = 'td-old';
    oldPart.textContent = row.oldText;
    const newPart = document.createElement('span');
    newPart.className = 'td-new';
    newPart.textContent = row.newText ?? '';
    content.append(oldPart, newPart);
  } else if (row.type === 'add') {
    const marker = document.createElement('span');
    marker.className = 'td-mark';
    marker.textContent = '+';
    marker.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'td-new';
    text.textContent = row.newText ?? '';
    content.append(marker, text);
  } else if (row.type === 'remove') {
    const marker = document.createElement('span');
    marker.className = 'td-mark';
    marker.textContent = '−';
    marker.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'td-old';
    text.textContent = row.oldText;
    content.append(marker, text);
  } else {
    const text = document.createElement('span');
    text.textContent = row.oldText;
    content.append(text);
  }

  item.append(oldNo, newNo, content);
  return item;
}

export function renderDiffRows(
  container: HTMLElement,
  rows: DiffRow[],
  options: DiffViewOptions = {},
): DiffViewResult {
  const filtered = options.onlyChanged ? rows.filter((row) => row.type !== 'same') : rows;
  const maxRows = options.maxRows ?? 4000;
  const shownRows = filtered.slice(0, maxRows);
  const fragment = document.createDocumentFragment();

  for (const row of shownRows) fragment.append(rowElement(row));

  container.replaceChildren(fragment);
  return {
    shown: shownRows.length,
    total: filtered.length,
    truncated: filtered.length > shownRows.length,
  };
}
