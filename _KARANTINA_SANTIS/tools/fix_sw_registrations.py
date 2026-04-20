import os
import re
from pathlib import Path

def consolidate_sw_registrations():
    # Aranacak hatalı kayıt kalıpları (Bu kayıt noktalarını tamamen SİLİYORUZ)
    patterns = [
        r"navigator\.serviceWorker\.register\(['\"]/?[a-z0-9\-_\./]*sw\.js['\"]\)[^;]*;?",
        r"navigator\.serviceWorker\.register\(['\"]/?[a-z0-9\-_\./]*service-worker\.js['\"]\)[^;]*;?"
    ]
    
    root_dir = Path(__file__).resolve().parents[1]
    fixed_count = 0

    print(f"🚀 Kök Dizin Taranıyor: {root_dir}")

    # Sadece belli dosya tipleri taranacak
    for ext in ['*.html', '*.js']:
        for file_path in root_dir.rglob(ext):
            path_str = str(file_path).replace("\\", "/")
            if "node_modules" in path_str or "archive" in path_str or "_backup" in path_str:
                continue
            
            # santis-bootloader.js ve santis-sw.js yollarını atla
            if "santis-bootloader.js" in path_str or "santis-sw.js" in path_str or file_path.name == "sw.js" or "tools/" in path_str or "scratch/" in path_str:
                continue
                
            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                new_content = content
                
                # Bütün register çağrılarını devre dışı bırak
                for pattern in patterns:
                    new_content = re.sub(pattern, "// [Sovereign OS] Legacy SW Registration Removed", new_content)
                
                if content != new_content:
                    file_path.write_text(new_content, encoding="utf-8")
                    print(f"✅ Düzeltildi: {path_str}")
                    fixed_count += 1
            except Exception as e:
                print(f"⚠️ Dosya okunamadı {file_path.name}: {e}")

    print(f"\n🎯 Toplam {fixed_count} dosyadaki eski Service Worker kaydı temizlendi.")

if __name__ == "__main__":
    consolidate_sw_registrations()
