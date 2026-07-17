import { test, expect } from '@playwright/test';

// Kịch bản kiểm thử: Giảm tải tối đa — chỉ 2 kịch bản, mỗi cái 1 từ khóa
const scenarios = [
  {
    name: 'Samsung Fan',
    searches: ['Samsung T7 Shield'],   // giảm xuống 1 từ khóa
    clicksPerSearch: 1
  },
  {
    name: 'Apple Ecosystem',
    searches: ['Apple Watch'],          // giảm xuống 1 từ khóa
    clicksPerSearch: 1
  }
];

test.describe('Frontend AI Recommendation Tests', () => {

  // Timeout hợp lý 45 giây
  test.setTimeout(45000);

  for (const scenario of scenarios) {
    test(`Scenario: ${scenario.name}`, async ({ page }) => {
      // 1. Vào trang chủ
      await page.goto('http://localhost:5173/');

      // Clear localStorage để bắt đầu người dùng mới tinh
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForLoadState('domcontentloaded'); // nhẹ hơn networkidle

      console.log(`\n=== Bắt đầu kịch bản: ${scenario.name} ===`);

      // 2. Thực hiện tìm kiếm và xem sản phẩm
      for (const query of scenario.searches) {
        const searchInput = page.locator('#header-search-input');
        await searchInput.fill(query);
        await page.keyboard.press('Enter');

        // Đợi kết quả hiển thị
        await page.waitForSelector(`h2:has-text("Kết quả tìm kiếm cho")`, { timeout: 5000 });

        // Click vào sản phẩm đầu tiên
        const firstProduct = page.locator('#storefront-container .grid > div').first();
        if (await firstProduct.isVisible()) {
          const title = await firstProduct.locator('h3').innerText();
          console.log(`[Xem] -> ${title}`);
          await firstProduct.click();

          // Chờ modal bật lên
          await page.waitForSelector('div[role="dialog"], .fixed.inset-0', { timeout: 5000 });

          // Giả lập đọc nội dung (giảm xuống 300ms)
          await page.waitForTimeout(300);

          // Đóng modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200); // giảm xuống 200ms
        }
      }

      // 3. Quay về Home để xem AI gợi ý
      console.log(`[Hành động] -> Quay về Trang chủ để xem gợi ý AI...`);
      await page.locator('#header-logo').click();

      // 4. Chờ AI hiển thị gợi ý
      await page.waitForSelector(`text="Gợi ý dành riêng cho bạn"`, { timeout: 20000 });

      // 5. Trích xuất danh sách gợi ý AI
      const aiRecs = page.locator('#catalog-row .grid > div');
      const count = await aiRecs.count();

      console.log(`[Kết quả AI] -> Đã gợi ý ${count} sản phẩm:`);
      for (let i = 0; i < count; i++) {
        const title = await aiRecs.nth(i).locator('h3').innerText();
        console.log(`  ${i + 1}. ${title}`);
      }

      // Kiểm tra có hiển thị gợi ý không
      expect(count).toBeGreaterThan(0);
    });
  }
});
