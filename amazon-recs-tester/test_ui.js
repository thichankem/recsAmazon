const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  console.log('Clicking user switcher...');
  await page.click('#user-profile-switcher');
  
  console.log('Waiting for dropdown...');
  await page.waitForTimeout(500);
  
  console.log('Clicking second user...');
  const users = await page.$$('div.absolute.right-0 button');
  if (users.length > 1) {
    await users[1].click();
    console.log('Clicked second user. Waiting for updates...');
    await page.waitForTimeout(2000);
  } else {
    console.log('Could not find second user');
  }
  
  await browser.close();
})();
