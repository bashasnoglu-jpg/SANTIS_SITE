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
New-Item -ItemType Directory -Force -Path $testsDir | Out-Null

# Test dosyasını her zaman güncelle (güncel ignore listesi için)
$specFile = Join-Path $testsDir "smoke.spec.js"
@"
const { test, expect } = require('@playwright/test');

const baseURL = process.env.BASE_URL || '$BaseUrl';

async function setupErrorListener(page) {
  const errors = [];
  await page.addInitScript(() => {
    const orig = console.error.bind(console);
    const ignore = [/Hotel/i, /fetch/i, /Encoding Mismatch/i, /Failed to fetch/i, /NetworkError/i];
    console.error = (...args) => {
      const text = args.map(a => (a?.message ?? String(a))).join(' ');
      if (ignore.some(re => re.test(text))) return;
      orig(...args);
    };
  });
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  const ignoredErrors = [/Failed to fetch/i, /NetworkError/i, /Encoding Mismatch/i, /Hotel/i, /fetch/i];
  page.on('pageerror', err => {
    if (ignoredErrors.some(re => re.test(err.message))) return;
    errors.push(err.message);
  });
  return errors;
}

test('home loads', async ({ page }) => {
  const errors = await setupErrorListener(page);
  await page.goto(baseURL + '/index.html', { waitUntil: 'load' });
  await expect(page).toHaveTitle(/Santis/i);
  if (errors.length > 0) console.log('Console errors:', errors);
  expect(errors.length).toBe(0);
});

test('gallery loads', async ({ page }) => {
  const errors = await setupErrorListener(page);
  await page.goto(baseURL + '/gallery.html', { waitUntil: 'load' });
  if (errors.length > 0) console.log('Console errors:', errors);
  expect(errors.length).toBe(0);
});
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
    Write-Host "🔗 BASE_URL ortam değişkeni ayarlandı: $env:BASE_URL"
    Write-Host "🧪 Running: npx playwright test --reporter=line --workers=1"
    npx playwright test --reporter=line --workers=1
    $exitCode = $LASTEXITCODE
  }
}
finally {
  if ($startedServer -and $server -and -not $server.HasExited) {
    Write-Host "🧹 Stopping server (pid=$($server.Id))"
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  }
}
exit $exitCode
