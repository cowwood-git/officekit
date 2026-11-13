import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TOOL_ICONS } from '../src/data/app-icons';
import { SPRITE_URL } from '../src/data/sprite';
import { tools } from '../src/data/tools';
import { buildSprite, iconFile, iconNames, toSymbol } from '../src/lib/icon-sprite';

describe('app-icons', () => {
  it('모든 도구에 아이콘이 지정돼 있다', () => {
    const missing = tools.map((tool) => tool.slug).filter((slug) => !TOOL_ICONS[slug]);
    expect(missing).toEqual([]);
  });

  it('도구마다 아이콘이 겹치지 않는다', () => {
    const values = Object.values(TOOL_ICONS);
    const dupes = values.filter((name, index) => values.indexOf(name) !== index);
    expect(dupes).toEqual([]);
  });

  it('지정한 아이콘이 Phosphor duotone 에 실제로 있다', () => {
    const missing = iconNames().filter((name) => !existsSync(iconFile(name)));
    expect(missing).toEqual([]);
  });

  it('SVG 를 viewBox 가 보존된 symbol 로 바꾼다', () => {
    const out = toSymbol(
      'x',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M0 0"/></svg>',
    );
    expect(out).toBe('<symbol id="i-x" viewBox="0 0 256 256"><path d="M0 0"/></symbol>');
  });

  it('스프라이트에 쓰는 아이콘 수만큼 symbol 이 들어간다', () => {
    const sprite = buildSprite();
    expect(sprite.match(/<symbol /g)?.length).toBe(iconNames().length);
  });

  it('스프라이트 URL 에 캐시 버전이 붙는다', () => {
    expect(SPRITE_URL).toMatch(/^\/icons\.svg\?v=[\w.-]+$/);
  });
});
