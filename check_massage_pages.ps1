$baseDir = "C:\Users\tourg\Desktop\SANTIS_SITE"
$masajDir = "$baseDir\tr\masajlar"

# Get HTML files
$htmlFiles = Get-ChildItem -Path $masajDir -Filter *.html

# List for missing assets
$missingAssets = @()

# Load db.js content for slug checking
$dbFile = "$baseDir\assets\js\db.js"
$dbContent = Get-Content $dbFile -Raw
$dbSlugs = [regex]::Matches($dbContent, '"slug"\s*:\s*"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }

Write-Host "Checking HTML files in $masajDir..."
Write-Host "Total db.js slugs found: $($dbSlugs.Count)"

foreach ($file in $htmlFiles) {
    if ($file.Name -match "index.html") { continue } # Skip index

    $content = Get-Content $file.FullName -Raw
    
    # 1. Check Images and Scripts (src="...")
    $srcMatches = [regex]::Matches($content, 'src="([^"]+)"')
    foreach ($match in $srcMatches) {
        $relPath = $match.Groups[1].Value
        
        # Determine absolute path
        try {
            # Combine HTML file directory with relative path
            $fullPath = [System.IO.Path]::GetFullPath((Join-Path $file.DirectoryName $relPath))
            
            if (!(Test-Path $fullPath)) {
                $missingAssets += [PSCustomObject]@{
                    Page           = $file.Name
                    Type           = "Asset"
                    MissingDetails = $relPath
                }
            }
        }
        catch {
            $missingAssets += [PSCustomObject]@{
                Page           = $file.Name
                Type           = "Error"
                MissingDetails = "Invalid Path: $relPath"
            }
        }
    }
    
    # 2. Check Slug Match
    $slug = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    if ($dbSlugs -notcontains $slug) {
        $missingAssets += [PSCustomObject]@{
            Page           = $file.Name
            Type           = "Slug Mismatch"
            MissingDetails = "Filename '$slug' not in db.js"
        }
    }
}

# Output Results
if ($missingAssets.Count -eq 0) {
    Write-Host "✅ All checks passed!" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Issues Found:" -ForegroundColor Yellow
    $missingAssets | Format-Table -AutoSize
}
