/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🎭 SANTIS OS — Playwright E2E Konfigürasyonu               ║
 * ║  Çalıştır: npx playwright test                              ║
 * ║  UI Modu:  npx playwright test --ui                         ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { defineConfig, devices } from '@playwright/test';

// Lokal dev: Live Server (VS Code) veya docker-compose nginx
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

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

  // ── Web Server (opsiyonel — Live Server çalışmıyorsa) ──────────────────────
  // webServer: {
  //   command: 'npx serve . -p 8080',
  //   port:    8080,
  //   reuseExistingServer: !process.env.CI,
  // },
});
