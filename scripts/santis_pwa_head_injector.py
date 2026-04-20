import sys, os, re
from pathlib import Path

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sovereign_blueprint as bp

PWA_TAGS = """
    <!-- Sovereign OS PWA Identity Layer -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#0a0a0a">
    <link rel="apple-touch-icon" href="/assets/icons/icon-192.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
"""

def inject_pwa_tags(html_content: str) -> str:
    # Eger zaten PWA katmani varsa dokunma (basit kontrol)
    if "rel=\"manifest\"" in html_content and "theme-color" in html_content:
        return html_content
    
    # </head> formatlarina karsi regex (bosluklari tolere etmek icin)
    head_close_pattern = re.compile(r'(</head>)', re.IGNORECASE)
    
    if head_close_pattern.search(html_content):
        # Insert tags exactly before </head>
        return head_close_pattern.sub(f"{PWA_TAGS}\\1", html_content)
    
    return html_content

def main():
    parser = bp.create_blueprint_parser("Sovereign PWA Head Injector")
    args = parser.parse_args()

    root = bp.resolve_root(__file__, args.root)
    
    # Tüm subfolderlardaki HTML leri tara (node_modules vb. haric tut)
    skip_dirs = {".git", "node_modules", "venv", "__pycache__", "dist", "tmp"}
    
    html_files = []
    for filepath in root.rglob("*.html"):
        if not any(part in skip_dirs for part in filepath.parts):
            html_files.append(filepath)

    total_injected = 0
    print("--- SOVEREIGN PWA HEAD INJECTOR ---")
    
    for f in html_files:
        content = f.read_text(encoding="utf-8", errors="ignore")
        new_content = inject_pwa_tags(content)
        
        if new_content != content:
            bp.safe_write(f, new_content, apply=args.apply, backup=True)
            total_injected += 1

    if args.apply:
        print(f"\n[BILGI] Toplam Enjekte Edilen Sayfa: {total_injected}")
    else:
        print(f"\n[DRY-RUN] Toplam Enjekte Edilecek Sayfa: {total_injected} (Uygulamak icin --apply kullanin)")

if __name__ == "__main__":
    main()
