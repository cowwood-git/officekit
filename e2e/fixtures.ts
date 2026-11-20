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

/** PNG·JPEG 헤더에서 픽셀 크기를 읽는다. 디코드 없이 결과 크기만 확인할 때. */
export function imageSize(buffer: Buffer): { type: 'png' | 'jpeg'; width: number; height: number } {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { type: 'png', width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      const marker = buffer[offset + 1] ?? 0;
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc2) {
        return {
          type: 'jpeg',
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + length;
    }
  }
  throw new Error('PNG·JPEG 크기를 읽지 못했습니다.');
}

/** JPEG(JFIF)·PNG(pHYs)에 기록된 해상도(dpi). 기록이 없으면 null. */
export function imageDpi(buffer: Buffer): number | null {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    const jfif = buffer.indexOf('JFIF\0', 0, 'latin1');
    if (jfif < 0) return null;
    const unit = buffer[jfif + 7];
    const x = buffer.readUInt16BE(jfif + 8);
    if (unit === 1) return x;
    if (unit === 2) return Math.round(x * 2.54);
    return null;
  }
  const phys = buffer.indexOf('pHYs', 0, 'latin1');
  if (phys < 0) return null;
  const perMeter = buffer.readUInt32BE(phys + 4);
  return buffer[phys + 12] === 1 ? Math.round(perMeter * 0.0254) : null;
}
