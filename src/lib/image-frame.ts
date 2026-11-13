export interface FrameOptions {
  radius: number;
  borderWidth: number;
  borderColor: string;
  padding: number;
  background: string;
  shadow: boolean;
  shadowBlur: number;
  shadowColor: string;
}

export const DEFAULT_FRAME: FrameOptions = {
  radius: 24,
  borderWidth: 0,
  borderColor: '#ffffff',
  padding: 24,
  background: '#ffffff',
  shadow: false,
  shadowBlur: 24,
  shadowColor: 'rgba(0,0,0,0.25)',
};

export function frameOutputSize(
  width: number,
  height: number,
  padding: number,
): {
  width: number;
  height: number;
} {
  const safe = Math.max(0, Math.min(400, Math.round(padding)));
  return { width: width + safe * 2, height: height + safe * 2 };
}

export function clampFrame(options: Partial<FrameOptions>): FrameOptions {
  const radius = Math.min(400, Math.max(0, options.radius ?? DEFAULT_FRAME.radius));
  return {
    radius,
    borderWidth: Math.min(80, Math.max(0, options.borderWidth ?? 0)),
    borderColor: options.borderColor ?? DEFAULT_FRAME.borderColor,
    padding: Math.min(400, Math.max(0, options.padding ?? DEFAULT_FRAME.padding)),
    background: options.background ?? DEFAULT_FRAME.background,
    shadow: options.shadow ?? false,
    shadowBlur: Math.min(100, Math.max(0, options.shadowBlur ?? DEFAULT_FRAME.shadowBlur)),
    shadowColor: options.shadowColor ?? DEFAULT_FRAME.shadowColor,
  };
}

/** 둥근 사각형 경로를 만든다. radius는 px. */
export function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safe = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  context.beginPath();
  context.moveTo(x + safe, y);
  context.lineTo(x + width - safe, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safe);
  context.lineTo(x + width, y + height - safe);
  context.quadraticCurveTo(x + width, y + height, x + width - safe, y + height);
  context.lineTo(x + safe, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safe);
  context.lineTo(x, y + safe);
  context.quadraticCurveTo(x, y, x + safe, y);
  context.closePath();
}

export function frameFileName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '').trim();
  return `${base || 'image'}-frame.png`;
}
