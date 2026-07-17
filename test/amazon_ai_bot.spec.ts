import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

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
// Vẽ hiệu ứng nhấp nháy (không block flow)
// ─────────────────────────────────────────────────────────
async function showFlash(page: any, x: number, y: number, ms = 800) {
    try {
        await page.evaluate(({ cx, cy }: { cx: number; cy: number }) => {
            const el = document.createElement('div');
            Object.assign(el.style, {
                position: 'fixed', left: `${cx}px`, top: `${cy}px`,
                width: '38px', height: '38px', borderRadius: '50%',
                background: 'rgba(255,60,0,0.8)', border: '3px solid #fff',
                zIndex: '2147483647', transform: 'translate(-50%,-50%)',
                pointerEvents: 'none',
            });
            document.body.appendChild(el);
            let s = 1; let g = true;
            const iv = setInterval(() => {
                s += g ? 0.09 : -0.09;
                if (s >= 1.8) g = false; else if (s <= 0.9) g = true;
                el.style.transform = `translate(-50%,-50%) scale(${s})`;
                el.style.background = g ? 'rgba(255,60,0,0.85)' : 'rgba(0,190,255,0.85)';
            }, 60);
            (window as any).__bIv = iv; (window as any).__bEl = el;
        }, { cx: x, cy: y });
        await page.waitForTimeout(ms);
        await page.evaluate(() => {
            clearInterval((window as any).__bIv);
            (window as any).__bEl?.remove();
        });
    } catch { /* page navigated */ }
}

// ─────────────────────────────────────────────────────────
// Đóng popup Vietnam – click trực tiếp vào nút Dismiss
// ─────────────────────────────────────────────────────────
async function dismissVietnamPopup(page: any) {
    try {
        // Tìm và click nút Dismiss trong popup Vietnam shipping
        const closed = await page.evaluate(() => {
            // Tìm tất cả button/input/span có chữ "Dismiss"
            const elements = document.querySelectorAll('button, input[type="submit"], span[class*="a-button"]');
            for (const el of elements) {
                if (el.textContent?.trim() === 'Dismiss') {
                    (el as HTMLElement).click();
                    return true;
                }
            }
            // Fallback: tìm trong input submit value="Dismiss"
            const inputs = document.querySelectorAll('input[value="Dismiss"]');
            for (const inp of inputs) {
                (inp as HTMLElement).click();
                return true;
            }
            return false;
        });
        if (closed) {
            console.log('  ℹ️  Đã đóng popup Vietnam');
            await page.waitForTimeout(600);
        }
    } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────
// Dùng page.evaluate để lấy toàn bộ product {title, href}
// từ DOM – đáng tin hơn Playwright locator cho lazy content
// ─────────────────────────────────────────────────────────
async function getSearchResults(page: any): Promise<{ title: string; href: string }[]> {
    return page.evaluate(() => {
        const cards = document.querySelectorAll('[data-component-type="s-search-result"]');
        const results: { title: string; href: string }[] = [];
        for (const card of cards) {
            // Thử h2 a trước
            const h2link = card.querySelector('h2 a') as HTMLAnchorElement | null;
            if (h2link) {
                const title = h2link.textContent?.trim() || '';
                const href = h2link.getAttribute('href') || '';
                if (href.includes('/dp/') || href.startsWith('/')) {
                    results.push({ title, href });
                    continue;
                }
            }
            // Fallback: tìm bất kỳ link nào dẫn tới /dp/
            const dpLink = card.querySelector('a[href*="/dp/"]') as HTMLAnchorElement | null;
            if (dpLink) {
                const title = (card.querySelector('h2')?.textContent || dpLink.textContent || '').trim();
                results.push({ title, href: dpLink.getAttribute('href') || '' });
            }
        }
        return results;
    });
}

// Trích ASIN path từ href, trả về URL sạch
function cleanAmazonUrl(href: string): string {
    if (!href) return '';
    if (href.startsWith('http') && href.includes('/dp/')) {
        const m = href.match(/(https?:\/\/[^/]+\/[^?]+\/dp\/[A-Z0-9]{10})/);
        return m ? m[1] : href.split('?')[0];
    }
    const m = href.match(/(\/[^?]+\/dp\/[A-Z0-9]{10})/);
    if (m) return 'https://www.amazon.com' + m[1];
    if (href.startsWith('/')) return 'https://www.amazon.com' + href.split('?')[0];
    return '';
}

// ─────────────────────────────────────────────────────────
// 10 Bot AI – Content-Based test
// ─────────────────────────────────────────────────────────
const AI_BOTS = [
    { id: 1,  name: 'Bot_Apple_Fan',       search: 'Apple iPhone 16 Pro Max phone',           target: 'iphone 16' },
    { id: 2,  name: 'Bot_Samsung_Loyal',   search: 'Samsung Galaxy S25 Ultra smartphone',     target: 'galaxy s25' },
    { id: 3,  name: 'Bot_Gamer',           search: 'ASUS ROG Phone 9 gaming smartphone',      target: 'rog phone' }
];

test.describe.configure({ mode: 'serial' });

for (const bot of AI_BOTS) {
    test(`[CB] Bot #${bot.id} ${bot.name}`, async ({ page, context }) => {
        test.setTimeout(180_000);

        await context.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        });

        console.log(`\n🤖 ${bot.name} → "${bot.search}"`);

        // ── BƯỚC 1: Tìm kiếm ─────────────────────────────────────
        await page.goto('https://www.amazon.com/', { waitUntil: 'domcontentloaded', timeout: 40_000 });
        await page.waitForTimeout(1500);

        // Captcha guard
        const searchBox = page.locator('#twotabsearchtextbox');
        if (!(await searchBox.isVisible({ timeout: 5_000 }).catch(() => false))) {
            console.log('    ⚠️  Captcha! Giải trong 120s...');
            await page.waitForSelector('#twotabsearchtextbox', { timeout: 120_000 });
        }
        await searchBox.fill(bot.search);
        await searchBox.press('Enter');
        await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 25_000 });
        await page.waitForTimeout(800);

        // Đóng popup Vietnam
        await dismissVietnamPopup(page);
        await page.waitForTimeout(400);

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

        // Vẽ flash tại vị trí giữa màn hình để biểu thị đang navigate
        await showFlash(page, 640, 360, 700);

        // ── BƯỚC 3: Navigate thẳng tới product page ───────────────
        await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 40_000 });
        await page.waitForSelector('#productTitle', { timeout: 30_000 });
        await page.waitForTimeout(800);

        // ── BƯỚC 4: Lấy nội dung sản phẩm ───────────────────────
        const sourceTitle = (await page.locator('#productTitle').innerText().catch(() => '')).trim();
        const bullets = await page.locator('#feature-bullets li span.a-list-item').allInnerTexts().catch(() => []);
        const descText = await page.locator('#productDescription').innerText().catch(() => '');
        const sourceDescription = [...bullets.map((b: string) => b.trim()), descText.trim()]
            .filter(Boolean).join('\n');
        console.log(`  📝 "${sourceTitle.slice(0, 65)}"`);

        // ── BƯỚC 5: Gợi ý Amazon (ground truth) ─────────────────
        let amazonRecs: string[] = [];
        try {
            await page.mouse.wheel(0, 1500);
            await page.waitForTimeout(2500);
            await page.mouse.wheel(0, 1200);
            await page.waitForTimeout(1200);

            amazonRecs = await page.evaluate(() => {
                const recs: string[] = [];
                const seen = new Set<string>();

                function isJunk(s: string): boolean {
                    const t = s.trim().toLowerCase();
                    if (t.length < 10) return true;
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
                    return false;
                }

                function addRec(s: string) {
                    const clean = s.split('\n')[0].trim();
                    if (!isJunk(clean) && !seen.has(clean)) {
                        seen.add(clean);
                        recs.push(clean);
                    }
                }

                // Ưu tiên: aria-label và alt text từ carousel
                const sections = document.querySelectorAll(
                    '[data-client-recs-id], #similarities_feature_div, #p13n-asin-carousel-wr, [class*="sims-fbt"], [class*="a-carousel"]'
                );
                sections.forEach(sec => {
                    sec.querySelectorAll<HTMLAnchorElement>('a[aria-label]').forEach(a => {
                        addRec(a.getAttribute('aria-label') || '');
                    });
                    sec.querySelectorAll<HTMLImageElement>('img[alt]').forEach(img => {
                        const alt = img.getAttribute('alt') || '';
                        if (alt.length > 15) addRec(alt);
                    });
                });

                // Fallback: text truncate
                if (recs.length < 3) {
                    const textSels = [
                        '[data-client-recs-id] .a-truncate-full',
                        '.a-carousel-card .a-truncate-full',
                        '.a-carousel-card .a-truncate-cut',
                    ];
                    for (const sel of textSels) {
                        document.querySelectorAll(sel).forEach(el => {
                            addRec((el as HTMLElement).innerText || '');
                        });
                    }
                }

                return recs.slice(0, 10);
            });
        } catch { /* Amazon có thể đóng session sau khi scroll */ }
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
    });
}