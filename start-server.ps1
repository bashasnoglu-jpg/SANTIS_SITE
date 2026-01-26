param(
  [int]$Port = 8080,
  [string]$RootPath = "."
)

$projectRoot = $PSScriptRoot
$rootFull = (Resolve-Path (Join-Path $projectRoot $RootPath)).Path

Write-Host "Starting server: http://127.0.0.1:$Port (root=$rootFull)"
npx -y http-server "$rootFull" -p $Port -c -1