/**
 * bot-helpers.ts
 * ═══════════════════════════════════════════════════════════════
 * Module chung cho tất cả Bot test:
 * - Khởi tạo Chrome thật (Persistent Context không lỗi trắng màn hình)
 * - Human-like delays, scroll, popup dismiss
 * - Flash effect cho demo
 * ═══════════════════════════════════════════════════════════════
 */

import { chromium, type BrowserContext, type Page } from '@playwright/test';
import * as path from 'path';

// Tạo profile riêng, không dính líu đến profile cũ bị lỗi
const CHROME_PROFILE_DIR = path.join(__dirname, '..', 'chrome_bot_profile');

export async function launchRealBrowser(): Promise<{ context: BrowserContext; page: Page }> {
    console.log('🚀 Khởi tạo Chrome thật (Chế độ tự động hoàn toàn)...');
    console.log(`   📁 Profile: ${CHROME_PROFILE_DIR}`);

    const context = await chromium.launchPersistentContext(CHROME_PROFILE_DIR, {
        headless: false,
        channel: 'chrome',                    // Chrome thật, không phải Chromium
        viewport: { width: 1280, height: 800 },
        // Quan trọng: Bỏ 2 cờ mặc định của Playwright hay gây lỗi trắng màn hình và bị Amazon phát hiện
        ignoreDefaultArgs: ['--enable-automation', '--no-sandbox', '--disable-extensions'],
        args: [
            '--disable-blink-features=AutomationControlled',   // Tắt "controlled by automation"
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-infobars',
            '--disable-popup-blocking',
            '--start-maximized',
        ],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });

    // Xóa navigator.webdriver đơn giản nhất, không đụng tới permissions hay runtime để tránh lỗi Illegal invocation
    await context.addInitScript(`
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
            configurable: true,
        });
    `);

    const page = context.pages()[0] || await context.newPage();
    console.log('   ✅ Chrome đã sẵn sàng!');
    return { context, page };
}

// ─────────────────────────────────────────────────────────
// Human-like random delay (800-2500ms)
// ─────────────────────────────────────────────────────────
export async function humanDelay(page: Page, minMs = 800, maxMs = 2500) {
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    await page.waitForTimeout(delay);
}

// ─────────────────────────────────────────────────────────
// Scroll chậm từng bước (giống người thật)
// ─────────────────────────────────────────────────────────
export async function safeScroll(page: Page, totalPx = 2000, steps = 5) {
    const stepPx = Math.floor(totalPx / steps);
    for (let i = 0; i < steps; i++) {
        await page.mouse.wheel(0, stepPx);
        await humanDelay(page, 400, 900);
    }
}

// ─────────────────────────────────────────────────────────
// Đóng popup Vietnam shipping (Amazon VN)
// ─────────────────────────────────────────────────────────
export async function dismissPopup(page: Page) {
    try {
        const closed = await page.evaluate(() => {
            const elements = document.querySelectorAll('button, input[type="submit"], span[class*="a-button"], span');
            for (const el of elements) {
                if (el.textContent?.trim() === 'Dismiss') {
                    (el as HTMLElement).click();
                    return true;
                }
            }
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
// Vẽ hiệu ứng nhấp nháy (demo visual)
// ─────────────────────────────────────────────────────────
export async function showFlash(page: Page, x: number, y: number, ms = 800) {
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
// Lấy search results từ Amazon DOM
// ─────────────────────────────────────────────────────────
export async function getSearchResults(page: Page): Promise<{ title: string; href: string }[]> {
    return page.evaluate(() => {
        const cards = document.querySelectorAll('[data-component-type="s-search-result"]');
        const results: { title: string; href: string }[] = [];
        for (const card of cards) {
            const h2link = card.querySelector('h2 a') as HTMLAnchorElement | null;
            if (h2link) {
                const title = h2link.textContent?.trim() || '';
                const href = h2link.getAttribute('href') || '';
                if (href.includes('/dp/') || href.startsWith('/')) {
                    results.push({ title, href });
                    continue;
                }
            }
            const dpLink = card.querySelector('a[href*="/dp/"]') as HTMLAnchorElement | null;
            if (dpLink) {
                const title = (card.querySelector('h2')?.textContent || dpLink.textContent || '').trim();
                results.push({ title, href: dpLink.getAttribute('href') || '' });
            }
        }
        return results;
    });
}

// ─────────────────────────────────────────────────────────
// Trích ASIN path từ href, trả về URL sạch
// ─────────────────────────────────────────────────────────
export function cleanAmazonUrl(href: string): string {
    if (!href) return '';
    const asinMatch = href.match(/\/dp\/([A-Z0-9]{10})/);
    if (asinMatch) {
        return 'https://www.amazon.com/dp/' + asinMatch[1];
    }
    if (href.startsWith('http')) return href.split('?')[0];
    if (href.startsWith('/')) return 'https://www.amazon.com' + href.split('?')[0];
    return '';
}

// ─────────────────────────────────────────────────────────
// Chờ Captcha (nếu bị) — cho user thời gian giải
// ─────────────────────────────────────────────────────────
export async function waitForSearchBox(page: Page) {
    const searchBox = page.locator('#twotabsearchtextbox');
    if (!(await searchBox.isVisible({ timeout: 5_000 }).catch(() => false))) {
        console.log('    ⚠️  Captcha/Block! Chờ giải trong 120s...');
        await page.waitForSelector('#twotabsearchtextbox', { timeout: 120_000 });
    }
    return searchBox;
}

// ─────────────────────────────────────────────────────────
// Scrape Amazon recommendations từ product page
// ─────────────────────────────────────────────────────────
export async function scrapeAmazonRecs(page: Page, maxItems = 15): Promise<string[]> {
    await safeScroll(page, 3000, 6);

    return page.evaluate((max) => {
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

        if (recs.length < 5) {
            const textSels = [
                '[data-client-recs-id] .a-truncate-full',
                '[data-client-recs-id] .a-truncate-cut',
                '.a-carousel-card .a-truncate-full',
                '.a-carousel-card .a-truncate-cut',
                '#sims-fbt-content .a-truncate-full',
            ];
            for (const sel of textSels) {
                document.querySelectorAll(sel).forEach(el => {
                    addRec((el as HTMLElement).innerText || '');
                });
            }
        }

        return recs.slice(0, max);
    }, maxItems);
}
