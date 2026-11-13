import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { captureDownload, fixture } from './fixtures';

const SAMPLES = join(process.cwd(), 'e2e', 'samples');

test.describe('VCF·ICS 뷰어', () => {
  test('연락처를 읽고 검색·CSV 저장한다', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/tools/vcf-ics-viewer/');
    await page.setInputFiles('#vi-input', join(SAMPLES, 'sample.vcf'));
    await expect(page.locator('#vi-panel')).toBeVisible();
    await expect(page.locator('#vi-stat-contacts')).toHaveText('2');
    await expect(page.locator('#vi-stat-events')).toHaveText('0');
    await expect(page.locator('#vi-contacts-list')).toContainText('김민수');
    await expect(page.locator('#vi-contacts-list')).toContainText('010-1234-5678');
    await expect(page.locator('#vi-contacts-list')).toContainText('Jane Doe');

    await page.locator('#vi-search').fill('Jane');
    await expect(page.locator('#vi-contacts-list .vi-contact:visible')).toHaveCount(1);
    await page.locator('#vi-search').fill('');

    const { name, buffer } = await captureDownload(page, () => page.click('#vi-contacts-csv'));
    expect(name).toBe('contacts.csv');
    expect(buffer.toString('utf8')).toContain('김민수');
    expect(buffer.toString('utf8')).toContain('010-1234-5678');
    expect(errors).toEqual([]);
  });

  test('일정을 읽고 반복·종일 일정을 표시한다', async ({ page }) => {
    await page.goto('/tools/vcf-ics-viewer/');
    await page.setInputFiles('#vi-input', join(SAMPLES, 'sample.ics'));
    await expect(page.locator('#vi-panel')).toBeVisible();
    await expect(page.locator('#vi-stat-contacts')).toHaveText('0');
    await expect(page.locator('#vi-stat-events')).toHaveText('2');
    await expect(page.locator('#vi-events-list')).toContainText('주간 회의');
    await expect(page.locator('#vi-events-list')).toContainText('종일 일정');
    await expect(page.locator('#vi-events-list')).toContainText('회의실 A');
    await expect(page.locator('#vi-events-list')).toContainText('반복');

    await page.locator('#vi-search').fill('회의실');
    await expect(page.locator('#vi-events-list .vi-event:visible')).toHaveCount(1);
  });

  test('VCF·ICS가 아니면 안내한다', async ({ page }) => {
    await page.goto('/tools/vcf-ics-viewer/');
    await page.setInputFiles('#vi-input', fixture('sample.csv'));
    await expect(page.locator('#vi-error')).toBeVisible();
    await expect(page.locator('#vi-panel')).toBeHidden();
  });
});
