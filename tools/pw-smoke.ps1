﻿[CmdletBinding()]
param(
  [string]$ProjectRoot = (Get-Location).Path,
  [string]$RootPath = ".",
  [int]$Port = 5501,
  [int]$WaitSeconds = 20,
  [string]$BaseUrl = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ([string]::IsNullOrWhiteSpace($BaseUrl)) { $BaseUrl = "http://127.0.0.1:$Port" }

$testsDir = Join-Path $ProjectRoot "tests"
New-Item -ItemType Directory -Force -Path $testsDir | Out-Null

# Mevcut test dosyasını koru, yoksa oluştur
$specFile = Join-Path $testsDir "smoke.spec.js"
if (-not (Test-Path $specFile)) {
  @"
const { test, expect } = require('@playwright/test');

const baseURL = process.env.BASE_URL || '$BaseUrl';

test('home loads', async ({ page }) => {
  await page.goto(baseURL + '/index.html', { waitUntil: 'load' });
  await expect(page).toHaveTitle(/Santis/i);
});
"@ | Set-Content -Encoding UTF8 $specFile
}

Write-Host "🌐 Starting server: http://127.0.0.1:$Port (root=$RootPath)"
$server = Start-Process -FilePath "cmd.exe" `
  -WorkingDirectory $ProjectRoot `
  -ArgumentList @("/k", "npx", "http-server", $RootPath, "-p", "$Port", "-c-1", "--silent") `
  -PassThru -NoNewWindow

try {
  $ok = $false
  for ($i = 0; $i -lt ($WaitSeconds * 2); $i++) {
    if ((Test-NetConnection 127.0.0.1 -Port $Port).TcpTestSucceeded) { $ok = $true; break }
    Start-Sleep -Milliseconds 500
  }

  if (-not $ok) {
    Write-Host "❌ Server port $Port açılmadı." -ForegroundColor Red
    exit 10
  }

  $env:BASE_URL = $BaseUrl
  Write-Host "🧪 Running: npx playwright test --reporter=line --workers=1"
  cmd /c npx playwright test --reporter=line --workers=1
  exit $LASTEXITCODE
}
finally {
  if ($server -and -not $server.HasExited) {
    Write-Host "🧹 Stopping server (pid=$($server.Id))"
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  }
}
