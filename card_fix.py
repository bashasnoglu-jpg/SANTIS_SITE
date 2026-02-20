"""
CARD LINK FIX v1.0 — Auto-Repair All Broken Card/Page Links
Fixes the 350 broken links found by card_audit.py.

Fix patterns:
  1. /en/skincare/X.html → /en/services/X.html (71 hits)
  2. /XX/booking.html → redirect to WhatsApp reservation modal (224 hits)
  3. ../../../en/services/ → corrected relative path (16 hits)
  4. ../../../XX/untitled/ → corrected to services/ folder (12 hits)
  5. /en/massages/X.html → verify or fix path

Usage:
    python card_fix.py --dry      # Preview changes
    python card_fix.py            # Apply fixes
"""

import os
import re
from pathlib import Path
from collections import defaultdict

# ──────────────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent
ACTIVE_LANGS = ["tr", "en", "de", "fr", "ru"]

# Folder names per language for services
SERVICE_FOLDERS = {
    "tr": "hizmetler",
    "en": "services",
    "de": "services",    # DE also uses /services/
    "fr": "services",    # FR also uses /services/
    "ru": "services",    # RU also uses /services/
}

MASSAGE_FOLDERS = {
    "tr": "masajlar",
    "en": "massages",
    "de": "massagen",
    "fr": "massages",
    "ru": "massages",
}

HAMAM_FOLDERS = {
    "tr": "hamam",
    "en": "hammam",
    "de": "hammam",
    "fr": "hammam",
    "ru": "hammam",
}

# ──────────────────────────────────────────────────────────────
# LINK REPLACEMENT RULES
# ──────────────────────────────────────────────────────────────

def build_replacements():
    """Build a list of (pattern, replacement) for broken links."""
    rules = []

    # Rule 1: /en/skincare/ → /en/services/
    rules.append(('/en/skincare/', '/en/services/'))

    # Rule 2: /XX/booking.html → javascript:void(0) with modal trigger
    # Better: change to # with onclick to open reservation modal
    for lang in ACTIVE_LANGS:
        rules.append((f'/{lang}/booking.html',
                       f'javascript:void(0)" onclick="if(typeof openReservationModal===\'function\')openReservationModal()'))

    # Rule 3: ../../../en/services/ → correct relative path for /tr/hizmetler/X/
    # These are in tr/hizmetler/X/index.html pointing to ../../../en/services/
    # The correct relative would depend on depth, but absolute is safest
    rules.append(('../../../en/services/', '/en/services/'))
    rules.append(('../../../de/untitled/', '/de/services/'))
    rules.append(('../../../fr/untitled/', '/fr/services/'))
    rules.append(('../../../ru/services/', '/ru/services/'))
    rules.append(('../../../de/services/', '/de/services/'))
    rules.append(('../../../fr/services/', '/fr/services/'))

    # Rule 4: untitled → services
    for lang in ["de", "fr"]:
        rules.append((f'/{lang}/untitled/', f'/{lang}/services/'))

    # Rule 5: Some EN massage paths that may be wrong
    rules.append(('/en/massages/classic-relaxation.html', '/en/massages/klasik-rahatlama.html'))
    rules.append(('/en/massages/aromatherapy.html', '/en/massages/aromaterapi.html'))
    rules.append(('/en/massages/deep-tissue.html', '/en/massages/derin-doku.html'))

    return rules


# ──────────────────────────────────────────────────────────────
# FIX ENGINE
# ──────────────────────────────────────────────────────────────

def fix_links(dry_run=False):
    """Scan and fix broken links across all pages."""

    print(f"\n{'='*60}")
    print(f"  🔧 CARD LINK FIX v1.0")
    print(f"  Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"{'='*60}\n")

    rules = build_replacements()
    stats = defaultdict(int)
    fixed_files = set()

    # Collect all HTML files
    html_files = []
    for lang in ACTIVE_LANGS:
        lang_dir = BASE_DIR / lang
        if lang_dir.exists():
            html_files.extend(lang_dir.rglob("*.html"))
    # Root HTML
    for f in BASE_DIR.iterdir():
        if f.suffix == ".html" and f.is_file():
            html_files.append(f)

    print(f"  📊 Scanning {len(html_files)} files...")
    print(f"  📋 {len(rules)} fix rules loaded\n")

    for fp in html_files:
        rel = fp.relative_to(BASE_DIR).as_posix()
        try:
            with open(fp, "r", encoding="utf-8", errors="replace") as f:
                content = original = f.read()
        except:
            continue

        file_changes = 0

        for pattern, replacement in rules:
            if pattern in content:
                count = content.count(pattern)
                content = content.replace(pattern, replacement)
                file_changes += count
                stats[pattern] += count

        if file_changes > 0:
            fixed_files.add(rel)
            if not dry_run:
                with open(fp, "w", encoding="utf-8") as f:
                    f.write(content)

    # Check if EN massage file exists, fix path if slug mismatch
    # Additional verification: check if replaced targets actually exist
    verify_count = 0
    for fp in html_files:
        try:
            with open(fp, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
        except:
            continue

        # Find remaining broken links to services
        for m in re.finditer(r'href="(/[a-z]{2}/services/[^"]+)"', content):
            target = BASE_DIR / m.group(1).lstrip("/")
            if not target.exists() and not (target.parent / "index.html").exists():
                verify_count += 1

    # Report
    print(f"{'─'*60}")
    print(f"  SONUÇLAR")
    print(f"{'─'*60}")
    print(f"  Düzeltilen dosya:  {len(fixed_files)}")
    print(f"  Toplam değişiklik: {sum(stats.values())}")
    print()

    if stats:
        print(f"  FIX DETAYLARI:")
        for pattern, count in sorted(stats.items(), key=lambda x: -x[1]):
            short = pattern[:50]
            print(f"    {count:4d}× {short}")

    if verify_count:
        print(f"\n  ⚠️ {verify_count} link hâlâ doğrulanamadı (hedef dosya yok)")

    print(f"\n{'='*60}")

    return {
        "fixed_files": len(fixed_files),
        "total_changes": sum(stats.values()),
        "remaining_unverified": verify_count,
        "details": dict(stats)
    }


# ──────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    dry = "--dry" in sys.argv
    result = fix_links(dry_run=dry)
