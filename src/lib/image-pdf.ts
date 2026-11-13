export interface Size {
  width: number;
  height: number;
}

export type PageMode = 'a4' | 'letter' | 'image';

/** PDF 포인트(pt). 1pt = 1/72인치 */
export const PAGE_SIZES = {
  a4: {
    portrait: { width: 595.28, height: 841.89 },
    landscape: { width: 841.89, height: 595.28 },
  },
  letter: {
    portrait: { width: 612, height: 792 },
    landscape: { width: 792, height: 612 },
  },
} as const;

/** 이미지 비율에 맞춰 페이지 방향을 고른다. */
export function pageSizeFor(mode: PageMode, image: Size): Size {
  if (mode === 'image') {
    return { width: Math.max(1, image.width), height: Math.max(1, image.height) };
  }

  const landscape = image.width > image.height;
  if (mode === 'a4') {
    return landscape ? PAGE_SIZES.a4.landscape : PAGE_SIZES.a4.portrait;
  }
  return landscape ? PAGE_SIZES.letter.landscape : PAGE_SIZES.letter.portrait;
}

/**
 * 여백을 뺀 영역 안에 이미지를 비율 유지하며 가운데 배치한다.
 * 작은 이미지도 페이지에 맞게 확대한다(인쇄 품질 우선).
 */
export function fitRect(image: Size, page: Size, margin: number): Size & { x: number; y: number } {
  const safeMargin = Math.max(0, margin);
  const availableWidth = Math.max(1, page.width - safeMargin * 2);
  const availableHeight = Math.max(1, page.height - safeMargin * 2);

  const scale = Math.min(availableWidth / image.width, availableHeight / image.height);
  const width = Math.max(1, image.width * scale);
  const height = Math.max(1, image.height * scale);

  return {
    x: (page.width - width) / 2,
    y: (page.height - height) / 2,
    width,
    height,
  };
}
