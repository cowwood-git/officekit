import { expect, test } from '@playwright/test';
import { parseVcf } from '../src/lib/vcf-ics';
import { captureDownload } from './fixtures';

test.describe('vCard 만들기', () => {
  test('입력한 연락처를 VCF로 저장한다', async ({ page }) => {
    await page.goto('/tools/vcard-maker/');
    await expect(page.locator('#vc-download')).toBeDisabled();
    await page.fill('#vc-name', '홍길동');
    await page.fill('#vc-org', '옷깃');
    await page.fill('#vc-title', '대표');
    await page.fill('#vc-phone', '010-1234-5678');
    await page.fill('#vc-email', 'hello@example.com');
    await page.fill('#vc-address', '서울시 강남구 테헤란로 1');
    await expect(page.locator('#vc-download')).toBeEnabled();

    const { name, buffer } = await captureDownload(page, () => page.click('#vc-download'));
    expect(name).toMatch(/^연락처-\d{8}\.vcf$/);
    const contacts = parseVcf(buffer.toString('utf8'));
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject({
      name: '홍길동',
      org: '옷깃',
      title: '대표',
      phones: ['010-1234-5678'],
      emails: ['hello@example.com'],
      address: '서울시 강남구 테헤란로 1',
    });
  });

  test('목록에 여러 연락처를 추가해 한 파일로 저장한다', async ({ page }) => {
    await page.goto('/tools/vcard-maker/');
    await page.fill('#vc-name', '홍길동');
    await page.fill('#vc-phone', '010-1111-1111');
    await page.click('#vc-add');
    await expect(page.locator('#vc-count')).toHaveText('1명');
    await page.fill('#vc-name', '김옷깃');
    await page.fill('#vc-phone', '010-2222-2222');
    await page.click('#vc-add');
    await expect(page.locator('#vc-count')).toHaveText('2명');

    const { buffer } = await captureDownload(page, () => page.click('#vc-download'));
    const contacts = parseVcf(buffer.toString('utf8'));
    expect(contacts.map((contact) => contact.name)).toEqual(['홍길동', '김옷깃']);
  });

  test('목록에서 연락처를 삭제한다', async ({ page }) => {
    await page.goto('/tools/vcard-maker/');
    await page.fill('#vc-name', '홍길동');
    await page.click('#vc-add');
    await expect(page.locator('#vc-list li')).toHaveCount(1);
    await page.locator('#vc-list [data-remove], #vc-list .vc-remove').first().click();
    await expect(page.locator('#vc-list li')).toHaveCount(0);
    await expect(page.locator('#vc-count')).toHaveText('0명');
  });
});
