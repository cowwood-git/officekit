/**
 * 도구 아이콘 스프라이트 생성 — Phosphor Icons duotone(MIT).
 * 빌드 때 TOOL_ICONS 에 쓰인 아이콘만 node_modules 에서 읽어 <symbol> 로 묶는다.
 * 결과는 /icons.svg 한 파일로 나가고(브라우저 캐시), AppIcon·검색 결과가 <use> 로 참조한다.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FALLBACK_ICON, TOOL_ICONS, UI_ICONS } from '../data/app-icons';
import { SPRITE_URL } from '../data/sprite';

export { SPRITE_URL };

// 패키지가 package.json 을 exports 하지 않아 resolve 대신 프로젝트 루트 기준 경로를 쓴다(빌드는 루트에서 실행).
const ASSETS = join(process.cwd(), 'node_modules', '@phosphor-icons', 'core', 'assets');

/** 아이콘 이름 → 원본 SVG 경로. `-fill` 로 끝나면 fill 굵기, 아니면 duotone. */
export function iconFile(name: string): string {
  return name.endsWith('-fill')
    ? join(ASSETS, 'fill', `${name}.svg`)
    : join(ASSETS, 'duotone', `${name}-duotone.svg`);
}

export function iconNames(): string[] {
  return [...new Set([...Object.values(TOOL_ICONS), FALLBACK_ICON, ...UI_ICONS])].sort();
}

export function toSymbol(name: string, svg: string): string {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 256 256';
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<symbol id="i-${name}" viewBox="${viewBox}">${inner}</symbol>`;
}

export function buildSprite(): string {
  const symbols = iconNames().map((name) => toSymbol(name, readFileSync(iconFile(name), 'utf8')));
  return `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>`;
}
