import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import fontkit from '@pdf-lib/fontkit';
import { describe, expect, it } from 'vitest';

const FONT_FILES = [
  'public/fonts/NanumGothic-OfficeKit.ttf',
  'public/fonts/NanumGothic-Bold-OfficeKit.ttf',
] as const;

/** 문서에서 실제로 쓰는 기호. 글꼴에 없으면 PDF에서 글자가 조용히 사라진다. */
const REQUIRED_GLYPHS = ['가', '힣', '○', '□', '→', '←', '₩', '※', '·', '—'] as const;

describe('문서 글꼴', () => {
  it.each(FONT_FILES)('%s는 문서 기호를 모두 포함한다', (file) => {
    const font = fontkit.create(new Uint8Array(readFileSync(join(process.cwd(), file))));
    const missing = REQUIRED_GLYPHS.filter(
      (char) => !font.hasGlyphForCodePoint(char.codePointAt(0) ?? 0),
    );
    expect(missing).toEqual([]);
  });
});
