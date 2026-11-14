import { expect, test } from '@playwright/test';

test.describe('앱 그리드 홈', () => {
  test('도구 89개를 6개 그룹으로 보여준다', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toHaveText(
      '개인정보 보안 걱정 없이, 내 브라우저에서만 처리하는 업무 도구',
    );
    await expect(page.locator('[data-app-group]')).toHaveCount(6);
    await expect(page.locator('#app-sections [data-app-tile]')).toHaveCount(89);
    await expect(page.locator('#app-document')).toHaveText('PDF');
  });

  test('홈 검색창이 앱 카드를 바로 필터링한다', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#home-search');
    await input.fill('PDF 텍스트 비교');
    await expect(page.locator('#site-search')).not.toBeVisible();
    const filtered = page.locator('#app-sections [data-app-tile]:visible');
    await expect(filtered).toHaveCount(1);
    await expect(filtered).toHaveAttribute('data-slug', 'pdf-diff');
    await expect(page.locator('#app-sections [data-app-group]:visible')).toHaveCount(1);
    await expect(page.locator('.app-all-count')).toHaveText('1개 도구 찾음');
    await expect(page.locator('[data-favorites]')).toBeHidden();

    await input.fill('없는검색어');
    await expect(filtered).toHaveCount(0);
    await expect(page.locator('#home-search-empty')).toBeVisible();
    await expect(page.locator('#app-sections [data-app-group]:visible')).toHaveCount(0);

    await page.locator('#home-search-clear').click();
    await expect(page.locator('#home-search')).toHaveValue('');
    await expect(page.locator('#app-sections [data-app-tile]:visible')).toHaveCount(89);
    await expect(page.locator('[data-favorites]')).toBeVisible();
    await expect(page.locator('#home-search-empty')).toBeHidden();
  });

  test('즐겨찾기한 도구는 카테고리에서 숨기고 검색에서는 다시 보여 준다', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('officekit-favorites', JSON.stringify(['pdf-merge']));
    });
    await page.goto('/');

    const tile = page.locator('#app-sections [data-tile-wrap][data-slug="pdf-merge"]');
    await expect(tile).toBeHidden();
    await expect(
      page.locator('[data-favorites] [data-tile-wrap][data-slug="pdf-merge"]'),
    ).toBeVisible();
    await expect(page.locator('.app-all-count')).toHaveText('현재 89개 도구 · 즐겨찾기 1개');

    await page.locator('#home-search').fill('PDF 합치기');
    await expect(tile).toBeVisible();
    await expect(page.locator('[data-favorites]')).toBeHidden();

    await page.locator('#home-search-clear').click();
    await expect(tile).toBeHidden();
    await expect(page.locator('[data-favorites]')).toBeVisible();

    // 즐겨찾기 카드에서도 다른 카드처럼 마우스를 올리면 별표가 나와 해제할 수 있다.
    const favTile = page.locator('[data-favorites] [data-tile-wrap][data-slug="pdf-merge"]');
    await expect(favTile.locator('.fav-tile')).toHaveCSS('opacity', '0');
    await favTile.hover();
    await expect(favTile.locator('.fav-tile')).toHaveCSS('opacity', '1');
    await favTile.locator('.fav-tile').click();
    await expect(favTile).toBeHidden();
    await expect(tile).toBeVisible();
  });

  test('모든 도구를 즐겨찾기하면 빈 카테고리를 숨긴다', async ({ page }) => {
    await page.goto('/');
    const slugs = await page
      .locator('[data-app-group][data-group="text"] [data-app-tile]')
      .evaluateAll((tiles) => tiles.map((tile) => (tile as HTMLElement).dataset.slug ?? ''));
    await page.evaluate((list) => {
      localStorage.setItem('officekit-favorites', JSON.stringify(list));
    }, slugs);
    await page.reload();

    await expect(page.locator('[data-app-group][data-group="text"]')).toBeHidden();
    await expect(page.locator('[data-app-group]:visible')).toHaveCount(5);
  });

  test('별표를 누르면 즐겨찾기로 이동하고 실행 취소할 수 있다', async ({ page }) => {
    await page.goto('/');
    const tile = page.locator('#app-sections [data-tile-wrap][data-slug="pdf-merge"]');
    await tile.hover();
    await tile.locator('[data-fav-toggle]').click();

    await expect(tile).toBeHidden();
    await expect(
      page.locator('[data-favorites] [data-tile-wrap][data-slug="pdf-merge"]'),
    ).toBeVisible();
    const toast = page.locator('#favorites-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('PDF 합치기 즐겨찾기로 이동됨');

    await toast.locator('[data-toast-undo]').click();
    await expect(tile).toBeVisible();
    await expect(toast).toBeHidden();
    await expect(page.locator('.app-all-count')).toHaveText('현재 89개 도구');
  });

  test('용도 칩으로 카테고리의 도구를 거른다', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-home-op="convert"]').click();
    await expect(page.locator('.app-all-count')).toHaveText('변환 도구 18개');
    await expect(page.locator('#app-sections [data-app-tile]:visible')).toHaveCount(18);
    await expect(page.locator('[data-favorites]')).toBeHidden();
    await expect(page.locator('[data-home-workflows]')).toBeHidden();
    await expect(page).toHaveURL(/use=convert/);

    await page.locator('#home-search').fill('PDF');
    await expect(page.locator('.app-all-count')).toHaveText('8개 도구 찾음');
    await page.locator('#home-search-clear').click();
    await page.locator('[data-home-op="all"]').click();
    await expect(page.locator('.app-all-count')).toHaveText('현재 89개 도구');
    await expect(page.locator('#app-sections [data-app-tile]:visible')).toHaveCount(89);
  });

  test('홈에서 작업 흐름으로 이동한다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.home-workflow-card')).toHaveCount(4);
    await page.locator('.home-workflow-card', { hasText: '제출용 PDF 만들기' }).click();
    await expect(page).toHaveURL(/\/workflows\/submit-pdf\/$/);
    await expect(page.locator('.workflow-head h1')).toHaveText('제출용 PDF 만들기');
  });

  test('모든 앱 타일에 호버 데모가 연결된다', async ({ page }) => {
    await page.goto('/');
    const data = await page.evaluate(() => {
      const tiles = [...document.querySelectorAll<HTMLElement>('[data-app-tile]')];
      const missing = tiles
        .filter((tile) => !tile.dataset.demo)
        .map((tile) => tile.dataset.slug ?? 'unknown');
      const types = [...new Set(tiles.map((tile) => tile.dataset.demo).filter(Boolean))];
      const templates = types.filter(
        (type) => !document.querySelector(`template[data-demo="${type}"]`),
      );
      return { total: tiles.length, missing, types: types.length, templates };
    });
    expect(data.total).toBe(89);
    expect(data.missing).toEqual([]);
    expect(data.types).toBe(89);
    expect(data.templates).toEqual([]);
  });

  test('PDF 타일 호버 시 실제 동작 데모가 뜬다', async ({ page }) => {
    await page.goto('/');
    const tile = page.locator('.app-tile[data-slug="pdf-compress"]').first();
    await tile.scrollIntoViewIfNeeded();
    await tile.hover();

    const tip = page.locator('#app-tip');
    await expect(tip).toHaveClass(/visible/);
    await expect(tip.locator('.app-tip-title')).toHaveText('PDF 압축');
    await expect(tip.locator('.app-tip-demo svg')).toBeVisible();
    await expect(tip.locator('.size-small')).toHaveText('0.8 MB');

    await page.mouse.move(4, 4);
    await expect(tip).not.toHaveClass(/visible/);
  });

  test('데모에 파일 형식 라벨이 표시된다', async ({ page }) => {
    await page.goto('/');
    const cases = [
      ['pdf-merge', 'PDF'],
      ['image-merge', 'JPG'],
      ['csv-clean', 'CSV'],
      ['docx-viewer', 'DOCX'],
    ] as const;

    for (const [slug, label] of cases) {
      const tile = page.locator(`.app-tile[data-slug="${slug}"]`).first();
      await tile.scrollIntoViewIfNeeded();
      await tile.hover();
      await expect(
        page
          .locator('#app-tip .demo-file-label, #app-tip .demo-static-label')
          .filter({ hasText: label })
          .first(),
      ).toBeVisible();
      await page.mouse.move(2, 2);
      await expect(page.locator('#app-tip')).not.toHaveClass(/visible/);
    }

    const calc = page.locator('.app-tile[data-slug="date-calc"]').first();
    await calc.scrollIntoViewIfNeeded();
    await calc.hover();
    await expect(page.locator('#app-tip .demo-file-label')).toHaveCount(0);
  });

  test('같은 행의 툴팁은 같은 방향으로 열린다', async ({ page }) => {
    await page.goto('/');
    const row = await page.evaluate(() => {
      const tiles = [...document.querySelectorAll<HTMLElement>('.app-tile')];
      const first = tiles[0];
      if (!first) return [];
      const top = first.getBoundingClientRect().top;
      return tiles
        .filter((tile) => Math.abs(tile.getBoundingClientRect().top - top) < 2)
        .map((tile) => tile.dataset.slug)
        .filter((slug): slug is string => Boolean(slug));
    });
    expect(row.length).toBeGreaterThan(1);
    const firstTile = page.locator(`.app-tile[data-slug="${row[0]}"]`).first();
    await firstTile.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(100);
    const directions: boolean[] = [];
    for (const slug of row) {
      const tile = page.locator(`.app-tile[data-slug="${slug}"]`).first();
      await tile.hover();
      await expect(page.locator('#app-tip')).toHaveClass(/visible/);
      directions.push(
        await page.locator('#app-tip').evaluate((tip) => tip.classList.contains('below')),
      );
      await page.mouse.move(2, 2);
      await expect(page.locator('#app-tip')).not.toHaveClass(/visible/);
    }

    expect(new Set(directions).size).toBe(1);
  });

  test('동작 줄이기에서는 데모가 결과 상태로 멈춘다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const tile = page.locator('.app-tile[data-slug="pdf-merge"]').first();
    await tile.scrollIntoViewIfNeeded();
    await tile.hover();

    const tip = page.locator('#app-tip');
    await expect(tip).toHaveClass(/visible/);
    const state = await page.evaluate(() => {
      const svg = document.querySelector('#app-tip .app-tip-demo svg');
      const merge = document.querySelector('#app-tip .merge-a');
      const check = document.querySelector('#app-tip .demo-check');
      return {
        svg: svg ? getComputedStyle(svg).animationName : 'missing',
        merge: merge ? getComputedStyle(merge).animationName : 'missing',
        check: check ? getComputedStyle(check).opacity : 'missing',
      };
    });
    expect(state.svg).toBe('none');
    expect(state.merge).toBe('none');
    expect(state.check).toBe('1');
  });

  test('/tools/는 전체 도구 카탈로그다', async ({ page }) => {
    await page.goto('/tools/');
    await expect(page).toHaveURL(/\/tools\/$/);
    await expect(page.locator('.catalog-head h1')).toHaveText('도구 전체');
    await expect(page.locator('#catalog-grid [data-app-tile]')).toHaveCount(89);
  });
});
