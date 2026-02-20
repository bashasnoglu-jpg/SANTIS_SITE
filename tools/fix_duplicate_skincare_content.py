import os
import json
import re

skincare_unique_data = {
    "acne-balance": {
        "steps": [
            "Cildi yatıştıran yeşil çay özlü ılık kompresle ön hazırlık",
            "Gözenekleri derinlemesine arındıran salisilik asit bazlı nazik temizlik",
            "Sebum dengesini sağlayan özel kil maskesi ve dingin bekleme süresi",
            "Botanikal serumlarla nemlendirme ve kızarıklık giderici son dokunuş"
        ],
        "effects": "Ciltteki enflamasyonu ve kızarıklığı yatıştırır, fazla sebumu kontrol altına alır ve sivilce oluşumunu engeller. Taze, dengeli ve mat bir bitiş sağlar.",
        "tagline": "Denge & Pürüzsüzlük"
    },
    "anti-aging-pro": {
        "steps": [
            "Hücre yenilenmesini tetikleyen nazik ısıl işlem",
            "İnce çizgileri hedef alan yoğun peptit içerikli serum uygulaması",
            "Kolajen üretimini destekleyen lifting etkili manuel yüz masajı",
            "Sıkılaştırıcı altın maske ve yaşlanma karşıtı zengin krem ile tamamlama"
        ],
        "effects": "Yüz ovalini toparlar, ince çizgi ve kırışıklık görünümünü azaltır. Hücresel yenilenmeyi hızlandırarak cilde genç, dolgun ve pürüzsüz bir görünüm kazandırır.",
        "tagline": "Zamanı Geri Alan Dokunuş"
    },
    "barrier-repair": {
        "steps": [
            "Hassas ciltlere özel formüle edilmiş mikrobiyom dostu temizlik",
            "Cilt bariyerini onaran seramid yüklü yatıştırıcı serum uygulaması",
            "Kızarıklığı alan ve cildi saran serinletici probiyotik maske",
            "Cildi dış etkenlere karşı zırhlayan yoğun nem kalkanı"
        ],
        "effects": "Zarar görmüş veya hassaslaşmış cilt bariyerini onarır. Çevresel faktörlere karşı cildi güçlendirir, kronik kızarıklığı ve gerginlik hissini anında giderir.",
        "tagline": "Koruma Kalkanı & Derin Onarım"
    },
    "brightening-spot": {
        "steps": [
            "Cilt tonunu eşitlemeye yönelik hafif asidik arındırıcı tonik",
            "Lekeleri hedefleyen yoğun C vitamini ve Niasinamid infüzyonu",
            "Hücresel aydınlanma sağlayan Oksijen maskesi",
            "Melanin üretimini baskılayan aydınlatıcı losyon ile bitiş"
        ],
        "effects": "Güneş, yaşlılık veya akne sonrası oluşan leke görünümlerini hafifletir. Cilt tonunu eşitler ve donuk görünümü silip yerine berrak, ışıltılı bir cilt bırakır.",
        "tagline": "Porselen Berraklığı & Işıltı"
    },
    "classic-facial": {
        "steps": [
            "Cilt yapısına uygun botanik süt ile rahatlatıcı yüz temizliği",
            "Buhar banyosu eşliğinde ölü derilerden arındıran hafif peeling",
            "Yüz kaslarını gevşeten ritmik ve akıcı rahatlama masajı",
            "Nemlendirici besin maskesi ve tazeleyici tonik ile final"
        ],
        "effects": "Cildin temel nem ve temizlik ihtiyacını karşılar. Gözeneklerin nefes almasını sağlayarak yorgunluk hissini siler, doğal bir pembelik ve yumuşaklık kazandırır.",
        "tagline": "Klasik Zarafet & Temel Bakım"
    },
    "collagen-lift": {
        "steps": [
            "Dolaşımı hızlandıran canlandırıcı mikro-masaj",
            "Saf deniz kolajeni ve elastin ampullerinin cilde doyurulması",
            "Doku sıkılaşmasını tetikleyen özel kaldırma (lifting) ritüeli",
            "Sıkılaşmayı mühürleyen termo-aktive edici özel maske"
        ],
        "effects": "Elastikiyetini kaybetmiş cildi toparlar, sıkılaşma ve anında lifting (gerginlik) etkisi yaratır. Yüz hatları daha belirgin, doku ise daha dolgun hissedilir.",
        "tagline": "Sıkılık & Gençlik Aşısı"
    },
    "deep-cleanse": {
        "steps": [
            "Ozonlu buhar ile gözeneklerin derinden açılması ve yumuşatılması",
            "Ultrasonik spatula veya manuel tekniklerle siyah nokta temizliği",
            "Gözenekleri anında sıkılaştıran soğuk kompres ve arındırıcı tonik",
            "Bakteri oluşumunu engelleyen dengeleyici yüksek frekans uygulaması"
        ],
        "effects": "Tıkanmış gözenekleri ve komedonları tamamen temizler. Cildin oksijen kapasitesini artırarak daha berrak, nefes alan ve pürüzsüz bir ten dokusu yaratır.",
        "tagline": "Saf Nefes & Derin Arınma"
    },
    "detox-charcoal": {
        "steps": [
            "Cilt yüzeyindeki toksinleri bağlayan aktif bambu kömürü temizliği",
            "Detoksifikasyonu hızlandıran lenfatik drenaj destekli masaj",
            "Ağır metalleri ve kirliliği çeken siyah kil maskesi",
            "Hücrelere canlılık veren antioksidan zengini su bazlı nemlendirici"
        ],
        "effects": "Şehir kirliliği, stres ve makyaj kalıntılarının yarattığı matlığı ve toksin birikimini siler. Cildi tıkanıklıklardan arındırarak sağlıklı bir canlanma sağlar.",
        "tagline": "Şehir Detoksu & Yenilenme"
    },
    "enzyme-peel": {
        "steps": [
            "Cildi hazırlayan ve pH dengesi sağlayan papatya özlü tonik",
            "Meyve enzimleri (Papaya ve Ananas) içeren aktif peeling jel uygulaması",
            "Ölü hücrelerin enzimatik yolla parçalanması için buharlı masaj",
            "Enzimleri nötralize eden, hücre yenileyici ipek maskesi"
        ],
        "effects": "Fiziksel aşındırma yapmadan (granülsüz) ölü deri hücrelerini nazikçe yok eder. Hassas ciltlerde bile güvenle kullanılabilen, anında parlatıcı bir etki sunar.",
        "tagline": "Nazik Yenilenme & Botanik Işıltı"
    },
    "eye-contour": {
        "steps": [
            "Göz çevresine özel, yatıştırıcı çift fazlı misel temizleyici",
            "Şişlikleri indiren soğuk yeşim taşı (jade roller) ile mikrodolaşım masajı",
            "İnce çizgi ve morluk hedefli hyalüronik ve kafein bazlı serum dolgusu",
            "Gözleri dinlendiren, yorgunluk alıcı altın göz maskesi uygulaması"
        ],
        "effects": "Göz altı torbalanmalarını, koyu halkaları ve kaz ayaklarını gözle görülür şekilde azaltır. Daha uyanık, aydınlık ve genç bir bakış kazandırır.",
        "tagline": "Aydınlık Bakışlar & Göz Çevresi Terapisi"
    },
    "glass-skin": {
        "steps": [
            "Cildi pürüzsüzleştiren ve aydınlatan çift aşamalı (yağ ve su bazlı) temizlik",
            "Işığı yansıtma kapasitesini artıran fermente pirinç özlü mikro-peeling",
            "Cilde yoğun su dolgunluğu sağlayan hyalüronik ve inci tozu serumu",
            "Cildi cam gibi parlatan, jel tabanlı aydınlatıcı katman maskesi"
        ],
        "effects": "Kore güzellik ritüellerinden ilham alan bu bakım, gözenek görünümünü minimize eder. Cilde içeriden gelen su bazlı, şeffaf ve cam gibi yansımalı bir ışıltı verir.",
        "tagline": "Porselen Pürüzsüzlüğü & Kristal Parlaklık"
    },
    "gold-mask-ritual": {
        "steps": [
            "Hücresel iletişimi artıran lüks hücre yenileyici ılık losyon",
            "24 Ayar saf altın yapraklarının cilde tek tek işlenmesi",
            "Işıltıyı hücrelere kilitleyen altın ve havyar özlü bağlayıcı masaj",
            "Cildi muazzam bir pürüzsüzlüğe ulaştıran altın mühürleme serumu"
        ],
        "effects": "Altının iyonik özellikleri ile cilt dokusunu yeniler, kan akışını hızlandırarak erken yaşlanmayı yavaşlatır. Muhteşem bir lüks hissi ve kraliyet ışıltısı bırakır.",
        "tagline": "Saf Lüks & 24 Ayar Işıltı"
    },
    "hyaluron-hydrate": {
        "steps": [
            "Moleküler su bağlayıcı hafif temizleme köpüğü",
            "Farklı molekül ağırlıklı hyalüronik asit serilerinin katmanlı infüzyonu",
            "Nem emilimini en üst seviyeye çıkaran serinletici buz küresi masajı",
            "Ciltte bir su havuzu oluşturan, yoğun nem tutucu hidrojel maske"
        ],
        "effects": "Cildin alt katmanlarına kadar inerek dehidrasyonu (susuzluğu) yok eder. Nemsizlikten kaynaklanan ince çizgileri anında doldurur, cildi neme doyurur ve dolgunlaştırır.",
        "tagline": "Derin Nem & Su Terapisi"
    },
    "led-rejuvenation": {
        "steps": [
            "LED dalgalarına karşı cildi hazırlayan şeffaf ışık iletken jel",
            "Cilt problemine göre seçilen (Kırmızı, Mavi veya Yeşil) Fototerapi uygulaması",
            "Hücresel ATP üretiminin uyarılması için 20 dakikalık işıksal şifa seansı",
            "Işık terapisinin etkisini mühürleyen hücresel onarım kremi"
        ],
        "effects": "Işık spektrumu sayesinde iğnesiz ve ağrısız hücresel yenilenme sağlar. Kırmızı ışık kolajeni uyarır, mavi ışık bakterileri yok eder, yeşil ışık ton eşitsizliklerini giderir.",
        "tagline": "Işığın İyileştirici Gücü & Fototerapi"
    },
    "lip-care": {
        "steps": [
            "Dudaklardaki ölü deriyi alan şeker kamışı ve bal bazlı nazik granül peeling",
            "Dudak çevresindeki mimik çizgilerini gevşeten hafif masaj",
            "Dudakları dolgunlaştıran hyalüronik ve kırmızı meyve özlü dolgu serumu",
            "Aşırı kurumalara karşı shea ve badem yağı içerikli yoğun dudak maskesi"
        ],
        "effects": "Çatlamış ve yıpranmış dudakları onarır, doğal rengini canlandırır. Çevresindeki ince 'barkod' çizgilerini hafifleterek dudaklara çok daha dolgun ve pürüzsüz bir görünüm katar.",
        "tagline": "Duyusal Dolgunluk & İpeksi Dudaklar"
    },
    "men-facial": {
        "steps": [
            "Erkek cildinin doğal yapısına uygun, tıraş hassasiyetini alan köpük temizliği",
            "Sertleşmiş stratum corneum tabakasını incelten ferahlatıcı peeling",
            "Yüz, boyun ve omuz bölgesindeki gerilimi çözen maskülen rahatlama masajı",
            "Tıraş sonrası tahrişi önleyen, matlaştırıcı ve yağ dengesini sağlayan bakım kremi"
        ],
        "effects": "Erkeklerin daha kalın ve yağlanmaya müsait cilt yapısını dengeler. Tıraşın yarattığı mikro-tahrişleri iyileştirir, cilde yorgunluktan uzak, sağlıklı ve enerjik bir matlık verir.",
        "tagline": "Dinamik Enerji & Maskülen Bakım"
    },
    "micro-polish": {
        "steps": [
            "Pürüzsüzleştirici işlemi desteklemek için keratolitik solüsyon",
            "Cilt yüzeyini nazikçe zımparalayan ince kristal mikrodermabrazyon uygulaması",
            "Soyulan derinin atılmasını sağlayan serin ve yatıştırıcı misel silme",
            "Yeni ortaya çıkan taze cildi besleyen yoğun seramid destekli losyon"
        ],
        "effects": "Cildin en üst katmanındaki hasarlı ve ölü hücreleri fiziksel olarak yeniler. Küçük yara izleri, hafif çukurlar ve geniş gözenek görünümü anında düzelerek taze bir cilt ortaya çıkar.",
        "tagline": "Pırlanta Pürüzsüzlüğü & Yeniden Doğuş"
    },
    "oxygen-boost": {
        "steps": [
            "Hücresel solunumu tetikleyen ozon destekli ön arındırma",
            "Saf oksijen basıncı eşliğinde vitamin ve mineral kokteyli püskürtülmesi",
            "Oksijenin emilimini artıran canlandırıcı ve ritmik vuruşlu masaj",
            "Cilde nefes aldıran, hafif dokulu aerated (havalandırılmış) kapatıcı krem"
        ],
        "effects": "Sigara içenler, stresli yaşantıya sahip olanlar veya solgun görünen ciltler için bir nefestir. Dokulara yoğun oksijen taşıyarak anında pembemsi, son derece sağlıklı ve canlı bir doku yaratır.",
        "tagline": "Hücresel Nefes & Saf Canlılık"
    },
    "sensitive-soothe": {
        "steps": [
            "Su ve paraben içermeyen, alerjen testinden geçmiş termal temizleme",
            "Kılcal damarları yatıştıran at kestanesi ve papatya kompresi",
            "Isı ve sürtünme oluşturmadan yapılan baskısız, şifalı dokunuş (touch-therapy)",
            "Kızarıklığı alan, cilt ısısını düşüren serinletici yulaf özlü maske"
        ],
        "effects": "Rosacea, egzama eğilimi veya yoğun alerjik reaksiyon gösteren ciltler için bir kurtarıcıdır. İntoleransı azaltır, cildin ateşini alır ve güvenli bir rahatlama kozası oluşturur.",
        "tagline": "Sakinleştirici Şefkat & Ateş Düşürücü Dokunuş"
    },
    "vitamin-c-glow": {
        "steps": [
            "Ciltteki donukluğu kırmak için narenciye özlü canlandırıcı yıkama",
            "Stabilize L-Askorbik asit içeren yüksek doz antioksidan C Vitamini serumu",
            "Serumun derinlemesine nüfuzunu sağlayan Gua Sha taşları ile lenfatik drenaj",
            "Cildi çevresel hasarlara karşı adeta kalkan gibi saran koruyucu aydınlık maske"
        ],
        "effects": "Serbest radikallere savaş açarak cildi fotoyaşlanmadan (güneş hasarı) korur. Anında bir enerji portresi çizer; cildiniz adeta içeriden bir ampul yanmışçasına sağlıklı ışıldar.",
        "tagline": "Antioksidan Güç & Göz Alıcı Işıltı"
    }
}

def update_json_file(file_path):
    if not os.path.exists(file_path):
        return False
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    try:
        data = json.loads(content)
        modified = False
        
        # services.json is a list
        if isinstance(data, list):
            for item in data:
                slug = item.get("slug", "")
                if slug in skincare_unique_data:
                    unique_data = skincare_unique_data[slug]
                    
                    if "content" not in item:
                        item["content"] = {}
                    if "tr" not in item["content"]:
                        item["content"]["tr"] = {}
                        
                    item["content"]["tr"]["steps"] = unique_data["steps"]
                    item["content"]["tr"]["effects"] = unique_data["effects"]
                    item["content"]["tr"]["tagline"] = unique_data["tagline"]
                    modified = True
                    
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return modified
        
    except Exception as e:
        print(f"Error parsing JSON {file_path}: {e}")
        return False

def update_js_fallback_file(file_path):
    if not os.path.exists(file_path):
        return False
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # fallback_data.js exports window.SANTIS_FALLBACK
    # We will use regex to find and replace steps strings if possible, or just parse, update and write back
    
    # Actually, fallback_data.js contains pure JSON inside window.SANTIS_FALLBACK = { ... };
    match = re.search(r"window\.SANTIS_FALLBACK\s*=\s*(window\.SANTIS_FALLBACK\s*\|\|\s*)?(\{.*?\});", content, re.DOTALL)
    if not match:
        print("SANTIS_FALLBACK object not found.")
        return False
        
    json_str = match.group(2)
    try:
        data = json.loads(json_str)
        modified = False
        
        # In fallback, services are an object dictionary: "services": { "id_name": { ... } }
        if "services" in data:
            for key, service in data["services"].items():
                # In fallback_data, some services might not have explicit "slug" or the slug might be inside
                slug = service.get("slug", key)
                # It could also match the HTML filename slug
                # find matching slug
                for match_slug in skincare_unique_data.keys():
                    if match_slug in slug or match_slug in key:
                        unique_data = skincare_unique_data[match_slug]
                        
                        if "content" not in service:
                             service["content"] = {}
                        if "tr" not in service["content"]:
                             service["content"]["tr"] = {}
                        
                        service["content"]["tr"]["steps"] = unique_data["steps"]
                        service["content"]["tr"]["effects"] = unique_data["effects"]
                        service["content"]["tr"]["tagline"] = unique_data["tagline"]
                        modified = True
                        break # Found match

        if modified:
            new_json_str = json.dumps(data, ensure_ascii=False, indent=4)
            new_content = content[:match.start(2)] + new_json_str + content[match.end(2):]
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            return True
            
    except Exception as e:
        print(f"Error parsing fallbackJS JSON: {e}")
        return False
        
    return False

if __name__ == "__main__":
    db_paths = [
        "assets/data/services.json",
        "assets/data/product-data.json"
    ]
    
    js_paths = [
        "assets/js/fallback_data.js",
        "assets/js/db.js"
    ]
    
    total_mod = 0
    for file_path in db_paths:
        if update_json_file(file_path):
            total_mod += 1
            print(f"✅ Özgün içerikler eklendi: {file_path}")
            
    for file_path in js_paths:
        if update_js_fallback_file(file_path):
            total_mod += 1
            print(f"✅ Özgün içerikler eklendi: {file_path}")
            
    print(f"\nİşlem Tamam. Toplam {total_mod} veritabanı dosyası güncellendi. Artık Skincare sayfalarının tüm Adımları ve Faydaları birbirinden eşsiz!")
