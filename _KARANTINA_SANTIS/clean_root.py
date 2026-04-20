"""
SANTIS ROOT CLEANER — Teknik Borç Temizliği v1.0
--------------------------------------------------
Kök dizindeki geçici, stale ve orphan dosyaları arşivler.

Kullanım:
  python clean_root.py          → Dry-run (sadece önizle, hiçbir şeye dokunma)
  python clean_root.py --commit → Gerçek taşıma işlemini yap
"""

import sys
import shutil
from pathlib import Path

# ─── CONFIG ──────────────────────────────────────────────────────────────────

ROOT = Path(__file__).parent

ARCHIVE_MAP = {
    # (glob_pattern): hedef_klasör
    "tmp_*.py":                                    "archive/scripts",
    "fix_*.py":                                    "archive/scripts",
    "implement_*.py":                              "archive/scripts",
    "build_*.py":                                  "archive/scripts",
    "generate_*.py":                               "archive/scripts",
    "migrate_*.py":                                "archive/scripts",
    "unify_*.py":                                  "archive/scripts",
    "inject_*.py":                                 "archive/scripts",
    "rebuild-*.js":                                "archive/scripts",
    "fix-*.js":                                    "archive/scripts",
    "transform-*.js":                              "archive/scripts",
    # Stale backup & raporlar
    "index_backup.html":                           "archive/backups",
    "*.diff":                                      "archive/backups",
    "forecast*.json":                              "archive/backups",
    "audit_report.csv":                            "archive/stale_reports",
    "*.zip":                                       "archive/backups",
    # Orphan test/debug JS dosyaları (tests/ altında olmalı)
    "test.js":                                     "archive/tests",
    "test-*.js":                                   "archive/tests",
    "test_*.js":                                   "archive/tests",
    "check_*.js":                                  "archive/tests",
    "check_*.py":                                  "archive/tests",
    "debug_*.js":                                  "archive/tests",
    "total_domination_test.js":                    "archive/tests",
    "navbar_dominance_scan.js":                    "archive/tests",
    "bracket_test.js":                             "archive/tests",
}

# Bu dosyalar asla taşınmasın (root'ta kalması gereken kritik dosyalar)
WHITELIST = {
    "clean_root.py",        # bu script'in kendisi
    "package.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "requirements.txt",
    "tailwind.config.js",
    "tsconfig.json",
    "tsconfig.base.json",
    "vite.config.js",
    "postcss.config.js",
    "postcss.config.mjs",
    "playwright.config.ts",
    "wrangler.toml",
    "vercel.json",
    "routes.json",
    "manifest.json",
    "robots.txt",
    "sitemap.xml",
    "sw.js",
    "nginx.conf",
    "alembic.ini",
    "Dockerfile",
    "Dockerfile.frontend",
    "Dockerfile.sovereign",
    "docker-compose.yml",
    "docker-compose.dev.yml",
    "docker-compose.sovereign.yml",
    "start.bat",
    "fiveserver.config.js",
    "santis.build.config.js",
    "build.mjs",
    "cf-deploy.mjs",
    "favicon.ico",
    "favicon.svg",
}

# ─── CORE ────────────────────────────────────────────────────────────────────

def setup_archive(dry_run: bool):
    dirs = set(ARCHIVE_MAP.values())
    for d in dirs:
        path = ROOT / d
        if not dry_run:
            path.mkdir(parents=True, exist_ok=True)
        else:
            print(f"  [mkdir] {d}")

def collect_targets() -> list[tuple[Path, Path]]:
    """Taşınacak dosyaları toplar, whitelist ve klasörleri atlar."""
    moves = []
    for pattern, target_dir in ARCHIVE_MAP.items():
        for src in sorted(ROOT.glob(pattern)):
            if not src.is_file():
                continue
            if src.name in WHITELIST:
                continue
            dest = ROOT / target_dir / src.name
            moves.append((src, dest))
    return moves

def run(dry_run: bool):
    print()
    print("=" * 60)
    mode = "DRY-RUN (önizleme — hiçbir şey taşınmıyor)" if dry_run else "COMMIT (gerçek taşıma başlıyor)"
    print(f"  SANTIS ROOT CLEANER | Mod: {mode}")
    print("=" * 60)

    if dry_run:
        print("\n  Arşiv klasörleri oluşturulacak:\n")
        setup_archive(dry_run=True)

    moves = collect_targets()

    if not moves:
        print("\n✅ Taşınacak dosya bulunamadı. Kök dizin temiz.")
        return

    print(f"\n  Tespit edilen {len(moves)} dosya:\n")
    for src, dest in moves:
        tag = "TAŞI" if not dry_run else "→"
        print(f"  [{tag}] {src.name:50s}  →  {dest.parent.name}/")

    if dry_run:
        print(f"\n💡 Onaylamak için: python clean_root.py --commit\n")
        return

    # ─── GERÇEK TAŞIMA ───────────────────────────────────────────
    print()
    setup_archive(dry_run=False)
    ok = 0
    fail = 0
    for src, dest in moves:
        try:
            if dest.exists():
                dest = dest.with_stem(dest.stem + "_dup")
            shutil.move(str(src), str(dest))
            print(f"  ✓ {src.name}")
            ok += 1
        except Exception as e:
            print(f"  ✗ {src.name} — HATA: {e}")
            fail += 1

    print()
    print("=" * 60)
    print(f"  Tamamlandı: {ok} taşındı, {fail} hata")
    print("=" * 60)
    print()

# ─── ENTRY ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    commit_mode = "--commit" in sys.argv
    run(dry_run=not commit_mode)
