# SANTIS SITE - Ultra Scan
Write-Host "=== BROKEN HTML (Multiple <body> tags) ==="
$dirs = @("tr", "en", "de", "fr", "ru")
foreach ($d in $dirs) {
    Get-ChildItem -Path $d -Recurse -Filter "*.html" | ForEach-Object {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $bodyCount = ([regex]::Matches($content, '<body')).Count
            if ($bodyCount -gt 1) {
                Write-Host "BROKEN-BODY($bodyCount): $($_.FullName.Replace('C:\Users\tourg\Desktop\SANTIS_SITE\',''))"
            }
        }
    }
}

Write-Host ""
Write-Host "=== DRAFT PAGES ==="
foreach ($d in $dirs) {
    Get-ChildItem -Path $d -Recurse -Filter "*.html" | ForEach-Object {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -and $content -match '\[DRAFT\]') {
            Write-Host "DRAFT: $($_.FullName.Replace('C:\Users\tourg\Desktop\SANTIS_SITE\',''))"
        }
    }
}

Write-Host ""
Write-Host "=== NOINDEX PAGES (outside _legacy) ==="
foreach ($d in $dirs) {
    Get-ChildItem -Path $d -Recurse -Filter "*.html" | ForEach-Object {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -and $content -match 'noindex') {
            Write-Host "NOINDEX: $($_.FullName.Replace('C:\Users\tourg\Desktop\SANTIS_SITE\',''))"
        }
    }
}

Write-Host ""
Write-Host "=== SCRIPT TAG COUNT DISTRIBUTION ==="
$scriptCounts = @{}
foreach ($d in $dirs) {
    Get-ChildItem -Path $d -Recurse -Filter "*.html" | ForEach-Object {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $sc = ([regex]::Matches($content, '<script')).Count
            if (-not $scriptCounts.ContainsKey($sc)) { $scriptCounts[$sc] = 0 }
            $scriptCounts[$sc]++
        }
    }
}
$scriptCounts.GetEnumerator() | Sort-Object Name | ForEach-Object {
    Write-Host "$($_.Value) pages have $($_.Name) script tags"
}

Write-Host ""
Write-Host "=== TEMPLATE PATTERN ANALYSIS ==="
$patterns = @{}
foreach ($d in $dirs) {
    Get-ChildItem -Path $d -Recurse -Filter "*.html" | ForEach-Object {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $hasNavbarContainer = $content -match 'navbar-container'
            $hasNvHeader = $content -match 'id="nv-header"'
            $hasNvMain = $content -match 'id="nv-main"'
            $hasFooterContainer = $content -match 'footer-container'
            $hasNvFooter = $content -match 'id="nv-footer"'
            $hasSantisNav = $content -match 'santis-nav\.js'
            $hasLoader = $content -match 'loader\.js'
            $hasTrinity = $content -match 'three\.min\.js'
            
            $pattern = ""
            if ($hasNavbarContainer) { $pattern += "NavC+" } elseif ($hasNvHeader) { $pattern += "NvH+" }
            if ($hasNvMain) { $pattern += "Main+" }
            if ($hasFooterContainer) { $pattern += "FootC+" } elseif ($hasNvFooter) { $pattern += "NvF+" }
            if ($hasSantisNav) { $pattern += "SNav+" }
            if ($hasLoader) { $pattern += "Ldr+" }
            if ($hasTrinity) { $pattern += "Tri" }
            
            if (-not $patterns.ContainsKey($pattern)) { $patterns[$pattern] = 0 }
            $patterns[$pattern]++
        }
    }
}
$patterns.GetEnumerator() | Sort-Object -Property Value -Descending | ForEach-Object {
    Write-Host "$($_.Value) pages: $($_.Key)"
}

Write-Host ""
Write-Host "=== MIXED LANGUAGE DETECTION (EN pages with Turkish content) ==="
$trInEN = 0
Get-ChildItem -Path "en" -Recurse -Filter "*.html" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and $content -match 'ANA SAYFA' -and $content -match 'lang="en"') {
        $trInEN++
    }
}
Write-Host "$trInEN EN pages have Turkish 'ANA SAYFA' noscript fallback"

$enInTR = 0
Get-ChildItem -Path "tr" -Recurse -Filter "*.html" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and $content -match 'Reserve Now' -and $content -match 'lang="tr"') {
        $enInTR++
    }
}
Write-Host "$enInTR TR pages have English 'Reserve Now' button"
