# NEUROVA Site Test ve Önizleme Aracı
# Kullanım: .\test-project.ps1 [-Server] [-Port 8080]

param (
    [switch]$Server,
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"
$root = Get-Location

function Test-Dosya {
    param($Yol)
    if (Test-Path $Yol) {
        Write-Host "[OK] Bulundu: $Yol" -ForegroundColor Green
    } else {
        Write-Host "[HATA] Eksik: $Yol" -ForegroundColor Red
    }
}

function Test-Icerik {
    param($Yol, $Metin)
    if (-not (Test-Path $Yol)) { return }
    $content = Get-Content $Yol -Raw -ErrorAction SilentlyContinue
    if ($content -like "*$Metin*") {
        Write-Host "[OK] '$Yol' içinde bulundu: '$Metin'" -ForegroundColor Green
    } else {
        Write-Host "[HATA] '$Yol' içinde EKSİK: '$Metin'" -ForegroundColor Red
    }
}

Write-Host "`n--- NEUROVA SİTE KONTROLÜ ---`n" -ForegroundColor Cyan

# 1. Dosya Yapısı
Write-Host "1. Dosya Yapısı Kontrol ediliyor..." -ForegroundColor Yellow
Test-Dosya "index.html"
Test-Dosya "assets\css\style.css"
Test-Dosya "assets\js\app.js"
Test-Dosya "tr"
Test-Dosya "en"

# 2. İçerik ve Standartlar
Write-Host "`n2. İçerik ve Standartlar taranıyor..." -ForegroundColor Yellow
Test-Icerik "index.html" 'id="nv-header"'
Test-Icerik "index.html" 'id="nv-main"'
Test-Icerik "assets\js\app.js" 'NEUROVA – GLOBAL NAVIGATION v1.0'
Test-Icerik "assets\js\app.js" 'NEUROVA – RESERVATION MODAL MASTER BLOĞU'

# 3. Sunucu Modu
if ($Server) {
    Write-Host "`n--- YEREL SUNUCU BAŞLATILIYOR ---`n" -ForegroundColor Cyan
    try {
        $listener = New-Object System.Net.HttpListener
        $url = "http://localhost:$Port/"
        $listener.Prefixes.Add($url)
        $listener.Start()
        Write-Host "Sunucu aktif: $url" -ForegroundColor Green
        Write-Host "Durdurmak için Ctrl+C basın." -ForegroundColor Gray
        
        Start-Process $url

        while ($listener.IsListening) {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            $localPath = "$root$($request.Url.LocalPath)".Replace('/', '\')
            
            # Klasör ise index.html dene
            if (Test-Path $localPath -PathType Container) {
                $indexPath = Join-Path $localPath "index.html"
                if (Test-Path $indexPath) {
                    $localPath = $indexPath
                }
            }
            
            if (Test-Path $localPath -PathType Leaf) {
                $bytes = [IO.File]::ReadAllBytes($localPath)
                $response.ContentLength64 = $bytes.Length
                
                $ext = [IO.Path]::GetExtension($localPath).ToLower()
                switch ($ext) {
                    ".html" { $response.ContentType = "text/html; charset=utf-8" }
                    ".css"  { $response.ContentType = "text/css" }
                    ".js"   { $response.ContentType = "application/javascript" }
                    ".json" { $response.ContentType = "application/json" }
                    ".jpg"  { $response.ContentType = "image/jpeg" }
                    ".png"  { $response.ContentType = "image/png" }
                    ".svg"  { $response.ContentType = "image/svg+xml" }
                    Default { $response.ContentType = "application/octet-stream" }
                }
                
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.StatusCode = 200
            } else {
                $response.StatusCode = 404
            }
            $response.Close()
        }
    } catch {
         Write-Host "Sunucu hatası: $_" -ForegroundColor Red
         Write-Host "İpucu: PowerShell'i Yönetici olarak çalıştırmanız gerekebilir veya port meşgul." -ForegroundColor Gray
    }
} else {
    Write-Host "`n[BİLGİ] Siteyi tarayıcıda açmak için şu komutu kullanın:" -ForegroundColor Cyan
    Write-Host ".\test-project.ps1 -Server" -ForegroundColor White
}
