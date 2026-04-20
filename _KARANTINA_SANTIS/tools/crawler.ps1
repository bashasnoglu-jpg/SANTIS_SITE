$startUrl = "http://localhost:8000"
$queue = @($startUrl)
$visited = @()

Write-Host "Tarama Baslatiliyor... (Hedef: $startUrl)" -ForegroundColor Cyan

while ($queue.Count -gt 0) {
    # Kuyruktan ilk URL'yi al
    $url = $queue[0]
    
    # Kuyrugu guncelle
    if ($queue.Count -gt 1) {
        $queue = $queue[1..($queue.Count - 1)]
    }
    else {
        $queue = @()
    }

    # Daha once ziyaret edildiyse atla
    if ($visited -contains $url) { continue }

    $visited += $url
    Write-Host "Taranıyor: $url" -ForegroundColor Yellow

    try {
        $res = Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction Stop
        
        # Regex deseni (cift tirnak ile olusturuldu, hata vermez)
        $pattern = "href=[`"']([^`"']+)[`"']"
        
        $links = [regex]::Matches($res.Content, $pattern) | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
        
        foreach ($link in $links) {
            # Eger link relative (goreceli) ise tam URL'ye cevir (ornek: /hakkimizda -> http://localhost:8000/hakkimizda)
            if ($link.StartsWith("/")) {
                $link = $startUrl + $link
            }
            
            # Sadece http ile baslayan gecerli linkleri ve kendi sitemizi tarayalim (disarilara gitmeyelim)
            if ($link.StartsWith($startUrl) -and ($visited -notcontains $link) -and ($queue -notcontains $link)) {
                $queue += $link
            }
        }
    }
    catch {
        Write-Host "Erisim Hatasi ($url): $_" -ForegroundColor Red
    }
}

Write-Host "Tarama Tamamlandi! Toplam URL Sayisi: $($visited.Count)" -ForegroundColor Green
$visited | Out-File "links.txt" -Encoding utf8
Write-Host "Tüm linkler 'links.txt' dosyasina kaydedildi." -ForegroundColor Cyan
