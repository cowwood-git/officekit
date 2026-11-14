import { expect, test } from '@playwright/test';

// 도구 머리의 아이콘은 설명 길이와 상관없이 분류·제목 줄에 맞아야 한다(가운데 정렬로 내려가지 않게).
for (const slug of ['remove-background', 'image-compress', 'pdf-merge']) {
  for (const width of [1280, 820]) {
    test(`${slug} 머리 아이콘이 분류 줄과 같은 높이에서 시작한다 (${width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/tools/${slug}/`);
      const icon = await page.locator('.tool-head .tool-icon').boundingBox();
      const eyebrow = await page.locator('.tool-head .eyebrow').boundingBox();
      const title = await page.locator('.tool-head h1').boundingBox();
      if (!icon || !eyebrow || !title) throw new Error('머리 요소를 찾지 못했습니다.');
      expect(Math.abs(icon.y - eyebrow.y)).toBeLessThanOrEqual(2);
      // 아이콘이 제목 줄을 넘어 설명 쪽으로 내려가지 않는다.
      expect(icon.y + icon.height).toBeLessThanOrEqual(title.y + title.height + 12);
    });
  }
}
