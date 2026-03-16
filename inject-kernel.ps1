#!/usr/bin/env powershell
# ============================================================
#  SANTIS OS v3 - HTML Kernel Injector
#  3 Guardrail: type=module, smart path, idempotency
#  The Final Kill - 16 Mart 2026
# ============================================================
param(
    [string]$RootPath = "C:\Users\tourg\Desktop\SANTIS_SITE",
    [switch]$DryRun   = $false
)

function Log-Changed ($msg) { Write-Host "  UPDATED: $msg" -ForegroundColor Cyan }
function Log-Skip    ($msg) { Write-Host "  SKIP:    $msg" -ForegroundColor DarkGray }
function Log-Header  ($msg) { Write-Host "`n  $msg" -ForegroundColor Magenta }

# Exclude dirs
$EXCLUDE_PATTERN = "node_modules|_archive|_backup|quarantine|SantisV5|dist|venv|demo|Quarantine_zone|quarantine_zone"

$htmlFiles = Get-ChildItem -Path $RootPath -Recurse -Include "*.html" -File |
             Where-Object { $_.FullName -notmatch $EXCLUDE_PATTERN }

$stats = @{ Scanned=0; Updated=0; Skipped=0; NoAppJs=0 }

Log-Header "SANTIS OS v3 - HTML Kernel Injector"
Log-Header "Root: $RootPath | DryRun: $DryRun | Files: $($htmlFiles.Count)"

foreach ($file in $htmlFiles) {
    $stats.Scanned++
    $content = Get-Content $file.FullName -Raw -Encoding UTF8

    # GUARDRAIL 1: app.js referansi yoksa atla
    if ($content -notmatch 'app\.js') {
        $stats.NoAppJs++
        continue
    }

    # GUARDRAIL 2: Idempotency - santis-core.js zaten varsa atla
    if ($content -match 'santis-core\.js') {
        $stats.Skipped++
        Log-Skip "$($file.Name)"
        continue
    }

    # GUARDRAIL 3: Akilli yol cozumlemesi
    # app.js src'den prefix oku
    $m = [regex]::Match($content, 'src=["]([^"]*?app\.js[^"]*?)["]')
    if (-not $m.Success) {
        $m2 = [regex]::Match($content, "src=['']([^']*?app\.js[^']*?)['']")
        if ($m2.Success) {
            $appSrc = $m2.Groups[1].Value
        } else {
            $stats.NoAppJs++
            continue
        }
    } else {
        $appSrc = $m.Groups[1].Value
    }

    # Prefix: assets/js/app.js kismini core/santis-core.js ile degistir
    $coreSrc = $appSrc -replace "assets/js/app\.js", "assets/js/core/santis-core.js"

    # Kernel script etiketi
    $kernelTag = "<script type=`"module`" src=`"$coreSrc`"></script>"

    # app.js etiketinin oncesine kernel'i ekle
    $scriptPattern = '(<script[^>]*?app\.js[^>]*?>\s*</script>)'
    $newContent = [regex]::Replace(
        $content,
        $scriptPattern,
        "$kernelTag`n    `$1",
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    if ($DryRun) {
        Log-Changed "$($file.Name) --> $coreSrc [DRYRUN]"
    } else {
        [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
        Log-Changed "$($file.Name) --> $coreSrc"
    }
    $stats.Updated++
}

# Rapor
Log-Header "=========================================="
Log-Header "RAPOR"
Write-Host "  Taranan    : $($stats.Scanned)"
Write-Host "  Guncellenen: $($stats.Updated)" -ForegroundColor Cyan
Write-Host "  Atlandı    : $($stats.Skipped)  (santis-core.js zaten var)"
Write-Host "  app.js yok : $($stats.NoAppJs)"
if ($DryRun) {
    Write-Host "`n  [DRY RUN] Hicbir dosya degistirilmedi." -ForegroundColor Yellow
    Write-Host "  Gercek calistirma icin: .\inject-kernel.ps1" -ForegroundColor Yellow
} else {
    Write-Host "`n  Kernel enjeksiyonu tamamlandi!" -ForegroundColor Green
}
Log-Header "=========================================="
