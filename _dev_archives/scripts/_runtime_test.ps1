$base = "http://localhost:8000"
$results = @()

# --- POST ENDPOINTS (unauth) ---
$postEndpoints = @(
    "/api/config",
    "/api/services",
    "/api/pages/test-slug",
    "/api/bridge/save",
    "/api/fix/ghost",
    "/api/fix/utf8",
    "/api/fix/link",
    "/api/fix/optimize",
    "/api/template-governance/fix-inline",
    "/api/vip/check-offer",
    "/api/admin/auto-fix",
    "/api/admin/social",
    "/fix/ghost",
    "/fix/utf8",
    "/admin/upload",
    "/admin/run-audit",
    "/admin/auto-fix",
    "/admin/generate-ai",
    "/admin/redirects/add",
    "/admin/sections/sync",
    "/admin/intelligence/scan",
    "/admin/apply-fix",
    "/admin/attack-simulator",
    "/admin/visual-audit",
    "/admin/performance-audit",
    "/admin/security-audit",
    "/admin/fix/ghost",
    "/admin/fix/utf8",
    "/admin/fix/optimize"
)

Write-Output "=== POST TESTS (unauth) ==="
foreach ($ep in $postEndpoints) {
    try {
        $r = Invoke-WebRequest -Uri "$base$ep" -Method POST -Body '{}' -ContentType 'application/json' -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Output "$ep POST -> $($r.StatusCode)"
    }
    catch {
        $code = $_.Exception.Response.StatusCode.value__
        if (-not $code) { $code = "TIMEOUT" }
        Write-Output "$ep POST -> $code"
    }
}

# --- DELETE ENDPOINTS (unauth) ---
Write-Output "`n=== DELETE TESTS (unauth) ==="
$deleteEndpoints = @(
    "/api/services/fake-slug-test"
)
foreach ($ep in $deleteEndpoints) {
    try {
        $r = Invoke-WebRequest -Uri "$base$ep" -Method DELETE -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Output "$ep DELETE -> $($r.StatusCode)"
    }
    catch {
        $code = $_.Exception.Response.StatusCode.value__
        if (-not $code) { $code = "TIMEOUT" }
        Write-Output "$ep DELETE -> $code"
    }
}

# --- GET ENDPOINTS (unauth) ---
Write-Output "`n=== GET TESTS (unauth) ==="
$getEndpoints = @(
    "/api/config",
    "/api/services",
    "/api/oracle/status",
    "/api/oracle/analytics",
    "/api/geo/location",
    "/api/admin/analytics/dashboard",
    "/api/admin/seo/score",
    "/api/admin/seo/suggestions",
    "/api/admin/tone-health",
    "/api/flight-check",
    "/api/health-score",
    "/api/health-history",
    "/api/audit-history",
    "/api/activity-log",
    "/api/system/health",
    "/api/template-governance",
    "/api/analytics/log-event",
    "/admin/deep-audit/start",
    "/admin/deep-audit/status",
    "/admin/deep-audit/report",
    "/admin/sentinel-status",
    "/admin/sentinel/fleet",
    "/admin/sentinel/incidents",
    "/admin/sentinel/capabilities",
    "/admin/sentinel/trends",
    "/admin/sentinel/suggestions",
    "/admin/audit-report",
    "/admin/audit-history",
    "/admin/download-report",
    "/admin/seo-quality",
    "/admin/seo-ai-suggestions",
    "/admin/ai-fix-suggestions",
    "/admin/redirects",
    "/admin/full-audit",
    "/admin/audit-stream",
    "/health"
)
foreach ($ep in $getEndpoints) {
    try {
        $r = Invoke-WebRequest -Uri "$base$ep" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Output "$ep GET -> $($r.StatusCode)"
    }
    catch {
        $code = $_.Exception.Response.StatusCode.value__
        if (-not $code) { $code = "TIMEOUT" }
        Write-Output "$ep GET -> $code"
    }
}

# --- DATA MOUNT (sensitive files) ---
Write-Output "`n=== DATA MOUNT TESTS ==="
$dataFiles = @(
    "/data/services.json",
    "/data/config.json",
    "/data/site_content.json"
)
foreach ($ep in $dataFiles) {
    try {
        $r = Invoke-WebRequest -Uri "$base$ep" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $size = $r.Content.Length
        Write-Output "$ep GET -> $($r.StatusCode) (size: $size bytes)"
    }
    catch {
        $code = $_.Exception.Response.StatusCode.value__
        if (-not $code) { $code = "TIMEOUT" }
        Write-Output "$ep GET -> $code"
    }
}

# --- SENSITIVE FILE TESTS ---
Write-Output "`n=== SENSITIVE FILE TESTS ==="
$sensitiveFiles = @(
    "/server.py",
    "/.env",
    "/admin_lock.py",
    "/security_shield.py",
    "/requirements.txt",
    "/build.mjs",
    "/package.json"
)
foreach ($ep in $sensitiveFiles) {
    try {
        $r = Invoke-WebRequest -Uri "$base$ep" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Output "$ep GET -> $($r.StatusCode) *** EXPOSED ***"
    }
    catch {
        $code = $_.Exception.Response.StatusCode.value__
        if (-not $code) { $code = "TIMEOUT" }
        Write-Output "$ep GET -> $code"
    }
}

# --- HEADER / CSP CHECK ---
Write-Output "`n=== SECURITY HEADERS ==="
try {
    $r = Invoke-WebRequest -Uri "$base/" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    $headers = @(
        "Content-Security-Policy",
        "X-Frame-Options",
        "X-Content-Type-Options",
        "Strict-Transport-Security",
        "Referrer-Policy",
        "Permissions-Policy"
    )
    foreach ($h in $headers) {
        $val = $r.Headers[$h]
        if ($val) {
            Write-Output "$h : $val"
        }
        else {
            Write-Output "$h : MISSING"
        }
    }
}
catch {
    Write-Output "Root page fetch failed: $($_.Exception.Message)"
}

# --- FRONTEND PHANTOM ENDPOINTS ---
Write-Output "`n=== PHANTOM ENDPOINT TESTS ==="
$phantomEndpoints = @(
    "/admin/last-audit-report",
    "/admin/run-link-audit",
    "/api/admin/seo/audit",
    "/api/admin/seo/ai-suggestions",
    "/admin/fix-link",
    "/admin/auto-security-patch"
)
foreach ($ep in $phantomEndpoints) {
    try {
        $r = Invoke-WebRequest -Uri "$base$ep" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Output "$ep GET -> $($r.StatusCode)"
    }
    catch {
        $code = $_.Exception.Response.StatusCode.value__
        if (-not $code) { $code = "TIMEOUT" }
        Write-Output "$ep GET -> $code"
    }
}
