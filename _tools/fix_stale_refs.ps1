# Fix stale "hizmetler" and "urunler" references in DE, FR, RU
# Only replace self-referencing URLs (de/hizmetler -> de/services, fr/hizmetler -> fr/services)
# TR references to tr/hizmetler are correct and should NOT be changed

$base = 'c:\Users\tourg\Desktop\SANTIS_SITE'
$count = 0

# DE: hizmetler -> services
$deFiles = Get-ChildItem -Path "$base\de" -Recurse -Filter '*.html'
foreach ($f in $deFiles) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8
    $original = $content
    $content = $content -replace 'santis\.club/de/hizmetler/', 'santis.club/de/services/'
    $content = $content -replace '"/de/hizmetler/', '"/de/services/'
    $content = $content -replace 'santis\.club/de/urunler/', 'santis.club/de/shop/'
    $content = $content -replace '"/de/urunler/', '"/de/shop/'
    if ($content -ne $original) {
        $content | Set-Content $f.FullName -Encoding UTF8 -NoNewline
        $count++
    }
}

# FR: hizmetler -> services
$frFiles = Get-ChildItem -Path "$base\fr" -Recurse -Filter '*.html'
foreach ($f in $frFiles) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8
    $original = $content
    $content = $content -replace 'santis\.club/fr/hizmetler/', 'santis.club/fr/services/'
    $content = $content -replace '"/fr/hizmetler/', '"/fr/services/'
    $content = $content -replace 'santis\.club/fr/urunler/', 'santis.club/fr/shop/'
    $content = $content -replace '"/fr/urunler/', '"/fr/shop/'
    if ($content -ne $original) {
        $content | Set-Content $f.FullName -Encoding UTF8 -NoNewline
        $count++
    }
}

# RU: urunler -> shop
$ruFiles = Get-ChildItem -Path "$base\ru" -Recurse -Filter '*.html'
foreach ($f in $ruFiles) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8
    $original = $content
    $content = $content -replace 'santis\.club/ru/urunler/', 'santis.club/ru/shop/'
    $content = $content -replace '"/ru/urunler/', '"/ru/shop/'
    if ($content -ne $original) {
        $content | Set-Content $f.FullName -Encoding UTF8 -NoNewline
        $count++
    }
}

Write-Host "Fixed $count files with stale references"
