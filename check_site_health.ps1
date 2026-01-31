
# Hedef URL
$Url = "http://localhost:5500/tr/masajlar/index.html" # Hedef sayfayı güncelledim

Write-Host "🔍 Santis Club Health Check Başlatılıyor..." -ForegroundColor Cyan
Write-Host "Hedef: $Url" -ForegroundColor Gray

try {
    # Sayfayı indir (HTML)
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Sayfa Erişilebilir (HTTP 200)" -ForegroundColor Green
    } else {
        Write-Host "❌ Sayfa Erişilemez! Kod: $($response.StatusCode)" -ForegroundColor Red
        exit
    }
    
    $Html = $response

    # CSP meta etiketini bul
    # ParsedHtml her ortamda çalışmayabilir (IE bağımlılığı), bu yüzden basit regex kullanacağım
    $content = $Html.Content
    if ($content -match '<meta\s+http-equiv="Content-Security-Policy"[^>]*content="([^"]*)"') {
        Write-Host "`n🛡️ CSP Meta Etiketi Bulundu!" -ForegroundColor Green
        Write-Host "Değer: $($matches[1])" -ForegroundColor Gray
    } else {
        # Dinamik eklenen scripti kontrol et
        if ($content -match 'Content-Security-Policy') {
            Write-Host "`n🛡️ Dinamik CSP Scripti Tespit Edildi (JS içinde)." -ForegroundColor Yellow
        } else {
            Write-Host "`n⚠️ CSP meta etiketi veya scripti bulunamadı." -ForegroundColor Yellow
        }
    }

    # Basit bir Regex ile script src'lerini topla (Daha hafif ve hızlı)
    $scriptMatches = [regex]::Matches($content, 'src="([^"]+\.js)"')
    $linkMatches = [regex]::Matches($content, 'href="([^"]+\.css)"')
    
    Write-Host "`n📂 Kaynak Kontrolü Başlıyor..." -ForegroundColor Cyan
    
    # URL Düzeltici Fonksiyon
    function Test-Resource ($path) {
        # Absolute path düzeltmesi
        if ($path.StartsWith("/")) {
             $fullUrl = "http://localhost:5500" + $path
        } elseif ($path.StartsWith("http")) {
             $fullUrl = $path
        } else {
             $fullUrl = "http://localhost:5500/tr/masajlar/" + $path
        }
        
        try {
            $r = Invoke-WebRequest -Uri $fullUrl -Method Head -UseBasicParsing -ErrorAction Stop
            Write-Host "  ✅ OK: $path" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ HATA: $path ($($_.Exception.Message))" -ForegroundColor Red
        }
    }

    foreach ($match in $scriptMatches) { Test-Resource $match.Groups[1].Value }
    foreach ($match in $linkMatches) { Test-Resource $match.Groups[1].Value }

} catch {
    Write-Host "❌ KRİTİK HATA: Siteye hiç ulaşılamıyor! Live Server açık mı?" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n🏁 Test Tamamlandı." -ForegroundColor Cyan
