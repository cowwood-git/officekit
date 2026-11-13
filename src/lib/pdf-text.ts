export interface TextItemLike {
  str: string;
  hasEOL?: boolean;
}

/** pdf.js 텍스트 아이템을 줄바꿈을 살려 하나의 문자열로 만든다. */
export function pageText(items: TextItemLike[]): string {
  let output = '';
  for (const item of items) {
    if (!item.str) {
      if (item.hasEOL && output !== '' && !output.endsWith('\n')) output += '\n';
      continue;
    }
    output += item.str;
    if (item.hasEOL) output += '\n';
  }
  return output
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export interface PageText {
  pageNumber: number;
  text: string;
}

/** 여러 페이지를 하나로 합친다. 구분선을 넣으면 페이지 경계를 알 수 있다. */
export function combinePages(pages: PageText[], includePageMarkers = true): string {
  return pages
    .map((page) =>
      includePageMarkers ? `--- ${page.pageNumber}페이지 ---\n${page.text}` : page.text,
    )
    .join('\n\n')
    .trim();
}

export function textFileName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '').trim();
  return `${base || 'document'}.txt`;
}

/** 추출 결과 통계. */
export function textStats(text: string): { characters: number; lines: number; pages: number } {
  const pages = text === '' ? 0 : (text.match(/^--- \d+페이지 ---$/gm) ?? []).length;
  const content = text
    .replace(/^--- \d+페이지 ---$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
  return {
    characters: content.replace(/\s/g, '').length,
    lines: content === '' ? 0 : content.split('\n').length,
    pages,
  };
}
