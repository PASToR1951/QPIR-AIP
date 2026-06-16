const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/wiki/user-guides/assets/user-manual');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    async function login(email, password = 'password') {
      await page.goto(`${BASE_URL}/login`);
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent.includes('Sign in manually') || b.textContent.includes('Email & Password'));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 500));
      await page.type('input[type="email"]', email);
      await page.type('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 3000));
    }

    async function snap(url, name) {
      await page.goto(`${BASE_URL}${url}`);
      await new Promise(r => setTimeout(r, 2000)); // wait for React to render
      await page.screenshot({ path: path.join(OUTPUT_DIR, name) });
      console.log(`Captured: ${name}`);
    }

    // Access
    await snap('/login', 'um-01-login-options.png');
    // ... we already captured um-02 manual login ...

    // Admin
    await login('admin@qpir.local', 'admin123');
    await snap('/admin', 'um-48-admin-overview.png');
    await snap('/admin/users', 'um-49-admin-users-table.png');
    await snap('/admin/schools', 'um-53-admin-schools-clusters.png');
    await snap('/admin/programs', 'um-55-admin-programs-focal-template.png');
    await snap('/admin/deadlines', 'um-56-admin-deadlines.png');
    await snap('/admin/reports', 'um-58-admin-reports.png');
    await snap('/admin/consolidation', 'um-59-admin-consolidation.png');
    await snap('/admin/settings', 'um-60-admin-settings-branding-signatories.png');
    await snap('/admin/sessions', 'um-64-admin-sessions.png');
    await snap('/admin/backups', 'um-66-admin-backups.png');

    // clear cookies
    const cookies = await page.cookies();
    await page.deleteCookie(...cookies);

    // School
    await login('pir-demo-gscs@local', '123456');
    await snap('/', 'um-16-school-dashboard-next-action.png');
    await snap('/', 'um-07-dashboard-overview.png');
    await snap('/aip', 'um-17-aip-program-selector.png');
    await snap('/pir', 'um-25-pir-dashboard.png');

    const cookies2 = await page.cookies();
    await page.deleteCookie(...cookies2);

    // Division Focal
    await login('pir-demo-division@local', '123456');
    await snap('/', 'um-35-division-dashboard.png');

    const cookies3 = await page.cookies();
    await page.deleteCookie(...cookies3);

    // CES
    await login('ces@qpir.local', '123456');
    await snap('/', 'um-40-ces-queue-filters.png');

    const cookies4 = await page.cookies();
    await page.deleteCookie(...cookies4);

    // Observer
    await login('observer@deped.gov.ph', '123456');
    await snap('/', 'um-45-observer-overview.png');

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
}

run();
