const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/wiki/user-guides/assets/user-manual');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    
    console.log("Navigating to login...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    
    console.log("Clicking switch button...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Sign in manually') || b.textContent.includes('Email & Password'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Taking screenshot 1...");
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'um-02-manual-login.png') });
    
    console.log("Logging in...");
    await page.type('input[type="email"]', 'admin@qpir.local');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    console.log("Waiting for dashboard...");
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Taking screenshot 2...");
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'um-48-admin-overview.png') });
    
    console.log("Done!");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
}

run();
