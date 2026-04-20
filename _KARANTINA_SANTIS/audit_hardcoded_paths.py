"""
SANTIS — Hardcoded Path Audit v1.0
Aktif Python scriptlerinde taşınamaz path antipatternlarını tespit eder.
Çalıştır: python audit_hardcoded_paths.py
"""
from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

SCAN_DIRS = ["scripts", "tools", "ai"]

PATTERNS = [
    ("windows_abs_path",     re.compile(r"[A-Za-z]:[/\\\\]")),
    ("unix_home_path",       re.compile(r"(/Users/|/home/)")),
    ("desktop_project_ref",  re.compile(r"Desktop[/\\]SANTIS_SITE", re.IGNORECASE)),
    ("root_dir_assignment",  re.compile(r"\bROOT(?:_DIR)?\s*=\s*Path\s*\(")),
    ("os_chdir",             re.compile(r"\bos\.chdir\s*\(")),
    ("hardcoded_html_file",  re.compile(r"['\"][^'\"]*\.(html|py)['\"].*#\s*hardcoded|open\s*\(['\"][^'\"]+\.html")),
    ("path_literal",         re.compile(r"Path\s*\(\s*r?['\"][A-Za-z]:[/\\\\]")),
    ("hardcoded_page_path",  re.compile(r"['\"](?:tr|en|sr)/[^'\"]+\.html['\"]")),
]

IGNORE_PARTS = {".git", "archive", "node_modules", ".venv", "venv", "__pycache__"}


def iter_files():
    for folder in SCAN_DIRS:
        base = ROOT / folder
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.py")):
            if any(p in IGNORE_PARTS for p in path.parts):
                continue
            yield path


def audit(path: Path):
    try:
        lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    except Exception as e:
        return [{"type": "read_error", "line": 0, "snippet": str(e)}]

    hits = []
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        for name, pat in PATTERNS:
            if pat.search(line):
                hits.append({"type": name, "line": i, "snippet": stripped[:100]})
                break  # tek satır için en az bir pattern yeterli
    return hits


def main():
    results = {}
    total_files = 0

    for py in iter_files():
        total_files += 1
        hits = audit(py)
        if hits:
            results[py] = hits

    # ─── ÇIKTI ────────────────────────────────────────────────────────────────
    print(f"\n{'='*65}")
    print(f"  SANTIS HARDCODED PATH AUDIT")
    print(f"  Taranan: {total_files} dosya  |  Bayraklı: {len(results)} dosya")
    print(f"{'='*65}\n")

    severity = {}  # dosya → hit sayısı

    for path, hits in sorted(results.items()):
        rel = path.relative_to(ROOT)
        severity[rel] = len(hits)
        print(f"[{rel}]  ({len(hits)} bulgu)")
        for h in hits:
            print(f"  L{h['line']:>3} | {h['type']:<22} | {h['snippet']}")
        print()

    # ─── ÖZET SIRALI ──────────────────────────────────────────────────────────
    print(f"{'='*65}")
    print("  EN RİSKLİ DOSYALAR (hit sayısına göre):")
    print(f"{'='*65}")
    for path, count in sorted(severity.items(), key=lambda x: -x[1]):
        bar = "█" * min(count, 20)
        print(f"  {count:>3} {bar}  {path}")

    print(f"\n{'='*65}")
    print(f"  Temiz dosya : {total_files - len(results)}")
    print(f"  Bayraklı    : {len(results)}")
    print(f"{'='*65}\n")


if __name__ == "__main__":
    main()
