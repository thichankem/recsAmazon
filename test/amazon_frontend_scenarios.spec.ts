import { test, expect } from '@playwright/test';

// ✅ Chỉ 2 kịch bản, mỗi cái 1 từ khóa để test nhanh và nhẹ máy
const scenarios = [
  { name: 'Samsung Fan',    searches: ['Samsung T7 Shield'] },
  { name: 'Apple Fan',      searches: ['Apple Watch'] }
];

test.describe('Frontend AI Recommendation Tests', () => {

  test.setTimeout(45000);

  for (const scenario of scenarios) {
    test(`Scenario: ${scenario.name}`, async ({ page }) => {

      // 1. Vào trang chủ, reset trạng thái sạch
      await page.goto('http://localhost:5173/');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      // Đóng bất kỳ modal nào đang mở sẵn (tránh bị che khuất)
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      console.log(`\n=== Kịch bản: ${scenario.name} ===`);

      // 2. Tìm kiếm và xem sản phẩm
      for (const query of scenario.searches) {
        const searchInput = page.locator('#header-search-input');
        await searchInput.fill(query);
        await page.keyboard.press('Enter');

        await page.waitForSelector(`h2:has-text("Kết quả tìm kiếm cho")`, { timeout: 8000 });

        // Đợi modal cũ biến mất hoàn toàn trước khi click
        await page.waitForSelector('div[role="dialog"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

        const firstProduct = page.locator('#storefront-container .grid > div').first();
        if (await firstProduct.isVisible()) {
          const title = await firstProduct.locator('h3').innerText().catch(() => '(unknown)');
          console.log(`[Xem] -> ${title}`);

          // Click vào phần tử con (h3) để tránh modal overlay che khuất
          await firstProduct.locator('h3').click({ force: true });

          // Đợi modal mở
          await page.waitForSelector('div[role="dialog"]', { state: 'visible', timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(200);

          // Đóng modal bằng Escape
          await page.keyboard.press('Escape');

          // Đợi modal đóng hẳn trước khi tiếp tục
          await page.waitForSelector('div[role="dialog"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(150);
        }
      }

      // 3. Quay về Home để xem gợi ý AI
      console.log(`[Action] -> Quay về trang chủ...`);
      await page.locator('#header-logo').click({ force: true });

      // 4. Chờ AI hiển thị gợi ý cá nhân hoá
      await page.waitForSelector(`text="Gợi ý dành riêng cho bạn"`, { timeout: 20000 });

      // 5. Lấy danh sách gợi ý
      const aiRecs = page.locator('#catalog-row .grid > div');
      const count = await aiRecs.count();
      console.log(`[Kết quả] -> AI gợi ý ${count} sản phẩm`);

      for (let i = 0; i < count; i++) {
        const title = await aiRecs.nth(i).locator('h3').innerText().catch(() => '-');
        console.log(`  ${i + 1}. ${title}`);
      }

      expect(count).toBeGreaterThan(0);
    });
  }
});
