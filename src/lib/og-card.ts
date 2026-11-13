/**
 * 도구별 공유 이미지(1200×630) SVG — 카카오톡·네이버·SNS 미리보기에서 «무슨 도구인지» 바로 보이게.
 * 기본 공유 이미지(public/og.svg)와 같은 색·로고·글꼴을 쓴다. PNG 변환은 src/pages/og/tools/[slug].png.ts.
 */
export interface OgCard {
  eyebrow: string;
  title: string;
  summary: string;
}

const FONT = "-apple-system, 'Apple SD Gothic Neo', 'Nanum Gothic', sans-serif";

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 글자 폭 추정(em). 한글·한자는 1, 영문 대문자 0.66, 그 밖의 영숫자 0.56, 공백·문장부호는 좁게. */
export function charWidth(char: string): number {
  if (/[ᄀ-ᇿ㄰-㆏가-힣一-鿿　-〿＀-￯]/.test(char)) return 1;
  if (/[A-Z]/.test(char)) return 0.66;
  if (/[a-z0-9]/.test(char)) return 0.56;
  if (char === ' ') return 0.3;
  return 0.4;
}

const widthOf = (text: string) => [...text].reduce((sum, char) => sum + charWidth(char), 0);

/**
 * 폭(em) 안에 들어가게 낱말 단위로 줄을 나눈다. maxLines 를 넘으면 마지막 줄을 «…»로 줄인다.
 * 한 낱말이 한 줄보다 길면 글자 단위로 자른다.
 */
export function wrapText(text: string, maxEm: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = '';
  const push = () => {
    if (line) lines.push(line);
    line = '';
  };
  for (const word of text.trim().split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (widthOf(candidate) <= maxEm) {
      line = candidate;
      continue;
    }
    push();
    if (widthOf(word) <= maxEm) {
      line = word;
      continue;
    }
    for (const char of word) {
      if (widthOf(line + char) > maxEm) push();
      line += char;
    }
  }
  push();
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1] ?? '';
  while (last && widthOf(`${last}…`) > maxEm) last = [...last].slice(0, -1).join('');
  kept[maxLines - 1] = `${last.replace(/[\s,·.]+$/, '')}…`;
  return kept;
}

export function ogCardSvg({ eyebrow, title, summary }: OgCard): string {
  const titleSize = 76;
  const titleLines = wrapText(title, 1040 / titleSize, 2);
  const summarySize = 32;
  const summaryLines = wrapText(summary, 1040 / summarySize, 2);
  const titleTop = 300 - (titleLines.length - 1) * 44;
  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="80" y="${titleTop + i * 92}" font-family="${FONT}" font-size="${titleSize}" font-weight="800" fill="#14181f" letter-spacing="-2">${escapeXml(line)}</text>`,
    )
    .join('\n  ');
  const summaryTop = titleTop + (titleLines.length - 1) * 92 + 72;
  const summarySvg = summaryLines
    .map(
      (line, i) =>
        `<text x="80" y="${summaryTop + i * 46}" font-family="${FONT}" font-size="${summarySize}" font-weight="500" fill="#3d4552">${escapeXml(line)}</text>`,
    )
    .join('\n  ');
  const pillWidth = Math.round(widthOf(eyebrow) * 26 + 44);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="g" cx="85%" cy="0%" r="80%">
      <stop offset="0%" stop-color="#e6f2ef" />
      <stop offset="70%" stop-color="#fbfaf7" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#fbfaf7" />
  <rect width="1200" height="630" fill="url(#g)" />
  <g transform="translate(80,72)">
    <rect width="64" height="64" rx="16" fill="#0b6b5b" />
    <path d="M20 12h18l10 10v30H20z" fill="#ffffff" />
    <path d="M38 12l10 10H38z" fill="#f2c66d" />
    <path d="M26 35l5 5l9-11" fill="none" stroke="#0b6b5b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
    <text x="84" y="44" font-family="${FONT}" font-size="34" font-weight="800"><tspan fill="#0b6b5b">옷</tspan><tspan fill="#a85f13">깃</tspan></text>
  </g>
  <rect x="80" y="${titleTop - 128}" width="${pillWidth}" height="46" rx="23" fill="#e6f2ef" />
  <text x="${80 + pillWidth / 2}" y="${titleTop - 96}" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="700" fill="#0b6b5b">${escapeXml(eyebrow)}</text>
  ${titleSvg}
  ${summarySvg}
  <rect x="80" y="536" width="1040" height="2" fill="#e4e0d6" />
  <text x="80" y="582" font-family="${FONT}" font-size="28" font-weight="800" fill="#0b6b5b">officekit.kr</text>
  <text x="1120" y="582" text-anchor="end" font-family="${FONT}" font-size="26" font-weight="600" fill="#5b6472">설치·회원가입 없이 · 파일은 서버로 전송되지 않습니다</text>
</svg>`;
}

/** /tools/{slug}/… 경로의 도구 공유 이미지 주소. 도구 페이지가 아니면 undefined. */
export function toolOgPath(path: string, isTool: (slug: string) => boolean): string | undefined {
  const slug = path.match(/^\/tools\/([^/]+)\//)?.[1];
  return slug && isTool(slug) ? `/og/tools/${slug}.png` : undefined;
}
