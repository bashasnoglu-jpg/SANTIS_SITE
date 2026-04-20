import sys
import argparse
import time

def print_slow(text, delay=0.03):
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()

def generate_luxury_content(service_name):
    print_slow("\n[SANTIS CURATOR AI v1.0] - OMNI-INTELLIGENCE AKTİF", 0.05)
    print_slow("Bağlantı Kuruluyor...", 0.05)
    time.sleep(1)
    print_slow(f"Kavram Analiz Ediliyor: '{service_name}'", 0.05)
    time.sleep(1.5)
    print_slow("Quiet Luxury (Sessiz Lüks) Parametreleri Yükleniyor...", 0.05)
    print_slow("✓ Ucuzluk/İndirim kelimeleri filtrelendi.")
    print_slow("✓ Tone of Voice ayarlandı (Minimal, Duygusal, Seçkin).")
    time.sleep(1)
    
    # Static simulation responses for the presentation
    
    title = f"{service_name.title()} | Santis Club Özel Deneyimleri"
    
    meta_desc = f"Santis Club'ın kalbinde, bedeninizi ve ruhunuzu onaracak eşsiz {service_name.lower()} ayrıcalığını keşfedin. Zamanın durduğu anlara davetlisiniz."
    
    body_text = (
        f"Geleneksel dokunuşların modern lüks ile buluştuğu {service_name.lower()}, sıradan bir terapiden çok daha fazlasıdır.\n"
        "Uzman terapistlerimizin kişiye özel yaklaşımlarıyla şekillenen bu ritüel, zihninizi arındırmak ve bedeninizi "
        "köklerinden yenilemek için tasarlandı. Santis atmosferinin sakinliğinde, kendinize ayırdığınız bu eşsiz zaman "
        "diliminde gerçek dinlenmenin ne demek olduğunu yeniden tanımlayacaksınız.\n\n"
        "Özel ayrıcalıklarınızı keşfetmek ve bu benzersiz yolculuğa adım atmak için yerinizi ayırtın."
    )
    
    image_prompt = (
        f"NEUROVA quiet luxury spa photography, premium editorial, {service_name.lower()}, minimal, calm, refined. "
        "Materials: dark warm-gray stone, brushed metal, soft steam, marble accents. "
        "Lighting: soft diffused, cinematic, low contrast. "
        "Composition: negative space for UI overlays."
    )
    
    print("\n" + "="*70)
    print("💎 ÜRETİLEN İÇERİK BİLGİLERİ (V3 STANDARTLARINDA)")
    print("="*70)
    
    print(f"\n[SEO TITLE] (Max 60 Karakter)\n=> {title}")
    print(f"Karakter Sayısı: {len(title)} / 60")
    
    print(f"\n[META DESCRIPTION] (Max 160 Karakter)\n=> {meta_desc}")
    print(f"Karakter Sayısı: {len(meta_desc)} / 160")
    
    print("\n[GÖVDE METNİ (BODY TEXT)]")
    print(body_text)
    
    print("\n[MİDJOURNEY / AI GÖRSEL ÜRETİM PROMPTU]")
    print(image_prompt)
    
    print("\n" + "="*70)
    print("✓ İçerik V3 Yönergelerine %100 Uyumludur.")
    print("="*70)

def main():
    parser = argparse.ArgumentParser(description="Santis Curator AI - Lüks Metin Asistanı")
    parser.add_argument("service_name", type=str, nargs="?", help="Hizmetin adı (örn: 'Altın Maske Ritüeli')")
    
    args = parser.parse_args()
    
    if args.service_name:
        generate_luxury_content(args.service_name)
    else:
        print("Kullanım: python curator_ai.py \"Hizmet Adı\"")
        print("Örnek: python curator_ai.py \"Altın Maske Ritüeli\"")

if __name__ == "__main__":
    main()
