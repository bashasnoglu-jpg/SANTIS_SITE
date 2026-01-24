$latest = Get-ChildItem "$PSScriptRoot\..\logs\test-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $latest) { Write-Host "No logs found"; exit 1 }

$r = Get-Content $latest.FullName -Raw | ConvertFrom-Json
$r.results | Where-Object status -ne "ok" | Select-Object status, code, url | Format-Table -AutoSize