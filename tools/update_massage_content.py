import json
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Go up one level from tools/
SERVICES_JSON_PATH = os.path.join(BASE_DIR, "assets", "data", "services.json")
PRODUCT_DATA_JS_PATH = os.path.join(BASE_DIR, "assets", "js", "product-data.js")

print(f"Reading from: {SERVICES_JSON_PATH}")

def update_content():
    try:
        with open(SERVICES_JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Updates to apply
        updates = {
            "mass-antistress": {
                "title": "Anti-Stress Masajı",
                "shortDesc": "Zihni susturan, ruhu dinlendiren yumuşak terapi.",
                "fullDesc": "Yavaş, ritmik ve nazik hareketlerle sinir sistemini yatıştıran özel bir seans.",
                "tagline": "Zihinsel Durgunluk & Dinginlik",
                "heroTitle": "Zihnin Sessizliğe Kavuşması",
                "intro": "Modern yaşamın hızlı temposuna bir \"dur\" deyin. Bu masaj, kaslardan ziyade sinir sistemini hedefler; sizi meditatif bir dinginliğe davet eder.",
                "steps": [
                    "Baş ve boyun bölgesine odaklanan sakinleştirici başlangıç",
                    "Sinir uçlarını yatıştıran uzun ve yumuşak sıvazlamalar",
                    "Ritmik hareketlerle bedenin uyku moduna geçişi",
                    "Tamamen dinginleşmiş bir zihinle uyanış"
                ],
                "effects": "Kortizol (stres) seviyesini düşürür, anksiyeteyi hafifletir ve derin bir huzur hissi verir. Uykusuzluk çekenler için birebirdir.",
                "idealFor": "Yoğun stres altında çalışanlar ve zihinsel yorgunluk hissedenler.",
                "signature": "Santis, terapötik ustalığı duyusal spa lüksüyle buluşturur."
            },
            "mass-anticellulite": {
                "title": "Selülit Masajı",
                "shortDesc": "Pürüzsüz bir siluet için dinamik dokunuş.",
                "fullDesc": "Kan dolaşımını hızlandırarak doku görünümünü iyileştiren, sıkılaştırıcı masaj.",
                "tagline": "Sıkılaşma & Pürüzsüz Doku",
                "heroTitle": "Cildin Işıltılı Dönüşümü",
                "intro": "Dolaşım sistemini harekete geçiren özel tekniklerle cildinize yeniden form kazandırın. Bu masaj, sadece estetik değil, doku sağlığı için de canlandırıcıdır.",
                "steps": [
                    "Sorunlu bölgelere odaklanan ısınma hareketleri",
                    "Kan akışını hızlandıran yoğurma ve yuvarlama teknikleri",
                    "Lenfatik akışı destekleyen yönlendirilmiş baskılar",
                    "Canlanmış ve ısınmış doku hissi"
                ],
                "effects": "Dokulardaki ödemin atılmasına yardımcı olur, portakal kabuğu görünümünü hafifletir ve cildin daha sıkı, elastik görünmesini sağlar.",
                "idealFor": "Vücut sıkılaştırma programında olanlar ve bölgesel incelme hedefleyenler.",
                "signature": "Santis, terapötik ustalığı duyusal spa lüksüyle buluşturur."
            }
        }

        count = 0
        for item in data:
            if item.get("id") in updates:
                print(f"Updating {item['id']}...")
                if "content" not in item:
                    item["content"] = {}
                item["content"]["tr"] = updates[item["id"]]
                count += 1
        
        print(f"Updated {count} items.")

        # Save services.json
        with open(SERVICES_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print("Saved services.json")

        # Save product-data.js
        js_content = f"window.productCatalog = {json.dumps(data, ensure_ascii=False, indent=4)};"
        with open(PRODUCT_DATA_JS_PATH, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print("Saved product-data.js")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_content()
