import { test, expect } from '@playwright/test';

test.describe('Scenario 4: Frontend UI/UX Recommendation Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to frontend
    await page.goto('http://localhost:5173/');
    // Clear local storage and reload to ensure Cold Start for each test
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Test Case 1: Trạng thái Cold Start (Lần đầu truy cập)', async ({ page }) => {
    // Không có lịch sử xem -> Phải hiện "Danh sách sản phẩm"
    await expect(page.locator('text="Danh sách sản phẩm"')).toBeVisible();
    
    // Không được hiện "Gợi ý dành riêng cho bạn"
    await expect(page.locator('text="Gợi ý dành riêng cho bạn"')).not.toBeVisible();
  });

  test('Test Case 2: Content-Based Flow (Xem chi tiết sản phẩm -> Gợi ý liên quan)', async ({ page }) => {
    // Mock API response for content-based recommendations
    await page.route('**/api/recommendations/content', async (route) => {
      const json = {
        titles: [
          'Apple Watch Series 9 GPS 45mm Smartwatch',
          'Anker 3-in-1 Wireless Charging Station with Power Adapter'
        ]
      };
      await route.fulfill({ json });
    });

    // Click vào 1 sản phẩm bất kỳ
    const productLocator = page.locator('div[id^="product-card-"]').first();
    await productLocator.click();
    
    // Đợi Modal bật lên
    const modal = page.locator('div[id^="product-modal-"]').first();
    await expect(modal).toBeVisible();

    // Xác minh phần "Sản phẩm gợi ý liên quan" được hiển thị bằng AI
    await expect(modal.locator('text=Sản phẩm gợi ý liên quan')).toBeVisible();
    await expect(modal.locator('text=Được đề xuất bởi hệ thống AI')).toBeVisible();

    // Có ít nhất 1 sản phẩm gợi ý trong mục này
    const recCards = modal.locator('div[id^="product-card-"]');
    await expect(recCards.first()).toBeVisible();

    // Đóng modal bằng nút đóng có id=modal-close-btn
    await modal.locator('#modal-close-btn').click();
    await expect(modal).not.toBeVisible();
  });

  test('Test Case 3: Collaborative Filtering (Quay về trang chủ -> Gợi ý dành riêng cho bạn)', async ({ page }) => {
    // Mock API response for collaborative recommendations
    await page.route('**/api/recommendations/collaborative', async (route) => {
      const json = {
        titles: [
          'Samsung Galaxy Watch 6 Classic, 47mm',
          'Samsung Galaxy Buds 2 Pro True Wireless Earbuds',
          'Samsung Galaxy Tab S9, 11-inch, 128GB'
        ]
      };
      await route.fulfill({ json });
    });

    // Bước 1: Click 1 sản phẩm để đưa vào lịch sử
    const productLocator = page.locator('div[id^="product-card-"]').first();
    await productLocator.click();
    
    // Chờ modal hiện ra và đóng lại
    const modal = page.locator('div[id^="product-modal-"]').first();
    await expect(modal).toBeVisible();
    await modal.locator('#modal-close-btn').click();
    await expect(modal).not.toBeVisible();

    // Bước 2: Quay lại trang chủ, AI sẽ tính toán và hiển thị "Gợi ý dành riêng cho bạn"
    const recommendationSection = page.locator('#catalog-row');
    await expect(recommendationSection.locator('text=Gợi ý dành riêng cho bạn')).toBeVisible();
    await expect(recommendationSection.locator('text=Powered by AI')).toBeVisible();

    // Xác minh rằng có danh sách thẻ sản phẩm
    const productCards = recommendationSection.locator('div[id^="product-card-"]');
    await expect(productCards.first()).toBeVisible();
    
    console.log("✅ Đã test thành công luồng Collaborative Filtering (mocked).");
  });

  test('Test Case 4: Continuous Profiling (Lịch sử xem tích lũy)', async ({ page }) => {
    // Click sản phẩm 1
    const p1 = page.locator('div[id^="product-card-"]').nth(0);
    await p1.click();
    let modal = page.locator('div[id^="product-modal-"]').first();
    await expect(modal).toBeVisible();
    await modal.locator('#modal-close-btn').click();
    await expect(modal).not.toBeVisible();

    // Click sản phẩm 2
    const p2 = page.locator('div[id^="product-card-"]').nth(1);
    await p2.click();
    modal = page.locator('div[id^="product-modal-"]').first();
    await expect(modal).toBeVisible();
    await modal.locator('#modal-close-btn').click();
    await expect(modal).not.toBeVisible();

    // Verify debug banner hiển thị đúng số lượng
    const banner = page.locator('text=Đã xem (2):');
    await expect(banner).toBeVisible();
  });
});
