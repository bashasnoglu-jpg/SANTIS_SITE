$base = 'c:\Users\tourg\Desktop\SANTIS_SITE'
$domain = 'https://santis.club'
$lines = @('<?xml version="1.0" encoding="UTF-8"?>')
$lines += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
$lines += ''
$lines += '  <url><loc>' + $domain + '/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>'

$dirs = @('tr', 'en', 'de', 'fr', 'ru')
foreach ($d in $dirs) {
    $path = Join-Path $base $d
    if (Test-Path $path) {
        Get-ChildItem -Path $path -Recurse -Filter '*.html' | Sort-Object FullName | ForEach-Object {
            $rel = $_.FullName.Substring($base.Length).Replace('\', '/')
            $lines += '  <url><loc>' + $domain + $rel + '</loc><changefreq>weekly</changefreq></url>'
        }
    }
}
$lines += '</urlset>'
$outPath = Join-Path $base 'sitemap.xml'
$lines | Out-File -FilePath $outPath -Encoding UTF8
Write-Host "Sitemap generated: $($lines.Count) lines, saved to $outPath"
