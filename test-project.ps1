# SANTIS CLUB Site Test ve Önizleme Aracı
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
    }
    else {
        Write-Host "[HATA] Eksik: $Yol" -ForegroundColor Red
    }
}

function Test-Icerik {
    param($Yol, $Metin)
    if (-not (Test-Path $Yol)) { return }
    $content = Get-Content $Yol -Raw -ErrorAction SilentlyContinue
    if ($content -like "*$Metin*") {
        Write-Host "[OK] '$Yol' içinde bulundu: '$Metin'" -ForegroundColor Green
    }
    else {
        Write-Host "[HATA] '$Yol' içinde EKSİK: '$Metin'" -ForegroundColor Red
    }
}

Write-Host "`n--- SANTIS CLUB SİTE KONTROLÜ ---`n" -ForegroundColor Cyan

# 1. Dosya Yapısı
Write-Host "1. Dosya Yapısı Kontrol ediliyor..." -ForegroundColor Yellow
Test-Dosya "index.html"
Test-Dosya "assets\css\style.css"
Test-Dosya "assets\js\app.js"
Test-Dosya "assets\js\core_data_loader.js"
Test-Dosya "tr"
Test-Dosya "en"

# 2. Legacy Dosya Kontrolü (Atlandı)

# 3. İçerik ve Standartlar
Write-Host "`n3. İçerik ve Standartlar taranıyor..." -ForegroundColor Yellow
Test-Icerik "index.html" 'id="navbar-container"'
Test-Icerik "index.html" 'id="nv-main"'
Test-Icerik "assets\js\app.js" 'Santis'

# 4. Resim Varlık Kontrolü (JSON Verisinden)
Write-Host "`n4. JSON Verisindeki Resimler Kontrol ediliyor..." -ForegroundColor Yellow
$jsonPath = "$root\data\site_content.json"
if (Test-Path $jsonPath) {
    try {
        $jsonContent = Get-Content $jsonPath -Raw | ConvertFrom-Json
        $imagesToCheck = @()
        
        # Services (Eğer varsa)
        if ($jsonContent.services) {
            $jsonContent.services.PSObject.Properties | ForEach-Object {
                if ($_.Value.img) { $imagesToCheck += $_.Value.img }
            }
        }
        
        # Catalogs (Hammam, Massage, Skincare)
        if ($jsonContent.catalogs) {
            $jsonContent.catalogs.PSObject.Properties | ForEach-Object {
                if ($_.Value.items) {
                    $_.Value.items | ForEach-Object {
                        if ($_.img) { $imagesToCheck += $_.img }
                    }
                }
            }
        }

        # Hotels
        if ($jsonContent.hotels) {
            $jsonContent.hotels | ForEach-Object {
                if ($_.hero_image) { $imagesToCheck += $_.hero_image }
            }
        }

        # Benzersiz resimleri kontrol et
        $imagesToCheck | Select-Object -Unique | ForEach-Object {
            # Başındaki / işaretini kaldır ve ters slash yap
            $relPath = $_ -replace "^/", "" -replace "/", "\"
            $fullPath = "$root\$relPath"
            
            if (-not (Test-Path $fullPath)) {
                Write-Host "[EKSİK] Dosya bulunamadı: $relPath" -ForegroundColor Red
            }
        }
        Write-Host "Resim kontrolü tamamlandı." -ForegroundColor Gray
    }
    catch {
        Write-Host "[HATA] JSON okunamadı: $_" -ForegroundColor Red
    }
}

# 3. Sunucu Modu
if ($Server) {
    Write-Host "`n--- YEREL SUNUCU BAŞLATILIYOR ---`n" -ForegroundColor Cyan
    try {
        $listener = New-Object System.Net.HttpListener
        $started = $false
        $currentPort = $Port
        $maxPort = $Port + 10
        $url = ""

        while (-not $started -and $currentPort -le $maxPort) {
            try {
                $listener = New-Object System.Net.HttpListener
                $url = "http://localhost:$currentPort/"
                $listener.Prefixes.Add($url)
                $listener.Start()
                $started = $true
            }
            catch {
                Write-Host "[BILGI] Port $currentPort dolu, siradaki deneniyor..." -ForegroundColor DarkYellow
                $currentPort++
                if ($listener) { $listener.Close() }
                $listener = New-Object System.Net.HttpListener
            }
        }

        if (-not $started) {
            throw "Hicbir port ($Port-$maxPort araliginda) musait degil."
        }

        Write-Host "Sunucu aktif: $url" -ForegroundColor Green
        Write-Host "Durdurmak icin Ctrl+C basin." -ForegroundColor Gray
        
        Start-Process $url

        while ($listener.IsListening) {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            $localPath = "$root$($request.Url.LocalPath)".Replace('/', '\')
            Write-Host "[ISTEK] $($request.HttpMethod): $($request.Url.LocalPath)" -ForegroundColor Gray
            
            # Klasör ise index.html dene
            if (Test-Path $localPath -PathType Container) {
                $indexPath = Join-Path $localPath "index.html"
                if (Test-Path $indexPath) {
                    $localPath = $indexPath
                }
            }
            
            if (Test-Path $localPath -PathType Leaf) {
                try {
                    $bytes = [IO.File]::ReadAllBytes($localPath)
                    $response.ContentLength64 = $bytes.Length
                    
                    $ext = [IO.Path]::GetExtension($localPath).ToLower()
                    switch ($ext) {
                        ".html" { $response.ContentType = "text/html; charset=utf-8" }
                        ".css" { $response.ContentType = "text/css" }
                        ".js" { $response.ContentType = "application/javascript" }
                        ".json" { $response.ContentType = "application/json" }
                        ".jpg" { $response.ContentType = "image/jpeg" }
                        ".png" { $response.ContentType = "image/png" }
                        ".webp" { $response.ContentType = "image/webp" }
                        ".svg" { $response.ContentType = "image/svg+xml" }
                        Default { $response.ContentType = "application/octet-stream" }
                    }
                    
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.StatusCode = 200
                    Write-Host "  -> 200 OK ($($bytes.Length) byte)" -ForegroundColor Green
                }
                catch {
                    Write-Host "  -> 500 HATA: $($_.Exception.Message)" -ForegroundColor Red
                    $response.StatusCode = 500
                }
            }
            else {
                Write-Host "  -> 404 Bulunamadi: $localPath" -ForegroundColor Red
                $response.StatusCode = 404
            }
            $response.Close()
        }
    }
    catch {
        Write-Host "Sunucu hatası: $_" -ForegroundColor Red
        Write-Host "İpucu: PowerShell'i Yönetici olarak çalıştırmanız gerekebilir veya port meşgul." -ForegroundColor Gray
    }
}
else {
    Write-Host "`n[BİLGİ] Siteyi tarayıcıda açmak için şu komutu kullanın:" -ForegroundColor Cyan
    Write-Host ".\test-project.ps1 -Server" -ForegroundColor White
}
