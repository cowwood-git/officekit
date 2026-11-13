import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Page } from '@playwright/test';

export const FIXTURES = join(process.cwd(), 'e2e', '.fixtures');

export function fixture(name: string): string {
  return join(FIXTURES, name);
}

export interface DownloadResult {
  name: string;
  buffer: Buffer;
}

/** 다운로드 이벤트를 기다린 뒤 파일 내용을 읽는다. */
export async function captureDownload(
  page: Page,
  action: () => Promise<void>,
): Promise<DownloadResult> {
  const [download] = await Promise.all([page.waitForEvent('download'), action()]);
  const path = await download.path();
  if (!path) throw new Error('다운로드 경로를 찾을 수 없습니다.');
  return {
    name: download.suggestedFilename(),
    buffer: await readFile(path),
  };
}

/** 페이지 내 canvas 픽셀을 읽는다. */
export async function canvasPixel(
  page: Page,
  selector: string,
  x: number,
  y: number,
): Promise<number[]> {
  return page.evaluate(
    ({ selector, x, y }) => {
      const canvas = document.querySelector(selector) as HTMLCanvasElement | null;
      if (!canvas) throw new Error(`canvas not found: ${selector}`);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('2d context unavailable');
      return Array.from(context.getImageData(x, y, 1, 1).data);
    },
    { selector, x, y },
  );
}
