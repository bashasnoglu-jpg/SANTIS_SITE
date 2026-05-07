/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🎭 SANTIS OS — Playwright E2E Konfigürasyonu               ║
 * ║  Çalıştır: npx playwright test                              ║
 * ║  UI Modu:  npx playwright test --ui                         ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { defineConfig, devices } from '@playwright/test';

// Port SSOT: E2E_BASE_URL env var → CI/staging override mümkün
// Marketing site static HTML → port 8081 (admin-panel Vite = 8080, ayrı product)
const BASE_URL = process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:8081';

export default defineConfig({

  // ── Test dosyaları ──────────────────────────────────────────────────────────
  testDir: './tests/e2e',
  testMatch: ['**/*.spec.ts'],

  // ── Paralellik ──────────────────────────────────────────────────────────────
  fullyParallel: true,
  workers:       process.env.CI ? 2 : 4,
  retries:       process.env.CI ? 2 : 0,

  // ── Raporlama ───────────────────────────────────────────────────────────────
  reporter: [
    ['html',    { outputFolder: 'tests/reports/html', open: 'never' }],
    ['json',    { outputFile:   'tests/reports/results.json' }],
    ['list'],
  ],

  // ── Global Ayarlar ──────────────────────────────────────────────────────────
  use: {
    baseURL:          BASE_URL,
    screenshot:       'only-on-failure',
    video:            'retain-on-failure',
    trace:            'on-first-retry',
    actionTimeout:    10_000,
    navigationTimeout: 30_000,
    // Gerçek kullanıcı gibi görün
    extraHTTPHeaders: {
      'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
    },
  },

  // ── Tarayıcı Matrisi ────────────────────────────────────────────────────────
  projects: [
    {
      name:  'chromium',
      use:   { ...devices['Desktop Chrome'] },
    },
    {
      name:  'firefox',
      use:   { ...devices['Desktop Firefox'] },
    },
    {
      name:  'mobile-safari',
      use:   { ...devices['iPhone 14'] },
    },
    {
      name:  'mobile-chrome',
      use:   { ...devices['Pixel 7'] },
    },
  ],

  // ── Output ─────────────────────────────────────────────────────────────────
  outputDir: 'tests/artifacts',

  // ── Web Server — Statik marketing site HTML dosyalarını serve eder ───────────────────
  webServer: {
    // node serve.cjs — projenin kendi zero-dependency static serveri, Windows uyumlu
    // Port argümanı ile 8081'de başlatılır (serve.cjs: PORT = process.argv[2] || 3030)
    command: 'node serve.cjs 8081',
    port:    8081,
    timeout: 30_000,
    reuseExistingServer: !process.env.CI, // Lokalde zaten çalışıyorsa tekrar başlatma
  },
});
