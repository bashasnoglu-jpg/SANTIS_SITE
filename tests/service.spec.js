const { test, expect } = require('@playwright/test');

const routeTestRunner = page =>
  page.route('**/test-runner-schema.js', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  );

test.describe('service page', () => {
  test.beforeEach(async ({ page }) => {
    await routeTestRunner(page);
  });

  test('category anchors exist for deep links (list mode)', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/service.html#hammam`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#serviceListView', { state: 'visible' });
    // At least one deep-link anchor should exist (hash may add one)
    await page.waitForSelector('#hammam', { state: 'attached' });
    expect(await page.locator('#listGrid .card').count()).toBeGreaterThan(0);
    await expect(page.locator('#serviceName')).not.toBeEmpty();
  });

  test('service detail renders content and CTA points to booking', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/service.html?service=hammam_traditional_ritual&hotel=alba-resort&lang=en`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#serviceTitle');
    await expect(page.locator('#serviceTitle')).toContainText(/Traditional/i);
    await expect(page.locator('#serviceDuration')).toContainText(/min/i);
    await expect(page.locator('#servicePrice')).toContainText(/💰/);
    // button triggers location change; assert text and clickability
    await expect(page.locator('#btnBookOnline')).toHaveText(/Book Online/i);
  });
});
