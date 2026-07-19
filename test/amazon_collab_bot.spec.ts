/**
 * amazon_collab_bot.spec.ts
 * ═══════════════════════════════════════════════════════════════
 * Kịch bản ĐÚNG của Collaborative Filtering:
 *
 *   Bot vào Amazon, xem sản phẩm A → B → C → D
 *   Trên mỗi trang sản phẩm, Amazon đã hiển thị:
 *     "Customers who bought this also bought..."  (ground truth)
 *
 *   Bot thu thập tất cả gợi ý đó lại (A_recs ∪ B_recs ∪ ...)
 *   → Đây là tập sản phẩm mà "người dùng thực" hay mua cùng
 *
 *   Mô hình CF của ta cũng nhận [title_A, title_B, title_C, title_D]
 *   → Trả về top-10 gợi ý
 *
 *   So sánh: CF có gợi ý trùng với Amazon không?
 *   Kết quả lưu vào output/collab-bot-{id}.json
 * ═══════════════════════════════════════════════════════════════
 */

import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
    launchRealBrowser,
    humanDelay,
    dismissPopup,
    showFlash,
    waitForSearchBox,
    scrapeAmazonRecs,
} from './bot-helpers';

// ─────────────────────────────────────────────────────────
// Gọi Item-Item CF model Python
// ─────────────────────────────────────────────────────────
function runCFModel(viewedTitles: string[], topK = 10): string[] {
    try {
        const script = path.join(__dirname, '../predict_collaboration.py');
        const input  = JSON.stringify({ viewed_titles: viewedTitles, top_k: topK, method: 'item_cf' });
        const stdout = execSync(`python "${script}"`, {
            input,
            encoding: 'utf-8',
            timeout: 180_000,
            cwd: path.join(__dirname, '..'),
        });
        return JSON.parse(stdout.trim()) as string[];
    } catch (err: any) {
        console.error('❌ CF model lỗi:', String(err.message).slice(0, 100));
        return [`Lỗi: ${String(err.message).slice(0, 80)}`];
    }
}

// ─────────────────────────────────────────────────────────
// Crawl 1 sản phẩm: trả về title thực + Amazon "also bought"
// ─────────────────────────────────────────────────────────
async function crawlProduct(page: any, keyword: string): Promise<{
    realTitle: string;
    amazonAlsoBought: string[];
}> {
    console.log(`\n    🔍 Crawl: "${keyword}"`);

    // Vào Amazon tìm kiếm
    await page.goto('https://www.amazon.com/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await humanDelay(page, 1000, 2000);

    const searchBox = await waitForSearchBox(page);
    await searchBox.fill(keyword);
    await humanDelay(page, 300, 600);
    await searchBox.press('Enter');
    await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 22_000 });
    await humanDelay(page, 500, 1000);
    await dismissPopup(page);

    // Lấy tất cả link /dp/ từ kết quả tìm kiếm bằng evaluate
    const products: { title: string; href: string }[] = await page.evaluate(() => {
        const out: { title: string; href: string }[] = [];
        document.querySelectorAll('[data-component-type="s-search-result"]').forEach(card => {
            const link = card.querySelector<HTMLAnchorElement>('a[href*="/dp/"]');
            if (!link) return;
            const title = (card.querySelector('h2')?.textContent || link.textContent || '').trim();
            const href  = link.getAttribute('href') || '';
            if (href.includes('/dp/')) out.push({ title, href });
        });
        return out;
    });

    // Tìm kết quả khớp keyword nhất
    const words = keyword.toLowerCase().split(' ').filter(w => w.length > 3);
    let best = products[0];
    let bestScore = 0;
    for (const p of products) {
        const score = words.filter(w => p.title.toLowerCase().includes(w)).length;
        if (score > bestScore) { bestScore = score; best = p; }
    }

    // Parse URL sạch /dp/ASIN
    const dpMatch = (best?.href || '').match(/(\/[^?]+\/dp\/[A-Z0-9]{10})/);
    const productUrl = dpMatch
        ? 'https://www.amazon.com' + dpMatch[1]
        : 'https://www.amazon.com' + (best?.href || '').split('?')[0];

    console.log(`    🔗 → ${productUrl.slice(0, 70)}`);

    const { width, height } = page.viewportSize() ?? { width: 1280, height: 720 };
    await showFlash(page, Math.floor(width / 2), Math.floor(height / 2), 600);

    // Navigate thẳng tới product page
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForSelector('#productTitle', { timeout: 25_000 });
    await humanDelay(page, 600, 1200);

    // Lấy tiêu đề thực
    const realTitle = (await page.locator('#productTitle').innerText().catch(() => keyword)).trim();
    console.log(`    ✅ Title: "${realTitle.slice(0, 65)}"`);

    // ── QUAN TRỌNG: Scrape "Customers also bought" từ trang này ──
    const amazonAlsoBought = await scrapeAmazonRecs(page, 15);

    console.log(`    📦 Amazon "also bought": ${amazonAlsoBought.length} sản phẩm`);
    if (amazonAlsoBought.length > 0) {
        console.log(`       → ${amazonAlsoBought[0]?.slice(0, 55)}`);
    }

    return { realTitle, amazonAlsoBought };
}

// ─────────────────────────────────────────────────────────
// 2 kịch bản ColabBot
// ─────────────────────────────────────────────────────────
const COLAB_BOTS = [
    {
        id: 1,
        name: 'ColabBot_Apple_Ecosystem',
        scenario: 'User xem phụ kiện Apple → Amazon & CF gợi ý thêm đồ Apple',
        viewedKeywords: [
            'Apple AirPods Pro 2nd generation',
            'Apple MagSafe charger iPhone 15',
            'Apple Lightning USB-C cable',
            'Apple iPhone 15 silicone case MagSafe',
        ],
    },
    {
        id: 2,
        name: 'ColabBot_Gaming_Mobile',
        scenario: 'User xem controller gaming → Amazon & CF gợi ý gear gaming',
        viewedKeywords: [
            'Razer Kishi V2 mobile game controller iPhone',
            'GameSir G8 Galileo USB-C controller Android',
            'Backbone One PlayStation edition controller',
            'SteelSeries Nimbus wireless controller iOS',
        ],
    }
];

test.describe.configure({ mode: 'serial' });

for (const bot of COLAB_BOTS) {
    test(`[CF] ColabBot #${bot.id} – ${bot.name}`, async () => {
        test.setTimeout(720_000);   // 12 phút (crawl 4 trang × ~2 phút)

        // ── Khởi tạo Chrome thật (không cần KhoiDongChromeBot.bat) ──
        const { context, page } = await launchRealBrowser();

        console.log(`\n${'═'.repeat(60)}`);
        console.log(`🤖 ${bot.name}`);
        console.log(`📌 ${bot.scenario}`);
        console.log(`${'═'.repeat(60)}`);

        // ── BƯỚC 1: Crawl từng sản phẩm, lấy title + Amazon "also bought" ──
        const crawledTitles:    string[]   = [];
        const amazonGroundTruth: string[]  = [];
        const perProductData: {
            keyword: string;
            realTitle: string;
            amazonRecs: string[];
        }[] = [];

        for (let i = 0; i < bot.viewedKeywords.length; i++) {
            const kw = bot.viewedKeywords[i];
            console.log(`\n  [${i + 1}/${bot.viewedKeywords.length}] Sản phẩm ${String.fromCharCode(65 + i)}:`);

            const { realTitle, amazonAlsoBought } = await crawlProduct(page, kw);
            crawledTitles.push(realTitle);

            // Gộp vào ground truth (tránh duplicate)
            for (const r of amazonAlsoBought) {
                if (!amazonGroundTruth.includes(r)) {
                    amazonGroundTruth.push(r);
                }
            }

            perProductData.push({ keyword: kw, realTitle, amazonRecs: amazonAlsoBought });

            // Delay giữa các request để tránh bị block
            if (i < bot.viewedKeywords.length - 1) {
                await humanDelay(page, 2000, 4000);
            }
        }

        console.log(`\n  📋 Đã crawl ${crawledTitles.length} tiêu đề thực`);
        console.log(`  📦 Tổng Amazon ground truth: ${amazonGroundTruth.length} sản phẩm`);

        // ── BƯỚC 2: Chạy CF model ─────────────────────────────────────
        console.log('\n  🧠 Chạy Item-Item CF model...');
        const cfRecs = runCFModel(crawledTitles, 10);

        console.log(`  🎯 CF gợi ý ${cfRecs.length} sản phẩm:`);
        cfRecs.slice(0, 3).forEach((r, i) =>
            console.log(`     ${i + 1}. ${r.slice(0, 65)}`));

        // ── BƯỚC 3: So sánh CF vs Amazon ground truth ─────────────────
        const gtLower = amazonGroundTruth.map(t => t.toLowerCase());
        let matched = 0;
        const matchFlags: boolean[] = cfRecs.map(rec => {
            const rl = rec.toLowerCase();
            const hit = gtLower.some(a =>
                a.includes(rl.slice(0, 30)) || rl.includes(a.slice(0, 30))
            );
            if (hit) matched++;
            return hit;
        });

        const precision = amazonGroundTruth.length > 0
            ? Math.round((matched / Math.min(cfRecs.length, amazonGroundTruth.length)) * 100)
            : 0;

        console.log(`\n  📊 Kết quả so sánh:`);
        console.log(`     CF recommendations: ${cfRecs.length}`);
        console.log(`     Amazon ground truth: ${amazonGroundTruth.length}`);
        console.log(`     Khớp: ${matched}  |  Precision: ${precision}%`);

        // ── BƯỚC 4: Lưu JSON ─────────────────────────────────────────
        const outDir = path.join(__dirname, '../output');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        fs.writeFileSync(
            path.join(outDir, `collab-bot-${bot.id}.json`),
            JSON.stringify({
                botId: bot.id,
                botName: bot.name,
                scenario: bot.scenario,
                algorithm: 'Item-Item Collaborative Filtering',
                timestamp: new Date().toISOString(),

                inputData: {
                    originalKeywords: bot.viewedKeywords,
                    crawledTitles,
                },

                collabModelOutput: cfRecs,
                amazonGroundTruth,
                perProductData,

                evaluation: {
                    cfRecsCount: cfRecs.length,
                    amazonGroundTruthCount: amazonGroundTruth.length,
                    matched,
                    precisionPercent: precision,
                    matchFlags,
                },
            }, null, 2),
            'utf-8'
        );

        console.log(`\n  ✅ Xong → output/collab-bot-${bot.id}.json`);
        console.log(`${'➖'.repeat(60)}`);
        
        await page.close();
        await context.close();
    });
}
