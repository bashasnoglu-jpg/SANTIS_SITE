const { test, expect } = require('@playwright/test');

const routeTestRunner = page =>
  page.route('**/test-runner-schema.js', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  );

test.describe('booking page extended', () => {
  test.beforeEach(async ({ page }) => {
    await routeTestRunner(page);
  });

  test('services list stays populated when hotel changes', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/booking.html?hotel=alba-resort&lang=tr`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#service option', { state: 'attached' });
    const initialCount = await page.locator('#service option').count();
    await expect(initialCount).toBeGreaterThan(1);

    await page.selectOption('#hotelSelect', 'alba-queen');
    await page.waitForTimeout(400); // allow renderServices refresh
    const newCount = await page.locator('#service option').count();
    await expect(newCount).toBeGreaterThan(1);
  });

  test('language switch updates labels and placeholder', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/booking.html?hotel=alba-resort&lang=tr`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#service option', { state: 'attached' });

    await page.selectOption('#langSelect', 'en');
    await expect(page.locator('#lblService')).toHaveText(/Service/);
    await expect(page.locator('#service option').first()).toHaveText(/Select Service/i);
  });
});
