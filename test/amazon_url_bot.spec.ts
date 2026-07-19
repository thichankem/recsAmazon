/**
 * amazon_url_bot.spec.ts
 * ═══════════════════════════════════════════════════════════════
 * Kịch bản: Bot truy cập một URL tùy ý, cào toàn bộ văn bản 
 * hiển thị trên trang (document.body.innerText). Sau đó đưa đoạn
 * văn bản này vào thuật toán Content-Based (TF-IDF + Cosine) để
 * xem AI có thể nhận diện ra sản phẩm tương đương trên Amazon không.
 * ═══════════════════════════════════════════════════════════════
 */

import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { launchRealBrowser, humanDelay } from './bot-helpers';

// 🌐 ĐIỀN URL BẠN MUỐN TEST VÀO ĐÂY:
const TARGET_URL = process.env.TEST_URL || 'https://www.apple.com/iphone-15-pro/';

test('🌐 Bot cào trang web bất kỳ -> Content Based Model', async () => {
    test.setTimeout(120000);

    // ── Khởi tạo Chrome thật (không cần KhoiDongChromeBot.bat) ──
    const { context, page } = await launchRealBrowser();

    console.log(`\n════════════════════════════════════════════════════════════`);
    console.log(`🌐 TÙY CHỈNH URL BOT`);
    console.log(`📌 Mục tiêu: Cào văn bản trang web -> Đoán sản phẩm liên quan`);
    console.log(`🔗 URL: ${TARGET_URL}`);
    console.log(`════════════════════════════════════════════════════════════\n`);

    // 1. Truy cập URL
    console.log(`  🔍 Đang truy cập trang web...`);
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Nếu là Amazon thì có thể dính Captcha, chờ xíu
    if (page.url().includes('amazon.com/errors/validateCaptcha')) {
        console.log(`    ⚠️  Captcha Amazon! Giải trong 60s...`);
        await page.waitForNavigation({ timeout: 60000 }).catch(() => {});
    }

    // Đợi thêm cho page load text
    await humanDelay(page, 2000, 4000);

    // 2. Lấy TOÀN BỘ text của trang (loại bỏ code JS/CSS)
    const pageText = await page.evaluate(() => {
        return document.body.innerText.substring(0, 8000);
    });
    const pageTitle = await page.title();
    
    console.log(`  ✅ Đã cào được: ${pageText.length} ký tự (Title: "${pageTitle}")`);

    // 3. Gửi sang Model Python (Content-Based)
    console.log(`\n  🧠 Chạy Content-Based model...`);
    const payload = {
        title: pageTitle,
        description: pageText,
        top_k: 10
    };

    let predictions: string[] = [];
    try {
        const out = execSync(`python -c "import sys, json, subprocess; p = subprocess.Popen(['python', 'predict.py'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8', errors='replace'); out, err = p.communicate(sys.stdin.read()); print(out)"`, {
            input: JSON.stringify(payload).replace(/[\uD800-\uDFFF]/g, ''),
            encoding: 'utf-8'
        });
        
        predictions = JSON.parse(out.trim());
    } catch (e: any) {
        console.log("    Lỗi chạy Python model:", e.message);
        predictions = [];
    }

    console.log(`\n  🎯 Hệ thống đoán các sản phẩm liên quan trên Amazon:`);
    predictions.forEach((p, i) => console.log(`     ${i + 1}. ${p.substring(0, 65)}...`));

    // 4. Lưu output
    const outputData = {
        botName: "CB_Custom_URL_Bot",
        scenario: "Cào trang web ngẫu nhiên -> nhận diện sản phẩm Content-Based",
        inputData: {
            url: TARGET_URL,
            title: pageTitle,
            description: pageText
        },
        expectedOutput: [],
        myModelOutput: predictions
    };

    const outDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    fs.writeFileSync(
        path.join(outDir, `content-based-bot-url.json`),
        JSON.stringify(outputData, null, 2),
        'utf-8'
    );
    console.log(`\n  ✅ Xong → output/content-based-bot-url.json\n`);
    
    await page.close();
    await context.close();
});
