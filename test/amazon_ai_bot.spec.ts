import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ─────────────────────────────────────────────────────────
// Gọi model Content-Based Python (.pkl) từ predict.py
// ─────────────────────────────────────────────────────────
function runContentBasedModel(title: string, description: string): string[] {
    try {
        const scriptPath = path.join(__dirname, '../predict.py');
        const input = JSON.stringify({ title, description });
        const stdout = execSync(`python "${scriptPath}"`, {
            input,
            encoding: 'utf-8',
            timeout: 120_000,   // 2 phút – cần time để load pkl lần đầu
            cwd: path.join(__dirname, '..'), // chạy từ thư mục gốc để tìm đúng model/
        });
        return JSON.parse(stdout.trim()) as string[];
    } catch (err: any) {
        console.error('❌ Lỗi model Python:', err.message);
        return [`Lỗi: ${err.message.slice(0, 80)}`];
    }
}

// ─────────────────────────────────────────────────────────
// Hiệu ứng nhấp nháy trực quan trước khi click
// ─────────────────────────────────────────────────────────
async function flashAndClick(page: any, locator: any, label = '') {
    try {
        await locator.scrollIntoViewIfNeeded();
        const box = await locator.boundingBox();
        if (box) {
            const cx = box.x + box.width / 2;
            const cy = box.y + box.height / 2;

            await page.evaluate(({ x, y }: { x: number; y: number }) => {
                const el = document.createElement('div');
                Object.assign(el.style, {
                    position: 'fixed', left: `${x}px`, top: `${y}px`,
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'rgba(255,0,0,0.65)', border: '3px solid #fff',
                    zIndex: '2147483647', transform: 'translate(-50%,-50%)',
                    pointerEvents: 'none', transition: 'transform .12s',
                });
                document.body.appendChild(el);
                let s = 1; let g = true;
                const iv = setInterval(() => {
                    s += g ? 0.08 : -0.08;
                    if (s >= 1.8) g = false; else if (s <= 0.9) g = true;
                    el.style.transform = `translate(-50%,-50%) scale(${s})`;
                    el.style.background = g ? 'rgba(255,30,30,0.75)' : 'rgba(30,200,80,0.75)';
                }, 60);
                (window as any).__botIv = iv; (window as any).__botEl = el;
            }, { x: cx, y: cy });

            await page.waitForTimeout(1500);   // nhấp nháy 1.5s cho đẹp mắt

            await page.evaluate(() => {
                clearInterval((window as any).__botIv);
                (window as any).__botEl?.remove();
            });
        }
    } catch { /* ignore */ }

    if (label) console.log(`👉 Click: "${label.slice(0, 60)}"`);
    await locator.click({ force: true, timeout: 15_000 });
}

// ─────────────────────────────────────────────────────────
// 10 Bot AI – Content-Based test
// ─────────────────────────────────────────────────────────
const AI_BOTS = [
    { id: 1,  name: 'Bot_Apple_Fan',       search: 'iPhone 16 pro max case',           target: 'iphone',   onlyPhone: false },
    { id: 2,  name: 'Bot_Samsung_Loyal',   search: 'Samsung Galaxy S25 case cover',    target: 'samsung',  onlyPhone: false },
    { id: 3,  name: 'Bot_Gamer',           search: 'ROG Phone gaming accessories',      target: 'rog',      onlyPhone: false },
    { id: 4,  name: 'Bot_Audiophile',      search: 'Wireless Earbuds Bluetooth 2024',  target: 'earbuds',  onlyPhone: false },
    { id: 5,  name: 'Bot_Case_Hunter',     search: 'Heavy Duty Phone Case drop proof',  target: 'case',     onlyPhone: false },
    { id: 6,  name: 'Bot_Power_User',      search: 'Anker Power Bank 20000mAh fast',   target: 'power',    onlyPhone: false },
    { id: 7,  name: 'Bot_Creator',         search: 'Phone Camera Lens Clip-on kit',    target: 'lens',     onlyPhone: false },
    { id: 8,  name: 'Bot_Minimalist',      search: 'MagSafe Wallet Card Holder slim',  target: 'magsafe',  onlyPhone: false },
    { id: 9,  name: 'Bot_Screen',          search: 'Tempered Glass Screen Protector',  target: 'protector',onlyPhone: false },
    { id: 10, name: 'Bot_Budget',          search: 'Unlocked Android Phone under 200', target: 'phone',    onlyPhone: false },
];

test.describe.configure({ mode: 'serial' });

for (const bot of AI_BOTS) {
    test(`[CB] Bot #${bot.id} ${bot.name}`, async ({ page, context }) => {
        test.setTimeout(120_000);   // 2 phút mỗi bot

        // Đặt UA thực tế để tránh bot-detection đơn giản
        await context.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        });

        // ── BƯỚC 1: Tới Amazon & tìm kiếm ──────────────────────
        console.log(`\n🤖 ${bot.name} → "${bot.search}"`);
        await page.goto('https://www.amazon.com/', { waitUntil: 'domcontentloaded', timeout: 40_000 });
        await page.waitForTimeout(1500);

        // Xử lý Captcha nếu có
        const searchBox = page.locator('#twotabsearchtextbox');
        if (!(await searchBox.isVisible({ timeout: 5_000 }).catch(() => false))) {
            console.log('⚠️  Captcha? Vui lòng giải nhanh trong 45s...');
            await page.waitForSelector('#twotabsearchtextbox', { timeout: 45_000 });
        }
        await searchBox.fill(bot.search);
        await searchBox.press('Enter');

        // Đợi kết quả xuất hiện
        await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 25_000 });
        await page.waitForTimeout(800);

        // Đóng popup nếu có
        const dismissBtn = page.locator('button:has-text("Dismiss"), [data-action-type="DISMISS"]').first();
        if (await dismissBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await dismissBtn.click({ force: true }).catch(() => {});
        }

        // ── BƯỚC 2: Click sản phẩm phù hợp nhất ───────────────
        const cards = page.locator('[data-component-type="s-search-result"]');
        const total = await cards.count();
        console.log(`🔍 Tìm thấy ${total} kết quả`);

        let clicked = false;
        for (let i = 0; i < Math.min(total, 12); i++) {
            const card = cards.nth(i);
            const link = card.locator('h2 a').first();
            const title = (await link.textContent().catch(() => '')).trim().toLowerCase();

            if (title.includes(bot.target)) {
                await flashAndClick(page, link, title);
                clicked = true;
                break;
            }
        }

        if (!clicked && total > 0) {
            console.log('⚠️  Không khớp target, click sản phẩm đầu tiên');
            const firstLink = cards.first().locator('h2 a').first();
            await flashAndClick(page, firstLink, 'first result');
        }

        // Chờ trang chi tiết load xong
        await page.waitForSelector('#productTitle', { timeout: 30_000 });
        await page.waitForTimeout(1000);

        // ── BƯỚC 3: Lấy nội dung sản phẩm nguồn ───────────────
        const sourceTitle = (await page.locator('#productTitle').innerText().catch(() => '')).trim();
        const bullets = await page.locator('#feature-bullets li span.a-list-item').allInnerTexts().catch(() => []);
        const descText = await page.locator('#productDescription').innerText().catch(() => '');
        const sourceDescription = [...bullets.map(b => b.trim()), descText.trim()]
            .filter(Boolean).join('\n');

        console.log(`📝 Sản phẩm: "${sourceTitle.slice(0, 60)}..."`);

        // ── BƯỚC 4: Gợi ý Amazon (ground truth) ────────────────
        await page.mouse.wheel(0, 1400);
        await page.waitForTimeout(2500);

        const recItems = page.locator('[data-client-recs-id], .a-carousel-card, .recs-card');
        const recCount = await recItems.count();
        const amazonRecs: string[] = [];
        for (let i = 0; i < Math.min(recCount, 5); i++) {
            const t = await recItems.nth(i).locator('span, h2').first().innerText().catch(() => '');
            if (t.trim().length > 5) amazonRecs.push(t.trim());
        }

        // ── BƯỚC 5: Model Content-Based ─────────────────────────
        console.log('🧠 Đang gọi model pkl...');
        const modelRecs = runContentBasedModel(sourceTitle, sourceDescription);
        console.log('🎯 Model gợi ý:', modelRecs);

        // ── BƯỚC 6: Ghi file kết quả ────────────────────────────
        const outDir = path.join(__dirname, '../output');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        fs.writeFileSync(
            path.join(outDir, `content-based-bot-${bot.id}.json`),
            JSON.stringify({
                botId: bot.id, botName: bot.name,
                testCase: `Content-Based: ${bot.search}`,
                timestamp: new Date().toISOString(),
                inputData: { title: sourceTitle, description: sourceDescription },
                expectedOutput: amazonRecs,
                myModelOutput: modelRecs,
            }, null, 2),
            'utf-8'
        );
        console.log(`✅ Bot #${bot.id} xong!`);
    });
}