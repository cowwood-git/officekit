export type TableAlign = 'left' | 'center' | 'right';

export interface TableOptions {
  header: boolean;
  align: TableAlign;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

/** 표 데이터를 HTML table 코드로 만든다. */
export function toHtmlTable(rows: string[][], options: TableOptions): string {
  if (rows.length === 0) return '';
  const alignStyle = `text-align: ${options.align};`;
  const header = options.header ? (rows[0] ?? []) : [];
  const body = options.header ? rows.slice(1) : rows;

  const lines: string[] = ['<table>'];
  if (header.length > 0) {
    lines.push('  <thead>', '    <tr>');
    for (const cell of header) {
      lines.push(`      <th style="${alignStyle}">${escapeHtml(cell)}</th>`);
    }
    lines.push('    </tr>', '  </thead>');
  }
  lines.push('  <tbody>');
  for (const row of body) {
    lines.push('    <tr>');
    for (const cell of row) {
      lines.push(`      <td style="${alignStyle}">${escapeHtml(cell)}</td>`);
    }
    lines.push('    </tr>');
  }
  lines.push('  </tbody>', '</table>');
  return lines.join('\n');
}

const ALIGN_MARK: Record<TableAlign, string> = {
  left: ':---',
  center: ':---:',
  right: '---:',
};

/** 표 데이터를 GitHub Flavored Markdown 표로 만든다. */
export function toMarkdownTable(rows: string[][], options: TableOptions): string {
  if (rows.length === 0) return '';
  const header = options.header ? (rows[0] ?? []) : (rows[0] ?? []).map(() => '');
  const body = options.header ? rows.slice(1) : rows;
  const columns = Math.max(header.length, ...body.map((row) => row.length));
  const pad = (row: string[]) =>
    Array.from({ length: columns }, (_, index) => escapeMarkdown(row[index] ?? ''));

  const lines = [
    `| ${pad(header).join(' | ')} |`,
    `| ${Array.from({ length: columns }, () => ALIGN_MARK[options.align]).join(' | ')} |`,
  ];
  for (const row of body) {
    lines.push(`| ${pad(row).join(' | ')} |`);
  }
  return lines.join('\n');
}

export function tableFileName(original: string, extension: 'html' | 'md'): string {
  const base = original.replace(/\.[^.]+$/, '').trim();
  return `${base || 'table'}-table.${extension}`;
}
