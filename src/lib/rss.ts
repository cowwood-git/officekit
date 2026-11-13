/**
 * 도구 RSS — 네이버 서치어드바이저 «RSS 제출»용. 새 도구·고친 도구를 수집 로봇이 빨리 알게 한다.
 * 정렬은 수정일 최신순(같은 날짜면 기존 목록 순서). 날짜는 화면·JSON-LD 의 수정일과 같은 값.
 */
export interface RssItem {
  title: string;
  link: string;
  description: string;
  /** YYYY-MM-DD */
  date: string;
  category?: string;
}

export interface RssChannel {
  title: string;
  link: string;
  description: string;
  self: string;
  items: RssItem[];
}

const escapeXml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** YYYY-MM-DD → RFC 822(한국 시간 자정). */
export function rfc822(date: string): string {
  return new Date(`${date}T00:00:00+09:00`).toUTCString().replace('GMT', '+0000');
}

export function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => b.item.date.localeCompare(a.item.date) || a.index - b.index)
    .map(({ item }) => item);
}

export function rssXml(channel: RssChannel): string {
  const items = sortByDateDesc(channel.items);
  const lastBuild = items[0]?.date;
  const body = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${rfc822(item.date)}</pubDate>${item.category ? `\n      <category>${escapeXml(item.category)}</category>` : ''}
    </item>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${escapeXml(channel.link)}</link>
    <description>${escapeXml(channel.description)}</description>
    <language>ko</language>${lastBuild ? `\n    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>` : ''}
    <atom:link href="${escapeXml(channel.self)}" rel="self" type="application/rss+xml" />
${body}
  </channel>
</rss>
`;
}
