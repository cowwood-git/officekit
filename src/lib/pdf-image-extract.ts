export type ImageKind = 1 | 2 | 3;

export interface RawImage {
  width: number;
  height: number;
  kind: number;
  data: Uint8Array | Uint8ClampedArray;
  bitmap?: ImageBitmap;
}

/** pdf.js 이미지 데이터를 RGBA로 바꾼다. 1bpp·24bpp·32bpp를 지원한다. */
export function imageDataToRgba(image: RawImage): Uint8ClampedArray {
  const { width, height, kind, data } = image;
  const pixels = width * height;
  const rgba = new Uint8ClampedArray(pixels * 4);

  if (kind === 3) {
    for (let index = 0; index < pixels; index += 1) {
      rgba[index * 4] = data[index * 4] ?? 0;
      rgba[index * 4 + 1] = data[index * 4 + 1] ?? 0;
      rgba[index * 4 + 2] = data[index * 4 + 2] ?? 0;
      rgba[index * 4 + 3] = data[index * 4 + 3] ?? 255;
    }
    return rgba;
  }

  if (kind === 2) {
    for (let index = 0; index < pixels; index += 1) {
      const source = index * 3;
      rgba[index * 4] = data[source] ?? 0;
      rgba[index * 4 + 1] = data[source + 1] ?? 0;
      rgba[index * 4 + 2] = data[source + 2] ?? 0;
      rgba[index * 4 + 3] = 255;
    }
    return rgba;
  }

  const rowBytes = Math.ceil(width / 8);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const byte = data[y * rowBytes + (x >> 3)] ?? 0;
      const bit = (byte >> (7 - (x & 7))) & 1;
      const value = bit === 1 ? 255 : 0;
      const index = (y * width + x) * 4;
      rgba[index] = value;
      rgba[index + 1] = value;
      rgba[index + 2] = value;
      rgba[index + 3] = 255;
    }
  }
  return rgba;
}

export function isExtractableKind(kind: number): kind is ImageKind {
  return kind === 1 || kind === 2 || kind === 3;
}

export function extractedImageName(page: number, index: number, extension = 'png'): string {
  return `page-${String(page).padStart(2, '0')}-image-${String(index).padStart(2, '0')}.${extension}`;
}

export function isTinyImage(width: number, height: number, min = 16): boolean {
  return width < min || height < min;
}
