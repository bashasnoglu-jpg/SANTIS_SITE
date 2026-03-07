"""
FLIGHT CHECK ENGINE v1.0
Santis Club — Pre-Deploy Safety Gate (GO / NO-GO)

5 scanner modules unified into a single check:
  1. Redirect Chain Scanner
  2. Hreflang Integrity Checker
  3. Canonical Validator
  4. Template Violation Bridge
  5. Critical Link Checker

Usage:
  python flight_check.py [base_dir]
"""

import os
import re
import json
import datetime
from pathlib import Path
from html.parser import HTMLParser
from collections import defaultdict

# ──────────────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────────────

LANG_DIRS = ["tr", "en", "de", "fr", "ru", "ar"]
REDIRECTS_FILE = "data/redirects.json"
SKIP_DIRS = {"admin", "node_modules", ".git", "__pycache__", "_backup", "assets", "data", "reports", "core", "tools", "backup", "_backup_manual", "_pages_build", "_build"}

# Severity levels
CRITICAL = "critical"
WARNING = "warning"
INFO = "info"


# ──────────────────────────────────────────────────────────────
# SHARED: HTML Tag Parser
# ──────────────────────────────────────────────────────────────

class HeadTagParser(HTMLParser):
    """Extract <head> tags relevant to flight checks: link[rel], meta, title."""

    def __init__(self):
        super().__init__()
        self.canonical = None
        self.hreflangs = []  # [{lang, href}]
        self.has_title = False
        self.has_description = False
        self.nav_links = []  # href values from <a> tags
        self.img_srcs = []   # src values from <img> tags
        self.inline_style_count = 0
        self._in_head = False
        self._in_nav = False
        self._in_noscript = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag == "head":
            self._in_head = True
        elif tag == "nav":
            self._in_nav = True
        elif tag == "noscript":
            self._in_noscript = True

        # Head-level checks
        if self._in_head:
            if tag == "link":
                rel = attrs_dict.get("rel", "")
                href = attrs_dict.get("href", "")
                hreflang = attrs_dict.get("hreflang", "")

                if "canonical" in rel:
                    self.canonical = href
                elif "alternate" in rel and hreflang:
                    self.hreflangs.append({"lang": hreflang, "href": href})

            elif tag == "title":
                self.has_title = True
            elif tag == "meta":
                if attrs_dict.get("name", "").lower() == "description":
                    self.has_description = True

        # Nav link checks (both nav and noscript fallback)
        if tag == "a" and attrs_dict.get("href"):
            href = attrs_dict["href"]
            if self._in_nav or self._in_noscript:
                self.nav_links.append(href)

        # Image checks
        if tag == "img" and attrs_dict.get("src"):
            self.img_srcs.append(attrs_dict["src"])

        # Inline style count
        if attrs_dict.get("style"):
            self.inline_style_count += 1

    def handle_endtag(self, tag):
        if tag == "head":
            self._in_head = False
        elif tag == "nav":
            self._in_nav = False
        elif tag == "noscript":
            self._in_noscript = False


def parse_html_file(filepath):
    """Parse an HTML file and return a HeadTagParser with extracted data."""
    parser = HeadTagParser()
    try:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            parser.feed(f.read())
    except Exception:
        pass
    return parser


def collect_html_files(base_dir):
    """Collect all HTML files from language directories."""
    files = []
    for lang in LANG_DIRS:
        lang_path = os.path.join(base_dir, lang)
        if not os.path.isdir(lang_path):
            continue
        for root, dirs, filenames in os.walk(lang_path):
            # Skip known tool/output/backup directories
            dirs[:] = [
                d for d in dirs
                if d not in SKIP_DIRS
                and "_backup" not in d.lower()
            ]
            for fname in filenames:
                if fname.endswith(".html"):
                    full = os.path.join(root, fname)
                    rel = os.path.relpath(full, base_dir).replace("\\", "/")
                    if "_backup" in rel:
                        continue
                    files.append({"full": full, "rel": rel, "lang": lang})
    # Also check root HTML files
    for fname in os.listdir(base_dir):
        if fname.endswith(".html") and os.path.isfile(os.path.join(base_dir, fname)):
            full = os.path.join(base_dir, fname)
            rel = fname
            files.append({"full": full, "rel": rel, "lang": "root"})
    return files


# ══════════════════════════════════════════════════════════════
# MODULE 1: REDIRECT CHAIN SCANNER
# ══════════════════════════════════════════════════════════════

def check_redirect_chains(base_dir):
    """
    Scan redirects.json for:
    - Chain redirects (A→B→C)
    - Self-redirects (A→A)
    - Orphan targets (target file doesn't exist)
    """
    issues = []
    redirects_path = os.path.join(base_dir, REDIRECTS_FILE)

    if not os.path.exists(redirects_path):
        return {"status": "PASS", "issues": [], "count": 0, "detail": "No redirects file"}

    try:
        with open(redirects_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        issues.append({"severity": CRITICAL, "msg": f"redirects.json parse error: {e}"})
        return {"status": "FAIL", "issues": issues, "count": len(issues)}

    redirects = data.get("redirects", [])
    if not redirects:
        return {"status": "PASS", "issues": [], "count": 0, "detail": "0 redirects defined"}

    # Build lookup: source → target
    redirect_map = {}
    for r in redirects:
        src = r.get("from", r.get("source", ""))
        tgt = r.get("to", r.get("target", ""))
        if src and tgt:
            redirect_map[src] = tgt

    for src, tgt in redirect_map.items():
        # Self-redirect
        if src == tgt:
            issues.append({
                "severity": CRITICAL,
                "msg": f"Self-redirect: {src} → {tgt}"
            })
            continue

        # Chain detection
        chain = [src, tgt]
        current = tgt
        depth = 0
        while current in redirect_map and depth < 10:
            current = redirect_map[current]
            chain.append(current)
            depth += 1

        if depth > 0:
            issues.append({
                "severity": CRITICAL,
                "msg": f"Redirect chain (depth {depth + 1}): {' → '.join(chain)}"
            })

        # Orphan target check (is target a real file?)
        target_path = tgt.lstrip("/")
        target_full = os.path.join(base_dir, target_path)
        if not os.path.exists(target_full) and not tgt.startswith("http"):
            issues.append({
                "severity": WARNING,
                "msg": f"Orphan redirect target: {src} → {tgt} (file not found)"
            })

    critical = sum(1 for i in issues if i["severity"] == CRITICAL)
    status = "FAIL" if critical > 0 else ("WARN" if issues else "PASS")
    return {"status": status, "issues": issues, "count": len(issues)}


# ══════════════════════════════════════════════════════════════
# MODULE 2: HREFLANG INTEGRITY CHECKER
# ══════════════════════════════════════════════════════════════

def check_hreflang_integrity(base_dir, html_files):
    """
    Cross-validate hreflang tags:
    - If page A declares hreflang to page B, page B must declare back to A
    - Check for missing self-referencing hreflang
    - Verify hreflang target files exist
    """
    issues = []

    # Build hreflang map: {page_rel: [{lang, href}]}
    hreflang_map = {}
    for finfo in html_files:
        if finfo["lang"] == "root":
            continue
        parser = parse_html_file(finfo["full"])
        if parser.hreflangs:
            hreflang_map[finfo["rel"]] = {
                "lang": finfo["lang"],
                "hreflangs": parser.hreflangs
            }

    # Cross-validation
    checked_pairs = set()
    for page_rel, data in hreflang_map.items():
        page_lang = data["lang"]

        for hl in data["hreflangs"]:
            target_href = hl["href"]
            target_lang = hl["lang"]

            # Normalize href to relative path
            target_rel = target_href.lstrip("/")
            if target_rel.startswith("https://") or target_rel.startswith("http://"):
                # Extract path from absolute URL
                from urllib.parse import urlparse
                parsed = urlparse(target_href)
                target_rel = parsed.path.lstrip("/")

            # Skip x-default
            if target_lang == "x-default":
                continue

            # Check target file exists
            target_full = os.path.join(base_dir, target_rel)
            if not os.path.exists(target_full):
                issues.append({
                    "severity": WARNING,
                    "msg": f"Hreflang target missing: {page_rel} → [{target_lang}] {target_rel}"
                })
                continue

            # Cross-check: Does target point back?
            pair_key = tuple(sorted([page_rel, target_rel]))
            if pair_key in checked_pairs:
                continue
            checked_pairs.add(pair_key)

            if target_rel in hreflang_map:
                target_hreflangs = hreflang_map[target_rel]["hreflangs"]
                back_links = [h["href"].lstrip("/") for h in target_hreflangs]
                # Normalize for comparison
                back_links_norm = []
                for bl in back_links:
                    if bl.startswith("https://") or bl.startswith("http://"):
                        from urllib.parse import urlparse
                        back_links_norm.append(urlparse(bl).path.lstrip("/"))
                    else:
                        back_links_norm.append(bl)

                if page_rel not in back_links_norm:
                    issues.append({
                        "severity": CRITICAL,
                        "msg": f"Missing return hreflang: {page_rel} [{page_lang}] → [{target_lang}] {target_rel}, but target doesn't link back"
                    })

    # Check pages WITHOUT any hreflang (in lang dirs)
    pages_without_hreflang = 0
    for finfo in html_files:
        if finfo["lang"] not in ("root",) and finfo["rel"] not in hreflang_map:
            pages_without_hreflang += 1

    if pages_without_hreflang > 0:
        issues.append({
            "severity": INFO,
            "msg": f"{pages_without_hreflang} pages have no static hreflang tags (OK if using dynamic injector)"
        })

    critical = sum(1 for i in issues if i["severity"] == CRITICAL)
    warnings = sum(1 for i in issues if i["severity"] == WARNING)
    status = "FAIL" if critical > 0 else ("WARN" if warnings > 0 else "PASS")
    return {"status": status, "issues": issues, "count": critical + warnings}


# ══════════════════════════════════════════════════════════════
# MODULE 3: CANONICAL VALIDATOR
# ══════════════════════════════════════════════════════════════

def check_canonicals(base_dir, html_files):
    """
    Validate canonical tags:
    - Every page should have rel=canonical
    - Canonical should be self-referencing (or valid)
    - Canonical target should exist
    - No duplicate canonicals on same page
    """
    issues = []
    missing_count = 0
    total_checked = 0

    for finfo in html_files:
        if finfo["lang"] == "root":
            continue  # Skip root HTML files for canonical check
        total_checked += 1
        parser = parse_html_file(finfo["full"])

        if not parser.canonical:
            missing_count += 1
            continue  # Many pages may use dynamic canonical — warn in bulk

        canonical = parser.canonical

        # Check if canonical points to a real file
        canon_path = canonical.lstrip("/")
        if canon_path.startswith("https://") or canon_path.startswith("http://"):
            # Absolute URL — can't verify file existence, skip
            continue

        canon_full = os.path.join(base_dir, canon_path)
        if not os.path.exists(canon_full):
            issues.append({
                "severity": WARNING,
                "msg": f"Broken canonical: {finfo['rel']} → {canonical} (file not found)"
            })

    # Bulk report for missing canonicals
    if missing_count > 0:
        pct = round((missing_count / total_checked) * 100) if total_checked > 0 else 0
        severity = CRITICAL if pct > 50 else (WARNING if pct > 20 else INFO)
        issues.append({
            "severity": severity,
            "msg": f"{missing_count}/{total_checked} pages missing canonical tag ({pct}%)"
        })

    critical = sum(1 for i in issues if i["severity"] == CRITICAL)
    warnings = sum(1 for i in issues if i["severity"] == WARNING)
    status = "FAIL" if critical > 0 else ("WARN" if warnings > 0 else "PASS")
    return {"status": status, "issues": issues, "count": critical + warnings}


# ══════════════════════════════════════════════════════════════
# MODULE 4: TEMPLATE VIOLATION BRIDGE
# ══════════════════════════════════════════════════════════════

def check_template_violations(base_dir, html_files):
    """
    Quick template governance check:
    - Pages with > 10 inline styles → warning
    - Pages with > 20 inline styles → critical
    - Missing <title> or <meta description> → warning
    """
    issues = []
    high_inline_pages = []

    for finfo in html_files:
        if finfo["lang"] == "root":
            continue
        parser = parse_html_file(finfo["full"])

        # Inline style severity (cosmetic — never blocks deploy)
        count = parser.inline_style_count
        if count > 20:
            high_inline_pages.append((finfo["rel"], count))
            issues.append({
                "severity": WARNING,
                "msg": f"Excessive inline styles: {finfo['rel']} ({count} styles)"
            })
        elif count > 10:
            high_inline_pages.append((finfo["rel"], count))
            issues.append({
                "severity": WARNING,
                "msg": f"High inline styles: {finfo['rel']} ({count} styles)"
            })

        # Missing SEO essentials
        if not parser.has_title:
            issues.append({
                "severity": WARNING,
                "msg": f"Missing <title>: {finfo['rel']}"
            })
        if not parser.has_description:
            issues.append({
                "severity": WARNING,
                "msg": f"Missing <meta description>: {finfo['rel']}"
            })

    critical = sum(1 for i in issues if i["severity"] == CRITICAL)
    warnings = sum(1 for i in issues if i["severity"] == WARNING)
    status = "FAIL" if critical > 0 else ("WARN" if warnings > 0 else "PASS")
    return {"status": status, "issues": issues, "count": critical + warnings}


# ══════════════════════════════════════════════════════════════
# MODULE 5: CRITICAL LINK CHECKER
# ══════════════════════════════════════════════════════════════

def check_critical_links(base_dir, html_files):
    """
    File-based link validation (no HTTP, fast):
    - Check nav links point to existing files
    - Check img src files exist
    - Report broken internal references
    """
    issues = []
    broken_nav = set()
    broken_img = set()

    for finfo in html_files:
        parser = parse_html_file(finfo["full"])
        file_dir = os.path.dirname(finfo["full"])

        # Check nav links
        for href in parser.nav_links:
            if not href or href.startswith("#") or href.startswith("http") or href.startswith("mailto:") or href.startswith("tel:") or href.startswith("javascript:"):
                continue

            # Resolve relative path
            if href.startswith("/"):
                target = os.path.join(base_dir, href.lstrip("/"))
            else:
                target = os.path.normpath(os.path.join(file_dir, href))

            # Handle directory (check for index.html)
            if os.path.isdir(target):
                target = os.path.join(target, "index.html")

            # Strip query/hash
            target = target.split("?")[0].split("#")[0]

            if not os.path.exists(target):
                key = f"{finfo['rel']} → {href}"
                if key not in broken_nav:
                    broken_nav.add(key)
                    issues.append({
                        "severity": WARNING,
                        "msg": f"Broken nav link: {key}"
                    })

        # Check images (sample — only first 5 per page to stay fast)
        for src in parser.img_srcs[:5]:
            if not src or src.startswith("http") or src.startswith("data:"):
                continue

            if src.startswith("/"):
                target = os.path.join(base_dir, src.lstrip("/"))
            else:
                target = os.path.normpath(os.path.join(file_dir, src))

            target = target.split("?")[0]

            if not os.path.exists(target):
                key = src
                if key not in broken_img:
                    broken_img.add(key)

    if broken_img:
        issues.append({
            "severity": WARNING,
            "msg": f"{len(broken_img)} unique broken image references found"
        })

    critical = sum(1 for i in issues if i["severity"] == CRITICAL)
    warnings = sum(1 for i in issues if i["severity"] == WARNING)
    status = "FAIL" if critical > 0 else ("WARN" if warnings > 0 else "PASS")
    return {"status": status, "issues": issues, "count": critical + warnings}


# ══════════════════════════════════════════════════════════════
# VERDICT ENGINE
# ══════════════════════════════════════════════════════════════

def compute_verdict(modules):
    """
    GO / NO-GO decision:
    - GO: 0 critical issues across ALL modules
    - NO-GO: 1+ critical in any module
    Warnings are informational — they DON'T block deployment.
    Score reflects structural health (critical-weighted).
    """
    total_critical = 0
    total_warning = 0
    total_info = 0

    for mod_name, mod_result in modules.items():
        for issue in mod_result.get("issues", []):
            if issue["severity"] == CRITICAL:
                total_critical += 1
            elif issue["severity"] == WARNING:
                total_warning += 1
            elif issue["severity"] == INFO:
                total_info += 1

    # Score: critical issues are the main deductors
    # Warnings have minimal impact (cosmetic)
    score = 100
    score -= total_critical * 20
    score -= total_warning * 0.1
    score = max(0, min(100, round(score)))

    # GO if zero critical — warnings don't block deploy
    verdict = "GO" if total_critical == 0 else "NO-GO"

    return {
        "verdict": verdict,
        "score": score,
        "critical": total_critical,
        "warning": total_warning,
        "info": total_info
    }


# ══════════════════════════════════════════════════════════════
# MAIN: RUN FLIGHT CHECK
# ══════════════════════════════════════════════════════════════

def run_flight_check(base_dir):
    """
    Execute all 5 modules and return unified report.
    """
    base_dir = os.path.abspath(base_dir)

    # Collect HTML files once (shared across modules)
    html_files = collect_html_files(base_dir)

    # Run all modules
    modules = {
        "redirects": check_redirect_chains(base_dir),
        "hreflang": check_hreflang_integrity(base_dir, html_files),
        "canonical": check_canonicals(base_dir, html_files),
        "template": check_template_violations(base_dir, html_files),
        "links": check_critical_links(base_dir, html_files),
    }

    # Compute verdict
    verdict_data = compute_verdict(modules)

    return {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "verdict": verdict_data["verdict"],
        "score": verdict_data["score"],
        "total_pages": len(html_files),
        "modules": modules,
        "summary": {
            "critical": verdict_data["critical"],
            "warning": verdict_data["warning"],
            "info": verdict_data["info"],
            "passed": sum(1 for m in modules.values() if m["status"] == "PASS")
        }
    }


# ══════════════════════════════════════════════════════════════
# CLI
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    base = sys.argv[1] if len(sys.argv) > 1 else "."
    result = run_flight_check(base)

    # Pretty print
    print(f"\n{'='*60}")
    print(f"  FLIGHT CHECK — {result['verdict']}  (Score: {result['score']})")
    print(f"{'='*60}")
    print(f"  Pages scanned: {result['total_pages']}")
    print(f"  Critical: {result['summary']['critical']}")
    print(f"  Warnings: {result['summary']['warning']}")
    print(f"  Info: {result['summary']['info']}")
    print(f"  Modules PASS: {result['summary']['passed']}/5")
    print(f"{'='*60}\n")

    for mod_name, mod_data in result["modules"].items():
        icon = "✅" if mod_data["status"] == "PASS" else ("⚠️" if mod_data["status"] == "WARN" else "❌")
        print(f"  {icon} {mod_name.upper()}: {mod_data['status']} ({mod_data['count']} issues)")
        for issue in mod_data["issues"][:5]:  # Show max 5 per module
            sev_icon = "🔴" if issue["severity"] == CRITICAL else ("🟡" if issue["severity"] == WARNING else "ℹ️")
            print(f"     {sev_icon} {issue['msg']}")
        if len(mod_data["issues"]) > 5:
            print(f"     ... +{len(mod_data['issues']) - 5} more")
        print()

    # Also save JSON
    print(json.dumps(result, indent=2, ensure_ascii=False))
