import { expect, test } from '@playwright/test';
import { parseIcs } from '../src/lib/vcf-ics';
import { captureDownload } from './fixtures';

test.describe('ICS 만들기', () => {
  test('시간 일정을 만들어 다시 읽는다', async ({ page }) => {
    await page.goto('/tools/ics-maker/');
    await page.fill('#ics-title', '프로젝트 회의');
    await page.fill('#ics-start-date', '2026-11-13');
    await page.fill('#ics-start-time', '10:00');
    await page.fill('#ics-end-time', '11:00');
    await page.fill('#ics-location', '회의실 A');
    await page.fill('#ics-description', '안건 확인');

    const { name, buffer } = await captureDownload(page, () => page.click('#ics-generate'));
    expect(name).toMatch(/^일정-\d{8}\.ics$/);
    const events = parseIcs(buffer.toString('utf8'));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      summary: '프로젝트 회의',
      location: '회의실 A',
      description: '안건 확인',
    });
    expect(events[0]?.start?.allDay).toBe(false);
  });

  test('종일 일정을 만들고 종료일을 다음 날로 저장한다', async ({ page }) => {
    await page.goto('/tools/ics-maker/');
    await page.fill('#ics-title', '종일 행사');
    await page.fill('#ics-start-date', '2026-11-13');
    await page.fill('#ics-end-date', '2026-11-13');
    await page.check('#ics-allday');
    await expect(page.locator('#ics-start-time-field')).toBeHidden();

    const { buffer } = await captureDownload(page, () => page.click('#ics-generate'));
    const text = buffer.toString('utf8');
    expect(text).toContain('DTSTART;VALUE=DATE:20261113');
    expect(text).toContain('DTEND;VALUE=DATE:20261114');
    expect(parseIcs(text)[0]?.start?.allDay).toBe(true);
  });

  test('종료 시간이 빠르면 안내한다', async ({ page }) => {
    await page.goto('/tools/ics-maker/');
    await page.fill('#ics-title', '잘못된 일정');
    await page.fill('#ics-start-time', '12:00');
    await page.fill('#ics-end-time', '11:00');
    await page.click('#ics-generate');
    await expect(page.locator('#ics-error')).toBeVisible();
    await expect(page.locator('#ics-error')).toContainText('종료 시간');
  });

  test('미리보기가 입력을 따라간다', async ({ page }) => {
    await page.goto('/tools/ics-maker/');
    await page.fill('#ics-title', '미리보기 일정');
    await page.fill('#ics-start-date', '2026-11-13');
    await expect(page.locator('#ics-summary-title')).toHaveText('미리보기 일정');
    await expect(page.locator('#ics-summary-when')).toContainText('2026. 11. 13.');
  });
});
