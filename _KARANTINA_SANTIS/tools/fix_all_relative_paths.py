"""Fix ALL relative asset paths across JSON and JS files"""
import sys, os
from pathlib import Path

# Add scripts directory to sys.path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))
import sovereign_blueprint as bp

def main():
    parser = bp.create_blueprint_parser("Fix ALL relative asset paths across JSON and JS files")
    args = parser.parse_args()

    root = bp.resolve_root(__file__, args.root)
    
    targets = [
        root / "assets" / "data" / "global-trends.json",
        root / "assets" / "data" / "home_data.json",
        root / "assets" / "data" / "products-sothys.json",
        root / "assets" / "data" / "products-atelier.json",
        root / "data" / "site_content.json",
    ]

    total = 0
    print("--- FIX ALL RELATIVE PATHS ---")
    for f in targets:
        if not f.exists():
            print(f"[ATLANIYOR] Bulunamadi: {f.name}")
            continue
            
        content = f.read_text(encoding="utf-8", errors="ignore")
        
        old_count = 0
        for pattern in ['"assets/', "'assets/"]:
            c = content.count(pattern)
            if c > 0:
                replacement = pattern[0] + '/' + pattern[1:]
                content = content.replace(pattern, replacement)
                old_count += c
        
        if old_count > 0:
            # We bypass the string diff in bp.safe_write if it doesn't print exactly what we want,
            # but bp.safe_write will handle it well.
            bp.safe_write(f, content, apply=args.apply, backup=True)
            if args.apply:
                print(f"      └─> {old_count} relative path düzeltildi.")
            total += old_count
        else:
            print(f"[NO-OP] {f.name} (Degisiklik gerekmiyor)")

    if args.apply:
        print(f"\n[BILGI] Toplam düzeltilen yol: {total}")
    else:
        print(f"\n[DRY-RUN] Toplam bulunup düzeltilecek yol: {total} (Uygulamak icin --apply kullanin)")

if __name__ == "__main__":
    main()
