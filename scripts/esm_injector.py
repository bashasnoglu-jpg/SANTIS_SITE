import re
from pathlib import Path

# SANTIS Sovereign Build - DEBT-001 ESM Bulk Injector
TARGET_DIRS = ["admin", "tr"]
ROOT_DIR = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE")


def process_html_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Hedef: <script src="..."> veya <script defer src="..."> (Eğer type="module" veya benzeri değilse)
        # Sadece src barındıran tagleri izole etmek

        # Regex mantığı: type="module" içermeyen script taglerine mühür at
        # Ayrıca harici cdn / dışarıdan yüklenen 3. partilere atılabilir, Vite sorun etmez
        # Fakat biz yine de asset ve src içerenleri modifiye edelim.

        def replacer(match):
            tag = match.group(0)
            if 'type="module"' in tag or "type='module'" in tag:
                return tag  # Zaten modül
            if "src=" not in tag:
                return tag  # Sadece inline script

            # Script taginin başına type="module" ekle
            new_tag = tag.replace("<script ", '<script type="module" ')
            return new_tag

        pattern = r"<script\b[^>]*>"
        new_content = re.sub(pattern, replacer, content)

        if new_content != content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            return True
        return False
    except Exception as e:
        print(f"[ERROR] Dosya işlenemedi: {file_path} - {e}")
        return False


def main():
    print("🚀 [DEBT-001] Legacy ESM Bulk Injector başlatıldı...")
    modified_count = 0
    scanned_count = 0

    for d in TARGET_DIRS:
        target_path = ROOT_DIR / d
        if not target_path.exists():
            print(f"Uyarı: {target_path} bulunamadı, atlanıyor.")
            continue

        for path in target_path.rglob("*.html"):
            scanned_count += 1
            if process_html_file(path):
                modified_count += 1

    print(
        f"✅ Tarama tamamlandı. Taranan: {scanned_count} | Yapılandırılan (ESM Mührü Basılan): {modified_count}"
    )


if __name__ == "__main__":
    main()
