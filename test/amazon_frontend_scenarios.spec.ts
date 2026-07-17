import { test, expect } from '@playwright/test';

// Kịch bản kiểm thử: Tìm kiếm các sản phẩm để "train" bot, sau đó quay về trang chủ để xem gợi ý.
const scenarios = [
  {
    name: 'Samsung Fan',
    searches: ['Samsung T7 Shield', 'Samsung T7'],
    clicksPerSearch: 1
  },
  {
    name: 'Apple Ecosystem',
    searches: ['Apple Watch', 'Apple'],
    clicksPerSearch: 1
  },
  {
    name: 'Audio Lover',
    searches: ['Sony WH-1000XM4', 'JBL Flip 6'],
    clicksPerSearch: 1
  },
  {
    name: 'Home Kitchen Master',
    searches: ['Keurig K-Elite', 'COSORI Pro II', 'Dyson V8', 'Vitamix 5200'],
    clicksPerSearch: 1
  },
  {
    name: 'Fitness Freak',
    searches: ['Manduka PRO', 'Hydro Flask', 'Bowflex SelectTech'],
    clicksPerSearch: 1
  },
  {
    name: 'Outdoor Adventurer',
    searches: ['Osprey Talon', 'Coleman Sundome'],
    clicksPerSearch: 1
  },
  {
    name: 'Home Office Setup',
    searches: ['Steelcase Gesture', 'FLEXISPOT'],
    clicksPerSearch: 1
  },
  {
    name: 'Runner',
    searches: ['Brooks Ghost 15', 'Hydro Flask'],
    clicksPerSearch: 1
  },
  {
    name: 'Tech Worker',
    searches: ['Logitech MX Keys', 'Samsung T7 Shield'],
    clicksPerSearch: 1
  },
  {
    name: 'Mixed User',
    searches: ['Apple Watch', 'Dyson V8', 'Manduka PRO'],
    clicksPerSearch: 1
  }
];

test.describe('Frontend AI Recommendation Tests', () => {

  // Tăng timeout lên 60 giây vì AI model chạy ngầm có thể mất 1-2 giây
  test.setTimeout(60000);

  for (const scenario of scenarios) {
    test(`Scenario: ${scenario.name}`, async ({ page }) => {
      // 1. Vào trang chủ
      await page.goto('http://localhost:5173/');
      
      // Clear localStorage để bắt đầu người dùng mới tinh
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForLoadState('networkidle');

      console.log(`\n=== Bắt đầu kịch bản: ${scenario.name} ===`);

      // 2. Thực hiện tìm kiếm và xem sản phẩm
      for (const query of scenario.searches) {
        // Nhập tìm kiếm
        const searchInput = page.locator('#header-search-input');
        await searchInput.fill(query);
        await page.keyboard.press('Enter');
        
        // Đợi kết quả hiển thị (chờ h2 có chứa từ khóa tìm kiếm)
        await page.waitForSelector(`h2:has-text("Kết quả tìm kiếm cho")`, { timeout: 5000 });
        
        // Click vào sản phẩm đầu tiên
        const firstProduct = page.locator('#storefront-container .grid > div').first();
        if (await firstProduct.isVisible()) {
          const title = await firstProduct.locator('h3').innerText();
          console.log(`[Xem] -> ${title}`);
          await firstProduct.click();
          
          // Chờ modal bật lên
          await page.waitForSelector('div[role="dialog"], .fixed.inset-0', { timeout: 5000 });
          
          // Giả lập đọc nội dung 1 giây
          await page.waitForTimeout(1000);
          
          // Đóng modal (nhấn Escape hoặc click nút X)
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500); // Chờ modal đóng hoàn toàn
        }
      }

      // 3. Click logo để quay về Home và xem AI gợi ý
      console.log(`[Hành động] -> Quay về Trang chủ để xem gợi ý AI...`);
      await page.locator('#header-logo').click();
      
      // 4. Chờ AI xử lý và hiển thị "Gợi ý dành riêng cho bạn"
      await page.waitForSelector(`text="Gợi ý dành riêng cho bạn"`, { timeout: 10000 });
      
      // 5. Trích xuất danh sách gợi ý AI
      const aiRecs = page.locator('#catalog-row .grid > div');
      const count = await aiRecs.count();
      
      console.log(`[Kết quả AI] -> Đã gợi ý ${count} sản phẩm:`);
      for (let i = 0; i < count; i++) {
        const title = await aiRecs.nth(i).locator('h3').innerText();
        console.log(`  ${i+1}. ${title}`);
      }
      
      // Kiểm tra xem thực sự có hiển thị gợi ý (do AI trả về) không
      expect(count).toBeGreaterThan(0);
    });
  }
});
