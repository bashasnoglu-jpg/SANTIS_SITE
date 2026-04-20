import os
import re
from collections import Counter

# --- KONFİGÜRASYON ---
TARGET_EXTENSIONS = (".html", ".css", ".js", ".scss", ".vue")
IGNORE_DIRS = ["node_modules", ".git", "dist", "build"]

# --- REGEX DESENLERİ ---
# font-family: "Santis Sans", ... veya font-family: 'Santis Sans'
FONT_FAMILY_RE = re.compile(r"font-family:\s*['\"]?([^;'\"]+)['\"]?")
# <link href="...fonts.googleapis.com...">
EXTERNAL_FONT_RE = re.compile(
    r'href=["\'](https?://(?:fonts\.googleapis\.com|use\.typekit\.net|fonts\.gstatic\.com)[^"\']+)["\']'
)
# @import url(...)
IMPORT_FONT_RE = re.compile(
    r"@import\s+(?:url\()?['\"]?([^;'\"]*fonts\.[^;'\"]+)['\"]?\)?"
)
# font-weight: 600
FONT_WEIGHT_RE = re.compile(r"font-weight:\s*(\d+)")


def audit_typography(root_path):
    report = {
        "external_links": [],
        "font_families": Counter(),
        "font_weights": Counter(),
        "files_scanned": 0,
        "anomalies": [],
    }

    print(f"🚀 [Santis Audit] Tarama başlatılıyor: {root_path}")

    for root, dirs, files in os.walk(root_path):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            if file.endswith(TARGET_EXTENSIONS):
                report["files_scanned"] += 1
                file_path = os.path.join(root, file)

                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()

                        # Dış linkleri yakala
                        ext_links = EXTERNAL_FONT_RE.findall(content)
                        if ext_links:
                            report["external_links"].extend(ext_links)
                            report["anomalies"].append(f"CDN Linki: {file_path}")

                        # Importları yakala
                        imports = IMPORT_FONT_RE.findall(content)
                        if imports:
                            report["external_links"].extend(imports)
                            report["anomalies"].append(
                                f"@import Tespit Edildi: {file_path}"
                            )

                        # Font ailelerini yakala
                        families = FONT_FAMILY_RE.findall(content)
                        for fam in families:
                            # Virgülle ayrılmış font stack'inden ilkini (ana fontu) al
                            main_font = (
                                fam.split(",")[0]
                                .strip()
                                .replace('"', "")
                                .replace("'", "")
                            )
                            report["font_families"][main_font] += 1

                        # Ağırlıkları yakala
                        weights = FONT_WEIGHT_RE.findall(content)
                        for w in weights:
                            report["font_weights"][w] += 1

                except Exception as e:
                    print(f"⚠️ Dosya okuma hatası ({file}): {e}")

    return report


def print_report(data):
    print("\n" + "=" * 50)
    print("📊 SANTIS TİPOGRAFİ DENETİM RAPORU")
    print("=" * 50)
    print(f"✅ Taranan Dosya Sayısı: {data['files_scanned']}")

    print("\n🌐 DIŞ KAYNAKLI FONT BAĞLANTILARI (Kapatılmalı):")
    if data["external_links"]:
        for link in set(data["external_links"]):
            print(f"  - {link}")
    else:
        print("  - Temiz! (Dış link bulunamadı)")

    print("\n🖋️ KULLANILAN FONT AİLELERİ (Envanter):")
    for fam, count in data["font_families"].most_common():
        print(f"  - {fam}: {count} kez tanımlanmış")

    print("\n⚖️ FONT AĞIRLIK DAĞILIMI (Weight Matrix):")
    for weight, count in sorted(data["font_weights"].items()):
        print(f"  - {weight}: {count} kullanım")

    print("\n🚨 KRİTİK DOSYALAR (Müdahale Gerekenler):")
    if data["anomalies"]:
        for anomaly in set(data["anomalies"][:15]):  # İlk 15'i göster
            print(f"  - {anomaly}")
    else:
        print("  - Mükemmel! Tüm fontlar yerel (self-hosted) görünüyor.")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    # Scriptin bulunduğu dizinden başla
    current_dir = os.getcwd()
    audit_data = audit_typography(current_dir)
    print_report(audit_data)
