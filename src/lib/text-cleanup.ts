export type SortMode = 'none' | 'asc' | 'desc' | 'length';
export type NumberingMode = 'none' | 'dot' | 'paren' | 'dash' | 'bullet';

export interface CleanupOptions {
  trim: boolean;
  removeEmpty: boolean;
  dedupe: boolean;
  collapseSpaces: boolean;
  sort: SortMode;
  numbering: NumberingMode;
}

export interface CleanupStats {
  inputLines: number;
  outputLines: number;
  removedLines: number;
  duplicateLines: number;
}

function prefix(index: number, mode: NumberingMode): string {
  switch (mode) {
    case 'dot':
      return `${index + 1}. `;
    case 'paren':
      return `${index + 1}) `;
    case 'dash':
      return `- `;
    case 'bullet':
      return '• ';
    default:
      return '';
  }
}

/** 줄 단위로 정리한다. 순서: 공백 → 빈 줄 → 중복 → 정렬 → 번호. */
export function cleanText(input: string, options: CleanupOptions): string {
  const source = input.replace(/\r\n?/g, '\n').split('\n');
  let lines = source;

  if (options.collapseSpaces) {
    lines = lines.map((line) => line.replace(/\s+/g, ' ').trim());
  } else if (options.trim) {
    lines = lines.map((line) => line.trim());
  }

  if (options.removeEmpty) {
    lines = lines.filter((line) => line.length > 0);
  }

  if (options.dedupe) {
    const seen = new Set<string>();
    lines = lines.filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    });
  }

  if (options.sort === 'asc') {
    lines = [...lines].sort((a, b) => a.localeCompare(b, 'ko'));
  } else if (options.sort === 'desc') {
    lines = [...lines].sort((a, b) => b.localeCompare(a, 'ko'));
  } else if (options.sort === 'length') {
    lines = [...lines].sort((a, b) => a.length - b.length || a.localeCompare(b, 'ko'));
  }

  if (options.numbering !== 'none') {
    lines = lines.map((line, index) => `${prefix(index, options.numbering)}${line}`);
  }

  return lines.join('\n');
}

export function cleanupStats(input: string, output: string): CleanupStats {
  const inputLines = input.replace(/\r\n?/g, '\n').split('\n');
  const nonEmpty = inputLines.filter((line) => line.trim().length > 0);
  const unique = new Set(nonEmpty.map((line) => line.trim()));
  const outputLines = output === '' ? [] : output.split('\n');
  return {
    inputLines: inputLines.length,
    outputLines: outputLines.length,
    removedLines: Math.max(0, inputLines.length - outputLines.length),
    duplicateLines: Math.max(0, nonEmpty.length - unique.size),
  };
}

export function cleanupFileName(original?: string): string {
  const base = (original ?? 'text').replace(/\.[^.]+$/, '').trim();
  return `${base || 'text'}-cleaned.txt`;
}
