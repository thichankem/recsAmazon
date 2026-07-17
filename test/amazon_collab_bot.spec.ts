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

import { test, chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

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
// Đóng popup Vietnam shipping
// ─────────────────────────────────────────────────────────
async function dismissPopup(page: any) {
    try {
        await page.evaluate(() => {
            document.querySelectorAll<HTMLElement>('button, input[type="submit"], span').forEach(el => {
                if (el.textContent?.trim() === 'Dismiss') el.click();
            });
        });
        await page.waitForTimeout(500);
    } catch { }
}

// ─────────────────────────────────────────────────────────
// Vẽ hiệu ứng nhấp nháy
// ─────────────────────────────────────────────────────────
async function flash(page: any, ms = 700) {
    try {
        const { width, height } = page.viewportSize() ?? { width: 1280, height: 720 };
        await page.evaluate(({ cx, cy }: { cx: number; cy: number }) => {
            const el = Object.assign(document.createElement('div'), {});
            Object.assign(el.style, {
                position: 'fixed', left: `${cx}px`, top: `${cy}px`,
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(255,120,0,0.85)', border: '3px solid #fff',
                zIndex: '2147483647', transform: 'translate(-50%,-50%)',
                pointerEvents: 'none',
            });
            document.body.appendChild(el);
            let s = 1, g = true;
            const iv = setInterval(() => {
                s += g ? 0.09 : -0.09;
                if (s >= 1.8) g = false; else if (s <= 0.9) g = true;
                el.style.transform = `translate(-50%,-50%) scale(${s})`;
                el.style.background = g ? 'rgba(255,120,0,.9)' : 'rgba(0,200,120,.9)';
            }, 55);
            (window as any).__fi = iv; (window as any).__fe = el;
        }, { cx: Math.floor(width / 2), cy: Math.floor(height / 2) });
        await page.waitForTimeout(ms);
        await page.evaluate(() => { clearInterval((window as any).__fi); (window as any).__fe?.remove(); });
    } catch { }
}

// ─────────────────────────────────────────────────────────
// Crawl 1 sản phẩm: trả về title thực + Amazon "also bought"
// ─────────────────────────────────────────────────────────
async function crawlProduct(page: any, keyword: string): Promise<{
    realTitle: string;
    amazonAlsoBought: string[];   // gợi ý "cũng mua" của Amazon trên trang này
}> {
    console.log(`\n    🔍 Crawl: "${keyword}"`);

    // Vào Amazon tìm kiếm
    await page.goto('https://www.amazon.com/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForTimeout(1200);

    const searchBox = page.locator('#twotabsearchtextbox');
    if (!(await searchBox.isVisible({ timeout: 5_000 }).catch(() => false))) {
        console.log('    ⚠️  Captcha! Giải trong 120s...');
        await page.waitForSelector('#twotabsearchtextbox', { timeout: 120_000 });
    }

    await searchBox.fill(keyword);
    await searchBox.press('Enter');
    await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 22_000 });
    await page.waitForTimeout(700);
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
    await flash(page, 600);

    // Navigate thẳng tới product page (bỏ qua tracking redirect)
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForSelector('#productTitle', { timeout: 25_000 });
    await page.waitForTimeout(800);

    // Lấy tiêu đề thực
    const realTitle = (await page.locator('#productTitle').innerText().catch(() => keyword)).trim();
    console.log(`    ✅ Title: "${realTitle.slice(0, 65)}"`);

    // ── QUAN TRỌNG: Scrape "Customers also bought" từ trang này ──
    // Scroll xuống để load carousel
    await page.mouse.wheel(0, 1800);
    await page.waitForTimeout(2500);
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(1500);

    const amazonAlsoBought: string[] = await page.evaluate(() => {
        const recs: string[] = [];
        const seen = new Set<string>();

        // Hàm kiểm tra xem chuỗi có phải giá tiền / rác hay không
        function isJunk(s: string): boolean {
            const t = s.trim().toLowerCase();
            if (t.length < 10) return true;
            // Loại giá tiền VND, $, €, ₫
            if (/^[\s\d,.\-]+$/.test(t)) return true;
            if (/vnd[\s\d,.\-]/i.test(t)) return true;
            if (/^\$[\d,.\s]/.test(t)) return true;
            if (/^\(vnd\s/i.test(t)) return true;
            if (/\/count\)/.test(t)) return true;
            if (/\/feet\)/.test(t)) return true;
            if (/% off/i.test(t)) return true;
            if (/limited.time.deal/i.test(t)) return true;
            if (/only \d+ left/i.test(t)) return true;
            if (/list\s*:?\s*price/i.test(t)) return true;
            if (/typical\s*:/i.test(t)) return true;
            if (/discover more products/i.test(t)) return true;
            if (/sustainability/i.test(t)) return true;
            if (/^\d+[\s]*stars?/i.test(t)) return true;
            if (/^\d+[,.]?\d*$/.test(t.replace(/\s/g, ''))) return true;
            return false;
        }

        function addRec(s: string) {
            const clean = s.split('\n')[0].trim();
            if (!isJunk(clean) && !seen.has(clean)) {
                seen.add(clean);
                recs.push(clean);
            }
        }

        // 1. Ưu tiên: lấy title từ link có aria-label trong carousel
        const carouselSections = document.querySelectorAll(
            '[data-client-recs-id], #similarities_feature_div, #p13n-asin-carousel-wr, [class*="sims-fbt"], [class*="a-carousel"]'
        );
        carouselSections.forEach(sec => {
            // Lấy từ aria-label của link (thường chứa tên sản phẩm đầy đủ)
            sec.querySelectorAll<HTMLAnchorElement>('a[aria-label]').forEach(a => {
                addRec(a.getAttribute('aria-label') || '');
            });
            // Lấy từ alt text của ảnh sản phẩm
            sec.querySelectorAll<HTMLImageElement>('img[alt]').forEach(img => {
                const alt = img.getAttribute('alt') || '';
                if (alt.length > 15) addRec(alt);
            });
        });

        // 2. Fallback: lấy text truncate (nhưng lọc giá)
        if (recs.length < 5) {
            const textSelectors = [
                '[data-client-recs-id] .a-truncate-full',
                '[data-client-recs-id] .a-truncate-cut',
                '.a-carousel-card .a-truncate-full',
                '.a-carousel-card .a-truncate-cut',
                '#sims-fbt-content .a-truncate-full',
            ];
            for (const sel of textSelectors) {
                document.querySelectorAll(sel).forEach(el => {
                    addRec((el as HTMLElement).innerText || '');
                });
            }
        }

        return recs.slice(0, 15);
    });

    console.log(`    📦 Amazon "also bought": ${amazonAlsoBought.length} sản phẩm`);
    if (amazonAlsoBought.length > 0) {
        console.log(`       → ${amazonAlsoBought[0]?.slice(0, 55)}`);
    }

    return { realTitle, amazonAlsoBought };
}

// ─────────────────────────────────────────────────────────
// 5 kịch bản ColabBot
// Mỗi bot xem 4 sản phẩm → lấy Amazon recs từ mỗi trang
// → Gộp làm ground truth → so với CF model
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

        let browser;
        try {
            browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 10000 });
        } catch (e) {
            console.error("LỖI: Chưa khởi động Chrome ở chế độ Bot. Hãy chạy file KhoiDongChromeBot.bat trước!");
            throw e;
        }
        const context = browser.contexts()[0];
        const page = await context.newPage();

        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        });

        console.log(`\n${'═'.repeat(60)}`);
        console.log(`🤖 ${bot.name}`);
        console.log(`📌 ${bot.scenario}`);
        console.log(`${'═'.repeat(60)}`);

        // ── BƯỚC 1: Crawl từng sản phẩm, lấy title + Amazon "also bought" ──
        const crawledTitles:    string[]   = [];
        const amazonGroundTruth: string[]  = [];  // tổng hợp từ TẤT CẢ trang
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
                await page.waitForTimeout(2500);
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

                // Dữ liệu đầu vào
                inputData: {
                    originalKeywords: bot.viewedKeywords,  // keyword tìm kiếm
                    crawledTitles,                          // tiêu đề thực từ Amazon
                },

                // Gợi ý từ mô hình CF
                collabModelOutput: cfRecs,

                // Ground truth từ Amazon (tổng hợp từ TẤT CẢ trang sản phẩm đã crawl)
                amazonGroundTruth,

                // Chi tiết từng sản phẩm đã crawl
                perProductData,

                // Đánh giá
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
    });
}
