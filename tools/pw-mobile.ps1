[CmdletBinding()]
param(
  [string]$ProjectRoot = (Get-Location).Path,
  [string]$RootPath = ".",
  [int]$Port = 5501,
  [int]$WaitSeconds = 20,
  [string]$BaseUrl = ""
)

# Encoding fix
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [System.Text.UTF8Encoding]::new()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ([string]::IsNullOrWhiteSpace($BaseUrl)) { $BaseUrl = "http://127.0.0.1:$Port" }

$testsDir = Join-Path $ProjectRoot "tests"
if (-not (Test-Path $testsDir)) { New-Item -ItemType Directory -Force -Path $testsDir | Out-Null }

# Mobile Test Spec File
$specFile = Join-Path $testsDir "mobile.spec.js"
@"
const { test, expect, devices } = require('@playwright/test');

const baseURL = process.env.BASE_URL || '$BaseUrl';

// Test edilecek cihazlar
const mobileConfigs = [
  { name: 'iPhone 12', config: devices['iPhone 12'] },
  { name: 'Pixel 5', config: devices['Pixel 5'] }
];

for (const { name, config } of mobileConfigs) {
  test.describe(name, () => {
    test.use(config);

    test('Homepage: Hamburger menu works', async ({ page }) => {
      await page.goto(baseURL + '/index.html', { waitUntil: 'domcontentloaded' });
      
      // Hamburger menü görünür olmalı
      const hamburger = page.locator('#hamburger');
      await expect(hamburger).toBeVisible();

      // Menü kapalı başlamalı
      const navLinks = page.locator('#navLinks');
      await expect(navLinks).toBeHidden();

      // Tıklayınca açılmalı
      await hamburger.click();
      await expect(navLinks).toBeVisible();
    });

    test('Service Detail: Layout checks', async ({ page }) => {
      await page.goto(baseURL + '/service-detail.html?id=peeling_kopuk', { waitUntil: 'domcontentloaded' });
      
      // Başlık görünür olmalı
      await expect(page.locator('.detail-title')).toBeVisible();
      
      // CTA butonu görünür ve tıklanabilir olmalı
      const cta = page.locator('.cta-button');
      await expect(cta).toBeVisible();
    });

    test('Booking: Form fits screen', async ({ page }) => {
      await page.goto(baseURL + '/booking.html', { waitUntil: 'domcontentloaded' });
      
      // Form elemanlarının görünürlüğünü kontrol et
      await expect(page.locator('#bookingForm')).toBeVisible();
      await expect(page.locator('#submitFormBtn')).toBeVisible();
    });
  });
}
"@ | Set-Content -Encoding UTF8 $specFile

function Test-PortInUse([int]$p) {
  @(Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue).Count -gt 0
}

$startedServer = $false
$server = $null

if (Test-PortInUse $Port) {
  Write-Host "ℹ️ Port $Port zaten kullanımda; mevcut server'ı kullanıyorum."
} else {
  Write-Host "🌐 Starting server: http://127.0.0.1:$Port (root=$RootPath)"
  $server = Start-Process -FilePath "powershell.exe" `
    -WorkingDirectory $ProjectRoot `
    -ArgumentList @("-NoProfile", "-Command", "npx -y http-server '$RootPath' -p $Port -c-1") `
    -PassThru -NoNewWindow
  $startedServer = $true
}

$exitCode = 0
try {
  $ok = $false
  for ($i = 0; $i -lt ($WaitSeconds * 2); $i++) {
    if ((Test-NetConnection 127.0.0.1 -Port $Port).TcpTestSucceeded) { $ok = $true; break }
    Start-Sleep -Milliseconds 500
  }

  if (-not $ok) {
    Write-Host "❌ Server port $Port açılmadı." -ForegroundColor Red
    $exitCode = 10
  } else {
    $env:BASE_URL = $BaseUrl
    Write-Host "🔗 BASE_URL: $env:BASE_URL"
    Write-Host "📱 Running Mobile Tests..."
    npx playwright test tests/mobile.spec.js --reporter=line --workers=1
    $exitCode = $LASTEXITCODE
  }
}
finally {
  if ($startedServer -and $server -and -not $server.HasExited) {
    Write-Host "🧹 Stopping server..."
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  }
}
exit $exitCode