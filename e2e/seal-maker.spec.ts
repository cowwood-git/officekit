import { expect, test } from '@playwright/test';
import { canvasPixel, captureDownload } from './fixtures';

const pngInfo = (buffer: Buffer) => ({
  width: buffer.readUInt32BE(16),
  height: buffer.readUInt32BE(20),
  colorType: buffer[25],
});

test.describe('도장·서명 만들기', () => {
  test('글자 도장을 투명 PNG로 저장한다', async ({ page }) => {
    await page.goto('/tools/seal-maker/');
    await expect(page.locator('#sm-text')).toHaveValue('옷깃');
    await page.fill('#sm-text', '옷깃\n대표 홍길동');
    await page.selectOption('#sm-shape', 'square');
    expect((await canvasPixel(page, '#sm-canvas', 0, 0))[3]).toBe(0);

    const { name, buffer } = await captureDownload(page, () => page.click('#sm-download'));
    expect(name).toMatch(/^도장-\d{8}\.png$/);
    expect(pngInfo(buffer)).toEqual({ width: 1200, height: 1200, colorType: 6 });
  });

  test('손글씨 서명을 그려 저장한다', async ({ page }) => {
    await page.goto('/tools/seal-maker/');
    await page.check('#sm-mode-sign');
    await expect(page.locator('#sm-sign-panel')).toBeVisible();
    await expect(page.locator('#sm-download')).toBeDisabled();

    const box = await page.locator('#sm-canvas').boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    await page.mouse.move(box.x + 40, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 40, box.y + box.height / 2 - 24, { steps: 10 });
    await page.mouse.up();
    await expect(page.locator('#sm-download')).toBeEnabled();

    const { name, buffer } = await captureDownload(page, () => page.click('#sm-download'));
    expect(name).toMatch(/^서명-\d{8}\.png$/);
    expect(pngInfo(buffer)).toEqual({ width: 900, height: 400, colorType: 6 });
  });

  test('처음으로를 누르면 글자 도장으로 돌아온다', async ({ page }) => {
    await page.goto('/tools/seal-maker/');
    await page.check('#sm-mode-sign');
    await page.click('#sm-reset');
    await expect(page.locator('#sm-mode-seal')).toBeChecked();
    await expect(page.locator('#sm-text')).toHaveValue('옷깃');
    await expect(page.locator('#sm-download')).toBeEnabled();
  });
});
