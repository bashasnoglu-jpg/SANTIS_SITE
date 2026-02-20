import os
import json
from pathlib import Path
from bs4 import BeautifulSoup

FAQ_SCHEMAS = {
    "tr/masajlar/index.html": [
        {
            "question": "Santis Club'ta hangi masaj türleri uygulanıyor?",
            "answer": "Santis Club'ta Klasik İsveç Masajı, Bali Masajı, Thai Masajı, Derin Doku (Deep Tissue), Aromaterapi ve Sıcak Taş gibi dünyaca ünlü masaj terapileri uzman terapistlerimiz tarafından uygulanmaktadır."
        },
        {
            "question": "Masaj süreleri ne kadar?",
            "answer": "Masaj sürelerimiz seçtiğiniz terapiye bağlı olarak genellikle 30, 50, 60 veya 90 dakika arasında değişiklik göstermektedir."
        },
        {
            "question": "Çiftler için özel masaj odalarınız var mı?",
            "answer": "Evet, çiftler için özel olarak tasarlanmış VIP masaj odalarımızda aynı anda terapi alarak 'Signature Couples' masaj deneyimimizin keyfini çıkarabilirsiniz."
        }
    ],
    "tr/hamam/index.html": [
        {
            "question": "Geleneksel Türk Hamamı ritüeli neleri kapsıyor?",
            "answer": "Geleneksel Türk Hamamı ritüelimiz; göbek taşında ısınma, ölü derilerden arınmayı sağlayan derinlemesine kese uygulaması ve ardından zeytinyağlı sabunla yapılan tamamen rahatlatıcı köpük masajını kapsar."
        },
        {
            "question": "Hamam kullanımında nelere dikkat etmeliyim?",
            "answer": "Hamam seansından önce fazla yemek yememenizi ve bol sıvı tüketmenizi öneririz. Yoğun bir kese uygulaması olacağı için seans öncesinde güneşlenmekten kaçınmak faydalı olacaktır."
        },
        {
            "question": "Hamam ritüeli ne kadar sürüyor?",
            "answer": "Kese ve köpük masajı ritüelimiz ortalama 30 ile 50 dakika arasında sürmektedir. Detaylı Osmanlı ritüelleri daha uzun sürebilir."
        }
    ],
    "tr/cilt-bakimi/index.html": [
        {
            "question": "Hangi marka cilt bakım ürünlerini kullanıyorsunuz?",
            "answer": "Santis Club olarak, dünyaca ünlü profesyonel cilt bakım markası Sothys Paris'in yüksek kaliteli ve klinik onaylı ürünlerini kullanmaktayız."
        },
        {
            "question": "Cilt bakımı için seans süresi nedir?",
            "answer": "Cildinizin ihtiyacına yönelik olarak hazırlanan bakım protokolleri ortalama 50 ile 60 dakika sürmektedir."
        },
        {
            "question": "Hassas veya akneli ciltler için bakımınız var mı?",
            "answer": "Kesinlikle. Cilt analizi sonrasında, hassasiyeti yatıştıran Sensitive Soothe veya akne/sebum dengeleyen Acne Balance gibi tamamen kişiselleştirilmiş protokoller uyguluyoruz."
        }
    ]
}

def generate_faq_jsonld(faq_list):
    main_entities = []
    for faq in faq_list:
        main_entities.append({
            "@type": "Question",
            "name": faq["question"],
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq["answer"]
            }
        })
        
    schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": main_entities
    }
    
    return json.dumps(schema, ensure_ascii=False, indent=2)

def inject_faq_schemas():
    root_dir = Path(".")
    injected_count = 0
    
    for relative_path, faq_list in FAQ_SCHEMAS.items():
        file_path = root_dir / Path(relative_path).as_posix()
        if not file_path.exists():
            # Try windows slashes
            file_path = root_dir / Path(relative_path.replace("/", os.sep))
            
        if not file_path.exists():
            print(f"Uyarı: {relative_path} bulunamadı, es geçiliyor.")
            continue
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        soup = BeautifulSoup(content, "html.parser")
        
        # Check if FAQPage already exists
        has_faq = False
        scripts = soup.find_all("script", type="application/ld+json")
        for script in scripts:
            if script.string and "FAQPage" in script.string:
                has_faq = True
                break
                
        if not has_faq:
            json_ld = generate_faq_jsonld(faq_list)
            script_tag = soup.new_tag("script", type="application/ld+json")
            script_tag.string = f"\n{json_ld}\n"
            
            head = soup.find("head")
            if head:
                head.append(script_tag)
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(str(soup))
                injected_count += 1
                print(f"✅ FAQ Schema Eklendi: {relative_path}")
                
    print(f"\n🚀 İşlem Tamamlandı. Toplam {injected_count} kategori (listing) sayfasına FAQ Schema entegre edildi.")

if __name__ == "__main__":
    inject_faq_schemas()
