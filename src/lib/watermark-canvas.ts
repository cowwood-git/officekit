import type { Size } from './crop';
import { cornerAnchor, diagonal, tileStep, watermarkFontSize } from './watermark';

export type WatermarkLayout = 'tile' | 'center' | 'corner';

export interface WatermarkRenderOptions {
  text: string;
  sizePercent: number;
  opacity: number;
  color: string;
  angle: number;
  layout: WatermarkLayout;
  shadow?: boolean;
}

/** 캔버스에 텍스트 워터마크를 그린다. 이미지·PDF 오버레이가 같은 규칙을 쓴다. */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  bounds: Size,
  options: WatermarkRenderOptions,
): void {
  const text = options.text.trim();
  if (!text) return;

  const fontSize = watermarkFontSize(bounds, options.sizePercent);
  const radians = (options.angle * Math.PI) / 180;

  ctx.save();
  ctx.font = `700 ${fontSize}px 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif`;
  ctx.fillStyle = options.color;
  ctx.globalAlpha = options.opacity;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (options.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = Math.max(2, fontSize * 0.12);
  }

  if (options.layout === 'tile') {
    const width = ctx.measureText(text).width;
    const step = tileStep(width, fontSize);
    const radius = diagonal(bounds) / 2 + fontSize * 2;

    ctx.translate(bounds.width / 2, bounds.height / 2);
    ctx.rotate(radians);

    let row = 0;
    for (let y = -radius; y <= radius; y += step.y) {
      const offset = row % 2 === 0 ? 0 : step.x / 2;
      for (let x = -radius; x <= radius; x += step.x) {
        ctx.fillText(text, x + offset, y);
      }
      row += 1;
    }
  } else if (options.layout === 'center') {
    ctx.translate(bounds.width / 2, bounds.height / 2);
    ctx.rotate(radians);
    ctx.fillText(text, 0, 0);
  } else {
    const margin = Math.min(bounds.width, bounds.height) * 0.04;
    const anchor = cornerAnchor(bounds, margin);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.translate(anchor.x, anchor.y);
    ctx.rotate(radians);
    ctx.fillText(text, 0, 0);
  }

  ctx.restore();
}
