# Generate available-routes.json by scanning actual filesystem
# Uses i18n-routes.js ROUTE_MAP logic to build canonical keys

$base = "c:\Users\tourg\Desktop\SANTIS_SITE"
$langs = @("tr", "en", "de", "fr", "ru")

# ROUTE_MAP: dir name -> canonical (TR) key
$dirToCanonical = @{
    "massages" = "masajlar"; "massagen" = "masajlar"; "masajlar" = "masajlar"
    "hammam" = "hamam"; "hamam" = "hamam"
    "services" = "hizmetler"; "hizmetler" = "hizmetler"; "cilt-bakimi" = "hizmetler"
    "products" = "urunler"; "urunler" = "urunler"
    "gallery" = "galeri"; "galeri" = "galeri"
    "shop" = "magaza"; "magaza" = "magaza"
    "about" = "hakkimizda"; "hakkimizda" = "hakkimizda"
    "team" = "ekibimiz"; "ekibimiz" = "ekibimiz"; "our-team" = "ekibimiz"
    "blog" = "blog"
    "wisdom" = "bilgelik"; "bilgelik" = "bilgelik"
    "booking" = "rezervasyon"; "rezervasyon" = "rezervasyon"
}

# Scan all HTML files across all language directories
$routes = @{}

foreach ($lang in $langs) {
    $langDir = Join-Path $base $lang
    if (-not (Test-Path $langDir)) { continue }
    
    $htmlFiles = Get-ChildItem -Path $langDir -Filter "*.html" -Recurse
    foreach ($file in $htmlFiles) {
        # Get relative path from language dir
        $relPath = $file.FullName.Substring($langDir.Length + 1).Replace("\", "/")
        
        # Parse: first segment is the category dir
        $segments = $relPath -split "/"
        $dirName = if ($segments.Count -gt 1) { $segments[0] } else { $null }
        
        # Build canonical key
        if ($dirName -and $dirToCanonical.ContainsKey($dirName)) {
            $canonicalDir = $dirToCanonical[$dirName]
            $canonicalPath = $canonicalDir + "/" + ($segments[1..($segments.Count - 1)] -join "/")
        }
        else {
            $canonicalPath = $relPath
        }
        
        # Add to routes
        if (-not $routes.ContainsKey($canonicalPath)) {
            $routes[$canonicalPath] = @{}
        }
        $routes[$canonicalPath][$lang] = $relPath
    }
}

# Sort and output as JSON
$sorted = [ordered]@{}
foreach ($key in ($routes.Keys | Sort-Object)) {
    $entry = [ordered]@{}
    foreach ($lang in $langs) {
        if ($routes[$key].ContainsKey($lang)) {
            $entry[$lang] = $routes[$key][$lang]
        }
    }
    $sorted[$key] = $entry
}

$json = $sorted | ConvertTo-Json -Depth 3
$outPath = Join-Path $base "assets\data\available-routes.json"
$json | Set-Content -Path $outPath -Encoding UTF8
$routeCount = $sorted.Count
Write-Host "available-routes.json regenerated: $routeCount routes"
