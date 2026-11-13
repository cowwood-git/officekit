import { expect, test } from '@playwright/test';

test.describe('JSON 도구', () => {
  test('포맷과 키 정렬을 적용한다', async ({ page }) => {
    await page.goto('/tools/json-tools/');
    await page.fill('#jt-input-a', '{"b":2,"a":{"y":1,"x":3}}');
    await page.check('#jt-sort');
    await expect(page.locator('#jt-output')).toHaveValue(/"a": \{/);
    const value = await page.locator('#jt-output').inputValue();
    expect(value.indexOf('"a"')).toBeLessThan(value.indexOf('"b"'));
    expect(value).toContain('\n  ');
  });

  test('압축한다', async ({ page }) => {
    await page.goto('/tools/json-tools/');
    await page.selectOption('#jt-operation', 'minify');
    await page.fill('#jt-input-a', '{\n  "a": 1,\n  "b": [2, 3]\n}');
    await expect(page.locator('#jt-output')).toHaveValue('{"a":1,"b":[2,3]}');
  });

  test('문법 오류의 행 위치를 보여준다', async ({ page }) => {
    await page.goto('/tools/json-tools/');
    await page.selectOption('#jt-operation', 'validate');
    await page.fill('#jt-input-a', '{\n  "a": 1,\n}');
    await expect(page.locator('#jt-error')).toContainText('3행', { timeout: 10_000 });
  });

  test('두 JSON의 차이를 비교한다', async ({ page }) => {
    await page.goto('/tools/json-tools/');
    await page.selectOption('#jt-operation', 'diff');
    await page.fill('#jt-input-a', '{"a":1,"b":{"c":2}}');
    await page.fill('#jt-input-b', '{"a":2,"b":{"c":2,"d":3}}');
    await expect(page.locator('#jt-output')).toHaveValue(/~ a: 1 → 2/);
    await expect(page.locator('#jt-output')).toHaveValue(/\+ b\.d: 3/);
  });
});
