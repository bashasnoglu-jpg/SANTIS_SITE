import os
import re

# CONFIGURATION V3: MULTI-LANGUAGE
TEMPLATE_PATH = r"C:\Users\tourg\Desktop\SANTIS_SITE\assets\html\templates\cinematic-detail-master.html"

LANG_CONFIG = {

    'tr': {
        'dirs': [
            r"C:\Users\tourg\Desktop\SANTIS_SITE\tr\masajlar",
            r"C:\Users\tourg\Desktop\SANTIS_SITE\tr\hamam",
            r"C:\Users\tourg\Desktop\SANTIS_SITE\tr\cilt-bakimi"
        ],
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
        'dirs': [
            r"C:\Users\tourg\Desktop\SANTIS_SITE\en\massages",
            r"C:\Users\tourg\Desktop\SANTIS_SITE\en\hammam",
            r"C:\Users\tourg\Desktop\SANTIS_SITE\en\skincare"
        ],
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
        'dirs': [
            r"C:\Users\tourg\Desktop\SANTIS_SITE\de\massagen",
            r"C:\Users\tourg\Desktop\SANTIS_SITE\de\hammam",
            r"C:\Users\tourg\Desktop\SANTIS_SITE\de\hautpflege"
        ],
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
        'dirs': [
            r"C:\Users\tourg\Desktop\SANTIS_SITE\fr\massages",
            r"C:\Users\tourg\Desktop\SANTIS_SITE\fr\hammam",
            r"C:\Users\tourg\Desktop\SANTIS_SITE\fr\soins-visage"
        ],
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
        'dirs': [
            r"C:\Users\tourg\Desktop\SANTIS_SITE\ru\massages",
            r"C:\Users\tourg\Desktop\SANTIS_SITE\ru\hammam",
            r"C:\Users\tourg\Desktop\SANTIS_SITE\ru\skincare"
        ],
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

def process_file(source_dir, filename, lang, config):
    # PATHS
    backup_dir = os.path.join(source_dir, "_backup_legacy")
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)

    file_path = os.path.join(source_dir, filename)
    backup_path = os.path.join(backup_dir, filename)
    
    # EXCLUSIONS
    # Normalize paths for comparison
    norm_source = os.path.normpath(source_dir)
    norm_config_dirs = [os.path.normpath(d) for d in config['dirs']]
    is_root_dir = norm_source in norm_config_dirs

    if filename == "index.html":
        if is_root_dir:
            print(f"Skipping Listing Page: {filename} in {source_dir}")
            return
        # Else: processing a subdirectory index.html (FR style) -> Allow
    elif filename in ["index.html.bak", "signature-rituel.html"]:
        print(f"Skipping {filename}")
        return

    # BACKUP LOGIC
    if not os.path.exists(backup_path):
        # ... existing ...
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            with open(backup_path, "w", encoding="utf-8") as f:
                f.write(content)
        except FileNotFoundError:
            print(f"File not found: {file_path}")
            return
    
    # ... existing read ...
    try:
        with open(backup_path, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        return

    # --- EXTRACTION ---
    # ... existing ...
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
    category_label = config['labels']['ui_massages']
    breadcrumb_link = f"../../{lang}/massages/index.html"

    if "hamam" in lower_dir or "hammam" in lower_dir:
        hero_image = "../../assets/img/cards/hammam.webp"
        sub_image = "../../assets/img/cards/hammam_detail.webp"
        subtitle = config['labels']['subtitle_hammam']
        focus = config['labels']['focus_body']
        quote = config['labels']['quote_massage'] 
        
        category_label = config['labels']['ui_hammam']
        breadcrumb_link = f"../../{lang}/hammam/index.html"

    elif "cilt" in lower_dir or "skin" in lower_dir or "soin" in lower_dir or "haut" in lower_dir:
        hero_image = "../../assets/img/cards/facial.webp"
        sub_image = "../../assets/img/cards/skincare_detail.webp"
        subtitle = config['labels']['subtitle_skincare']
        focus = config['labels']['focus_face']
        quote = config['labels']['quote_skincare']

        category_label = config['labels']['ui_skincare']
        breadcrumb_link = f"../../{lang}/skincare/index.html" # Note: 'skincare' might need to be 'soins-visage' for link?
        # TODO: Fix breadcrumb link for localized folders if needed
        if lang == 'fr':
            breadcrumb_link = "../../fr/soins-visage/index.html"
        if lang == 'de':
            breadcrumb_link = "../../de/hautpflege/index.html"

    else:
        # Massage default
        hero_image = "../../assets/img/cards/massage.webp"
        sub_image = "../../assets/img/cards/sauna.webp"
        subtitle = config['labels']['subtitle_massage']
        focus = config['labels']['focus_body']
        quote = config['labels']['quote_massage']
        
        if lang == 'de':
            breadcrumb_link = "../../de/massagen/index.html"
        # fr uses 'massages' which is default

    # --- TEMPLATE INJECTION ---
    new_html = TEMPLATE
    
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
             # Parent dir need? NO, likely ../lang/category/dirname/
             # Actually: source_dir is .../fr/massages/massage-balinais
             # We want: https://santis-club.com/fr/massages/massage-balinais/
             
             # Extract relative path from language root? Too complex reliably.
             # Use safe fallback:
             existing_canonical = f"https://santis-club.com/{lang}/{os.path.basename(os.path.dirname(source_dir))}/{dir_name}/"
             # This assumes structure .../lang/category/service/index.html
        else:
            dir_name = os.path.basename(source_dir)
            existing_canonical = f"https://santis-club.com/{lang}/{dir_name}/{filename}"
    
    new_html = new_html.replace("{{CANONICAL_URL}}", existing_canonical)
    new_html = new_html.replace('../../favicon.ico', '/favicon.ico')

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_html)
    
    print(f"[{lang.upper()}] Converted {filename} in {os.path.basename(source_dir)}")

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    targets = ['de', 'fr', 'ru'] 
    
    for lang in targets:
        print(f"\n🚀 STARTING LANGUAGE: {lang.upper()}")
        cfg = LANG_CONFIG.get(lang)
        if not cfg:
            continue
        
        for d in cfg['dirs']:
            if os.path.exists(d):
                print(f"--- Scanning {d} ---")
                
                # Hybrid Scan: Files + Subdirs
                items = os.listdir(d)
                for item in items:
                    full_path = os.path.join(d, item)
                    
                    # 1. Flat File
                    if os.path.isfile(full_path) and item.endswith(".html"):
                        process_file(d, item, lang, cfg)
                    
                    # 2. Subdirectory (Nested Style, e.g. FR)
                    elif os.path.isdir(full_path) and not item.startswith("_") and not item.startswith("."):
                        sub_index = os.path.join(full_path, "index.html")
                        if os.path.exists(sub_index):
                            process_file(full_path, "index.html", lang, cfg)
            else:
                print(f"Directory not found: {d}")

