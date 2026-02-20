"""
DEPLOY GATE v2.0 — Pre-Deploy Automation Pipeline
Enterprise-grade quality pipeline with notifications.

Pipeline:
    1. Hreflang Cluster Sync   → available-routes.json → static HTML
    2. Sitemap Generation       → available-routes.json + filesystem → sitemap.xml
    3. Sitemap XML Validation   → checks well-formedness + URL count
    4. Flight Check             → 5-module quality gate
    5. GO/NO-GO Decision        → Critical > 0 = ABORT
    6. Post-Deploy Actions      → Search Console ping + webhook notification

Usage:
    python deploy_gate.py              # Full pipeline
    python deploy_gate.py --skip-sync  # Skip hreflang+sitemap, only flight check
    python deploy_gate.py --dry        # Dry run (no file changes)
"""

import sys
import os
import time
import datetime
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

BASE_DIR = Path(__file__).resolve().parent

# ──────────────────────────────────────────────────────────────
# NOTIFICATION CONFIG (set via environment or .env)
# ──────────────────────────────────────────────────────────────

DOMAIN = "https://santis-club.com"
SITEMAP_URL = f"{DOMAIN}/sitemap.xml"

# Slack webhook (set SLACK_WEBHOOK_URL env var to enable)
SLACK_WEBHOOK = os.environ.get("SLACK_WEBHOOK_URL", "")

# Search Console ping (standard protocol)
SC_PING_URLS = [
    f"https://www.google.com/ping?sitemap={SITEMAP_URL}",
    f"https://www.bing.com/ping?sitemap={SITEMAP_URL}",
]


# ──────────────────────────────────────────────────────────────
# STEP RUNNER
# ──────────────────────────────────────────────────────────────

def run_step(name, func, *args, **kwargs):
    """Run a pipeline step with timing and error handling."""
    print(f"\n{'─' * 60}")
    print(f"▶ {name}")
    print(f"{'─' * 60}")
    start = time.time()
    try:
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f"✅ {name} — {elapsed:.1f}s")
        return {"status": "ok", "result": result, "time": elapsed}
    except Exception as e:
        elapsed = time.time() - start
        print(f"❌ {name} — FAILED: {e}")
        return {"status": "error", "error": str(e), "time": elapsed}


# ──────────────────────────────────────────────────────────────
# SITEMAP XML VALIDATOR
# ──────────────────────────────────────────────────────────────

def validate_sitemap():
    """Validate sitemap.xml is well-formed and has reasonable content."""
    sitemap_path = BASE_DIR / "sitemap.xml"

    if not sitemap_path.exists():
        return {"valid": False, "error": "sitemap.xml not found", "url_count": 0}

    try:
        tree = ET.parse(str(sitemap_path))
        root = tree.getroot()

        # Count URLs
        ns = {"ns": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        urls = root.findall(".//ns:url", ns)
        url_count = len(urls)

        # Check for localhost
        has_localhost = False
        for url in urls[:5]:
            loc = url.find("ns:loc", ns)
            if loc is not None and "localhost" in (loc.text or ""):
                has_localhost = True
                break

        # Validate hreflang presence
        xhtml_ns = {"xhtml": "http://www.w3.org/1999/xhtml"}
        hreflang_count = 0
        for url in urls[:10]:
            links = url.findall("xhtml:link", xhtml_ns)
            hreflang_count += len(links)

        issues = []
        if url_count < 10:
            issues.append(f"Only {url_count} URLs (expected 300+)")
        if has_localhost:
            issues.append("Contains localhost URLs!")
        if hreflang_count == 0:
            issues.append("No hreflang xhtml:link elements found")

        result = {
            "valid": len(issues) == 0,
            "url_count": url_count,
            "hreflang_sample": hreflang_count,
            "issues": issues
        }

        print(f"  📊 URLs: {url_count} | Hreflang links (sample): {hreflang_count}")
        if issues:
            for i in issues:
                print(f"  ⚠️ {i}")
        else:
            print(f"  ✅ Well-formed, {url_count} URLs, hreflang present")

        return result

    except ET.ParseError as e:
        return {"valid": False, "error": f"XML parse error: {e}", "url_count": 0}


# ──────────────────────────────────────────────────────────────
# SEARCH ENGINE PING
# ──────────────────────────────────────────────────────────────

def ping_search_engines():
    """Ping Google/Bing with sitemap URL after successful deploy."""
    results = []
    for ping_url in SC_PING_URLS:
        engine = "Google" if "google" in ping_url else "Bing"
        try:
            req = Request(ping_url, headers={"User-Agent": "Santis-Deploy-Gate/2.0"})
            resp = urlopen(req, timeout=10)
            status = resp.status
            results.append({"engine": engine, "status": status, "ok": status == 200})
            print(f"  📡 {engine}: HTTP {status} {'✅' if status == 200 else '⚠️'}")
        except URLError as e:
            results.append({"engine": engine, "status": 0, "ok": False, "error": str(e)})
            print(f"  📡 {engine}: FAILED — {e}")
        except Exception as e:
            results.append({"engine": engine, "status": 0, "ok": False, "error": str(e)})
            print(f"  📡 {engine}: ERROR — {e}")
    return results


# ──────────────────────────────────────────────────────────────
# SLACK WEBHOOK NOTIFICATION
# ──────────────────────────────────────────────────────────────

def send_slack_notification(verdict, score, critical, warning, pages, total_time):
    """Send deploy verdict to Slack webhook."""
    if not SLACK_WEBHOOK:
        print("  ℹ️ Slack webhook not configured (set SLACK_WEBHOOK_URL env var)")
        return None

    emoji = "✅" if verdict == "GO" else "❌"
    color = "#36a64f" if verdict == "GO" else "#cc0000"

    payload = {
        "attachments": [{
            "color": color,
            "title": f"{emoji} Deploy Gate: {verdict}",
            "fields": [
                {"title": "Score", "value": str(score), "short": True},
                {"title": "Pages", "value": str(pages), "short": True},
                {"title": "Critical", "value": str(critical), "short": True},
                {"title": "Warning", "value": str(warning), "short": True},
                {"title": "Time", "value": f"{total_time:.1f}s", "short": True},
            ],
            "footer": f"Santis Deploy Gate v2.0 • {datetime.datetime.now().strftime('%H:%M:%S')}",
        }]
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = Request(SLACK_WEBHOOK, data=data,
                      headers={"Content-Type": "application/json"})
        resp = urlopen(req, timeout=10)
        print(f"  📨 Slack notification sent: HTTP {resp.status}")
        return True
    except Exception as e:
        print(f"  ⚠️ Slack notification failed: {e}")
        return False


# ──────────────────────────────────────────────────────────────
# MAIN PIPELINE
# ──────────────────────────────────────────────────────────────

def run_pipeline(skip_sync=False, dry_run=False):
    """Execute the full deploy gate pipeline."""

    print("=" * 60)
    print("  🚀 SANTIS DEPLOY GATE v2.0")
    print(f"  ⏰ {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  📂 {BASE_DIR}")
    print(f"  Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print("=" * 60)

    results = {}
    pipeline_start = time.time()

    # ── STEP 1: Hreflang Cluster Sync ──
    if not skip_sync:
        from hreflang_sync import run_sync
        results["hreflang_sync"] = run_step(
            "Step 1: Hreflang Cluster Sync",
            run_sync,
            dry_run=dry_run
        )
    else:
        print("\n⏭ Step 1: Hreflang Sync — SKIPPED")

    # ── STEP 2: Sitemap Generation ──
    if not skip_sync:
        from sitemap_sync import generate_sitemap
        results["sitemap_sync"] = run_step(
            "Step 2: Sitemap Generation",
            generate_sitemap,
            dry_run=dry_run
        )
    else:
        print("⏭ Step 2: Sitemap — SKIPPED")

    # ── STEP 3: Sitemap XML Validation ──
    results["sitemap_validation"] = run_step(
        "Step 3: Sitemap XML Validation",
        validate_sitemap
    )

    # ── STEP 4: SEO Sweep (Schema + OG + Orphan Fix) ──
    if not skip_sync:
        def seo_sweep():
            """Run schema sync, OG meta fix, and orphan remediation."""
            sweep_stats = {}

            # 4a. Schema sync
            try:
                from schema_sync import run_schema_sync
                sweep_stats["schema"] = run_schema_sync(dry_run=dry_run)
            except Exception as e:
                print(f"  ⚠️ Schema sync skipped: {e}")
                sweep_stats["schema"] = {"error": str(e)}

            # 4b. OG Meta fix (only live)
            if not dry_run:
                try:
                    import subprocess
                    result = subprocess.run(
                        [sys.executable, "tools/og_meta_fix.py"],
                        cwd=str(BASE_DIR),
                        capture_output=True, text=True, timeout=30
                    )
                    sweep_stats["og_meta"] = "ok" if result.returncode == 0 else result.stderr[:200]
                    if result.stdout:
                        for line in result.stdout.strip().split("\n")[-5:]:
                            print(f"  {line}")
                except Exception as e:
                    sweep_stats["og_meta"] = {"error": str(e)}
            else:
                sweep_stats["og_meta"] = "skipped (dry run)"

            # 4c. Orphan fix
            try:
                from orphan_fix import run_orphan_fix
                sweep_stats["orphan"] = run_orphan_fix(dry_run=dry_run)
            except Exception as e:
                print(f"  ⚠️ Orphan fix skipped: {e}")
                sweep_stats["orphan"] = {"error": str(e)}

            return sweep_stats

        results["seo_sweep"] = run_step(
            "Step 4: SEO Sweep (Schema + OG + Orphan)",
            seo_sweep
        )
    else:
        print("⏭ Step 4: SEO Sweep — SKIPPED")

    # ── STEP 5: Flight Check ──
    from flight_check import run_flight_check
    fc_result = run_step(
        "Step 5: Flight Check (Quality Gate)",
        run_flight_check,
        str(BASE_DIR)
    )
    results["flight_check"] = fc_result

    # ── STEP 6: Verdict ──
    total_time = time.time() - pipeline_start

    print(f"\n{'=' * 60}")
    print(f"  📊 DEPLOY GATE RESULTS")
    print(f"{'=' * 60}")

    verdict = "ERROR"
    score = 0
    critical = "?"
    warning = "?"
    pages = "?"

    if fc_result["status"] == "ok":
        fc = fc_result["result"]
        verdict = fc.get("verdict", "ERROR")
        score = fc.get("score", 0)
        critical = fc.get("summary", {}).get("critical", "?")
        warning = fc.get("summary", {}).get("warning", "?")
        pages = fc.get("total_pages", "?")

        print(f"  Pages scanned:  {pages}")
        print(f"  Critical:       {critical}")
        print(f"  Warning:        {warning}")
        print(f"  Score:          {score}")
        print(f"  Pipeline time:  {total_time:.1f}s")
        print()

        if verdict == "GO":
            print("  ╔══════════════════════════════════════╗")
            print("  ║       ✅ GO — SAFE TO DEPLOY         ║")
            print("  ╚══════════════════════════════════════╝")
        else:
            print("  ╔══════════════════════════════════════╗")
            print("  ║     ❌ NO-GO — DEPLOYMENT BLOCKED    ║")
            print("  ╚══════════════════════════════════════╝")
            print()
            print(f"  Fix {critical} critical issues before deploying.")

        # Module status
        modules = fc.get("modules", {})
        print("\n  Module Status:")
        for mod_name, mod_data in modules.items():
            status = mod_data.get("status", "?")
            count = mod_data.get("count", 0)
            icon = "✅" if status == "PASS" else ("⚠️" if status == "WARN" else "❌")
            print(f"    {icon} {mod_name}: {status} ({count} issues)")

    else:
        print(f"  ❌ Flight Check FAILED: {fc_result.get('error')}")

    # ── STEP 7: Post-Deploy Actions ──
    if verdict == "GO" and not dry_run:
        print(f"\n{'─' * 60}")
        print("▶ Step 7: Post-Deploy Actions")
        print(f"{'─' * 60}")

        # Ping search engines
        print("\n  🔔 Search Engine Ping:")
        ping_results = ping_search_engines()

        # Slack notification
        print("\n  📨 Notifications:")
        send_slack_notification(verdict, score, critical, warning, pages, total_time)
    elif dry_run:
        print("\n⏭ Step 7: Post-Deploy Actions — SKIPPED (dry run)")
    else:
        # Send failure notification
        print(f"\n{'─' * 60}")
        print("▶ Step 7: Failure Notification")
        print(f"{'─' * 60}")
        send_slack_notification(verdict, score, critical, warning, pages, total_time)

    print(f"\n{'=' * 60}\n")

    # Save pipeline report
    report = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "verdict": verdict,
        "score": score,
        "total_time_seconds": round(total_time, 1),
        "dry_run": dry_run,
        "pages": pages,
        "critical": critical,
        "warning": warning,
        "steps": {k: {"status": v["status"], "time": round(v["time"], 1)}
                  for k, v in results.items()}
    }

    report_path = BASE_DIR / "reports" / "deploy_gate_last.json"
    report_path.parent.mkdir(exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    return verdict


# ──────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    skip = "--skip-sync" in sys.argv
    dry = "--dry" in sys.argv
    verdict = run_pipeline(skip_sync=skip, dry_run=dry)
    sys.exit(0 if verdict == "GO" else 1)
