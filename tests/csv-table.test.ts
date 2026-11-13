import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  escapeMarkdown,
  tableFileName,
  toHtmlTable,
  toMarkdownTable,
} from '../src/lib/csv-table';

const rows = [
  ['이름', '부서', '금액'],
  ['김오피스', '개발', '1200000'],
  ['이데이터', '영업', '950000'],
];

describe('escapeHtml', () => {
  it('HTML 특수문자를 이스케이프한다', () => {
    expect(escapeHtml(`<b>"Tom" & 'Jerry'</b>`)).toBe(
      '&lt;b&gt;&quot;Tom&quot; &amp; &#39;Jerry&#39;&lt;/b&gt;',
    );
  });
});

describe('toHtmlTable', () => {
  it('헤더와 본문을 만든다', () => {
    const html = toHtmlTable(rows, { header: true, align: 'left' });
    expect(html).toContain('<thead>');
    expect(html).toContain('<th style="text-align: left;">이름</th>');
    expect(html).toContain('<td style="text-align: left;">김오피스</td>');
    expect(html.match(/<tr>/g)).toHaveLength(3);
  });

  it('헤더를 끄면 첫 행도 본문이다', () => {
    const html = toHtmlTable(rows, { header: false, align: 'center' });
    expect(html).not.toContain('<thead>');
    expect(html).toContain('text-align: center');
    expect(html.match(/<tr>/g)).toHaveLength(3);
  });
});

describe('toMarkdownTable', () => {
  it('정렬 표시와 파이프 이스케이프를 처리한다', () => {
    const markdown = toMarkdownTable(
      [
        ['이름', '메모'],
        ['김 | 오피스', '줄\n바꿈'],
      ],
      { header: true, align: 'center' },
    );
    expect(markdown.split('\n')[0]).toBe('| 이름 | 메모 |');
    expect(markdown.split('\n')[1]).toBe('| :---: | :---: |');
    expect(markdown).toContain('김 \\| 오피스');
    expect(markdown).toContain('줄<br>바꿈');
  });

  it('열 수가 다른 행을 빈 칸으로 채운다', () => {
    const markdown = toMarkdownTable([['A', 'B', 'C'], ['1']], { header: true, align: 'left' });
    expect(markdown.split('\n')[2]).toBe('| 1 |  |  |');
  });
});

describe('escapeMarkdown', () => {
  it('파이프와 줄바꿈을 바꾼다', () => {
    expect(escapeMarkdown('a|b\nc')).toBe('a\\|b<br>c');
  });
});

describe('tableFileName', () => {
  it('확장자를 붙인다', () => {
    expect(tableFileName('거래처.csv', 'html')).toBe('거래처-table.html');
    expect(tableFileName('거래처.csv', 'md')).toBe('거래처-table.md');
  });
});
