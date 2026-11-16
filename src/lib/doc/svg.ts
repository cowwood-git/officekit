/**
 * DisplayList → SVG. PDF와 같은 레이아웃 결과를 브라우저에서 즉시 그린다.
 * 글꼴은 form-runner가 등록한 OfficeKitNanum을 쓴다.
 */

import { ptToMm } from './theme';
import type { DocOp, DocPage } from './types';

const number = (value: number): string => {
  const fixed = value.toFixed(3);
  return fixed.replace(/\.?0+$/, '') || '0';
};

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

function opToSvg(op: DocOp): string {
  switch (op.kind) {
    case 'text': {
      const anchor = op.align === 'center' ? 'middle' : op.align === 'right' ? 'end' : 'start';
      return `<text x="${number(op.x)}" y="${number(op.y)}" font-family="OfficeKitNanum, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif" font-size="${number(ptToMm(op.size))}" font-weight="${op.weight === 'bold' ? 700 : 400}" fill="${op.color}" text-anchor="${anchor}" xml:space="preserve">${escapeXml(op.text)}</text>`;
    }
    case 'line': {
      const dash = op.dash ? ` stroke-dasharray="${number(op.dash[0])} ${number(op.dash[1])}"` : '';
      return `<line x1="${number(op.x1)}" y1="${number(op.y1)}" x2="${number(op.x2)}" y2="${number(op.y2)}" stroke="${op.color}" stroke-width="${number(op.width)}"${dash} />`;
    }
    case 'rect': {
      const fill = op.fill ?? 'none';
      const stroke = op.stroke
        ? ` stroke="${op.stroke}" stroke-width="${number(op.strokeWidth ?? 0.2)}"`
        : '';
      return `<rect x="${number(op.x)}" y="${number(op.y)}" width="${number(op.width)}" height="${number(op.height)}" fill="${fill}"${stroke} />`;
    }
    case 'image':
      return `<image href="${escapeXml(op.src)}" x="${number(op.x)}" y="${number(op.y)}" width="${number(op.width)}" height="${number(op.height)}" preserveAspectRatio="none" />`;
  }
}

export function renderSvg(page: DocPage): string {
  const body = page.ops.map(opToSvg).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${number(page.width)} ${number(page.height)}" role="img" aria-label="문서 미리보기" style="display:block;width:100%;height:auto;background:#fff"><rect x="0" y="0" width="${number(page.width)}" height="${number(page.height)}" fill="#ffffff" />${body}</svg>`;
}
