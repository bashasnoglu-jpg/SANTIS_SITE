
# ==========================================
# SANTIS CLUB - MASTER SITE HEALTH CHECK v2.0
# ==========================================

$ErrorActionPreference = "SilentlyContinue"
$FoundPort = $null
$BaseUrl = $null
$TargetPage = "/tr/masajlar/index.html"

Write-Host "`n🚀 SANTIS CLUB TEST MODÜLÜ BAŞLATILIYOR..." -ForegroundColor Cyan

# 1. PORT SCAN (5500 vs 8000)
# ---------------------------
Write-Host "🔍 1. Sunucu Taraması yapılıyor..." -ForegroundColor Gray

if (Test-NetConnection -ComputerName 127.0.0.1 -Port 5500 -InformationLevel Quiet) {
    Write-Host "✅ Live Server (Port 5500) AKTİF." -ForegroundColor Green
    $FoundPort = 5500
}
elseif (Test-NetConnection -ComputerName 127.0.0.1 -Port 8000 -InformationLevel Quiet) {
    Write-Host "✅ Python Server (Port 8000) AKTİF." -ForegroundColor Green
    $FoundPort = 8000
}
else {
    Write-Host "⚠️ Hiçbir sunucu açık değil." -ForegroundColor Yellow
    Write-Host "⚙️ Otomatik Python Sunucusu başlatılıyor..." -ForegroundColor Cyan
    try {
        Start-Process "python" "-m http.server 8000" -WindowStyle Minimized
        Start-Sleep -Seconds 3
        if (Test-NetConnection -ComputerName 127.0.0.1 -Port 8000 -InformationLevel Quiet) {
            Write-Host "✅ Python Sunucusu Başlatıldı (Port 8000)." -ForegroundColor Green
            $FoundPort = 8000
        }
        else {
            Write-Host "❌ Sunucu başlatılamadı. Lütfen manuel başlatın." -ForegroundColor Red
            exit
        }
    }
    catch {
        Write-Host "❌ Python bulunamadı." -ForegroundColor Red
        exit
    }
}

$BaseUrl = "http://localhost:$FoundPort"
$FullUrl = "$BaseUrl$TargetPage"

# 2. SAYFA ERİŞİM TESTİ
# ---------------------
Write-Host "`n🔍 2. Sayfa Erişimi Test Ediliyor: $FullUrl" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri $FullUrl -UseBasicParsing
    Write-Host "✅ HTTP 200 OK - Sayfaya Ulaşıldı." -ForegroundColor Green
}
catch {
    Write-Host "❌ ERİŞİM HATASI: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 3. CSP KONTROLÜ
# ---------------
Write-Host "`n🔍 3. CSP Güvenlik Kontrolü..." -ForegroundColor Gray
$content = $response.Content

if ($content -match "Content-Security-Policy") {
    if ($content -match "unsafe-eval") {
        Write-Host "✅ CSP Bulundu ve 'unsafe-eval' izni var (Geliştirme Modu Uygun)." -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ CSP Bulundu ancak çok sıkı olabilir ('unsafe-eval' yok)." -ForegroundColor Yellow
    }
}
else {
    Write-Host "⚠️ CSP Meta etiketi veya scripti statik kodda bulunamadı (Dinamik olabilir)." -ForegroundColor Yellow
}

# 4. KAYNAK KONTROLÜ (ASSETS)
# ---------------------------
Write-Host "`n🔍 4. Kaynak Dosya Kontrolü (CSS/JS)..." -ForegroundColor Gray

$scriptMatches = [regex]::Matches($content, 'src="([^"]+\.js)"')
$linkMatches = [regex]::Matches($content, 'href="([^"]+\.css)"')

function Test-Asset ($path) {
    # Absolute/Relative düzeltme
    if ($path.StartsWith("/")) {
        $testUrl = "$BaseUrl$path"
    }
    elseif ($path.StartsWith("http")) {
        $testUrl = $path
    }
    else {
        # Relative path (tr/masajlar/ altından hesapla)
        $testUrl = "$BaseUrl/tr/masajlar/$path"
    }

    try {
        $r = Invoke-WebRequest -Uri $testUrl -Method Head -UseBasicParsing -ErrorAction Stop
        Write-Host "  ✅ $path" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ KIRIK LINK: $path" -ForegroundColor Red
    }
}

foreach ($m in $scriptMatches) { Test-Asset $m.Groups[1].Value }
foreach ($m in $linkMatches) { Test-Asset $m.Groups[1].Value }

Write-Host "`n🏁 TEST TAMAMLANDI. Siyah ekran sorunu yaşamamanız lazım." -ForegroundColor Cyan
