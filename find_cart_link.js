const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://practicesoftwaretesting.com/');
  await page.waitForLoadState('networkidle');

  const links = await page.$$eval('a', els => els.map(e => ({
    href: e.getAttribute('href'),
    testId: e.getAttribute('data-test'),
    html: e.outerHTML.slice(0, 150)
  })));

  console.log('Cart / checkout links:', links.filter(l => l.href?.includes('checkout') || l.testId?.includes('cart')));
  await browser.close();
})();
