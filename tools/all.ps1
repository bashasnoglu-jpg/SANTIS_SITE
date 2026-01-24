param(
  [string]$TestCommand = "node test-runner-advanced.js",
  [int]$Repeat = 1,
  [int]$DelayMs = 0
)

& "$PSScriptRoot\..\run-tests.ps1" -TestCommand $TestCommand -Repeat $Repeat -DelayMs $DelayMs

Write-Host ""
Write-Host "----- Latest Test Summary -----"
& "$PSScriptRoot\show-latest-test.ps1"