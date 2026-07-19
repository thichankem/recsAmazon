import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
    launchRealBrowser,
    humanDelay,
    dismissPopup,
    showFlash,
    getSearchResults,
    cleanAmazonUrl,
    waitForSearchBox,
    scrapeAmazonRecs,
} from './bot-helpers';

// ─────────────────────────────────────────────────────────
// Gọi model Content-Based Python (.pkl)
// ─────────────────────────────────────────────────────────
function runContentBasedModel(title: string, description: string): string[] {
    try {
        const scriptPath = path.join(__dirname, '../predict.py');
        const stdout = execSync(`python "${scriptPath}"`, {
            input: JSON.stringify({ title, description }),
            encoding: 'utf-8',
            timeout: 120_000,
            cwd: path.join(__dirname, '..'),
        });
        return JSON.parse(stdout.trim()) as string[];
    } catch (err: any) {
        return [`Lỗi: ${String(err.message).slice(0, 80)}`];
    }
}

// ─────────────────────────────────────────────────────────
// 3 Bot AI – Content-Based test
// ─────────────────────────────────────────────────────────
const AI_BOTS = [
    { id: 1,  name: 'Bot_Apple_Fan',       search: 'Apple iPhone 16 Pro Max phone',           target: 'iphone 16' },
    { id: 2,  name: 'Bot_Samsung_Loyal',   search: 'Samsung Galaxy S25 Ultra smartphone',     target: 'galaxy s25' },
    { id: 3,  name: 'Bot_Gamer',           search: 'ASUS ROG Phone 9 gaming smartphone',      target: 'rog phone' }
];

test.describe.configure({ mode: 'serial' });

for (const bot of AI_BOTS) {
    test(`[CB] Bot #${bot.id} ${bot.name}`, async () => {
        test.setTimeout(180_000);

        // ── Khởi tạo Chrome thật (không cần KhoiDongChromeBot.bat) ──
        const { context, page } = await launchRealBrowser();

        console.log(`\n🤖 ${bot.name} → "${bot.search}"`);

        // ── BƯỚC 1: Tìm kiếm ─────────────────────────────────────
        await page.goto('https://www.amazon.com/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
        await humanDelay(page, 1000, 2000);

        // Captcha guard
        const searchBox = await waitForSearchBox(page);
        await searchBox.fill(bot.search);
        await humanDelay(page, 300, 600);
        await searchBox.press('Enter');
        await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 25_000 });
        await humanDelay(page, 600, 1200);

        // Đóng popup Vietnam
        await dismissPopup(page);
        await humanDelay(page, 300, 600);

        // ── BƯỚC 2: Lấy product list từ DOM, chọn best match ──────
        const results = await getSearchResults(page);
        console.log(`  🔍 Tìm thấy ${results.length} kết quả có link /dp/`);

        // Tìm sản phẩm khớp target keyword
        const matched = results.find(r => r.title.toLowerCase().includes(bot.target));
        const chosen = matched || results.find(r => r.href.includes('/dp/')) || results[0];

        if (!chosen || !chosen.href) {
            throw new Error(`Không tìm được sản phẩm nào có link hợp lệ cho "${bot.search}"`);
        }

        const productUrl = cleanAmazonUrl(chosen.href);
        if (!productUrl) {
            throw new Error(`Không parse được URL từ href: ${chosen.href.slice(0, 80)}`);
        }

        console.log(`  ✅ Chọn: "${(chosen.title || '(no title)').slice(0, 60)}"`);
        console.log(`  🔗 URL: ${productUrl}`);

        // Vẽ flash tại vị trí giữa màn hình
        await showFlash(page, 640, 360, 700);

        // ── BƯỚC 3: Navigate thẳng tới product page ───────────────
        await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 });
        await page.waitForSelector('#productTitle', { timeout: 30_000 });
        await humanDelay(page, 600, 1200);

        // ── BƯỚC 4: Lấy nội dung sản phẩm ───────────────────────
        const sourceTitle = (await page.locator('#productTitle').innerText().catch(() => '')).trim();
        const bullets = await page.locator('#feature-bullets li span.a-list-item').allInnerTexts().catch(() => []);
        const descText = await page.locator('#productDescription').innerText().catch(() => '');
        const sourceDescription = [...bullets.map((b: string) => b.trim()), descText.trim()]
            .filter(Boolean).join('\n');
        console.log(`  📝 "${sourceTitle.slice(0, 65)}"`);

        // ── BƯỚC 5: Gợi ý Amazon (ground truth) ─────────────────
        const amazonRecs = await scrapeAmazonRecs(page, 10);
        console.log(`  📊 Amazon gợi ý ${amazonRecs.length} sản phẩm`);

        // ── BƯỚC 6: Model .pkl ────────────────────────────────────
        console.log('  🧠 Gọi model pkl...');
        const modelRecs = runContentBasedModel(sourceTitle, sourceDescription);
        console.log('  🎯 Model:', modelRecs.slice(0, 3));

        // ── BƯỚC 7: Lưu JSON ─────────────────────────────────────
        const outDir = path.join(__dirname, '../output');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(
            path.join(outDir, `content-based-bot-${bot.id}.json`),
            JSON.stringify({
                botId: bot.id, botName: bot.name,
                testCase: `Content-Based: ${bot.search}`,
                timestamp: new Date().toISOString(),
                productUrl,
                inputData: { title: sourceTitle, description: sourceDescription },
                expectedOutput: amazonRecs,
                myModelOutput: modelRecs,
            }, null, 2),
            'utf-8'
        );
        console.log(`  ✅ Bot #${bot.id} xong!`);
        await page.close();
        await context.close();
    });
}