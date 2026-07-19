import { test, expect } from '@playwright/test';

/**
 * Frontend Smoke Tests — nhẹ nhất có thể (2 test, ~20 giây tổng)
 *
 * Test 1: Cold Start — catalog hiển thị sản phẩm
 * Test 2: Click sản phẩm → modal mở → nhấn nút X → modal đóng → catalog vẫn còn
 */
test.describe('Frontend Smoke Test', () => {
  test.setTimeout(30000); // tối đa 30 giây / test

  test('Test 1 — Cold Start: catalog hiển thị sản phẩm', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Catalog phải load
    await expect(page.locator('#catalog-row')).toBeVisible({ timeout: 10000 });

    const cards = page.locator('#catalog-row .grid > div');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });

    const count = await cards.count();
    console.log(`✅ Cold Start: ${count} sản phẩm`);
    expect(count).toBeGreaterThan(0);
  });

  test('Test 2 — Modal: mở → đóng bằng nút X → catalog vẫn còn', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Đợi catalog load
    await page.waitForSelector('#catalog-row .grid > div', { timeout: 10000 });

    // Click card đầu tiên
    const firstCard = page.locator('#catalog-row .grid > div').first();
    const title = await firstCard.locator('h3').innerText().catch(() => '?');
    console.log(`🖱️  Click: "${title}"`);

    await firstCard.click({ force: true });

    // Modal phải xuất hiện — locate bằng id cố định
    const modal = page.locator('.fixed.inset-0').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    console.log('✅ Modal đã mở');

    // Đóng bằng nút X (id="modal-close-btn")
    await page.locator('#modal-close-btn').click();

    // Đợi modal biến mất
    await expect(modal).toBeHidden({ timeout: 5000 });
    console.log('✅ Modal đã đóng');

    // Đợi spinner "Đang tải gợi ý..." biến mất (nếu có) — CF đang fetch API
    await page.locator('text=Đang tải gợi ý').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    // Catalog vẫn phải hiển thị sau khi load xong
    await expect(page.locator('#catalog-row')).toBeVisible({ timeout: 5000 });
    const cards = page.locator('#catalog-row .grid > div');
    await expect(cards.first()).toBeVisible({ timeout: 10000 }); // chờ grid render
    const count = await cards.count();
    console.log(`✅ Catalog sau khi xem: ${count} sản phẩm`);
    expect(count).toBeGreaterThan(0);
  });
});
