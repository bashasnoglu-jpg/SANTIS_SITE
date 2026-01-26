const { test, expect } = require('@playwright/test');

const routeTestRunner = page =>
  page.route('**/test-runner-schema.js', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  );

test.describe('hotel page', () => {
  test.beforeEach(async ({ page }) => {
    await routeTestRunner(page);
  });

  test('hotel select populates and featured cards render for alba-resort', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/hotel.html?hotel=alba-resort&lang=tr`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#hotelSelect');
    await expect(async () => {
      const optCount = await page.locator('#hotelSelect option').count();
      expect(optCount).toBeGreaterThan(1);
    }).toPass();
    await expect(async () => {
      const cardCount = await page.locator('.service-card').count();
      expect(cardCount).toBeGreaterThan(0);
    }).toPass();
    const firstCta = page.locator('.service-card a.cta-btn').first();
    await expect(firstCta).toHaveAttribute('href', /hotel=alba-resort/);
  });

  test('changing hotel updates hero and CTA links', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/hotel.html?hotel=alba-resort&lang=tr`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#hotelSelect');
    const initialName = await page.locator('#hotelName').textContent();
    await page.selectOption('#hotelSelect', 'alba-queen');
    await expect(page.locator('#hotelName')).not.toHaveText(initialName);
    const firstCta = page.locator('.service-card a.cta-btn').first();
    await expect(firstCta).toHaveAttribute('href', /hotel=alba-queen/);
  });

  test('language switch updates featured title', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/hotel.html?hotel=alba-resort&lang=tr`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#langSelect');
    await page.selectOption('#langSelect', 'en');
    await expect(page.locator('#featuredTitle')).toHaveText(/Featured Services/i);
  });
});
