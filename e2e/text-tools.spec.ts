import { expect, test } from '@playwright/test';

test.describe('텍스트 정리', () => {
  test('줄 공백·빈 줄·중복을 정리한다', async ({ page }) => {
    await page.goto('/tools/text-cleanup/');
    await page.fill('#tc-input', '  사과  \n\n 바나나 \n 사과 ');
    await page.check('#tc-dedupe');

    await expect(page.locator('#tc-output')).toHaveValue('사과\n바나나');
    await expect(page.locator('#tc-stat-output')).toHaveText('2');
    await expect(page.locator('#tc-stat-duplicate')).toHaveText('1');
  });

  test('정렬과 번호 매기기를 적용한다', async ({ page }) => {
    await page.goto('/tools/text-cleanup/');
    await page.fill('#tc-input', '다\n가\n나');
    await page.selectOption('#tc-sort', 'asc');
    await page.selectOption('#tc-numbering', 'dot');
    await expect(page.locator('#tc-output')).toHaveValue('1. 가\n2. 나\n3. 다');

    await page.click('#tc-swap');
    await expect(page.locator('#tc-input')).toHaveValue('1. 가\n2. 나\n3. 다');
  });
});

test.describe('텍스트 변환', () => {
  test('한글 Base64 인코딩과 디코딩을 왕복한다', async ({ page }) => {
    await page.goto('/tools/text-convert/');
    await page.selectOption('#tx-operation', 'base64-encode');
    await page.fill('#tx-input', '오피스킷');
    await expect(page.locator('#tx-output')).toHaveValue('7Jik7ZS87Iqk7YK3');

    await page.click('#tx-swap');
    await expect(page.locator('#tx-operation')).toHaveValue('base64-decode');
    await expect(page.locator('#tx-output')).toHaveValue('오피스킷');
  });

  test('camelCase와 HTML 엔티티를 변환한다', async ({ page }) => {
    await page.goto('/tools/text-convert/');
    await page.selectOption('#tx-operation', 'camel');
    await page.fill('#tx-input', 'hello office kit');
    await expect(page.locator('#tx-output')).toHaveValue('helloOfficeKit');

    await page.selectOption('#tx-operation', 'html-encode');
    await page.fill('#tx-input', '<b>Tom & Jerry</b>');
    await expect(page.locator('#tx-output')).toHaveValue('&lt;b&gt;Tom &amp; Jerry&lt;/b&gt;');
  });
});

test.describe('퍼센트·부가세 계산기', () => {
  test('비율·증감률·부가세를 계산한다', async ({ page }) => {
    await page.goto('/tools/percent-calc/');

    await page.fill('#pcv-of-value', '200');
    await page.fill('#pcv-of-percent', '15');
    await expect(page.locator('#pcv-of-result')).toHaveText('30원');

    await page.fill('#pcv-ratio-part', '25');
    await page.fill('#pcv-ratio-whole', '200');
    await expect(page.locator('#pcv-ratio-result')).toHaveText('12.5%');

    await page.fill('#pcv-change-from', '100');
    await page.fill('#pcv-change-to', '120');
    await expect(page.locator('#pcv-change-result')).toHaveText('20%');

    await page.fill('#pcv-vat-amount', '1000000');
    await expect(page.locator('#pcv-vat-supply')).toHaveText('1,000,000원');
    await expect(page.locator('#pcv-vat-tax')).toHaveText('100,000원');
    await expect(page.locator('#pcv-vat-total')).toHaveText('1,100,000원');

    await page.selectOption('#pcv-vat-mode', 'included');
    await page.fill('#pcv-vat-amount', '1100000');
    await expect(page.locator('#pcv-vat-supply')).toHaveText('1,000,000원');
    await expect(page.locator('#pcv-vat-tax')).toHaveText('100,000원');
  });
});

test.describe('단위 변환기', () => {
  test('길이·온도·평을 변환한다', async ({ page }) => {
    await page.goto('/tools/unit-convert/');
    await page.selectOption('#uc-category', 'length');
    await page.fill('#uc-value', '1');
    await expect(page.locator('#uc-result')).toHaveText('3.2808');
    await expect(page.locator('#uc-result-unit')).toContainText('피트');

    await page.selectOption('#uc-category', 'temperature');
    await page.fill('#uc-value', '100');
    await expect(page.locator('#uc-result')).toHaveText('212');

    await page.selectOption('#uc-category', 'area');
    await page.selectOption('#uc-from', 'pyeong');
    await page.selectOption('#uc-to', 'm2');
    await page.fill('#uc-value', '1');
    await expect(page.locator('#uc-result')).toHaveText('3.3058');
  });
});
