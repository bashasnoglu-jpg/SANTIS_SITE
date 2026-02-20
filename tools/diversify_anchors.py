import os
import random
from pathlib import Path
from bs4 import BeautifulSoup

# Define targets and their natural LSI (Latent Semantic Indexing) variations
ANCHOR_VARIATIONS = {
    "Santis Club Masaj": [
        "Santis Club Masaj", # keep original sometimes
        "Antalya lüks masaj deneyimi",
        "Santis spa & masaj terapileri",
        "Profesyonel masaj uygulamaları",
        "Santis rahatlatıcı masaj",
        "Antalya ödüllü spa ritüelleri",
        "Bütünsel masaj deneyimi"
    ],
    "Rezervasyon Yap": [
        "Rezervasyon Yap",
        "Hemen Randevu Alın",
        "Spa Deneyiminizi Ayırtın",
        "Bize Ulaşın",
        "Online Rezervasyon",
        "Terapinizi Planlayın",
        "Yerinizi Ayırtın"
    ],
    "Detaylı Bilgi": [
        "Detaylı Bilgi",
        "Daha Fazla Bilgi Edinin",
        "Tüm Detayları İnceleyin",
        "Terapinin İşleyişi",
        "Bakım Detaylarını Görün",
        "Neler İçerir?"
    ],
    "Masajlar": [
        "Masajlar",
        "Terapötik Masaj Çeşitleri",
        "Rahatlatıcı Masaj Bakımları",
        "Dünya Masajları Özel Koleksiyonu",
        "Gevşetici Beden Terapileri"
    ]
}

def diversify_anchor_texts():
    root_dir = Path(".")
    exclude_dirs = {".git", "node_modules", "tools", "_tools", "logs", "reports", "core", "test", "tests", "_deploy_stage", "_build", "_backup", "assets", "data", "admin", "components", "_legacy_archive", "_legacy_content"}
    
    html_files = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs and not d.startswith('.')]
        for filename in filenames:
            if filename.endswith(".html"):
                html_files.append(Path(dirpath) / filename)

    modified_count = 0
    total_anchors_changed = 0
    
    for file_path in html_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        soup = BeautifulSoup(content, "html.parser")
        needs_save = False
        
        # We only want to look at <a> tags that have exact text matches
        links = soup.find_all("a")
        for a in links:
            if a.string:
                original_text = a.string.strip()
                # Check if it matches our strictly over-optimized targets
                for target, variations in ANCHOR_VARIATIONS.items():
                    if original_text == target:
                        # 40% chance to diversify, 60% chance to keep the original (to maintain some consistency but break the exact-match spam pattern)
                        if random.random() < 0.40:
                            new_text = random.choice(variations)
                            if new_text != original_text:
                                a.string = new_text
                                needs_save = True
                                total_anchors_changed += 1

        if needs_save:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(str(soup))
            modified_count += 1

    print(f"\n✅ İşlem Tamamlandı. Toplam {modified_count} dosyada {total_anchors_changed} çapa metni (Anchor Text) daha doğal LSI varyasyonlarıyla değiştirildi.")

if __name__ == "__main__":
    diversify_anchor_texts()
