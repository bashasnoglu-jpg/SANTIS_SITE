param(
    [string]$SiteDir = "$(Split-Path -Parent $PSCommandPath)",
    [string]$ReportFile = "$(Split-Path -Parent $PSCommandPath)\reports\fixed_links_report.csv"
)

# Ensure report directory exists
$reportDir = Split-Path $ReportFile
if (!(Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

$baseUrl = "http://127.0.0.1:8000/"

$htmlFiles = Get-ChildItem -Path $SiteDir -Recurse -Filter *.html
$allResults = @()

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    $matches = [regex]::Matches($content, "(?i)(href|src)\s*=\s*['""]([^'""]+)['""]")
    foreach ($m in $matches) {
        $link = $m.Groups[2].Value
        if ($link -notmatch "^https?://") {
            $link = $baseUrl + $link.TrimStart("/")
        }
        try {
            $r = Invoke-WebRequest -Uri $link -UseBasicParsing -TimeoutSec 10
            $status = $r.StatusCode
        } catch {
            $status = 404
        }
        $allResults += [PSCustomObject]@{
            File   = $file.FullName
            URL    = $link
            Status = $status
        }
    }
}

$allResults | Export-Csv $ReportFile -NoTypeInformation -Encoding UTF8
Write-Output "[DONE] Tarama ve rapor oluşturuldu: $ReportFile"
