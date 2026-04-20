import os
import re
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')
DIRS_TO_SCAN = ['tr', '.', 'de', 'en', 'fr', 'ru'] # '.' means root files
SKIP_DIRS = {'_legacy_archive','_legacy_content','_snapshots','backup','backups',
             'node_modules','admin','a4','components','venv','__pycache__',
             '.git','.vscode','_dev_archives','print','public','static','templates',
             'includes','reports','sr','assets'}

# Banned keywords that violate "Quiet Luxury"
BANNED_WORDS = [
    r'\bucuz\b', 
    r'\bindirim\b', 
    r'\bkampanya\b', 
    r'\bfırsat\b', 
    r'\bsatın al\b', 
    r'\bbedava\b',
    r'\bücretsiz\b', # Unless it's "ücretsiz iptal", but we flag it
    r'\bkaçırmayın\b',
    r'\bsok fiyat\b',
    r'\bsüper\b',
]

def scan_tone():
    html_files = []
    for dp, dn, fn in os.walk(ROOT):
        dn[:] = [d for d in dn if d not in SKIP_DIRS and not d.startswith('.')]
        for f in fn:
            if f.endswith('.html'):
                html_files.append(Path(dp) / f)

    violations = 0
    pages_with_violations = 0
    
    print("🔍 TONE HEALTH SCANNER BAŞLADI (SESSİZ LÜKS KONTROLÜ)...")
    print(f"{'-'*60}")
    
    for file_path in html_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except:
            continue
            
        soup = BeautifulSoup(content, 'html.parser')
        
        # We only want text within visible elements, not scripts or styles
        for script in soup(["script", "style"]):
            script.extract()
            
        text = soup.get_text()
        
        page_violations = []
        for word_pattern in BANNED_WORDS:
            matches = re.finditer(word_pattern, text, re.IGNORECASE)
            for m in matches:
                # Get context
                start = max(0, m.start() - 30)
                end = min(len(text), m.end() + 30)
                context = text[start:end].replace('\n', ' ').strip()
                page_violations.append((m.group(), context))
                
        if page_violations:
            rel_path = file_path.relative_to(ROOT)
            print(f"🔴 İHLAL BULUNDU: {rel_path}")
            for word, context in set(page_violations): # Use set to avoid duplicate identical contexts
                print(f"   Yaslı Kelime: '{word}' -> Kapsam: \"...{context}...\"")
            print()
            violations += len(page_violations)
            pages_with_violations += 1
            
    print(f"{'-'*60}")
    print("SONUÇLAR:")
    print(f"Taranan Sayfa Sayısı: {len(html_files)}")
    print(f"İhlal Bulunan Sayfa Sayısı: {pages_with_violations}")
    print(f"Toplam Yasaklı Kelime Geçişi: {violations}")

if __name__ == '__main__':
    scan_tone()
