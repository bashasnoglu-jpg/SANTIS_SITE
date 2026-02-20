# Focused scan - just the counts
Write-Host "=== DRAFT COUNT PER LANG ==="
$dirs = @("tr", "en", "de", "fr", "ru")
foreach ($d in $dirs) {
    $count = 0
    Get-ChildItem -Path $d -Recurse -Filter "*.html" | ForEach-Object {
        $c = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($c -and $c -match '\[DRAFT\]') { $count++ }
    }
    Write-Host "${d}: $count DRAFT pages"
}

Write-Host ""
Write-Host "=== NOINDEX COUNT PER LANG ==="
foreach ($d in $dirs) {
    $count = 0
    Get-ChildItem -Path $d -Recurse -Filter "*.html" | ForEach-Object {
        $c = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($c -and $c -match 'noindex') { $count++ }
    }
    Write-Host "${d}: $count NOINDEX pages"
}

Write-Host ""  
Write-Host "=== TEMPLATE PATTERNS ==="
$patterns = @{}
foreach ($d in $dirs) {
    Get-ChildItem -Path $d -Recurse -Filter "*.html" | ForEach-Object {
        $c = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($c) {
            $p = ""
            if ($c -match 'navbar-container') { $p += "NavC " } elseif ($c -match 'id="nv-header"') { $p += "NvH " }
            if ($c -match 'id="nv-main"') { $p += "Main " }
            if ($c -match 'footer-container') { $p += "FootC " } elseif ($c -match 'id="nv-footer"') { $p += "NvF " }
            if ($c -match 'santis-nav\.js') { $p += "SNav " }
            if ($c -match 'three\.min\.js') { $p += "Tri " }
            if ($c -match 'data-bridge\.js') { $p += "DB " }
            if ($c -match 'category-engine\.js') { $p += "CE " }
            if ($p -eq "") { $p = "RAW" }
            if (-not $patterns.ContainsKey($p.Trim())) { $patterns[$p.Trim()] = 0 }
            $patterns[$p.Trim()]++
        }
    }
}
$patterns.GetEnumerator() | Sort-Object -Property Value -Descending | ForEach-Object {
    Write-Host "$($_.Value) pages: [$($_.Key)]"
}

Write-Host ""
Write-Host "=== SCRIPT TAG COUNT DISTRIBUTION ==="
$scriptCounts = @{}
foreach ($d in $dirs) {
    Get-ChildItem -Path $d -Recurse -Filter "*.html" | ForEach-Object {
        $c = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($c) {
            $sc = ([regex]::Matches($c, '<script')).Count
            if (-not $scriptCounts.ContainsKey($sc)) { $scriptCounts[$sc] = 0 }
            $scriptCounts[$sc]++
        }
    }
}
$scriptCounts.GetEnumerator() | Sort-Object Name | ForEach-Object {
    Write-Host "$($_.Value) pages: $($_.Name) scripts"
}
