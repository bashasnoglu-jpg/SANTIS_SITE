# ============================================================
# SANTIS OS — Sovereign Shell Setup Script
# Bu script'i BİR KERE çalıştır, yeni terminal açınca
# Node 20 otomatik aktif olur.
#
# Çalıştır: .\scripts\setup-shell.ps1
# ============================================================

Write-Host "`n🛡️  [Sovereign Guard] Shell kurulumu başlatılıyor...`n" -ForegroundColor Cyan

# 1. PowerShell profile dosyasını bul / oluştur
$profilePath = $PROFILE

if (!(Test-Path $profilePath)) {
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
    Write-Host "✅ PowerShell profile oluşturuldu: $profilePath" -ForegroundColor Green
} else {
    Write-Host "📄 Mevcut profile: $profilePath" -ForegroundColor Yellow
}

# 2. fnm entegrasyonunu kontrol et ve ekle
$fnmLine = 'fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression'
$profileContent = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue

if ($profileContent -notmatch 'fnm env') {
    Add-Content -Path $profilePath -Value "`n# Santis OS — fnm Node version manager`n$fnmLine"
    Write-Host "✅ fnm env profile'a eklendi — yeni terminal açınca aktif olacak" -ForegroundColor Green
} else {
    Write-Host "⚡ fnm env zaten profile'da mevcut" -ForegroundColor Yellow
}

# 3. .nvmrc / .node-version dosyasını kontrol et
$nvmrcPath = Join-Path $PSScriptRoot ".." ".nvmrc"
$nodeVersionPath = Join-Path $PSScriptRoot ".." ".node-version"

if (!(Test-Path $nvmrcPath) -and !(Test-Path $nodeVersionPath)) {
    Set-Content -Path (Join-Path $PSScriptRoot ".." ".node-version") -Value "20"
    Write-Host "✅ .node-version dosyası oluşturuldu (Node 20)" -ForegroundColor Green
}

# 4. Şu anki terminalde fnm'yi aktif et
Write-Host "`n🔄 Şu anki terminal için fnm aktif ediliyor..." -ForegroundColor Cyan
try {
    fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
    fnm use 20 2>&1 | Out-Null
    $nodeVer = node -v
    Write-Host "✅ Node aktif: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "⚠️  fnm aktivasyonu başarısız. Manuel çalıştır: fnm use 20" -ForegroundColor Yellow
}

# 5. Özet
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Shell kurulumu tamamlandı!" -ForegroundColor Green
Write-Host "  Profile: $profilePath" -ForegroundColor White
Write-Host "  Node: $(node -v 2>$null)" -ForegroundColor White
Write-Host "  pnpm: $(pnpm -v 2>$null)" -ForegroundColor White
Write-Host "============================================`n" -ForegroundColor Cyan
Write-Host "📋 Sonraki adımlar:" -ForegroundColor White
Write-Host "  1. Yeni bir PowerShell terminali aç" -ForegroundColor White
Write-Host "  2. cd C:\Users\tourg\Desktop\SANTIS_SITE" -ForegroundColor White
Write-Host "  3. node -v  →  v20.20.2 beklenmeli" -ForegroundColor White
Write-Host "  4. pnpm install" -ForegroundColor White
Write-Host "  5. pnpm run test:e2e" -ForegroundColor White
