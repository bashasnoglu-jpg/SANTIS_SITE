[CmdletBinding()]
param(
  [string]$TestCommand = "node test-runner-advanced.js",
  [int]$Repeat = 1,
  [int]$DelayMs = 0,

  # Optional overrides
  [string]$WorkingDirectory = "",
  [string]$LogsDir = "",
  [string]$LatestResultPath = "",
  [string]$RunnerResultPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Robust base dir (works with -File, dot-sourcing, different hosts)
$ScriptFile = $PSCommandPath
if (-not $ScriptFile) { $ScriptFile = $MyInvocation.MyCommand.Path }
$BaseDir = if ($ScriptFile) { Split-Path -Parent $ScriptFile } else { (Get-Location).Path }

if ([string]::IsNullOrWhiteSpace($WorkingDirectory)) { $WorkingDirectory = $BaseDir }
if ([string]::IsNullOrWhiteSpace($LogsDir)) { $LogsDir = Join-Path $BaseDir "logs" }
if ([string]::IsNullOrWhiteSpace($LatestResultPath)) { $LatestResultPath = Join-Path $BaseDir "test-results.json" }
if ([string]::IsNullOrWhiteSpace($RunnerResultPath)) { $RunnerResultPath = Join-Path $BaseDir "test-results.json" }

function Ensure-Directory([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

if ($Repeat -lt 1) { $Repeat = 1 }
Ensure-Directory $LogsDir

Write-Host "🚀 Running tests: $TestCommand"

$lastExit = 0

for ($i = 1; $i -le $Repeat; $i++) {
  if ($Repeat -gt 1) { Write-Host "🔄 Iteration $i of $Repeat..." }

  $stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
  $archiveRunner = Join-Path $LogsDir ("test-results-$stamp.json")
  $archiveMeta   = Join-Path $LogsDir ("run-$stamp.json")

  $tmpStdout = [System.IO.Path]::GetTempFileName()
  $tmpStderr = [System.IO.Path]::GetTempFileName()

  $sw = [System.Diagnostics.Stopwatch]::StartNew()

  $proc = Start-Process -FilePath "cmd.exe" `
    -ArgumentList @("/c", $TestCommand) `
    -WorkingDirectory $WorkingDirectory `
    -NoNewWindow `
    -Wait `
    -PassThru `
    -RedirectStandardOutput $tmpStdout `
    -RedirectStandardError $tmpStderr

  $sw.Stop()
  $lastExit = $proc.ExitCode

  $stdout = ""
  $stderr = ""
  try { $stdout = Get-Content -LiteralPath $tmpStdout -Raw -ErrorAction SilentlyContinue } catch {}
  try { $stderr = Get-Content -LiteralPath $tmpStderr -Raw -ErrorAction SilentlyContinue } catch {}
  Remove-Item -LiteralPath $tmpStdout,$tmpStderr -Force -ErrorAction SilentlyContinue | Out-Null

  # Archive runner-produced JSON if present
  $runnerJson = $null
  if (Test-Path -LiteralPath $RunnerResultPath) {
    $runnerJson = Get-Content -LiteralPath $RunnerResultPath -Raw -ErrorAction SilentlyContinue
    if ($runnerJson) {
      Write-Utf8NoBom $archiveRunner $runnerJson
      Write-Utf8NoBom $LatestResultPath $runnerJson
      Write-Host "✅ Found existing test-results.json, archiving..."
    }
  }

  # Always write meta report
  $meta = [ordered]@{
    iteration       = $i
    repeat          = $Repeat
    timestamp       = (Get-Date).ToString("o")
    command         = $TestCommand
    workingDir      = $WorkingDirectory
    exitCode        = $proc.ExitCode
    durationMs      = [int]$sw.ElapsedMilliseconds
    ok              = ($proc.ExitCode -eq 0)
    runnerJsonFound = [bool]$runnerJson
    runnerJsonPath  = $RunnerResultPath
    archivedRunner  = (Test-Path -LiteralPath $archiveRunner)
    archivedMeta    = $archiveMeta
    stdout          = $stdout
    stderr          = $stderr
  }

  Write-Utf8NoBom $archiveMeta (($meta | ConvertTo-Json -Depth 8))

  if ($DelayMs -gt 0 -and $i -lt $Repeat) {
    Start-Sleep -Milliseconds $DelayMs
  }
}

Write-Host "✅ Test run complete"
Write-Host "• Logs:    $LogsDir"
Write-Host "• Latest:  $LatestResultPath"

exit $lastExit