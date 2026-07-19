const { chromium } = require('playwright');
const path = require('path');

(async () => {
    try {
        const context = await chromium.launchPersistentContext(path.join(__dirname, 'chrome_profile2'), {
            headless: false,
            channel: 'chrome',
            ignoreDefaultArgs: ['--enable-automation', '--no-sandbox'],
            args: [
                '--disable-blink-features=AutomationControlled',
                '--start-maximized'
            ]
        });
        const page = context.pages()[0] || await context.newPage();
        await page.goto('https://www.amazon.com');
        console.log("Navigated to amazon!");
        await new Promise(r => setTimeout(r, 10000));
        await context.close();
    } catch (e) {
        console.error(e);
    }
})();
