# SANTIS CLUB - AUDIT SCRIPT (PowerShell)
$ErrorActionPreference = "Stop"
$patterns = @(
    @('href="en/', 'Relative EN link (href="en/)'),
    @('href="/en/', 'Absolute EN link (href="/en/)'),
    @('href="../en/', 'Parent EN link (href="../en/)'),
    @('href="./en/', 'Current EN link (href="./en/)'),
    @('\?lang=', 'URL Query Param (?lang=)'),
    @('get\("lang"\)', 'JS URLSearchParams (get("lang"))'),
    @('hreflang="en', 'Hreflang English'),
    @('hreflang="fr', 'Hreflang French'),
    @('\.translations\[lang\]', 'JS Legacy translations[lang]'),
    @('name\[STATE\.lang\]', 'JS Legacy name[STATE.lang]'),
    @('hammam-zigzag-en\.js', 'Legacy Script Reference')
)

$excludes = @("node_modules", ".git", "tools", "_PROMPT_WORKBENCH.json", "santis-hotels.json", "site_content.json", "package-lock.json", "playwright.config.js")

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "SANTIS CLUB - TR-ONLY AUDIT (PS)" -ForegroundColor Cyan
Write-Host "======================================"

$failed = $false

foreach ($p in $patterns) {
    $pat = $p[0]
    $desc = $p[1]
    
    # Exclude tools directory manually since Get-ChildItem -Exclude is shallow
    $hits = Get-ChildItem -Recurse -File -Path . | Where-Object { $_.FullName -notmatch "\\tools\\" -and $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch ".git" } | Select-String -Pattern $pat
    
    # Filter out script itself and report if it matched recursively
    $count = 0
    if ($hits) {
        $count = $hits.Count
    }

    if ($count -eq 0) {
        Write-Host "✅ [OK] $desc : 0 hits" -ForegroundColor Green
    }
    else {
        Write-Host "❌ [FAIL] $desc : $count hits found!" -ForegroundColor Red
        $hits | ForEach-Object { Write-Host "   File: $($_.Path) Line: $($_.LineNumber)" -ForegroundColor Gray }
        $failed = $true
    }
}

Write-Host "======================================"
if (-not $failed) {
    Write-Host "🎉 AUDIT PASSED" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "🔥 AUDIT FAILED" -ForegroundColor Red
    exit 1
}
