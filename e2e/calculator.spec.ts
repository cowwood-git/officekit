import { expect, test } from '@playwright/test';

test.describe('계산기', () => {
  test('기본 계산기로 우선순위를 지켜 계산한다', async ({ page }) => {
    await page.goto('/tools/calculator/');
    await expect(page.locator('.calc-sci')).toBeHidden();
    for (const key of ['1', '+', '2', '×', '3']) {
      await page
        .locator('.calc-basic .key', { hasText: new RegExp(`^${key === '+' ? '\\+' : key}$`) })
        .click();
    }
    await page.locator('.calc-basic [data-action="equals"]').click();
    await expect(page.locator('#calc-result')).toHaveText('7');
    await expect(page.locator('#calc-history li')).toHaveCount(1);
  });

  test('공학 모드로 바꿔 sin 30° 를 계산하고 모드를 기억한다', async ({ page }) => {
    await page.goto('/tools/calculator/');
    await page.click('[data-mode-tab="sci"]');
    await expect(page.locator('.calc-sci')).toBeVisible();
    await page.click('[data-insert="sin("]');
    await page.keyboard.type('30');
    await page.keyboard.type(')');
    await page.click('.calc-basic [data-action="equals"]');
    await expect(page.locator('#calc-result')).toHaveText('0.5');
    await page.reload();
    await expect(page.locator('.calc-sci')).toBeVisible();
  });

  test('키보드 / 는 검색이 아니라 나누기', async ({ page }) => {
    await page.goto('/tools/calculator/');
    await page.keyboard.type('9/3');
    await page.keyboard.press('Enter');
    await expect(page.locator('#calc-result')).toHaveText('3');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });

  test('아이폰처럼 = 을 누르기 전에는 계산하지 않고, 기록에 = 이 보인다', async ({ page }) => {
    await page.goto('/tools/calculator/');
    await page.keyboard.type('89/9898*65');
    const result = page.locator('#calc-result');
    await expect(result).toHaveText('89÷9898×65');
    await expect(page.locator('#calc-copy')).toBeDisabled();

    await page.keyboard.press('Enter');
    await expect(page.locator('#calc-expr')).toContainText('=');
    await expect(result).not.toHaveText('89÷9898×65');
    await expect(page.locator('#calc-copy')).toBeEnabled();
    // 긴 결과도 두 줄로 넘어가지 않는다
    const lines = await result.evaluate((el) =>
      Math.round(
        el.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(el).lineHeight),
      ),
    );
    expect(lines).toBe(1);

    const item = page.locator('#calc-history li').first();
    await expect(item.locator('.calc-history-expr')).toHaveText(/=$/);
    await page.click('#calc-history-clear');
    await expect(page.locator('#calc-history li')).toHaveCount(0);
  });

  test('결과 다음 숫자는 새 식, 연산자는 결과에 이어서', async ({ page }) => {
    await page.goto('/tools/calculator/');
    await page.keyboard.type('2+3');
    await page.keyboard.press('Enter');
    await expect(page.locator('#calc-result')).toHaveText('5');
    await page.keyboard.type('*2');
    await expect(page.locator('#calc-result')).toHaveText('(2+3)×2');
    await expect(page.locator('#calc-expr')).not.toContainText('=');
    await page.keyboard.press('Enter');
    await expect(page.locator('#calc-result')).toHaveText('10');
    await page.keyboard.type('7');
    await expect(page.locator('#calc-result')).toHaveText('7');
  });

  test('닫지 않은 괄호는 = 에서 닫혀 식과 기록에 보인다', async ({ page }) => {
    await page.goto('/tools/calculator/');
    await page.click('[data-mode-tab="sci"]');
    await page.click('[data-insert="log("]');
    await page.keyboard.type('100');
    await page.keyboard.press('Enter');
    await expect(page.locator('#calc-result')).toHaveText('2');
    await expect(page.locator('#calc-expr')).toHaveText('log(100) =');
    await expect(page.locator('#calc-history .calc-history-expr').first()).toHaveText('log(100) =');
  });

  test('기록 줄은 카드 목록 모양(오른쪽 정렬, 테두리 없는 줄)으로 그린다', async ({ page }) => {
    await page.goto('/tools/calculator/');
    await page.keyboard.type('789*63');
    await page.keyboard.press('Enter');
    const item = page.locator('#calc-history .calc-history-item').first();
    const style = await item.evaluate((el) => {
      const css = getComputedStyle(el);
      return { align: css.textAlign, border: css.borderTopWidth, display: css.display };
    });
    expect(style).toEqual({ align: 'right', border: '0px', display: 'grid' });
    await expect(item.locator('.calc-history-value')).toHaveText('49,707');
  });

  test('= 을 다시 누르면 마지막 연산을 되풀이하고, ± 는 괄호를 닫아 붙인다', async ({ page }) => {
    await page.goto('/tools/calculator/');
    await page.keyboard.type('2+3');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(page.locator('#calc-result')).toHaveText('8');

    await page.keyboard.press('Escape');
    await page.keyboard.type('3*5');
    await page.locator('.calc-basic [data-action="negate"]').click();
    await page.keyboard.type('+2');
    await expect(page.locator('#calc-result')).toHaveText('3×(−5)+2');
    await page.keyboard.press('Enter');
    await expect(page.locator('#calc-result')).toHaveText('-13');
  });

  test('퍼센트 더하기는 아이폰처럼 원금에 퍼센트를 더한다', async ({ page }) => {
    await page.goto('/tools/calculator/');
    await page.keyboard.type('10000+10%');
    await page.keyboard.press('Enter');
    await expect(page.locator('#calc-result')).toHaveText('11,000');
  });

  test('결과에 이어 계산하면 앞 식이 위 줄에 남고, 기록은 한 칸에 단계로 쌓인다', async ({
    page,
  }) => {
    await page.goto('/tools/calculator/');
    await page.keyboard.type('5154*6');
    await page.keyboard.press('Enter');
    await expect(page.locator('#calc-result')).toHaveText('30,924');

    await page.keyboard.type('*6');
    await expect(page.locator('#calc-result')).toHaveText('5154×6×6');
    await page.keyboard.press('Enter');
    await expect(page.locator('#calc-result')).toHaveText('185,544');
    await expect(page.locator('#calc-expr')).toHaveText('5154\u2009×\u20096\u2009×\u20096 =');

    const entries = page.locator('#calc-history > li');
    await expect(entries).toHaveCount(1);
    const steps = entries.first().locator('.calc-history-item');
    await expect(steps).toHaveCount(2);
    await expect(steps.nth(0)).toContainText('30,924');
    await expect(steps.nth(1).locator('.calc-history-expr')).toHaveText('×\u20096 =');
    await expect(steps.nth(1).locator('.calc-history-value')).toHaveText('185,544');

    // 덧셈 결과에 곱하기를 이으면 괄호로 묶어 순서를 지킨다
    await page.keyboard.press('Escape');
    await page.keyboard.type('2+3');
    await page.keyboard.press('Enter');
    await page.keyboard.type('*4');
    await page.keyboard.press('Enter');
    await expect(page.locator('#calc-result')).toHaveText('20');
    await expect(page.locator('#calc-expr')).toContainText('(2\u2009+\u20093)\u2009×\u20094 =');
    await expect(entries).toHaveCount(2);

    // 결과 다음 숫자는 새 계산 → 새 칸
    await page.keyboard.type('7*2');
    await page.keyboard.press('Enter');
    await expect(entries).toHaveCount(3);
  });

  test('공학 계산도 앞 식을 살려 잇는다', async ({ page }) => {
    await page.goto('/tools/calculator/');
    await page.click('[data-mode-tab="sci"]');
    await page.click('[data-insert="sin("]');
    await page.keyboard.type('30');
    await page.locator('.calc-basic [data-action="equals"]').click();
    await expect(page.locator('#calc-result')).toHaveText('0.5');
    await page.click('[data-insert="^2"]');
    await page.locator('.calc-basic [data-action="equals"]').click();
    await expect(page.locator('#calc-result')).toHaveText('0.25');
    await expect(page.locator('#calc-expr')).toHaveText('sin(30)^2 =');
    await expect(
      page.locator('#calc-history > li').first().locator('.calc-history-item'),
    ).toHaveCount(2);
  });
});
