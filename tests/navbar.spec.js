const { test, expect } = require('@playwright/test');

const routeTestRunner = page =>
  page.route('**/test-runner-schema.js', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  );

test.describe('navbar component', () => {
  test.beforeEach(async ({ page }) => {
    await routeTestRunner(page);
  });

  test('desktop links point to service hashes and real pages', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/components/navbar.html`);
    await page.waitForSelector('#navLinks');
    const hrefs = await page.locator('#navLinks a').allTextContents();
    expect(hrefs.length).toBeGreaterThan(0);
    expect(await page.locator('a[href*="service.html"][href*="#hammam"]').count()).toBeGreaterThan(0);
    expect(await page.locator('a[href*="service.html"][href*="#classicMassages"]').count()).toBeGreaterThan(0);
    expect(await page.locator('a[href*="service.html"][href*="#faceSothys"]').count()).toBeGreaterThan(0);
    expect(await page.locator('a[href*="index.html"]').count()).toBeGreaterThan(0);
    expect(await page.locator('a[href*="hotel.html"]').count()).toBeGreaterThan(0);
    expect(await page.locator('a[href*="booking.html"]').count()).toBeGreaterThan(0);
  });

  test('hamburger toggles show class and aria-expanded on mobile', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${baseURL}/components/navbar.html`);

    const hamburger = page.locator('#hamburger');
    const navLinks = page.locator('#navLinks');

    await page.waitForSelector('#navLinks', { state: 'attached' });
    await expect(hamburger).toBeVisible();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await expect(navLinks).not.toHaveClass(/show/);

    await hamburger.click();
    await expect(navLinks).toHaveClass(/show/);
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    await hamburger.click();
    await expect(navLinks).not.toHaveClass(/show/);
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });


});
