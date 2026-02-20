"""
LINK DEPTH ANALYZER v1.0 — Internal Link Architecture
Analyzes the internal link structure of the entire site.

Reports:
- Inbound link count per page (link equity distribution)
- Click depth from homepage (depth > 3 = warning)
- Money pages depth check (hammam/massages should be ≤ 2)
- Orphan pages (0 inbound links)

Source: filesystem HTML parsing

Usage:
    python link_depth.py              # Full analysis
    python link_depth.py --json       # Output as JSON
"""

import os
import re
import json
from pathlib import Path
from html.parser import HTMLParser
from collections import defaultdict, deque
from urllib.parse import urlparse, urljoin

# ──────────────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent
ACTIVE_LANGS = ["tr", "en", "de", "fr", "ru"]
DOMAIN = "https://santis.club"
SKIP_DIRS = {"admin", "node_modules", ".git", "__pycache__", "_backup",
             "assets", "data", "reports", "core", "tools", "backup",
             "_dev_archives", "_legacy_archive", "_legacy_content", "venv"}

# Money pages: these should have depth ≤ 2
MONEY_PREFIXES = ["masajlar", "massages", "massagen", "hamam", "hammam",
                  "hizmetler", "services", "urunler", "products", "produits", "produkte"]


# ──────────────────────────────────────────────────────────────
# LINK EXTRACTOR
# ──────────────────────────────────────────────────────────────

class LinkExtractor(HTMLParser):
    """Extract all <a href> links from an HTML file."""
    
    def __init__(self):
        super().__init__()
        self.links = []
    
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            attrs_dict = dict(attrs)
            href = attrs_dict.get("href", "")
            if href and not href.startswith("#") and not href.startswith("javascript:") \
               and not href.startswith("mailto:") and not href.startswith("tel:"):
                self.links.append(href)


def extract_links(filepath):
    """Extract internal links from an HTML file."""
    parser = LinkExtractor()
    try:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            parser.feed(f.read())
    except:
        pass
    return parser.links


def normalize_link(href, source_rel, base_dir):
    """Normalize a link to a relative path from base_dir."""
    # Skip external links
    if href.startswith("http://") or href.startswith("https://"):
        parsed = urlparse(href)
        if "santis.club" not in parsed.netloc and "localhost" not in parsed.netloc:
            return None  # External link
        href = parsed.path
    
    # Absolute path (starts with /)
    if href.startswith("/"):
        rel = href.lstrip("/")
    else:
        # Relative path
        source_dir = os.path.dirname(source_rel)
        rel = os.path.normpath(os.path.join(source_dir, href)).replace("\\", "/")
    
    # Strip query/hash
    rel = rel.split("?")[0].split("#")[0]
    
    # Handle directory → index.html
    full = os.path.join(str(base_dir), rel)
    if os.path.isdir(full):
        rel = rel.rstrip("/") + "/index.html"
    
    # Normalize trailing slash
    if rel.endswith("/"):
        rel += "index.html"
    
    return rel


# ──────────────────────────────────────────────────────────────
# DEPTH ANALYSIS (BFS from homepage)
# ──────────────────────────────────────────────────────────────

def analyze_depth(base_dir):
    """Full link depth analysis."""
    
    # Step 1: Collect all HTML files
    all_pages = {}  # rel_path → full_path
    for lang in ACTIVE_LANGS:
        lang_dir = base_dir / lang
        if not lang_dir.exists():
            continue
        for html_file in lang_dir.rglob("*.html"):
            rel = html_file.relative_to(base_dir).as_posix()
            all_pages[rel] = str(html_file)
    
    # Also root pages
    for f in base_dir.iterdir():
        if f.suffix == ".html" and f.is_file():
            all_pages[f.name] = str(f)
    
    print(f"📊 Total pages: {len(all_pages)}")
    
    # Step 2: Build link graph
    outbound = defaultdict(set)  # page → set of linked pages
    inbound = defaultdict(set)   # page → set of pages linking to it
    
    for rel, full in all_pages.items():
        links = extract_links(full)
        for href in links:
            target = normalize_link(href, rel, base_dir)
            if target and target in all_pages and target != rel:
                outbound[rel].add(target)
                inbound[target].add(rel)
    
    # Step 3: BFS depth from index.html
    depth = {}
    start = "index.html"
    if start not in all_pages:
        # Try tr/index.html
        start = "tr/index.html"
    
    if start in all_pages:
        queue = deque([(start, 0)])
        depth[start] = 0
        
        while queue:
            page, d = queue.popleft()
            for linked in outbound.get(page, []):
                if linked not in depth:
                    depth[linked] = d + 1
                    queue.append((linked, d + 1))
    
    # Step 4: Analyze results
    orphans = []       # Pages with 0 inbound links
    deep_pages = []    # Pages with depth > 3
    money_deep = []    # Money pages with depth > 2
    
    for page in all_pages:
        in_count = len(inbound.get(page, set()))
        page_depth = depth.get(page, -1)  # -1 = unreachable
        
        # Orphan check (no inbound, not homepage)
        if in_count == 0 and page not in (start, "index.html"):
            orphans.append(page)
        
        # Deep page check
        if page_depth > 3:
            deep_pages.append({"page": page, "depth": page_depth})
        
        # Money page depth check
        parts = page.split("/")
        if len(parts) >= 2:
            section = parts[1] if parts[0] in ACTIVE_LANGS else parts[0]
            if section in MONEY_PREFIXES and page_depth > 2:
                money_deep.append({"page": page, "depth": page_depth})
    
    # Step 5: Generate report
    # Top pages by inbound links
    top_pages = sorted(
        [(page, len(links)) for page, links in inbound.items()],
        key=lambda x: -x[1]
    )[:20]
    
    # Depth distribution
    depth_dist = defaultdict(int)
    for d in depth.values():
        depth_dist[d] += 1
    unreachable = len(all_pages) - len(depth)
    
    report = {
        "total_pages": len(all_pages),
        "total_internal_links": sum(len(v) for v in outbound.values()),
        "depth_distribution": dict(sorted(depth_dist.items())),
        "unreachable_from_home": unreachable,
        "orphan_pages": len(orphans),
        "orphan_list": orphans[:20],
        "deep_pages_gt3": len(deep_pages),
        "deep_page_list": deep_pages[:20],
        "money_pages_gt2": len(money_deep),
        "money_deep_list": money_deep[:20],
        "top_linked_pages": [{"page": p, "inbound": c} for p, c in top_pages],
        "issues": {
            "critical": len(money_deep),
            "warning": len(deep_pages) + len(orphans),
            "info": 0
        }
    }
    
    return report


# ──────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    
    report = analyze_depth(BASE_DIR)
    
    if "--json" in sys.argv:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        print(f"\n{'='*60}")
        print(f"  LINK DEPTH ANALYZER — REPORT")
        print(f"{'='*60}")
        print(f"  Total pages:         {report['total_pages']}")
        print(f"  Internal links:      {report['total_internal_links']}")
        print(f"  Unreachable:         {report['unreachable_from_home']}")
        print(f"  Orphan pages:        {report['orphan_pages']}")
        print(f"  Deep pages (>3):     {report['deep_pages_gt3']}")
        print(f"  Money pages (>2):    {report['money_pages_gt2']}")
        
        print(f"\n  📊 Depth Distribution:")
        for d, count in sorted(report["depth_distribution"].items()):
            bar = "█" * min(count, 40)
            print(f"    Depth {d}: {count:>4} {bar}")
        
        if report["orphan_list"]:
            print(f"\n  🔴 Orphan Pages (top 20):")
            for p in report["orphan_list"]:
                print(f"    - {p}")
        
        if report["money_deep_list"]:
            print(f"\n  🔴 Money Pages Too Deep:")
            for m in report["money_deep_list"]:
                print(f"    - {m['page']} (depth {m['depth']})")
        
        if report["top_linked_pages"]:
            print(f"\n  ⭐ Top Linked Pages:")
            for t in report["top_linked_pages"][:10]:
                print(f"    - {t['page']}: {t['inbound']} inbound")
        
        print(f"\n{'='*60}")
