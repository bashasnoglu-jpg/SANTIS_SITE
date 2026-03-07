"""
ORPHAN FIX v1.0 — Related Links Injection
Mitigates orphan pages by injecting "related services" links.

Strategy:
  - Uses available-routes.json clusters to find sibling pages
  - For each orphan (0 inbound links), injects a cluster-aware
    "related services" block before </body>
  - Uses link_depth.py analysis to identify orphans

Usage:
    python orphan_fix.py           # Report orphans + inject links
    python orphan_fix.py --dry     # Report only, no changes
    python orphan_fix.py --report  # CSV export to reports/
"""

import os
import re
import json
import csv
import datetime
from pathlib import Path
from collections import defaultdict

# ──────────────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent
ROUTES_FILE = BASE_DIR / "assets" / "data" / "available-routes.json"
CONTENT_FILE = BASE_DIR / "data" / "site_content.json"
DOMAIN = "https://santis.club"
ACTIVE_LANGS = ["tr", "en", "de", "fr", "ru"]

# Marker for our injected blocks
RELATED_MARKER = "<!-- RELATED LINKS -->"
RELATED_RE = re.compile(r'<!-- RELATED LINKS -->.*?<!-- /RELATED LINKS -->', re.DOTALL)

# Labels per language
LABELS = {
    "tr": "İlgili Hizmetler",
    "en": "Related Services",
    "de": "Ähnliche Behandlungen",
    "fr": "Services Associés",
    "ru": "Похожие услуги"
}


# ──────────────────────────────────────────────────────────────
# LOAD & ANALYZE
# ──────────────────────────────────────────────────────────────

def load_routes():
    """Load route clusters."""
    with open(ROUTES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def load_content():
    """Load site content for item names."""
    with open(CONTENT_FILE, "r", encoding="utf-8-sig") as f:
        return json.load(f)


def get_orphan_pages():
    """Run link depth analysis and return orphan list."""
    from link_depth import analyze_depth
    report = analyze_depth(BASE_DIR)
    return report.get("orphan_list", []), report


def build_cluster_map(routes):
    """Build a map: rel_path → list of sibling pages."""
    # First, build reverse: rel_path → cluster_key
    path_to_cluster = {}
    for cluster_key, lang_paths in routes.items():
        for lang, rel_path in lang_paths.items():
            full_rel = f"{lang}/{rel_path}"
            path_to_cluster[full_rel] = cluster_key

    # Then, build: rel_path → [sibling rel_paths in same section]
    # "Same section" = pages sharing the same parent directory
    section_pages = defaultdict(list)
    for full_rel in path_to_cluster:
        parts = full_rel.split("/")
        if len(parts) >= 3:
            section = f"{parts[0]}/{parts[1]}"
            section_pages[section].append(full_rel)

    return path_to_cluster, section_pages


def get_item_names(content):
    """Build slug → {lang: name} lookup."""
    names = {}
    catalogs = content.get("catalogs", {})
    for section, data in catalogs.items():
        for item in data.get("items", []):
            slug = item.get("slug") or item.get("id")
            if slug:
                translations = item.get("translations", {})
                names[slug] = {}
                for lang, tr in translations.items():
                    names[slug][lang] = tr.get("name", slug.replace("-", " ").title())
    return names


# ──────────────────────────────────────────────────────────────
# HTML INJECTION
# ──────────────────────────────────────────────────────────────

def build_related_block(siblings, lang, item_names):
    """Build a related services HTML block."""
    label = LABELS.get(lang, "Related Services")

    links_html = []
    for sib in siblings[:6]:  # Max 6 related links
        parts = sib.split("/")
        slug = parts[-1].replace(".html", "").replace("index", "")
        if not slug:
            slug = parts[-2] if len(parts) >= 3 else "home"

        # Get display name
        name_map = item_names.get(slug, {})
        name = name_map.get(lang, name_map.get("tr", slug.replace("-", " ").title()))

        href = f"/{sib}"
        links_html.append(f'    <a href="{href}" class="nv-related-link">{name}</a>')

    if not links_html:
        return None

    html = f"""{RELATED_MARKER}
<aside class="nv-related-services" aria-label="{label}">
  <h3 class="nv-related-title">{label}</h3>
  <nav class="nv-related-nav">
{chr(10).join(links_html)}
  </nav>
</aside>
<!-- /RELATED LINKS -->"""

    return html


def inject_related(filepath, block, dry_run=False):
    """Inject related links block before </body>."""
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    # Remove existing
    content = RELATED_RE.sub("", content)

    # Inject before </body>
    if "</body>" in content:
        content = content.replace("</body>", f"\n{block}\n</body>")
    elif "</BODY>" in content:
        content = content.replace("</BODY>", f"\n{block}\n</BODY>")
    else:
        return False

    if not dry_run:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

    return True


# ──────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────

def run_orphan_fix(dry_run=False, report_csv=False):
    """Main orphan remediation flow."""

    print(f"{'='*60}")
    print(f"  🔗 ORPHAN FIX v1.0 — Related Links Injection")
    print(f"  Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"{'='*60}")

    # Step 1: Find orphans
    print("\n  Step 1: Analyzing link depth...")
    orphans, depth_report = get_orphan_pages()
    print(f"  Found {len(orphans)} orphan pages")

    # Step 2: Load routes & content
    routes = load_routes()
    content = load_content()
    path_to_cluster, section_pages = build_cluster_map(routes)
    item_names = get_item_names(content)

    stats = {"fixed": 0, "skipped": 0, "no_siblings": 0}

    # Step 3: CSV export if requested
    if report_csv:
        csv_path = BASE_DIR / "reports" / "orphan_pages.csv"
        csv_path.parent.mkdir(exist_ok=True)
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["page", "section", "lang", "has_cluster", "action"])
            for orphan in orphans:
                parts = orphan.split("/")
                lang = parts[0] if parts[0] in ACTIVE_LANGS else "root"
                section = parts[1] if len(parts) >= 3 else "-"
                has_cluster = orphan in path_to_cluster
                writer.writerow([orphan, section, lang, has_cluster, "pending"])
        print(f"\n  📊 CSV exported to: {csv_path}")

    # Step 4: Inject related links for orphans
    print("\n  Step 2: Injecting related links...")
    for orphan in orphans:
        filepath = BASE_DIR / orphan
        if not filepath.exists():
            stats["skipped"] += 1
            continue

        # Determine language + section
        parts = orphan.split("/")
        lang = parts[0] if parts[0] in ACTIVE_LANGS else "root"
        if lang == "root":
            stats["skipped"] += 1
            continue

        # Find siblings
        if len(parts) >= 3:
            section_key = f"{parts[0]}/{parts[1]}"
            siblings = section_pages.get(section_key, [])
            # Exclude self
            siblings = [s for s in siblings if s != orphan]

            if not siblings:
                stats["no_siblings"] += 1
                continue

            block = build_related_block(siblings, lang, item_names)
            if block:
                if inject_related(str(filepath), block, dry_run=dry_run):
                    stats["fixed"] += 1
                else:
                    stats["skipped"] += 1
            else:
                stats["no_siblings"] += 1
        else:
            stats["skipped"] += 1

    # Report
    print(f"\n{'='*60}")
    print(f"  ORPHAN FIX — {'DRY RUN' if dry_run else 'COMPLETE'}")
    print(f"{'='*60}")
    print(f"  Total orphans:  {len(orphans)}")
    print(f"  Fixed:          {stats['fixed']}")
    print(f"  Skipped:        {stats['skipped']}")
    print(f"  No siblings:    {stats['no_siblings']}")
    print(f"{'='*60}")

    return stats


# ──────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    dry = "--dry" in sys.argv
    report = "--report" in sys.argv
    run_orphan_fix(dry_run=dry, report_csv=report)
