import os
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urljoin

BASE_URL = "https://santisclub.com"
SUPPORTED_LANGS = ["tr", "en", "de", "fr", "ru"]

def find_language_equivalents(html_paths_list):
    """
    Creates a mapping of equivalent pages across languages.
    Because paths might differ (e.g. tr/hakkimizda vs en/about), 
    we mapped them simply by looking up existing files if they match by name, 
    but for exact 13 pages, we might just inject generic ones or self-referencing defaults.
    Let's just use self-referencing canonicals + a basic EN/TR structure for hreflang.
    """
    pass

def fix_canonical_hreflang():
    root_dir = Path(".")
    exclude_dirs = {".git", "node_modules", "tools", "_tools", "logs", "reports", "core", "test", "tests", "_deploy_stage", "_build", "_backup", "assets", "data", "admin", "components", "_legacy_archive", "_legacy_content"}
    
    html_files = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs and not d.startswith('.')]
        for filename in filenames:
            if filename.endswith(".html"):
                html_files.append(Path(dirpath) / filename)

    modified_count = 0
    
    for file_path in html_files:
        rel_parts = file_path.relative_to(root_dir).parts
        if len(rel_parts) < 2:
            continue
            
        lang = rel_parts[0] if rel_parts[0] in SUPPORTED_LANGS else "tr"
        rel_path_str = "/".join(rel_parts)
        absolute_canonical_url = f"{BASE_URL}/{rel_path_str}"
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        soup = BeautifulSoup(content, "html.parser")
        head = soup.find("head")
        if not head:
            continue
            
        needs_save = False
        
        # 1. Check Canonical
        canonical_tag = soup.find("link", rel="canonical")
        if not canonical_tag:
            canonical_tag = soup.new_tag("link", rel="canonical", href=absolute_canonical_url)
            head.append(canonical_tag)
            needs_save = True
        elif canonical_tag.get("href") == "" or canonical_tag.get("href").startswith("/"):
            # Fix relative canonicals
            canonical_tag["href"] = absolute_canonical_url
            needs_save = True
            
        # 2. Check Hreflang
        # If it doesn't have an hreflang for itself, add basic hreflang
        hreflang_tags = soup.find_all("link", rel="alternate", hreflang=True)
        if len(hreflang_tags) == 0:
            # Inject basic self-referencing hreflang + x-default (usually English)
            # This solves the critical Google Search Console error for missing return tags
            
            # Self
            self_hreflang = soup.new_tag("link", rel="alternate", hreflang=lang, href=absolute_canonical_url)
            head.append(self_hreflang)
            
            # Try to build x-default by replacing the lang prefix with 'en' if possible
            if len(rel_parts) > 1 and rel_parts[0] in SUPPORTED_LANGS:
                en_parts = list(rel_parts)
                en_parts[0] = "en"
                en_rel_str = "/".join(en_parts)
                en_url = f"{BASE_URL}/{en_rel_str}"
                
                # Check if the EN file exists
                if os.path.exists(root_dir / Path(*en_parts)):
                    xdefault_hreflang = soup.new_tag("link", rel="alternate", hreflang="x-default", href=en_url)
                    head.append(xdefault_hreflang)
                else:
                    xdefault_hreflang = soup.new_tag("link", rel="alternate", hreflang="x-default", href=f"{BASE_URL}/en/")
                    head.append(xdefault_hreflang)
            
            needs_save = True
            
        if needs_save:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(str(soup))
            modified_count += 1
            print(f"✅ SEO Tagleri Eklendi/Düzeltildi: {file_path}")

    print(f"\n🚀 İşlem Tamamlandı. Toplam {modified_count} sayfanın Canonical ve Hreflang etiketleri optimize edildi.")

if __name__ == "__main__":
    fix_canonical_hreflang()
