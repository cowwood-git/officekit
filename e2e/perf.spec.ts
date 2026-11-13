import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    __perf: { cls: number; lcp: number };
  }
}

const pages = ['/', '/tools/pdf-merge/', '/tools/image-ocr/'];

test.describe('성능 (CLS/LCP)', () => {
  for (const path of pages) {
    test(`${path} 초기 로딩이 예산 안에 있다`, async ({ page }) => {
      await page.addInitScript(() => {
        window.__perf = { cls: 0, lcp: 0 };
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
              window.__perf.cls += (entry as PerformanceEntry & { value: number }).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) window.__perf.lcp = last.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      });

      await page.goto(path, { waitUntil: 'load' });
      await expect.poll(async () => page.evaluate(() => window.__perf.lcp)).toBeGreaterThan(0);

      const perf = await page.evaluate(() => ({
        ...window.__perf,
        bytes: (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).reduce(
          (sum, entry) => sum + (entry.transferSize || 0),
          0,
        ),
      }));

      expect(perf.cls).toBeLessThan(0.1);
      expect(perf.lcp).toBeLessThan(2500);
      expect(perf.bytes).toBeLessThan(650_000);
    });
  }
});
