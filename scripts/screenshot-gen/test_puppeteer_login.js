const { chromium } = require('playwright');
async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://aip-pir.depedguihulngan.ph/login');
  
  await page.waitForSelector('button');
  const switchBtn = page.locator('button', { hasText: /Sign in manually|Email & Password/i }).first();
  if (await switchBtn.isVisible()) {
    await switchBtn.click();
    await page.waitForTimeout(500);
  }
  
  // enable inputs
  await page.evaluate(() => {
    document.querySelector('input[name="email"]').disabled = false;
    document.querySelector('input[name="password"]').disabled = false;
    document.querySelector('button[type="submit"]').disabled = false;
  });
  
  await page.fill('input[name="email"]', 'admin@qpir.local');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(3000);
  const html = await page.content();
  const errorMatch = html.match(/class="[^"]*text-red-700[^"]*"[^>]*>([^<]+)</);
  if (errorMatch) {
    console.log("Login Error Banner:", errorMatch[1]);
  } else {
    console.log("No error banner found. Logged in?");
  }
  await browser.close();
}
run().catch(console.error);
