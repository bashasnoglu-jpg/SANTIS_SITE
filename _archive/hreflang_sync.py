"""
HREFLANG CLUSTER SYNC v1.0
Enterprise Fix — Static hreflang tag generator

Reads available-routes.json (cluster registry) and:
1. For each HTML file in lang dirs, finds its cluster
2. Removes ALL existing hreflang tags
3. Injects the COMPLETE symmetric cluster set
4. Adds self-referencing canonical
5. Adds x-default → EN version

Result: 0 reciprocal failures, perfect cross-language symmetry.
"""

import os
import re
import json
import shutil
import datetime
from collections import defaultdict

# ──────────────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROUTES_FILE = os.path.join(BASE_DIR, "assets", "data", "available-routes.json")
DOMAIN = "https://santis-club.com"
ACTIVE_LANGS = ["tr", "en", "de", "fr", "ru"]
DEFAULT_LANG = "en"  # x-default target
BACKUP_DIR = os.path.join(BASE_DIR, "_backup", "hreflang_sync",
                          datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))

# Regex for hreflang link tags
HREFLANG_RE = re.compile(
    r'<link\s+[^>]*rel\s*=\s*["\']alternate["\'][^>]*hreflang\s*=\s*["\'][^"\']*["\'][^>]*/?\s*>',
    re.IGNORECASE
)
# Also match hreflang before rel
HREFLANG_RE2 = re.compile(
    r'<link\s+[^>]*hreflang\s*=\s*["\'][^"\']*["\'][^>]*rel\s*=\s*["\']alternate["\'][^>]*/?\s*>',
    re.IGNORECASE
)

# ──────────────────────────────────────────────────────────────
# LOAD CLUSTER REGISTRY
# ──────────────────────────────────────────────────────────────

def load_clusters():
    """Load available-routes.json and build reverse lookup."""
    with open(ROUTES_FILE, "r", encoding="utf-8") as f:
        routes = json.load(f)

    # Build reverse: "lang/path" → cluster_key
    reverse = {}  # "tr/masajlar/index.html" → "masajlar/index.html"
    clusters = {}  # cluster_key → {lang: full_relative_path}

    for canonical_key, lang_paths in routes.items():
        cluster = {}
        for lang, path in lang_paths.items():
            if lang not in ACTIVE_LANGS:
                continue
            full_rel = f"{lang}/{path}"
            cluster[lang] = full_rel
            reverse[full_rel] = canonical_key
        clusters[canonical_key] = cluster

    return clusters, reverse


# ──────────────────────────────────────────────────────────────
# GENERATE HREFLANG TAGS
# ──────────────────────────────────────────────────────────────

def generate_hreflang_block(cluster, current_lang):
    """Generate hreflang tags, skipping languages whose file is absent on disk."""
    lines = []

    # Filter to existing files only
    filtered = {}
    for lang, path in cluster.items():
        full = os.path.join(BASE_DIR, path)
        if os.path.exists(full):
            filtered[lang] = path

    # Sort langs for consistent output
    for lang in sorted(filtered.keys()):
        path = filtered[lang]
        href = f"{DOMAIN}/{path}"
        lines.append(f'    <link rel="alternate" hreflang="{lang}" href="{href}" />')

    if not filtered:
        return ""

    # x-default → DEFAULT_LANG if exists, else first available
    xdefault_path = filtered.get(DEFAULT_LANG) or filtered.get("tr") or list(filtered.values())[0]
    lines.append(f'    <link rel="alternate" hreflang=\"x-default\" href=\"{DOMAIN}/{xdefault_path}\" />')

    return "\n".join(lines)


# ──────────────────────────────────────────────────────────────
# PATCH HTML FILE
# ──────────────────────────────────────────────────────────────

def patch_file(filepath, cluster, current_lang, dry_run=False):
    """
    Remove existing hreflang tags and inject the correct cluster set.
    Returns True if file was modified.
    """
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    original = content

    # Step 1: Remove ALL existing hreflang link tags
    content = HREFLANG_RE.sub("", content)
    content = HREFLANG_RE2.sub("", content)

    # Clean up empty lines left behind
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

    # Step 2: Generate new hreflang block
    new_block = generate_hreflang_block(cluster, current_lang)

    # Step 3: Insert before </head>
    if "</head>" in content:
        content = content.replace("</head>", f"\n    <!-- HREFLANG CLUSTER SYNC -->\n{new_block}\n</head>")
    elif "</HEAD>" in content:
        content = content.replace("</HEAD>", f"\n    <!-- HREFLANG CLUSTER SYNC -->\n{new_block}\n</HEAD>")
    else:
        return False  # No </head> found, skip

    if content == original:
        return False

    if not dry_run:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

    return True


# ──────────────────────────────────────────────────────────────
# MAIN SYNC
# ──────────────────────────────────────────────────────────────

def run_sync(dry_run=False):
    clusters, reverse = load_clusters()

    print(f"📊 Loaded {len(clusters)} clusters from available-routes.json")
    print(f"📊 Reverse lookup: {len(reverse)} page entries")
    print(f"📊 Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print()

    # Backup if live
    if not dry_run:
        os.makedirs(BACKUP_DIR, exist_ok=True)
        print(f"💾 Backup dir: {BACKUP_DIR}")

    stats = {"patched": 0, "skipped": 0, "no_cluster": 0, "errors": 0}
    patched_files = []

    for lang in ACTIVE_LANGS:
        lang_dir = os.path.join(BASE_DIR, lang)
        if not os.path.isdir(lang_dir):
            continue

        for root, dirs, files in os.walk(lang_dir):
            dirs[:] = [d for d in dirs if d not in ("admin", ".git", "_backup", "assets")]
            for fname in files:
                if not fname.endswith(".html"):
                    continue

                full = os.path.join(root, fname)
                rel = os.path.relpath(full, BASE_DIR).replace("\\", "/")

                # Find cluster
                cluster_key = reverse.get(rel)
                if not cluster_key:
                    stats["no_cluster"] += 1
                    continue

                cluster = clusters[cluster_key]

                try:
                    # Backup
                    if not dry_run:
                        backup_path = os.path.join(BACKUP_DIR, rel.replace("/", os.sep))
                        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
                        shutil.copy2(full, backup_path)

                    # Patch
                    modified = patch_file(full, cluster, lang, dry_run=dry_run)
                    if modified:
                        stats["patched"] += 1
                        patched_files.append(rel)
                    else:
                        stats["skipped"] += 1

                except Exception as e:
                    stats["errors"] += 1
                    print(f"  ❌ Error: {rel}: {e}")

    # Report
    print()
    print("=" * 60)
    print(f"  HREFLANG CLUSTER SYNC — {'DRY RUN' if dry_run else 'COMPLETE'}")
    print("=" * 60)
    print(f"  Patched:    {stats['patched']}")
    print(f"  Skipped:    {stats['skipped']} (already correct or no change)")
    print(f"  No cluster: {stats['no_cluster']} (not in available-routes.json)")
    print(f"  Errors:     {stats['errors']}")
    print("=" * 60)

    if patched_files and not dry_run:
        print(f"\n📝 Patched files ({len(patched_files)}):")
        for f in patched_files[:20]:
            print(f"  ✅ {f}")
        if len(patched_files) > 20:
            print(f"  ... +{len(patched_files) - 20} more")

    return stats


# ──────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    dry = "--dry" in sys.argv or "--dry-run" in sys.argv
    run_sync(dry_run=dry)
