import { test, expect } from '@playwright/test';

test.describe('Scenario 4: Frontend UI/UX Recommendation Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to frontend
    await page.goto('http://127.0.0.1:5173/');
    // Clear local storage to ensure Cold Start for each test
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
    // Click vào 1 sản phẩm bất kỳ, ví dụ Apple Watch
    await page.locator('h3', { hasText: 'Apple Watch Series 9' }).first().click();
    
    // Đợi Modal bật lên
    const modal = page.locator('div[id^="product-modal-"]').first();
    await expect(modal).toBeVisible();

    // Xác minh phần "Sản phẩm gợi ý liên quan" được hiển thị bằng AI
    await expect(modal.locator('text=Sản phẩm gợi ý liên quan')).toBeVisible();
    await expect(modal.locator('text=Được đề xuất bởi hệ thống AI')).toBeVisible();

    // Có ít nhất 1 sản phẩm gợi ý
    const recCards = modal.locator('div[id^="product-card-"]');
    await expect(recCards.first()).toBeVisible();

    // Đóng modal
    await modal.locator('button').first().click();
    await expect(modal).not.toBeVisible();
    await page.waitForTimeout(500); // wait for modal animation
  });

  test('Test Case 3: Collaborative Filtering (Chọn 4 sản phẩm Samsung -> Gợi ý sản phẩm Samsung thứ 5)', async ({ page }) => {
    // Bước 1: Xem Samsung Galaxy S24 Ultra
    await page.locator('h3', { hasText: 'Samsung Galaxy S24 Ultra' }).first().click();
    await page.waitForTimeout(500); // Simulate user reading
    await page.locator('div[id^="product-modal-"]').first().locator('button').first().click(); // Close
    await page.waitForTimeout(500); // wait for modal animation

    // Bước 2: Xem Samsung Galaxy Watch 6 Classic
    await page.locator('h3', { hasText: 'Samsung Galaxy Watch 6 Classic' }).first().click();
    await page.waitForTimeout(500);
    await page.locator('div[id^="product-modal-"]').first().locator('button').first().click(); // Close
    await page.waitForTimeout(500); // wait for modal animation

    // Bước 3: Xem Samsung Galaxy Buds 2 Pro
    await page.locator('h3', { hasText: 'Samsung Galaxy Buds 2 Pro' }).first().click();
    await page.waitForTimeout(500);
    await page.locator('div[id^="product-modal-"]').first().locator('button').first().click(); // Close
    await page.waitForTimeout(500); // wait for modal animation

    // Bước 4: Xem Samsung Galaxy Tab S9
    await page.locator('h3', { hasText: 'Samsung Galaxy Tab S9' }).first().click();
    await page.waitForTimeout(500);
    await page.locator('div[id^="product-modal-"]').first().locator('button').first().click(); // Close
    await page.waitForTimeout(500); // wait for modal animation

    // Bước 5: Quay lại trang chủ, AI sẽ tính toán và hiển thị "Gợi ý dành riêng cho bạn"
    await expect(page.locator('text=Gợi ý dành riêng cho bạn')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Powered by AI')).toBeVisible();

    // Bước 6: Xác minh rằng hệ thống gợi ý sản phẩm Samsung thứ 5 (Samsung T7 Shield)
    // Thuật toán sẽ tìm item thường xuyên được mua cùng (bought_together) hoặc cùng category.
    // Dữ liệu mock đã liên kết S24, Watch6, Buds2, Tab9 với nhau và với đồ điện tử.
    const recommendationSection = page.locator('#catalog-row');
    await expect(recommendationSection.locator('h3', { hasText: 'Samsung T7 Shield' })).toBeVisible();
    
    // Tùy chọn: Log ra console để chứng minh cho khách hàng xem
    console.log("✅ Đã chọn 4 sản phẩm Samsung, hệ thống gợi ý thành công sản phẩm Samsung thứ 5: T7 Shield.");
  });
});
