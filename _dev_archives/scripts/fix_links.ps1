param(
    [string]$SiteDir = "C:\Users\tourg\Desktop\SANTIS_SITE",
    [string]$ReportFile = "C:\Users\tourg\Desktop\SANTIS_SITE\reports\fixed_links_report.csv",
    [switch]$ApplyFixes
)

# ===============================
# SANTIS_SITE Broken Link Fixer
# ===============================

if (!(Test-Path $SiteDir)) {
    Write-Error "SiteDir not found: $SiteDir"
    exit 1
}

if (!(Test-Path (Split-Path $ReportFile))) {
    New-Item -ItemType Directory -Path (Split-Path $ReportFile) -Force | Out-Null
}

$allResults = @()

function Is-ExternalLink($link) {
    if ([string]::IsNullOrWhiteSpace($link)) { return $true }
    $l = $link.Trim().ToLowerInvariant()
    return ($l -match '^(https?:|mailto:|tel:|javascript:|#|data:)')
}

function Normalize-Slashes($path) {
    return ($path -replace "\\", "/")
}

function Try-Fix-DuplicateLocale($link, $siteDir) {
    $clean = Normalize-Slashes $link
    $locales = @('tr','en','fr','de','ru','sr')
    foreach ($loc in $locales) {
        $pattern = "/$loc/"
        $lastIdx = $clean.LastIndexOf($pattern, [System.StringComparison]::OrdinalIgnoreCase)
        if ($lastIdx -gt 0) {
            $candidate = $clean.Substring($lastIdx)
            $fsPath = Join-Path $siteDir ($candidate.TrimStart('/'))
            if (Test-Path $fsPath) {
                return $candidate
            }
        }
    }
    return $null
}

$htmlFiles = Get-ChildItem -Path $SiteDir -Recurse -Filter *.html

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    $updated = $false

    # Match href/src attributes
    $matches = [regex]::Matches($content, '(?i)(href|src)\s*=\s*[\"\']([^\"\']+)[\"\']')

    foreach ($m in $matches) {
        $attr = $m.Groups[1].Value
        $link = $m.Groups[2].Value

        if (Is-ExternalLink $link) {
            continue
        }

        $original = $link
        $fixed = $link
        $status = 404
        $notes = ""

        $linkNorm = Normalize-Slashes $link
        $fileDir = Split-Path -Path $file.FullName -Parent

        # Candidate path: relative to file
        $candidateRel = $linkNorm
        $fsRel = Join-Path $fileDir ($candidateRel.TrimStart('/'))

        # Candidate path: relative to site root
        $fsRoot = Join-Path $SiteDir ($linkNorm.TrimStart('/'))

        if (Test-Path $fsRel) {
            $status = 200
        } elseif (Test-Path $fsRoot) {
            $status = 200
            if (-not $linkNorm.StartsWith('/')) {
                $fixed = "/" + $linkNorm.TrimStart('/')
                $notes = "Root-normalized"
            }
        } else {
            # Try locale dedupe fix
            $dedup = Try-Fix-DuplicateLocale $linkNorm $SiteDir
            if ($dedup) {
                $status = 200
                $fixed = $dedup
                $notes = "Locale-dedup"
            }
        }

        if ($fixed -ne $original -and $ApplyFixes) {
            $escapedOriginal = [regex]::Escape($original)
            $content = [regex]::Replace($content, "(?i)($attr\s*=\s*[\"\'])$escapedOriginal([\"\'])", "`$1$fixed`$2", 1)
            $updated = $true
        }

        $allResults += [PSCustomObject]@{
            File = $file.FullName
            Tag = $attr
            OriginalLink = $original
            FixedLink = $fixed
            Status = $status
            Notes = $notes
        }
    }

    if ($updated) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
    }
}

$allResults | Export-Csv $ReportFile -NoTypeInformation -Encoding UTF8
Write-Output "[DONE] Report: $ReportFile"



