"""
TEMPLATE GOVERNANCE ENGINE v2.0
Santis Club — Template integrity scanner + Auto-Fix engine.

Scans all HTML pages, detects inline styles, computes SHA256 hashes,
performs cross-language DOM diffing, and auto-fixes violations.
"""

import os
import re
import hashlib
import json
from pathlib import Path
from html.parser import HTMLParser


# ── CONFIGURATION ──────────────────────────────────────────────
LANG_DIRS = {
    "tr": {"masajlar": "masajlar", "hamam": "hamam", "cilt-bakimi": "cilt-bakimi", "hizmetler": "hizmetler", "ekibimiz": "ekibimiz"},
    "en": {"masajlar": "massages", "hamam": "hammam", "cilt-bakimi": "skincare", "hizmetler": "services", "ekibimiz": "team"},
    "de": {"masajlar": "massagen", "hamam": "hammam", "cilt-bakimi": "hautpflege", "hizmetler": "dienstleistungen", "ekibimiz": "team"},
    "fr": {"masajlar": "massages", "hamam": "hammam", "cilt-bakimi": "soins", "hizmetler": "services", "ekibimiz": "equipe"},
    "ru": {"masajlar": "massages", "hamam": "hammam", "cilt-bakimi": "skincare", "hizmetler": "services", "ekibimiz": "team"},
}

SUPPORTED_LANGS = ["tr", "en", "de", "ru", "ar", "fr"]

# ── INLINE STYLE DETECTOR ─────────────────────────────────────
class InlineStyleDetector(HTMLParser):
    """Parses HTML and records line numbers of inline style attributes."""

    def __init__(self):
        super().__init__()
        self.violations = []
        self._line_offset = 0

    def feed_with_lines(self, html_content):
        self.violations = []
        self.feed(html_content)
        return self.violations

    def handle_starttag(self, tag, attrs):
        for attr_name, attr_value in attrs:
            if attr_name == "style" and attr_value:
                line = self.getpos()[0]
                self.violations.append({
                    "line": line,
                    "tag": tag,
                    "style": attr_value[:80]  # truncate long styles
                })


# ── DOM STRUCTURE ANALYZER ─────────────────────────────────────
class DOMAnalyzer(HTMLParser):
    """Analyzes DOM structure: tag counts, section counts, class distribution."""

    def __init__(self):
        super().__init__()
        self.tag_counts = {}
        self.classes = {}
        self.section_count = 0
        self.total_tags = 0

    def analyze(self, html_content):
        self.tag_counts = {}
        self.classes = {}
        self.section_count = 0
        self.total_tags = 0
        try:
            self.feed(html_content)
        except Exception:
            pass
        return {
            "total_tags": self.total_tags,
            "section_count": self.section_count,
            "unique_tags": len(self.tag_counts),
            "tag_counts": dict(sorted(self.tag_counts.items(), key=lambda x: -x[1])[:15]),
            "top_classes": dict(sorted(self.classes.items(), key=lambda x: -x[1])[:10])
        }

    def handle_starttag(self, tag, attrs):
        self.total_tags += 1
        self.tag_counts[tag] = self.tag_counts.get(tag, 0) + 1
        if tag in ("section", "article", "main"):
            self.section_count += 1
        for attr_name, attr_value in attrs:
            if attr_name == "class" and attr_value:
                for cls in attr_value.split():
                    self.classes[cls] = self.classes.get(cls, 0) + 1


# ── CORE SCANNER ───────────────────────────────────────────────
def compute_hash(content: str) -> str:
    """Compute SHA256 hash of content."""
    return hashlib.sha256(content.encode("utf-8", errors="replace")).hexdigest()[:12]


def scan_html_file(filepath: str) -> dict:
    """Scan a single HTML file for metrics."""
    try:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
    except Exception as e:
        return {"error": str(e)}

    # Inline styles
    detector = InlineStyleDetector()
    inline_violations = detector.feed_with_lines(content)

    # DOM structure
    analyzer = DOMAnalyzer()
    dom_info = analyzer.analyze(content)

    # Hash
    file_hash = compute_hash(content)

    # Line count
    line_count = content.count("\n") + 1

    return {
        "size": len(content),
        "lines": line_count,
        "hash": file_hash,
        "inline_style_count": len(inline_violations),
        "inline_styles": inline_violations[:10],  # limit to first 10
        "dom": dom_info
    }


def compare_dom(dom_a: dict, dom_b: dict) -> dict:
    """Compare two DOM analyses and return mismatch info."""
    tag_diff = abs(dom_a.get("total_tags", 0) - dom_b.get("total_tags", 0))
    section_diff = abs(dom_a.get("section_count", 0) - dom_b.get("section_count", 0))
    unique_diff = abs(dom_a.get("unique_tags", 0) - dom_b.get("unique_tags", 0))

    total_a = dom_a.get("total_tags", 1) or 1
    similarity = max(0, 100 - int((tag_diff / total_a) * 100))

    return {
        "tag_diff": tag_diff,
        "section_diff": section_diff,
        "unique_tag_diff": unique_diff,
        "similarity_pct": similarity,
        "match": similarity >= 85  # 85%+ = match
    }


def find_lang_pair(base_dir: str, lang_a: str, path_a: str, lang_b: str) -> str | None:
    """Try to find the matching page in another language."""
    # Strategy: same filename in corresponding lang directory
    filename = os.path.basename(path_a)
    rel_from_lang = os.path.relpath(path_a, os.path.join(base_dir, lang_a))
    candidate = os.path.join(base_dir, lang_b, rel_from_lang)
    if os.path.isfile(candidate):
        return candidate

    # Try mapped directory names
    parts = rel_from_lang.replace("\\", "/").split("/")
    if len(parts) >= 2:
        subdir = parts[0]
        for key, val in LANG_DIRS.get(lang_a, {}).items():
            if val == subdir or key == subdir:
                mapped_dir = LANG_DIRS.get(lang_b, {}).get(key, subdir)
                mapped_path = os.path.join(base_dir, lang_b, mapped_dir, *parts[1:])
                if os.path.isfile(mapped_path):
                    return mapped_path
    return None


def scan_language_directory(base_dir: str, lang: str) -> list:
    """Scan all HTML files in a language directory."""
    lang_dir = os.path.join(base_dir, lang)
    if not os.path.isdir(lang_dir):
        return []

    results = []
    for root, dirs, files in os.walk(lang_dir):
        for fname in files:
            if not fname.endswith(".html"):
                continue
            fpath = os.path.join(root, fname)
            rel_path = os.path.relpath(fpath, base_dir).replace("\\", "/")
            scan = scan_html_file(fpath)
            scan["path"] = rel_path
            scan["lang"] = lang
            scan["filename"] = fname
            results.append(scan)
    return results


def full_scan(base_dir: str) -> dict:
    """
    Perform a full site scan for Template Governance.
    Returns stats, pages, violations, and language matrix.
    """
    all_pages = []
    all_violations = []
    lang_page_counts = {}

    # Scan each language directory
    for lang in SUPPORTED_LANGS:
        lang_dir = os.path.join(base_dir, lang)
        if not os.path.isdir(lang_dir):
            lang_page_counts[lang] = 0
            continue

        pages = scan_language_directory(base_dir, lang)
        lang_page_counts[lang] = len(pages)

        for page in pages:
            all_pages.append(page)
            # Record violations
            for v in page.get("inline_styles", []):
                all_violations.append({
                    "type": "inline_style",
                    "path": page["path"],
                    "lang": lang,
                    "line": v["line"],
                    "tag": v["tag"],
                    "detail": v["style"]
                })

    # Cross-language DOM comparison (TR vs EN)
    dom_mismatches = []
    tr_pages = [p for p in all_pages if p["lang"] == "tr"]
    for tr_page in tr_pages:
        tr_path = os.path.join(base_dir, tr_page["path"].replace("/", os.sep))
        en_pair = find_lang_pair(base_dir, "tr", tr_path, "en")
        if en_pair:
            en_rel = os.path.relpath(en_pair, base_dir).replace("\\", "/")
            en_page = next((p for p in all_pages if p["path"] == en_rel), None)
            if en_page:
                tr_page["pair"] = en_rel
                en_page["pair"] = tr_page["path"]
                comparison = compare_dom(tr_page.get("dom", {}), en_page.get("dom", {}))
                tr_page["dom_match"] = comparison["match"]
                tr_page["dom_similarity"] = comparison["similarity_pct"]
                en_page["dom_match"] = comparison["match"]
                en_page["dom_similarity"] = comparison["similarity_pct"]

                if not comparison["match"]:
                    dom_mismatches.append({
                        "type": "dom_mismatch",
                        "tr_path": tr_page["path"],
                        "en_path": en_rel,
                        "similarity": comparison["similarity_pct"],
                        "tag_diff": comparison["tag_diff"],
                        "section_diff": comparison["section_diff"]
                    })
                    all_violations.append({
                        "type": "dom_mismatch",
                        "path": tr_page["path"],
                        "lang": "tr↔en",
                        "line": "-",
                        "tag": "-",
                        "detail": f"DOM similarity: {comparison['similarity_pct']}% (tag diff: {comparison['tag_diff']})"
                    })

    # Compute totals
    total_pages = len(all_pages)
    total_inline = sum(p.get("inline_style_count", 0) for p in all_pages)
    total_dom_mismatches = len(dom_mismatches)
    total_violations = len(all_violations)

    # Page-based compliance: % of pages with 0 inline styles AND DOM match
    compliance = 100
    if total_pages > 0:
        clean_pages = sum(1 for p in all_pages if p.get("inline_style_count", 0) == 0)
        compliance = int((clean_pages / total_pages) * 100)

    # Build language matrix
    lang_matrix = {}
    for lang in SUPPORTED_LANGS:
        lang_dir = os.path.join(base_dir, lang)
        if os.path.isdir(lang_dir):
            lang_matrix[lang] = {
                "total": lang_page_counts.get(lang, 0),
                "has_pair": sum(1 for p in all_pages if p["lang"] == lang and p.get("pair")),
                "dom_ok": sum(1 for p in all_pages if p["lang"] == lang and p.get("dom_match", False)),
            }
        else:
            lang_matrix[lang] = {"total": 0, "has_pair": 0, "dom_ok": 0}

    # Simplify pages for response (remove heavy DOM data)
    simplified_pages = []
    for p in all_pages:
        simplified_pages.append({
            "path": p["path"],
            "lang": p["lang"],
            "size": p.get("size", 0),
            "lines": p.get("lines", 0),
            "hash": p.get("hash", ""),
            "inline_styles": p.get("inline_style_count", 0),
            "pair": p.get("pair", None),
            "dom_match": p.get("dom_match", None),
            "dom_similarity": p.get("dom_similarity", None)
        })

    return {
        "stats": {
            "total_pages": total_pages,
            "total_violations": total_violations,
            "compliance_score": compliance,
            "inline_styles": total_inline,
            "dom_mismatches": total_dom_mismatches,
            "langs_active": sum(1 for v in lang_page_counts.values() if v > 0)
        },
        "lang_matrix": lang_matrix,
        "pages": simplified_pages,
        "violations": all_violations[:50]  # cap at 50
    }


# ── AUTO-FIX: INLINE STYLES (SMART FILTER) ─────────────────────
# Layout-critical properties that should NEVER be auto-removed
LAYOUT_PROPERTIES = {
    "display", "flex", "flex-direction", "flex-wrap", "flex-grow", "flex-shrink",
    "flex-basis", "flex-flow", "align-items", "align-content", "align-self",
    "justify-content", "justify-items", "justify-self",
    "grid", "grid-template", "grid-template-columns", "grid-template-rows",
    "grid-column", "grid-row", "grid-area", "grid-gap", "grid-auto-flow",
    "gap", "row-gap", "column-gap",
    "position", "top", "right", "bottom", "left", "z-index",
    "width", "height", "min-width", "min-height", "max-width", "max-height",
    "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
    "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
    "overflow", "overflow-x", "overflow-y",
    "float", "clear", "transform", "transition",
}


def _split_style_properties(style_str: str) -> tuple:
    """Split a style string into (cosmetic_props, layout_props) lists."""
    cosmetic = []
    layout = []
    for prop in style_str.split(";"):
        prop = prop.strip()
        if not prop:
            continue
        prop_name = prop.split(":")[0].strip().lower()
        if prop_name in LAYOUT_PROPERTIES:
            layout.append(prop)
        else:
            cosmetic.append(prop)
    return cosmetic, layout


def auto_fix_inline_styles(base_dir: str, rel_path: str) -> dict:
    """
    Smart inline style fixer with auto-backup.
    - Creates backup before any modification
    - Cosmetic props (color, font-size, etc.) → extracted to CSS class
    - Layout props (display, flex, padding, etc.) → left inline (safe)
    """
    import shutil
    from datetime import datetime

    filepath = os.path.join(base_dir, rel_path.replace("/", os.sep))
    if not os.path.isfile(filepath):
        return {"error": "File not found", "fixed": 0}

    # AUTO-SNAPSHOT: backup before modification
    backup_dir = os.path.join(base_dir, "_backup", "tgov")
    os.makedirs(backup_dir, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = rel_path.replace("/", "_").replace("\\", "_")
    backup_path = os.path.join(backup_dir, f"{ts}_{safe_name}")
    shutil.copy2(filepath, backup_path)

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    pattern = re.compile(r'(<\w[^>]*)\s+style="([^"]+)"', re.IGNORECASE)
    css_rules = []
    counter = [0]
    skipped = [0]

    def replacer(m):
        tag_part = m.group(1)
        style_value = m.group(2).strip()

        cosmetic, layout = _split_style_properties(style_value)

        if not cosmetic:
            # All properties are layout-critical — skip entirely
            skipped[0] += 1
            return m.group(0)  # return unchanged

        counter[0] += 1
        class_name = f"tgov-fix-{counter[0]}"
        css_rules.append(f".{class_name} {{ {'; '.join(cosmetic)}; }}")

        # Add class to tag
        if 'class="' in tag_part:
            tag_part = tag_part.replace('class="', f'class="{class_name} ')
        else:
            tag_part += f' class="{class_name}"'

        if layout:
            # Keep layout properties inline
            return f'{tag_part} style="{"; ".join(layout)}"'
        else:
            # All cosmetic — remove style entirely
            return tag_part

    new_content = pattern.sub(replacer, content)
    fixed_count = counter[0]

    if fixed_count == 0:
        return {"fixed": 0, "skipped": skipped[0], "css": "", "path": rel_path}

    # Write fixed HTML
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)

    # Append CSS rules to tgov-fixes.css
    css_path = os.path.join(base_dir, "assets", "css", "tgov-fixes.css")
    os.makedirs(os.path.dirname(css_path), exist_ok=True)
    css_block = f"\n/* Auto-fix: {rel_path} */\n" + "\n".join(css_rules) + "\n"
    with open(css_path, "a", encoding="utf-8") as f:
        f.write(css_block)

    return {
        "fixed": fixed_count,
        "skipped": skipped[0],
        "css_rules": len(css_rules),
        "path": rel_path,
        "css_file": "assets/css/tgov-fixes.css"
    }


# ── DOM DIFF REPORT ────────────────────────────────────────────
def generate_dom_diff(base_dir: str, path_a: str, path_b: str) -> dict:
    """
    Generate detailed DOM diff between two HTML files.
    Returns structural comparison with tag-by-tag analysis.
    """
    file_a = os.path.join(base_dir, path_a.replace("/", os.sep))
    file_b = os.path.join(base_dir, path_b.replace("/", os.sep))

    if not os.path.isfile(file_a):
        return {"error": f"File not found: {path_a}"}
    if not os.path.isfile(file_b):
        return {"error": f"File not found: {path_b}"}

    with open(file_a, "r", encoding="utf-8", errors="replace") as f:
        content_a = f.read()
    with open(file_b, "r", encoding="utf-8", errors="replace") as f:
        content_b = f.read()

    analyzer = DOMAnalyzer()
    dom_a = analyzer.analyze(content_a)
    analyzer_b = DOMAnalyzer()
    dom_b = analyzer_b.analyze(content_b)

    comparison = compare_dom(dom_a, dom_b)

    # Tag-by-tag diff
    all_tags = set(list(dom_a.get("tag_counts", {}).keys()) + list(dom_b.get("tag_counts", {}).keys()))
    tag_diffs = []
    for tag in sorted(all_tags):
        count_a = dom_a.get("tag_counts", {}).get(tag, 0)
        count_b = dom_b.get("tag_counts", {}).get(tag, 0)
        if count_a != count_b:
            tag_diffs.append({
                "tag": tag,
                "count_a": count_a,
                "count_b": count_b,
                "diff": count_a - count_b
            })

    return {
        "path_a": path_a,
        "path_b": path_b,
        "similarity": comparison["similarity_pct"],
        "match": comparison["match"],
        "summary": {
            "tags_a": dom_a["total_tags"],
            "tags_b": dom_b["total_tags"],
            "sections_a": dom_a["section_count"],
            "sections_b": dom_b["section_count"],
        },
        "tag_diffs": tag_diffs[:20],
        "classes_only_in_a": [c for c in dom_a.get("top_classes", {}) if c not in dom_b.get("top_classes", {})],
        "classes_only_in_b": [c for c in dom_b.get("top_classes", {}) if c not in dom_a.get("top_classes", {})]
    }


# ── CLI TEST ───────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    base = sys.argv[1] if len(sys.argv) > 1 else "."
    result = full_scan(base)
    print(json.dumps(result, indent=2, ensure_ascii=False))
