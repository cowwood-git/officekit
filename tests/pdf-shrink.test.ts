import * as mupdf from 'mupdf';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { shrinkPdf, targetSize } from '../src/lib/pdf-shrink';

/** 사진처럼 압축이 잘 안 되는 큰 JPEG(잡음 + 그라데이션) */
async function photo(width: number, height: number, channels: 3 | 4 = 3) {
  const raw = Buffer.alloc(width * height * channels);
  for (let i = 0; i < raw.length; i += 1) raw[i] = (i * 7 + ((i * 2654435761) >>> 24)) & 255;
  const img = sharp(raw, { raw: { width, height, channels } });
  return channels === 4 ? img.png().toBuffer() : img.jpeg({ quality: 95 }).toBuffer();
}

async function samplePdf(withAlpha = false) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText('Quarterly report 2026', { x: 50, y: 790, size: 20, font });
  const jpg = await doc.embedJpg(await photo(2400, 1800));
  page.drawImage(jpg, { x: 50, y: 300, width: 495, height: 371 });
  if (withAlpha) {
    const png = await doc.embedPng(await photo(600, 600, 4));
    page.drawImage(png, { x: 50, y: 50, width: 200, height: 200 });
  }
  return doc.save();
}

function textOf(bytes: Uint8Array) {
  const doc = mupdf.Document.openDocument(bytes, 'application/pdf');
  return doc.loadPage(0).toStructuredText('preserve-whitespace').asText();
}

describe('pdf-shrink', () => {
  it('targetSize: 긴 변 기준으로 비율을 유지해 줄인다', () => {
    expect(targetSize(4000, 2000, 1000)).toEqual({ width: 1000, height: 500, scaled: true });
    expect(targetSize(800, 600, 1000)).toEqual({ width: 800, height: 600, scaled: false });
  });

  it('사진은 줄이고 글자는 그대로 남긴다', async () => {
    const input = await samplePdf();
    const out = shrinkPdf(mupdf, input, { dpi: 150, quality: 0.75 });
    expect(out.rewritten).toBe(1);
    expect(out.bytes.length).toBeLessThan(input.length * 0.5);
    expect(textOf(out.bytes)).toContain('Quarterly report 2026');
    const doc = mupdf.Document.openDocument(out.bytes, 'application/pdf');
    expect(doc.countPages()).toBe(1);
  });

  it('투명 이미지의 마스크는 건드리지 않고 문서가 정상으로 열린다', async () => {
    const input = await samplePdf(true);
    const out = shrinkPdf(mupdf, input, { dpi: 150, quality: 0.75, grayscale: true });
    expect(out.images).toBeGreaterThanOrEqual(2);
    const doc = mupdf.Document.openDocument(out.bytes, 'application/pdf');
    const pix = doc.loadPage(0).toPixmap(mupdf.Matrix.scale(0.2, 0.2), mupdf.ColorSpace.DeviceRGB);
    expect(pix.getWidth()).toBeGreaterThan(0);
    expect(textOf(out.bytes)).toContain('Quarterly report 2026');
  });

  it('줄일 게 없으면 원본 수준 크기를 유지한다', async () => {
    const doc = await PDFDocument.create();
    doc.addPage().drawText('only text');
    const input = await doc.save();
    const out = shrinkPdf(mupdf, input, { dpi: 150, quality: 0.75 });
    expect(out.rewritten).toBe(0);
    expect(textOf(out.bytes)).toContain('only text');
  });
});
