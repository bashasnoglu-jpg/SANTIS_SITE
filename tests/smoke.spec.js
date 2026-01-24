﻿﻿﻿const { test, expect } = require('@playwright/test');
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5501';

test('booking loads + fetches components & json', async ({ page }) => {
  await page.route('**/test-runner-schema.js', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  );

  await page.goto(baseURL + '/booking.html?hotel=alba-resort&lang=tr', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle(/Santis/i);

  // Network beklemek yerine DOM elementlerinin yüklendiğini doğrula (Daha stabil)
  await expect(page.locator('#navbar')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  
  // JSON verisi işlenip servisler dropdown'a dolmuş mu?
  await expect(page.locator('#service option')).not.toHaveCount(0);
});

test('booking form validation (empty submit)', async ({ page }) => {
  await page.route('**/test-runner-schema.js', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  );
  
  await page.goto(baseURL + '/booking.html?hotel=alba-resort&lang=tr', { waitUntil: 'domcontentloaded' });

  // Formun hazır olmasını bekle (servisler yüklenince option oluşur)
  await page.waitForSelector('#service option');

  // Boş form gönder
  await page.click('#btnSubmit');

  // Zorunlu alanların hata durumlarını kontrol et
  const fields = ['service', 'date', 'time', 'name'];
  for (const field of fields) {
    await expect(page.locator(`#${field}`)).toHaveClass(/error/);
    const errId = `#err${field.charAt(0).toUpperCase() + field.slice(1)}`;
    await expect(page.locator(errId)).toHaveClass(/show/);
  }
});
