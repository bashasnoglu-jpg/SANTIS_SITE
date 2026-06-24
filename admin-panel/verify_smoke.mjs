import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let shiftRequestUrl = '';
  page.on('request', req => {
    if (req.url().includes('/reception/shifts')) {
      shiftRequestUrl = req.url();
    }
  });

  // Mock /reception/day
  await page.route('**/api/v1/reception/day*', async route => {
    const today = new Date();
    const startStr = new Date(today.setHours(18, 30, 0, 0)).toISOString();
    const endStr = new Date(today.setHours(19, 30, 0, 0)).toISOString();
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        bookings: [
          {
            id: 'bkg130',
            fields: {
              fldLkesTF4z1iiQp9: [{ id: 'loc1', name: 'Budva' }], // Location
              flddXRKNIeh72ROX5: [{ id: 'th-2', name: 'ARZU' }], // Therapist
              Start_DateTime: startStr,
              Calculated_Finish_DateTime: endStr,
              Payment_Status_New: 'Unpaid',
              Balance_Due_EUR: 80,
              Client_Name: ['Ayşe Aşan'],
              Service_Name: ['Klasik Masaj']
            }
          }
        ],
        therapists: [],
        locations: []
      })
    });
  });

  // Mock /reception/shifts
  await page.route('**/api/v1/reception/shifts*', async route => {
    const today = new Date();
    const startStr = new Date(today.setHours(9, 0, 0, 0)).toISOString();
    const endStr = new Date(today.setHours(21, 0, 0, 0)).toISOString();
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        shifts: [
          {
            id: 'shift1',
            fields: {
              Staff_Link: ['th-2'],
              Staff_Name: ['ARZU'],
              Location_Link: ['loc1'],
              Location_Name: ['Budva'],
              Shift_Start: startStr,
              Shift_End: endStr,
              Shift_Status: 'Active',
              Scheduler_Visibility: ['VISIBLE - Scheduler']
            }
          }
        ]
      })
    });
  });

  console.log("=== SCENARIO 1: SUCCESSFUL SHIFT MATCH ===");
  console.log("Bypassing login...");
  
  await page.goto('http://localhost:8080/admin/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { user: { role: 'admin' }, token: 'fake-token' },
      version: 0
    }));
  });

  console.log("Navigating to http://localhost:8080/admin/reception...");
  await page.goto('http://localhost:8080/admin/reception', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Give React time to render

  const text1 = await page.evaluate(() => document.body.innerText);
  console.log("Network Request Made:", shiftRequestUrl || "NONE");
  console.log("Has READY - Therapist On Shift:", text1.includes("READY - Therapist On Shift"));
  console.log("Has Payment Attention / €:", text1.includes("Payment Attention") || text1.includes("€") || text1.includes("Unpaid"));
  console.log("Has Global Shift Error:", text1.includes("Staff shift verisi alınamadı"));

  console.log("\n=== SCENARIO 2: EMPTY SHIFTS ===");
  // Reset route
  await page.unroute('**/api/v1/reception/shifts*');
  await page.route('**/api/v1/reception/shifts*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ shifts: [] })
    });
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const text2 = await page.evaluate(() => document.body.innerText);
  console.log("Has REVIEW - No Shift Found:", text2.includes("REVIEW - No Shift Found"));
  console.log("Has Global Shift Error:", text2.includes("Staff shift verisi alınamadı"));

  console.log("\n=== SCENARIO 3: ENDPOINT ERROR (500) ===");
  await page.unroute('**/api/v1/reception/shifts*');
  await page.route('**/api/v1/reception/shifts*', async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: "Internal Server Error" })
    });
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const text3 = await page.evaluate(() => document.body.innerText);
  console.log("Has Global Shift Error:", text3.includes("Staff shift verisi alınamadı"));
  console.log("Has Mock Data Produced?:", text3.includes("READY - Therapist On Shift"));

  await browser.close();
})();
