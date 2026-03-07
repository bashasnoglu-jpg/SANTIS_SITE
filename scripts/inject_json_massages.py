import json
import os

assets_json_path = "c:/Users/tourg/Desktop/SANTIS_SITE/assets/data/services.json"

new_services = [
    {
        "id": "mass-bali-aroma",
        "categoryId": "massage-asian",
        "name": "Balinesische Aroma Massage",
        "duration": 60,
        "price": {"amount": 60, "currency": "€"},
        "media": {"hero": "santis_card_massage_oil_v2.webp"},
        "img": "/assets/img/cards/santis_card_massage_oil_v2.webp",
        "slug": "bali-aroma-masaji",
        "tags": [],
        "content": {
            "tr": {
                "title": "Bali Aroma Masajı",
                "shortDesc": "Geleneksel Bali dokunuşlarının sıcak aromatik yağlarla harmanlandığı derin bir rahatlama.",
                "fullDesc": "Kas gerginliklerini rahatlatan ve ruhunuzu şımartan Bali tarzı aromaterapi masajı.",
                "tagline": "Duyusal Uyanış",
                "heroTitle": "Bali'nin Aromatik Şifası",
                "intro": "Bali'nin geleneksel iyileştirme bilgeliğini aromatik yağların rahatlatıcı gücüyle birleştiren bu terapi, beden ve zihni mükemmel bir dengeye kavuşturur.",
                "steps": [
                    "Sıcak aromatik yağlarla karşılama ritüeli",
                    "Geleneksel Bali baskı ve sıvazlama teknikleri",
                    "Aroma esanslarının cilde derinlemesine nüfuzu",
                    "Ruhsal ve bedensel arınma"
                ],
                "effects": "Kan dolaşımını hızlandırır, hücreleri yeniler ve derin bir dinginlik sağlar.",
                "idealFor": "Stresli dönemlerden geçenler ve ruhsal denge arayanlar.",
                "signature": "Santis, terapötik ustalığı duyusal spa lüksüyle buluşturur."
            },
            "de": {
                "title": "Balinesische Aroma Massage",
                "shortDesc": "Tiefe Entspannung mit warmen, aromatischen Ölen und traditionellen balinesischen Griffen.",
                "fullDesc": "Balinesische Aromatherapie-Massage zur Lösung von Muskelverspannungen und Pflege der Seele."
            }
        }
    },
    {
        "id": "mass-bali-fuss",
        "categoryId": "massage-asian",
        "name": "Balinesische Fußmassage",
        "duration": 30,
        "price": {"amount": 30, "currency": "€"},
        "media": {"hero": "santis_card_massage_oil_v2.webp"},
        "slug": "bali-ayak-masaji",
        "tags": [],
        "content": {
            "tr": {
                "title": "Bali Ayak Masajı",
                "shortDesc": "Ayaklardaki yorgunluğu özel Bali teknikleriyle alan bölgesel rahatlama.",
                "fullDesc": "Ayak ve alt bacak bölgesindeki gerginliği hedefleyen odaklanmış Bali terapisi.",
                "tagline": "Hafifleyen Adımlar",
                "heroTitle": "Bali'nin Odaklanmış Dokunuşu",
                "intro": "Tüm günün yükünü taşıyan ayaklarınız için özel olarak tasarlanmış bu terapi, Bali teknikleriyle derin bir hafifleme sağlar.",
                "steps": [
                    "Sıcak kompres ile ayak ve bacak kaslarının ısıtılması",
                    "Bali teknikleriyle lokal basınç uygulaması",
                    "Ayak tabanından başlayıp dize kadar uzanan rahatlama",
                    "Nöral rahatlama ve gevşeme süreci"
                ],
                "effects": "Ayaklardaki ödemi azaltır, kan dolaşımını rahatlatır ve yorgunluğu yok eder.",
                "idealFor": "Gününü ayakta geçirenler ve bölgesel bir rahatlama arayanlar.",
                "signature": "Santis, terapötik ustalığı duyusal spa lüksüyle buluşturur."
            },
            "de": {
                "title": "Balinesische Fußmassage",
                "shortDesc": "Spezielle balinesische Techniken für müde Füße und Waden.",
                "fullDesc": "Gezielte Balinesische Therapie gegen Spannungen in Füßen und Unterschenkeln."
            }
        }
    },
    {
        "id": "mass-thai-aroma",
        "categoryId": "massage-asian",
        "name": "Thai Aroma Massage",
        "duration": 60,
        "price": {"amount": 70, "currency": "€"},
        "media": {"hero": "santis_card_massage_v1.webp"},
        "slug": "thai-aroma-masaji",
        "tags": [],
        "content": {
            "tr": {
                "title": "Thai Aroma Masajı",
                "shortDesc": "Thai esneme hareketleri ve sıcak bitkisel yağların benzersiz sentezi.",
                "fullDesc": "Esnekliği artırırken aroma yağlarıyla ruhu dinlendiren melez bir terapi.",
                "tagline": "Esneklik & Dinginlik",
                "heroTitle": "Tayland'ın Özgürleştiren Esintisi",
                "intro": "Thai masajının esneten dinamizmi ile aromaterapinin yatıştırıcı etkisini tek bir seansla deneyimleyin.",
                "steps": [
                    "Aromatik yağların vücuda uygulanması",
                    "Enerji meridyenleri boyunca ritmik baskılar",
                    "Kasları nazikçe açan esneme hareketleri",
                    "Esneklik kazanmış ve dinlenmiş bir bedenle bitiş"
                ],
                "effects": "Eklemleri açar, esneklik kazandırır ve aromatik etkiyle mental yorgunluğu yok eder.",
                "idealFor": "Hem esnemek hem de rahatlamak isteyenler.",
                "signature": "Santis, terapötik ustalığı duyusal spa lüksüyle buluşturur."
            },
            "de": {
                "title": "Thai Aroma Massage",
                "shortDesc": "Einzigartige Synthese aus Thai-Dehnungen und warmen Aromaölen.",
                "fullDesc": "Eine Hybridtherapie, die die Flexibilität fördert und mit Aromaölen die Seele beruhigt."
            }
        }
    },
    {
        "id": "mass-thai-fuss",
        "categoryId": "massage-asian",
        "name": "Thai Fußreflexzonenmassage",
        "duration": 30,
        "price": {"amount": 35, "currency": "€"},
        "media": {"hero": "santis_card_massage_oil_v2.webp"},
        "slug": "thai-ayak-masaji",
        "tags": [],
        "content": {
            "tr": {
                "title": "Thai Ayak Masajı",
                "shortDesc": "Özel Thai ahşap çubuklarıyla uygulanan refleksoloji sanatı.",
                "fullDesc": "Ayak tabanındaki organ refleks noktalarına Thai ahşap çubuğuyla uygulanan dengeleyici masaj.",
                "tagline": "İçsel Denge & Canlanma",
                "heroTitle": "Uzakdoğunun Denge Sırrı",
                "intro": "Ayaklarınızın altındaki yüzlerce sinir ucuna Thai ahşap çubuğuyla yapılan milimetrik dokunuşlarla bedeninizi yeniden dengeleyin.",
                "steps": [
                    "Ayakların ılık su ve bitki özleriyle yıkanması",
                    "Ahşap çubuk yardımıyla özel refleks noktalarının uyarılması",
                    "Alt bacak kaslarına el ile rahatlatıcı baskı",
                    "Uyumlanmış bir enerjiyle seansın tamamlanması"
                ],
                "effects": "Sinir sistemini uyarır, iç organların enerji akışını düzenler ve kan dolaşımını hızlandırır.",
                "idealFor": "Enerji akışında blokaj hissedenler ve uzakdoğu tarzı güçlü bir ayak masajı arayanlar.",
                "signature": "Santis, terapötik ustalığı duyusal spa lüksüyle buluşturur."
            },
            "de": {
                "title": "Thai Fußreflexzonenmassage",
                "shortDesc": "Reflexzonenmassage mit traditionellen Thai-Holzstäbchen.",
                "fullDesc": "Ausgleichende Massage der Organ-Reflexzonen an der Fußsohle mittels Thai-Holzstäbchen."
            }
        }
    }
]

def main():
    try:
        with open(assets_json_path, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
            
        print(f"Loaded {len(data)} items from assets/data/services.json")
        
        # Check if already exist
        existing_ids = {item["id"] for item in data}
        
        added = 0
        for svc in new_services:
            if svc["id"] not in existing_ids:
                data.append(svc)
                added += 1
                
        if added > 0:
            with open(assets_json_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Added {added} missing massages successfully.")
        else:
            print("Massages already exist in assets/data/services.json.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
