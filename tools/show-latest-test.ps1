$latest = Get-ChildItem "$PSScriptRoot\..\logs\test-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $latest) { Write-Host "No test logs found in $PSScriptRoot\..\logs"; exit 1 }

$r = Get-Content $latest.FullName -Raw | ConvertFrom-Json

Write-Host "Latest: $($latest.Name)"
$r.stats | Format-Table -AutoSize

$bad = $r.results | Where-Object status -ne "ok"
if ($bad) {
  $bad | Select-Object status, code, url | Format-Table -AutoSize
  exit 2
} else {
  Write-Host "✅ No failing results."
  exit 0
}