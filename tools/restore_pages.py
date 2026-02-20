import json
import os
import shutil
from pathlib import Path
import datetime

BASE_DIR = Path(__file__).resolve().parent
SITE_JSON = BASE_DIR / "data" / "site_content.json"
TEMPLATE_FILE = BASE_DIR / "templates" / "service-detail.html"

# -----------------------------------------------------------------------------
# CONFIGURATION & MAPPINGS
# -----------------------------------------------------------------------------

FOLDER_MAP = {
    "tr": { "hammam": "hamam", "massages": "masajlar", "skincare": "cilt-bakimi", "products": "urunler", "services": "hizmetler" },
    "en": { "hammam": "hammam", "massages": "massages", "skincare": "services", "products": "products", "services": "services" },
    "de": { "hammam": "hammam", "massages": "massagen", "skincare": "services", "products": "produkte", "services": "services" },
    "fr": { "hammam": "hammam", "massages": "massages", "skincare": "services", "products": "produits", "services": "services" },
    "ru": { "hammam": "hammam", "massages": "massages", "skincare": "services", "products": "products", "services": "services" }
}

# UI Localization for Static Headers in Template
UI_LABELS = {
    "tr": {
        "benefits": "Faydaları",
        "process": "Uygulama Süreci",
        "duration": "Süre & Deneyim",
        "related": "İlgili Hizmetler",
        "book_btn": "Rezervasyon Yap"
    },
    "en": {
        "benefits": "Benefits",
        "process": "The Process",
        "duration": "Duration & Experience",
        "related": "Related Services",
        "book_btn": "Book Now"
    },
    "de": {
        "benefits": "Vorteile",
        "process": "Der Ablauf",
        "duration": "Dauer & Erlebnis",
        "related": "Ähnliche Behandlungen",
        "book_btn": "Jetzt Buchen"
    },
    "fr": {
        "benefits": "Bienfaits",
        "process": "Le Processus",
        "duration": "Durée et Expérience",
        "related": "Services Associés",
        "book_btn": "Réserver"
    },
    "ru": {
        "benefits": "Преимущества",
        "process": "Процесс",
        "duration": "Длительность и Опыт",
        "related": "Похожие услуги",
        "book_btn": "Забронировать"
    }
}

# Generic Content Fallbacks (since JSON lacks specific 'process' text)
PROCESS_DEFAULTS = {
    "hammam": {
        "tr": "Geleneksel Türk hamamı ritüellerine uygun olarak, sıcak mermer göbek taşında başlayan deneyim, kese ve köpük uygulamalarıyla devam eder.",
        "en": "Beginning on the warm marble stone in accordance with traditional Turkish hammam rituals, the experience continues with scrub and foam applications.",
        "de": "Das Erlebnis beginnt auf dem warmen Marmorstein gemäß traditionellen türkischen Hammam-Ritualen und wird mit Peeling- und Schaumanwendungen fortgesetzt.",
        "fr": "Commençant sur la pierre chaude en marbre conformément aux rituels traditionnels du hammam turc, l'expérience se poursuit avec des applications de gommage et de mousse.",
        "ru": "Начинаясь на теплом мраморном камне в соответствии с традиционными ритуалами турецкого хаммама, опыт продолжается пилингом и пенными процедурами."
    },
    "massages": {
        "tr": "Uzman terapistlerimiz tarafından, kişisel tercihlerinize ve vücudunuzun ihtiyaçlarına göre belirlenen baskı teknikleri ve aromatik yağlarla uygulanır.",
        "en": "Performed by our expert therapists using pressure techniques and aromatic oils tailored to your personal preferences and body's needs.",
        "de": "Durchgeführt von unseren Expertentherapeuten mit Drucktechniken und aromatischen Ölen, die auf Ihre persönlichen Vorlieben und Bedürfnisse abgestimmt sind.",
        "fr": "Réalisé par nos thérapeutes experts utilisant des techniques de pression et des huiles aromatiques adaptées à vos préférences personnelles et aux besoins de votre corps.",
        "ru": "Выполняется нашими опытными терапевтами с использованием техник давления и ароматических масел, подобранных в соответствии с вашими личными предпочтениями и потребностями тела."
    },
    "skincare": {
        "tr": "Cilt tipinize uygun Sothys ürünleri ile yapılan analiz sonrası, temizleme, tonikleme, maske ve nemlendirme aşamalarından oluşan kapsamlı bir bakımdır.",
        "en": "A comprehensive treatment consisting of cleansing, toning, mask, and moisturizing stages after analysis with Sothys products suitable for your skin type.",
        "de": "Eine umfassende Behandlung bestehend aus Reinigung, Tonisierung, Maske und Feuchtigkeitspflege nach Analyse mit Sothys-Produkten, die auf Ihren Hauttyp abgestimmt sind.",
        "fr": "Un soin complet composé des étapes de nettoyage, tonification, masque et hydratation après analyse avec des produits Sothys adaptés à votre type de peau.",
        "ru": "Комплексный уход, состоящий из этапов очищения, тонизирования, маски и увлажнения после анализа с продуктами Sothys, подходящими для вашего типа кожи."
    },
    "default": {
        "tr": "Bu hizmet, Santis Club kalite standartlarında, alanında uzman profesyoneller tarafından sunulmaktadır.",
        "en": "This service is provided by experts in their field, adhering to Santis Club quality standards.",
        "de": "Dieser Service wird von Experten auf ihrem Gebiet unter Einhaltung der Qualitätsstandards des Santis Club angeboten.",
        "fr": "Ce service est fourni par des experts dans leur domaine, respectant les normes de qualité du Santis Club.",
        "ru": "Эта услуга предоставляется экспертами в своей области в соответствии со стандартами качества Santis Club."
    }
}

# -----------------------------------------------------------------------------
# HELPER FUNCTIONS
# -----------------------------------------------------------------------------

def get_process_text(cat_key, lang):
    """Returns a generic process description based on category and language."""
    # Map raw category keys to our generic buckets
    bucket = "default"
    if "hammam" in cat_key.lower(): bucket = "hammam"
    elif "massage" in cat_key.lower(): bucket = "massages"
    elif "skin" in cat_key.lower() or "face" in cat_key.lower(): bucket = "skincare"
    
    return PROCESS_DEFAULTS.get(bucket, PROCESS_DEFAULTS["default"]).get(lang, PROCESS_DEFAULTS["default"]["en"])

def build_hreflang_block(slug, current_lang, folder_mappings, catalg_key):
    """Generates the block of <link rel='alternate' ...> tags."""
    tags = []
    base_url = "https://santis.club"
    languages = ["tr", "en", "de", "fr", "ru"]
    
    for lang in languages:
        section_folder = folder_mappings.get(lang, {}).get(catalg_key, catalg_key)
        url = f"{base_url}/{lang}/{section_folder}/{slug}.html"
        tags.append(f'    <link rel="alternate" hreflang="{lang}" href="{url}">' )
    
    # X-Default (Input from PROMPT: seems to map to TR or EN. We use TR as main)
    x_def_folder = folder_mappings.get("tr", {}).get(catalg_key, catalg_key)
    x_def_url = f"{base_url}/tr/{x_def_folder}/{slug}.html"
    tags.append(f'    <link rel="alternate" hreflang="x-default" href="{x_def_url}">' )
    
    return "\n".join(tags)

def restore():
    print("🚀 Starting Smart Page Restoration with Template v2.0...")
    
    if not SITE_JSON.exists():
        print(f"❌ Error: {SITE_JSON} not found.")
        return
    if not TEMPLATE_FILE.exists():
        print(f"❌ Error: {TEMPLATE_FILE} not found.")
        return

    try:
        data = json.loads(SITE_JSON.read_text(encoding="utf-8-sig"))
        template_raw = TEMPLATE_FILE.read_text(encoding="utf-8")
    except Exception as e:
        print(f"❌ Error reading files: {e}")
        return

    catalogs = data.get("catalogs", {})
    if not catalogs:
        print("❌ No catalogs found in JSON.")
        return

    restored_count = 0
    languages = ["tr", "en", "de", "fr", "ru"]
    
    for lang in languages:
        folder_map = FOLDER_MAP.get(lang, {})
        ui_labels = UI_LABELS.get(lang, UI_LABELS["en"])
        
        for cat_key, cat_data in catalogs.items():
            # cat_key: hammam, massages, skincare...
            folder_name = folder_map.get(cat_key, cat_key)
            
            items = cat_data.get("items", [])
            for item in items:
                slug = item.get("slug") or item.get("id")
                if not slug: continue
                
                # --- DATA EXTRACTION ---
                # NOTE: Catalogs data is currently primarily Turkish in the JSON.
                # In a real localized system, we'd lookup `global.services[id][lang]`.
                # For now, we use what's in the item (TR) but wrap UI elements in correct lang.
                # This ensures Structure > Content for this verification step.
                
                title = item.get("title", item.get("name", "Service"))
                desc_short = item.get("desc", "")
                desc_long = item.get("longDesc", desc_short)
                benefits = item.get("benefits", [])
                duration = item.get("duration", "60 mins")
                price = item.get("price", 0)
                
                # Image Logic
                img_path = item.get("img", "assets/img/hero/santis_hero_main_v2.webp")
                img_filename = os.path.basename(img_path)
                # Template expects full relative path.
                # If we are at depth 2 (tr/massages/), main assets are ../../assets/
                hero_image_url = f"../../{img_path}"

                # --- TEMPLATE FILLING ---
                html = template_raw
                
                # Meta
                html = html.replace("{{lang}}", lang)
                html = html.replace("{{title}}", title)
                html = html.replace("{{meta_description}}", desc_short)
                
                # URLs
                canonical_folder = folder_map.get(cat_key, cat_key)
                canonical_url = f"https://santis.club/{lang}/{canonical_folder}/{slug}.html"
                html = html.replace("{{canonical_url}}", canonical_url)
                
                hreflang_block = build_hreflang_block(slug, lang, FOLDER_MAP, cat_key)
                html = html.replace("{{hreflang_tags}}", hreflang_block)
                
                # Content properties
                html = html.replace("{{hero_image_url}}", hero_image_url)
                html = html.replace("{{intro_paragraph}}", desc_long)
                
                # Dynamic Headers
                html = html.replace("{{header_benefits}}", ui_labels["benefits"])
                html = html.replace("{{header_process}}", ui_labels["process"])
                html = html.replace("{{header_duration}}", ui_labels["duration"])
                html = html.replace("{{header_related}}", ui_labels["related"])
                
                # Button Translation
                # Replaces strict placeholders if present or hardcoded text if found
                html = html.replace("Rezervasyon Yap", ui_labels["book_btn"])
                html = html.replace("/tr/rezervasyon/index.html", f"/{lang}/booking.html" if lang != "tr" else "/tr/rezervasyon/index.html")
                
                # Process Text (Generic fallback)
                process_text = get_process_text(cat_key, lang)
                html = html.replace("{{process_description}}", process_text)
                
                html = html.replace("{{duration_info}}", str(duration))
                
                # Benefits List
                if benefits:
                    benefits_html = "\n".join([f"            <li>{b}</li>" for b in benefits])
                else:
                    benefits_html = f"            <li>{ui_labels['benefits']}</li>"
                html = html.replace("{{benefits_list}}", benefits_html)

                # Schema
                schema_data = {
                    "@context": "https://schema.org",
                    "@type": "Service",
                    "name": title,
                    "description": desc_short,
                    "provider": {
                        "@type": "LocalBusiness",
                        "name": "Santis Club Spa & Wellness",
                        "image": "https://santis.club/assets/img/logo.png",
                        "address": {
                            "@type": "PostalAddress",
                            "addressCountry": "TR"
                        }
                    },
                     "offers": {
                        "@type": "Offer",
                        "price": str(price),
                        "priceCurrency": "EUR"
                    }
                }
                
                # Pretty print schema for template
                schema_str = json.dumps(schema_data, indent=4)
                script_block = f'<script type="application/ld+json">\n{schema_str}\n    </script>'
                html = html.replace("{{schema_json}}", script_block)
                
                # --- WRITE FILE ---
                out_dir = BASE_DIR / lang / folder_name
                out_dir.mkdir(parents=True, exist_ok=True)
                
                out_file = out_dir / f"{slug}.html"
                out_file.write_text(html, encoding="utf-8")
                restored_count += 1

    print(f"✅ Restored {restored_count} pages with Service V2 Template.")

if __name__ == "__main__":
    restore()
