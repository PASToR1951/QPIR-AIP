const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/wiki/user-guides/assets/user-manual');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();

  async function login(email, password = 'password') {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(1000);
    const switchBtn = page.locator('button', { hasText: /Sign in manually|Email & Password/i }).first();
    if (await switchBtn.isVisible()) {
      await switchBtn.click();
      await page.waitForTimeout(500);
    }
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000); // wait for navigation
  }

  async function snap(name) {
    const filePath = path.join(OUTPUT_DIR, name);
    await page.screenshot({ path: filePath });
    console.log(`Captured: ${name}`);
  }

  // Admin
  await login('admin@qpir.local', 'admin123');
  await snap('um-48-admin-overview.png');
  await page.goto(`${BASE_URL}/admin/users`);
  await page.waitForTimeout(1000);
  await snap('um-49-admin-users-table.png');
  await page.click('button:has-text("Add User")').catch(()=>console.log("no Add User btn"));
  await page.waitForTimeout(500);
  await snap('um-50-admin-create-user.png');

  await page.goto(`${BASE_URL}/admin/schools`);
  await page.waitForTimeout(1000);
  await snap('um-53-admin-schools-clusters.png');

  await page.goto(`${BASE_URL}/admin/programs`);
  await page.waitForTimeout(1000);
  await snap('um-55-admin-programs-focal-template.png');

  await page.goto(`${BASE_URL}/admin/deadlines`);
  await page.waitForTimeout(1000);
  await snap('um-56-admin-deadlines.png');
  
  await page.goto(`${BASE_URL}/admin/reports`);
  await page.waitForTimeout(1000);
  await snap('um-58-admin-reports.png');

  await page.goto(`${BASE_URL}/admin/consolidation`);
  await page.waitForTimeout(1000);
  await snap('um-59-admin-consolidation.png');

  await page.goto(`${BASE_URL}/admin/settings`);
  await page.waitForTimeout(1000);
  await snap('um-60-admin-settings-branding-signatories.png');

  await page.goto(`${BASE_URL}/admin/sessions`);
  await page.waitForTimeout(1000);
  await snap('um-64-admin-sessions.png');

  await page.goto(`${BASE_URL}/admin/backups`);
  await page.waitForTimeout(1000);
  await snap('um-66-admin-backups.png');

  await context.clearCookies();

  // School
  await login('pir-demo-gscs@local', '123456');
  await snap('um-16-school-dashboard-next-action.png');
  await snap('um-07-dashboard-overview.png');
  await page.goto(`${BASE_URL}/aip`);
  await page.waitForTimeout(1000);
  await snap('um-17-aip-program-selector.png');
  await snap('um-20-aip-activity-form.png');
  await page.goto(`${BASE_URL}/pir`);
  await page.waitForTimeout(1000);
  await snap('um-25-pir-dashboard.png');
  await context.clearCookies();

  // Focal
  await login('pir-demo-division@local', '123456');
  await snap('um-35-division-dashboard.png');
  await context.clearCookies();

  // CES
  await login('ces@qpir.local', '123456');
  await snap('um-40-ces-queue-filters.png');
  await snap('um-42-ces-review-modal.png');
  await context.clearCookies();

  // Observer
  await login('observer@deped.gov.ph', '123456');
  await snap('um-45-observer-overview.png');
  await context.clearCookies();

  await browser.close();
  console.log("All done.");
}

captureScreenshots().catch(console.error);
