$ErrorActionPreference = "Stop"

$path = "assets/css/style.css"

if (-not (Test-Path $path)) {
  throw "style.css not found at $path"
}

$content = Get-Content $path -Raw

$content = $content -replace "background:\s*rgba\(18,\s*16,\s*14,\s*0\.98\)\s*!important;", "background: var(--surface-glass-nav-strong);"
$content = $content -replace "z-index:\s*2147483647\s*!important;", "z-index: var(--z-index-command);"

$content = [regex]::Replace(
  $content,
  "(?s)(\.sovereign-nav\s*\{.*?z-index:\s*)var\(--z-index-command\)(\s*;.*?\})",
  '$1var(--z-index-nav)$2'
)

Set-Content $path $content -Encoding UTF8

Write-Host "✅ Navigation constitutional layer patch applied to $path"
Write-Host "   - rgba nav surface -> var(--surface-glass-nav-strong)"
Write-Host "   - 2147483647 -> var(--z-index-command)"
Write-Host "   - .sovereign-nav -> var(--z-index-nav)"
