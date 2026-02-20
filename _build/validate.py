"""
SANTIS OS — HTML Validation Script v1.0
Validates generated service detail pages for correctness.

Usage:
    python _build/validate.py                    # Validate all output
    python _build/validate.py --lang tr          # Validate Turkish only
    python _build/validate.py --strict           # Fail on warnings too
"""

import json
import os
import re
import sys
import argparse
from pathlib import Path

BUILD_DIR = Path(__file__).parent
OUTPUT_DIR = BUILD_DIR / "output"

LANGUAGES = ["tr", "en", "de", "fr", "ru"]
DOMAIN = "https://santis-club.com"

# ---------------------------------------------------------------------------
# VALIDATORS
# ---------------------------------------------------------------------------
def check_lang_attribute(html, expected_lang, filepath):
    """Check that html lang attribute matches expected language."""
    match = re.search(r'<html\s+lang="([^"]+)"', html)
    if not match:
        return {"level": "ERROR", "msg": f"Missing <html lang> attribute", "file": filepath}
    if match.group(1) != expected_lang:
        return {"level": "ERROR", "msg": f"Wrong lang: '{match.group(1)}' (expected: '{expected_lang}')", "file": filepath}
    return None


def check_title(html, filepath):
    """Check that page has a non-empty title."""
    match = re.search(r'<title>(.+?)</title>', html)
    if not match:
        return {"level": "ERROR", "msg": "Missing <title> tag", "file": filepath}
    if len(match.group(1).strip()) < 5:
        return {"level": "WARNING", "msg": f"Title too short: '{match.group(1)}'", "file": filepath}
    return None


def check_meta_description(html, filepath):
    """Check that page has a meta description."""
    match = re.search(r'<meta\s+content="([^"]*?)"\s+name="description"', html)
    if not match:
        match = re.search(r'<meta\s+name="description"\s+content="([^"]*?)"', html)
    if not match:
        return {"level": "ERROR", "msg": "Missing meta description", "file": filepath}
    if len(match.group(1).strip()) < 20:
        return {"level": "WARNING", "msg": f"Meta description too short ({len(match.group(1))} chars)", "file": filepath}
    return None


def check_canonical(html, expected_lang, filepath):
    """Check canonical URL format."""
    match = re.search(r'<link\s+href="([^"]+)"\s+rel="canonical"', html)
    if not match:
        return {"level": "ERROR", "msg": "Missing canonical URL", "file": filepath}
    url = match.group(1)
    if not url.startswith(DOMAIN):
        return {"level": "ERROR", "msg": f"Canonical URL not absolute: {url}", "file": filepath}
    if f"/{expected_lang}/" not in url:
        return {"level": "ERROR", "msg": f"Canonical URL wrong language: {url}", "file": filepath}
    return None


def check_hreflang(html, filepath):
    """Check hreflang tags: must have 5 languages + x-default."""
    hreflangs = re.findall(r'hreflang="([^"]+)"', html)
    required = set(LANGUAGES + ["x-default"])
    found = set(hreflangs)
    missing = required - found
    if missing:
        return {"level": "ERROR", "msg": f"Missing hreflang: {', '.join(sorted(missing))}", "file": filepath}
    return None


def check_schema_service(html, filepath):
    """Check that Schema.org Service or ItemList JSON-LD is present and parseable."""
    schemas = re.findall(r'<script type="application/ld\+json">\s*({.*?})\s*</script>', html, re.DOTALL)
    found_valid = False
    valid_types = {"Service", "ItemList"}
    for schema_str in schemas:
        try:
            data = json.loads(schema_str)
            schema_type = data.get("@type", "")
            if schema_type in valid_types:
                found_valid = True
                if schema_type == "Service" and not data.get("name"):
                    return {"level": "WARNING", "msg": "Schema Service missing 'name'", "file": filepath}
        except json.JSONDecodeError as e:
            return {"level": "ERROR", "msg": f"Schema JSON parse error: {e}", "file": filepath}

    if not found_valid:
        return {"level": "WARNING", "msg": "No Schema.org Service/ItemList found", "file": filepath}
    return None


def check_noscript_language(html, expected_lang, filepath):
    """Check that noscript nav links match the page language."""
    noscript_match = re.search(r'<noscript>(.*?)</noscript>', html, re.DOTALL)
    if not noscript_match:
        return {"level": "WARNING", "msg": "Missing noscript fallback", "file": filepath}

    noscript_content = noscript_match.group(1)
    links = re.findall(r'href="(/[^"]+)"', noscript_content)

    for link in links:
        if link == "/index.html":
            continue  # Root link is ok
        # Check that links contain the expected language prefix
        if not link.startswith(f"/{expected_lang}/"):
            return {"level": "ERROR",
                    "msg": f"Noscript nav link wrong language: '{link}' (expected /{expected_lang}/)",
                    "file": filepath}
    return None


def check_og_image(html, filepath):
    """Check OG image is an absolute URL."""
    match = re.search(r'property="og:image"\s*content="([^"]+)"', html)
    if not match:
        match = re.search(r'content="([^"]+)"\s*property="og:image"', html)
    if match:
        url = match.group(1)
        if not url.startswith("http"):
            return {"level": "WARNING", "msg": f"OG image not absolute: {url}", "file": filepath}
    return None


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------
def validate_file(filepath, expected_lang):
    """Run all validators on a single file. Returns list of issues."""
    try:
        html = filepath.read_text(encoding="utf-8")
    except Exception as e:
        return [{"level": "ERROR", "msg": f"Cannot read file: {e}", "file": str(filepath)}]

    issues = []
    checks = [
        check_lang_attribute(html, expected_lang, str(filepath)),
        check_title(html, str(filepath)),
        check_meta_description(html, str(filepath)),
        check_canonical(html, expected_lang, str(filepath)),
        check_hreflang(html, str(filepath)),
        check_schema_service(html, str(filepath)),
        check_noscript_language(html, expected_lang, str(filepath)),
        check_og_image(html, str(filepath)),
    ]
    issues.extend([c for c in checks if c is not None])
    return issues


def main():
    parser = argparse.ArgumentParser(description="Santis OS HTML Validator v1.0")
    parser.add_argument("--input", default=str(OUTPUT_DIR), help="Directory to validate")
    parser.add_argument("--lang", help="Validate specific language only", choices=LANGUAGES)
    parser.add_argument("--strict", action="store_true", help="Treat warnings as errors")
    args = parser.parse_args()

    input_dir = Path(args.input)
    if not input_dir.exists():
        print(f"❌ Input directory not found: {input_dir}")
        print(f"   Run build.py first to generate output.")
        sys.exit(1)

    print("=" * 60)
    print("  🔍 SANTIS OS — HTML Validator v1.0")
    print("=" * 60)

    target_langs = [args.lang] if args.lang else LANGUAGES
    all_issues = []
    total_files = 0

    for lang in target_langs:
        lang_dir = input_dir / lang
        if not lang_dir.exists():
            continue

        html_files = list(lang_dir.rglob("*.html"))
        for f in html_files:
            total_files += 1
            issues = validate_file(f, lang)
            all_issues.extend(issues)

    # Report
    errors = [i for i in all_issues if i["level"] == "ERROR"]
    warnings = [i for i in all_issues if i["level"] == "WARNING"]

    print(f"\n📊 Scanned: {total_files} files")
    print(f"   ❌ Errors:   {len(errors)}")
    print(f"   ⚠️  Warnings: {len(warnings)}")

    if errors:
        print(f"\n{'─' * 60}")
        print("  ❌ ERRORS")
        print(f"{'─' * 60}")
        for e in errors:
            rel = Path(e["file"]).relative_to(input_dir) if input_dir in Path(e["file"]).parents else e["file"]
            print(f"  {rel}")
            print(f"    → {e['msg']}")

    if warnings:
        print(f"\n{'─' * 60}")
        print("  ⚠️  WARNINGS")
        print(f"{'─' * 60}")
        for w in warnings:
            rel = Path(w["file"]).relative_to(input_dir) if input_dir in Path(w["file"]).parents else w["file"]
            print(f"  {rel}")
            print(f"    → {w['msg']}")

    # Exit code
    if errors or (args.strict and warnings):
        print(f"\n❌ Validation FAILED")
        sys.exit(1)
    else:
        print(f"\n✅ Validation PASSED")
        sys.exit(0)


if __name__ == "__main__":
    main()
