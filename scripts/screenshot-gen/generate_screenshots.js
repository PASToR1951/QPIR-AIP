const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/wiki/user-guides/assets/user-manual');

async function ensureDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

async function run() {
  await ensureDir();
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1440, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/login`);
    
    // Give react time to render
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'debug-login.png') });
    console.log("Captured debug-login.png");
    
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
}

run();
