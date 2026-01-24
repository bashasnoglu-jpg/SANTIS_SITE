New-Item -ItemType Directory -Force -Path "$PSScriptRoot" | Out-Null

# show-latest-test.ps1
@"
`$latest = Get-ChildItem "`$PSScriptRoot\..\logs\test-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not `$latest) { Write-Host "No test logs found in `$PSScriptRoot\..\logs"; exit 1 }

`$r = Get-Content `$latest.FullName -Raw | ConvertFrom-Json

Write-Host "Latest: `$(`$latest.Name)"
`$r.stats | Format-Table -AutoSize

`$bad = `$r.results | Where-Object status -ne "ok"
if (`$bad) {
  `$bad | Select-Object status, code, url | Format-Table -AutoSize
  exit 2
} else {
  Write-Host "✅ No failing results."
  exit 0
}
"@ | % { [System.IO.File]::WriteAllText((Join-Path $PSScriptRoot "show-latest-test.ps1"), $_, (New-Object System.Text.UTF8Encoding($false))) }

# show-fails.ps1
@"
`$latest = Get-ChildItem "`$PSScriptRoot\..\logs\test-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not `$latest) { Write-Host "No logs found"; exit 1 }

`$r = Get-Content `$latest.FullName -Raw | ConvertFrom-Json
`$r.results | Where-Object status -ne "ok" | Select-Object status, code, url | Format-Table -AutoSize
"@ | % { [System.IO.File]::WriteAllText((Join-Path $PSScriptRoot "show-fails.ps1"), $_, (New-Object System.Text.UTF8Encoding($false))) }

# open-latest-log.ps1
@"
`$latest = Get-ChildItem "`$PSScriptRoot\..\logs\test-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (`$latest) { notepad `$latest.FullName } else { Write-Host "No logs found" }
"@ | % { [System.IO.File]::WriteAllText((Join-Path $PSScriptRoot "open-latest-log.ps1"), $_, (New-Object System.Text.UTF8Encoding($false))) }

Write-Host "✅ Tools installed:"
Write-Host " - $PSScriptRoot\show-latest-test.ps1"
Write-Host " - $PSScriptRoot\show-fails.ps1"
Write-Host " - $PSScriptRoot\open-latest-log.ps1"