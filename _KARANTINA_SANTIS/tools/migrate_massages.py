import os
import re
import argparse
from pathlib import Path

LANG_CONFIG = {

    'tr': {
        'services': ['masajlar', 'hamam', 'cilt-bakimi'],
        'labels': {
            'subtitle_massage': 'SANTIS TERAPİSİ',
            'subtitle_hammam': 'HAMAM RİTÜELİ',
            'subtitle_skincare': 'CİLT BAKIMI',
            'duration_unit': 'dk',
            'intensity': 'Orta',
            'focus_body': 'Tüm Vücut',
            'focus_face': 'Yüz & Boyun',
            'quote_massage': 'Bedensel ve zihinsel dinginliğin mükemmel uyumu.',
            'quote_skincare': 'Güzellik bir ışıltıdır, içeriden dışarıya yansır.',
            'suitability': 'Yenilenmek isteyen herkes için uygundur.',
            'benefits_default': '<li>Derin rahatlama sağlar.</li><li>Stresi azaltır.</li><li>Kan dolaşımını düzenler.</li>',
            
            # UI LABELS
            'ui_duration': 'SÜRE',
            'ui_intensity': 'YOĞUNLUK',
            'ui_focus': 'ODAK',
            'ui_price': 'FİYAT',
            'ui_home': 'Ana Sayfa',
            'ui_massages': 'Masajlar', # Default cat
            'ui_hammam': 'Hamam',
            'ui_skincare': 'Cilt Bakımı',
            'ui_benefits': 'Faydaları',
            'ui_suitable': 'Kimler İçin Uygun?',
            'ui_btn_book': 'SESSİZLİĞE ADIM AT',
            'ui_btn_wa': 'WHATSAPP İLE SOR',
            'ui_caption': 'Santis Club Atmosferi'
        }
    },
    'en': {
        'services': ['massages', 'hammam', 'skincare'],
        'labels': {
            'subtitle_massage': 'SANTIS THERAPY',
            'subtitle_hammam': 'HAMMAM RITUAL',
            'subtitle_skincare': 'SKINCARE',
            'duration_unit': 'min',
            'intensity': 'Medium',
            'focus_body': 'Full Body',
            'focus_face': 'Face & Neck',
            'quote_massage': 'Perfect harmony of body and mind.',
            'quote_skincare': 'Beauty is a radiance that shines from within.',
            'suitability': 'Suitable for anyone seeking renewal.',
            'benefits_default': '<li>Provides deep relaxation.</li><li>Reduces stress.</li><li>Improves circulation.</li>',

            # UI LABELS
            'ui_duration': 'DURATION',
            'ui_intensity': 'INTENSITY',
            'ui_focus': 'FOCUS',
            'ui_price': 'PRICE',
            'ui_home': 'Home',
            'ui_massages': 'Massages',
            'ui_hammam': 'Hammam',
            'ui_skincare': 'Skincare',
            'ui_benefits': 'Benefits',
            'ui_suitable': 'Suitable For?',
            'ui_btn_book': 'STEP INTO SILENCE',
            'ui_btn_wa': 'ASK VIA WHATSAPP',
            'ui_caption': 'Santis Club Atmosphere'
        }
    },
    'de': {
        'services': ['massagen', 'hammam', 'hautpflege'],
        'labels': {
            'subtitle_massage': 'SANTIS THERAPIE',
            'subtitle_hammam': 'HAMAM RITUAL',
            'subtitle_skincare': 'HAUTPFLEGE',
            'duration_unit': 'Min',
            'intensity': 'Mittel',
            'focus_body': 'Ganzkörper',
            'focus_face': 'Gesicht & Hals',
            'quote_massage': 'Perfekte Harmonie von Körper und Geist.',
            'quote_skincare': 'Schönheit ist ein Strahlen, das von innen kommt.',
            'suitability': 'Geeignet für alle, die Erneuerung suchen.',
            'benefits_default': '<li>Sorgt für tiefgehende Entspannung.</li><li>Reduziert Stress.</li><li>Fördert die Durchblutung.</li>',

            # UI LABELS
            'ui_duration': 'DAUER',
            'ui_intensity': 'INTENSITÄT',
            'ui_focus': 'FOKUS',
            'ui_price': 'PREIS',
            'ui_home': 'Startseite',
            'ui_massages': 'Massagen',
            'ui_hammam': 'Hamam',
            'ui_skincare': 'Hautpflege',
            'ui_benefits': 'Vorteile',
            'ui_suitable': 'Für Wen?',
            'ui_btn_book': 'IN DIE STILLE EINTRETEN',
            'ui_btn_wa': 'VIA WHATSAPP FRAGEN',
            'ui_caption': 'Santis Club Atmosphäre'
        }
    },
    'fr': {
        'services': ['massages', 'hammam', 'soins-visage'],
        'labels': {
            'subtitle_massage': 'THÉRAPIE SANTIS',
            'subtitle_hammam': 'RITUEL HAMMAM',
            'subtitle_skincare': 'SOIN DU VISAGE',
            'duration_unit': 'min',
            'intensity': 'Moyenne',
            'focus_body': 'Corps Entier',
            'focus_face': 'Visage & Cou',
            'quote_massage': 'Harmonie parfaite du corps et de l\'esprit.',
            'quote_skincare': 'La beauté est un éclat qui vient de l\'intérieur.',
            'suitability': 'Convient à toute personne en quête de renouveau.',
            'benefits_default': '<li>Procure une relaxation profonde.</li><li>Réduit le stress.</li><li>Améliore la circulation.</li>',

            # UI LABELS
            'ui_duration': 'DURÉE',
            'ui_intensity': 'INTENSITÉ',
            'ui_focus': 'ZONE',
            'ui_price': 'PRIX',
            'ui_home': 'Accueil',
            'ui_massages': 'Massages',
            'ui_hammam': 'Hammam',
            'ui_skincare': 'Soins Visage',
            'ui_benefits': 'Bienfaits',
            'ui_suitable': 'Pour Qui?',
            'ui_btn_book': 'ENTRER DANS LE SILENCE',
            'ui_btn_wa': 'DEMANDER PAR WHATSAPP',
            'ui_caption': 'Atmosphère Santis Club'
        }
    },
    'ru': {
        'services': ['massages', 'hammam', 'skincare'],
        'labels': {
            'subtitle_massage': 'ТЕРАПИЯ SANTIS',
            'subtitle_hammam': 'РИТУАЛ ХАММАМА',
            'subtitle_skincare': 'УХОД ЗА КОЖЕЙ',
            'duration_unit': 'мин',
            'intensity': 'Средняя',
            'focus_body': 'Все тело',
            'focus_face': 'Лицо и шея',
            'quote_massage': 'Идеальная гармония тела и разума.',
            'quote_skincare': 'Красота — это сияние, идущее изнутри.',
            'suitability': 'Подходит для всех, кто ищет обновления.',
            'benefits_default': '<li>Обеспечивает глубокое расслабление.</li><li>Снимает стресс.</li><li>Улучшает кровообращение.</li>',

            # UI LABELS
            'ui_duration': 'ДЛИТЕЛЬНОСТЬ',
            'ui_intensity': 'ИНТЕНСИВНОСТЬ',
            'ui_focus': 'ЗОНА',
            'ui_price': 'СТОИМОСТЬ',
            'ui_home': 'Главная',
            'ui_massages': 'Массажи',
            'ui_hammam': 'Хаммам',
            'ui_skincare': 'Уход за лицом',
            'ui_benefits': 'Преимущества',
            'ui_suitable': 'Кому подходит?',
            'ui_btn_book': 'ШАГ В ТИШИНУ',
            'ui_btn_wa': 'СПРОСИТЬ В WHATSAPP',
            'ui_caption': 'Атмосфера Santis Club'
        }
    }
}

# READ TEMPLATE
with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
    TEMPLATE = f.read()

# HELPER: EXTRACT
def extract(pattern, text, default=""):
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else default

def process_file(source_dir, filename, lang, config, template_content, apply_changes):
    # PATHS
    backup_dir = os.path.join(source_dir, "_backup_legacy")
    if apply_changes and not os.path.exists(backup_dir):
        os.makedirs(backup_dir)

    file_path = os.path.join(source_dir, filename)
    backup_path = os.path.join(backup_dir, filename)
    
    # EXCLUSIONS
    dir_name = os.path.basename(source_dir)
    is_root_dir = dir_name in config.get('services', [])

    if filename == "index.html":
        if is_root_dir:
            print(f"Skipping Listing Page: {filename} in {source_dir}")
            return
        # Else: processing a subdirectory index.html (FR style) -> Allow
    elif filename in ["index.html.bak", "signature-rituel.html"]:
        print(f"Skipping {filename}")
        return

    # BACKUP LOGIC
    if apply_changes and not os.path.exists(backup_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            with open(backup_path, "w", encoding="utf-8") as f:
                f.write(content)
        except Exception as e:
            print(f"Backup Error for {file_path}: {e}")
            return
    
    if apply_changes:
        read_path = backup_path
    else:
        read_path = file_path # In dry-run, read original directly if no backup
    
    try:
        with open(read_path, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        return

    # --- EXTRACTION ---
    title = extract(r'<title>(.*?) \|', content, f"Santis {lang.upper()}")
    
    desc = extract(r'<meta content="([^"]*?)" name="description"', content)
    if not desc:
        desc = extract(r'<meta name="description" content="([^"]*?)"', content, "Santis Club experience.")
    
    intro = extract(r'<section class="service-intro">\s*<p>(.*?)</p>', content, desc)
    
    price = extract(r'"price":\s*"(.*?)"', content, "Ask")
    price_fmt = f"{price} €" if price.isdigit() else price
    
    # Duration
    duration = extract(r'(?:⏱|Süre|Duration|Dauer|Durée|Длительность)\s*(\d+\s*(?:dk|min))', content)
    if not duration:
        duration_val = extract(r'"duration":\s*"(.*?)"', content, "50")
        duration = f"{duration_val} {config['labels']['duration_unit']}"
    
    benefits_html = extract(r'<section class="service-benefits">.*?<ul>(.*?)</ul>', content)

    # --- CONTEXT LOGIC ---
    lower_dir = source_dir.lower()
    
    # Defaults
    category_slug = "massages"
    category_label = config['labels']['ui_massages']
    breadcrumb_link = f"../../{lang}/massages/index.html"

    if "hamam" in lower_dir or "hammam" in lower_dir:
        category = "hammam"
        hero_image = "../../assets/img/cards/hammam.webp"
        sub_image = "../../assets/img/cards/hammam_detail.webp"
        subtitle = config['labels']['subtitle_hammam']
        focus = config['labels']['focus_body']
        quote = config['labels']['quote_massage'] 
        
        category_slug = "hammam"
        category_label = config['labels']['ui_hammam']
        breadcrumb_link = f"../../{lang}/hammam/index.html"

    elif "cilt" in lower_dir or "skin" in lower_dir or "soin" in lower_dir or "haut" in lower_dir:
        category = "skincare"
        hero_image = "../../assets/img/cards/facial.webp"
        sub_image = "../../assets/img/cards/skincare_detail.webp"
        subtitle = config['labels']['subtitle_skincare']
        focus = config['labels']['focus_face']
        quote = config['labels']['quote_skincare']

        category_slug = "skincare"
        category_label = config['labels']['ui_skincare']
        breadcrumb_link = f"../../{lang}/skincare/index.html" 
        if lang == 'fr': breadcrumb_link = f"../../fr/soins-visage/index.html"
        if lang == 'de': breadcrumb_link = f"../../de/hautpflege/index.html"

    else:
        # Massage default
        category = "massage"
        hero_image = "../../assets/img/cards/massage.webp"
        sub_image = "../../assets/img/cards/sauna.webp"
        subtitle = config['labels']['subtitle_massage']
        focus = config['labels']['focus_body']
        quote = config['labels']['quote_massage']
        
        if lang == 'de': breadcrumb_link = f"../../de/massagen/index.html"
        # fr uses 'massages' which is default

    # --- TEMPLATE INJECTION ---
    new_html = template_content
    
    # LANGUAGE ATTRIBUTE
    new_html = new_html.replace('lang="tr"', f'lang="{lang}"')
    
    # UI LABELS replacement
    lbl = config['labels']
    new_html = new_html.replace("SÜRE", lbl['ui_duration'])
    new_html = new_html.replace("YOĞUNLUK", lbl['ui_intensity'])
    new_html = new_html.replace("ODAK", lbl['ui_focus'])
    new_html = new_html.replace("FİYAT", lbl['ui_price'])
    new_html = new_html.replace("Faydaları", lbl['ui_benefits'])
    new_html = new_html.replace("Kimler İçin Uygun?", lbl['ui_suitable'])
    new_html = new_html.replace("SESSİZLİĞE ADIM AT", lbl['ui_btn_book'])
    new_html = new_html.replace("WHATSAPP İLE SOR", lbl['ui_btn_wa'])
    new_html = new_html.replace("Santis Club Atmosferi", lbl['ui_caption'])

    # BREADCRUMB
    breadcrumb_html = f'<a href="../../{lang}/index.html">{lbl["ui_home"]}</a> / <a href="{breadcrumb_link}">{category_label}</a> / <span class="current">{title}</span>'
    new_html = re.sub(r'<nav class="cin-breadcrumb">.*?</nav>', f'<nav class="cin-breadcrumb">{breadcrumb_html}</nav>', new_html, flags=re.DOTALL)

    # CONTENT
    new_html = new_html.replace("{{TITLE}}", title)
    new_html = new_html.replace("{{SUBTITLE}}", subtitle)
    new_html = new_html.replace("{{DESCRIPTION}}", desc)
    new_html = new_html.replace("{{DESCRIPTION_HTML}}", f"<p>{intro}</p>")
    
    new_html = new_html.replace("{{HERO_IMAGE}}", hero_image)
    new_html = new_html.replace("{{SECONDARY_IMAGE}}", sub_image)
    
    new_html = new_html.replace("{{DURATION}}", duration)
    new_html = new_html.replace("{{PRICE}}", price_fmt)
    new_html = new_html.replace("{{INTENSITY}}", lbl['intensity'])
    new_html = new_html.replace("{{FOCUS}}", focus)
    new_html = new_html.replace("{{QUOTE}}", quote)
    new_html = new_html.replace("{{SUITABILITY_TEXT}}", lbl['suitability'])

    if benefits_html:
        new_html = new_html.replace("{{BENEFITS_LIST}}", benefits_html)
    else:
        new_html = new_html.replace("{{BENEFITS_LIST}}", lbl['benefits_default'])

    # CANONICAL
    existing_canonical = extract(r'<link href="(.*?)" rel="canonical"', content)
    if not existing_canonical or "localhost" in existing_canonical:
        # Heuristic for Nested vs Flat
        if filename == "index.html":
             # Subdir style
             dir_name = os.path.basename(source_dir)
             existing_canonical = f"https://santis-club.com/{lang}/{os.path.basename(os.path.dirname(source_dir))}/{dir_name}/"
        else:
            dir_name = os.path.basename(source_dir)
            existing_canonical = f"https://santis-club.com/{lang}/{dir_name}/{filename}"
    
    new_html = new_html.replace("{{CANONICAL_URL}}", existing_canonical)
    new_html = new_html.replace('../../favicon.ico', '/favicon.ico')

    if apply_changes:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_html)
        print(f"✅ [{lang.upper()}] Güncellendi: {filename} ({os.path.basename(source_dir)})")
    else:
        print(f"🔍 [DRY-RUN] [{lang.upper()}] Eşleşti ve şablon uygulandı: {os.path.basename(source_dir)}/{filename}")

# --- MAIN EXECUTION ---
def main():
    parser = argparse.ArgumentParser(description="SANTIS_SITE Çok Dilli Migrasyon Aracı")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1], help="Proje kök dizini")
    parser.add_argument("--apply", action="store_true", help="Gerçek taşıma işlemini uygulayarak verileri ezer")
    args = parser.parse_args()

    root = args.root.resolve()
    print(f"\n🚀 Operasyon Merkezi: {root}")
    if not args.apply:
         print(f"🛡️ MOD: DRY RUN (Gerçek yazma kapalı. Aktif etmek için --apply kullanın)\n")

    template_path = root / "assets" / "html" / "templates" / "cinematic-detail-master.html"
    if not template_path.exists():
        print(f"❌ Şablon dosyası bulunamadı: {template_path}")
        return

    with open(template_path, "r", encoding="utf-8") as f:
        template_content = f.read()

    targets = ['tr', 'en', 'de', 'fr', 'ru'] 
    
    for lang in targets:
        cfg = LANG_CONFIG.get(lang)
        if not cfg: continue
        
        lang_dir = root / lang
        if not lang_dir.exists():
             continue
             
        print(f"\n🌍 SCANNING LANGUAGE: {lang.upper()}")
        
        for svc in cfg.get('services', []):
            d = lang_dir / svc
            if d.exists():
                items = os.listdir(str(d))
                for item in items:
                    full_path = d / item
                    
                    if full_path.is_file() and item.endswith(".html"):
                        process_file(str(d), item, lang, cfg, template_content, args.apply)
                    
                    elif full_path.is_dir() and not item.startswith("_") and not item.startswith("."):
                        sub_index = full_path / "index.html"
                        if sub_index.exists():
                            process_file(str(full_path), "index.html", lang, cfg, template_content, args.apply)
            else:
                print(f"Directory not found (Skipped): {d}")

if __name__ == "__main__":
    main()

