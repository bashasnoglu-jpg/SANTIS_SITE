import json
import os
import argparse
from pathlib import Path

# --- MASTER TEMPLATE CONTENT (Enriched) ---
# This is the "Service Detail" template logic, but we inject specific SEO tags
MASTER_TEMPLATE = """<!DOCTYPE html>
<html lang="tr" data-site-root="/" data-service-id="{id}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{seo_title}</title>
    <meta name="description" content="{seo_desc}">
    
    <!-- FONTS -->
    <link rel="stylesheet" href="/assets/css/fonts.css">
    
    <!-- STYLES -->
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/editorial.css?v=8.1">
    <link rel="stylesheet" href="/assets/css/atmospheres.css?v=8.1">
    <link rel="stylesheet" href="/assets/css/service-detail.css">
    
    <link rel="icon" href="/favicon.ico">
    <link rel="manifest" href="/manifest.json">
    <link rel="canonical" href="https://santis-club.com/tr/cilt-bakimi/{filename}">
    
    <!-- PAGE CONFIG -->
    <script src="/assets/js/page-config.js"></script>
    <script src="/assets/js/i18n-routes.js"></script>
    <script src="/assets/js/hreflang-injector.js" defer></script>
    <script>
        // Force SERVICE_ID for the logic engine
        window.SERVICE_ID = '{id}';
    </script>
    
    <!-- STRUCTURED DATA -->
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "{title}",
      "provider": {{
        "@type": "BeautySalon",
        "name": "Santis Club Spa"
      }},
      "description": "{seo_desc}"
    }}
    </script>
</head>
<body class="editorial-mode skincare-theme">
    <noscript>
        <nav class="nv-noscript-nav">
            <a href="/index.html" class="nv-ns-home">ANA SAYFA</a>
            <a href="/tr/cilt-bakimi/index.html">CİLT BAKIMI</a>
        </nav>
    </noscript>

    <!-- PRELOADER -->
    <div id="preloader" class="preloader">
        <div class="preloader-logo">Santis Club</div>
    </div>
    
    <!-- NAVBAR CONTAINER -->
    <div id="navbar-container" style="position:fixed; width:100%; top:0; z-index:99;"></div>

    <main id="cinematic-wrapper">
        <!-- LEFT: VISUAL STAGE -->
        <div class="cin-visual-stage">
            <div class="cin-visual-overlay"></div>
            <!-- Texture Image (Loaded by JS, but providing a default) -->
            <img id="cin-img" class="cin-visual-img" src="/assets/img/textures/{texture}.webp" alt="{title}" style="opacity:0; transition: opacity 1s ease;">
        </div>

        <!-- RIGHT: CONTENT STAGE -->
        <div class="cin-content-stage">
            <div class="cin-breadcrumb">
                <a href="/tr/index.html">Ana Sayfa</a> / <a href="/tr/cilt-bakimi/index.html">Cilt Bakımı</a>
            </div>
            
            <!-- Content will be hydrated by service-detail-logic.js -->
            <h1 id="cin-title" class="cin-title">{title}</h1>
            <h2 id="cin-subtitle" class="cin-subtitle">{short_desc}</h2>
            
            <p id="cin-desc" class="cin-desc">
                {full_desc}
            </p>

            <!-- META GRID -->
            <div class="cin-meta-grid">
                <div class="cin-meta-box">
                    <span class="cin-label">Süre</span>
                    <span class="cin-value" id="val-duration">{duration} Dk</span>
                </div>
                <div class="cin-meta-box">
                    <span class="cin-label">Fiyat</span>
                    <span class="cin-value" id="val-price">{price}€</span>
                </div>
            </div>

            <!-- ACTIONS -->
            <div class="cin-actions">
                <a id="btn-whatsapp" href="javascript:void(0)" class="cin-btn primary" target="_blank" rel="noopener noreferrer">REZERVASYON YAP</a>
                <a href="/tr/cilt-bakimi/index.html" class="cin-btn">KOLEKSİYONA DÖN</a>
            </div>
        </div>
    </main>
    
    <!-- FOOTER -->
    <div id="footer-container" style="position:relative; z-index:10; background:#0b0d11;"></div>

    <!-- SCRIPTS -->
    <script src="/assets/js/fallback_data.js"></script>
    <script src="/assets/js/loaders/data-bridge.js?v=8.1"></script>
    <script src="/assets/js/santis-nav.js" defer></script>
    <script src="/assets/js/loader.js" defer></script>
    <script src="/assets/js/reflex/atmos.js"></script>
    <script src="/assets/js/booking-wizard.js"></script>
    <!-- LOGIC -->
    <script src="/assets/js/service-engine.js"></script>
    <script src="/assets/js/service-detail-logic.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.29/bundled/lenis.min.js"></script>
    <script src="/assets/js/lenis-init.js"></script>
</body>
</html>
"""

def main():
    parser = argparse.ArgumentParser(description="Update Skin Care Pages")
    default_root = Path(__file__).resolve().parents[1]
    
    parser.add_argument("--root", type=Path, default=default_root, help="Proje kök dizini")
    parser.add_argument("--apply", action="store_true", help="Değişiklikleri kaydeder")
    args = parser.parse_args()
    
    root_dir = args.root.resolve()
    data_file = root_dir / 'assets' / 'data' / 'services.json'
    target_dir = root_dir / 'tr' / 'cilt-bakimi'

    print(f">>> Loading services.json from {data_file}...")
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Hata: services.json okunamadı ({data_file}): {e}")
        return
    
    print(f">>> Found {len(data)} items. Filtering for Skin Care...")
    
    target_dir.mkdir(parents=True, exist_ok=True)
    
    count = 0
    for item in data:
        is_skincare = item.get('category', '').startswith('skincare') or item.get('categoryId', '').startswith('skincare')
        
        if is_skincare:
            filename = f"{item['id']}.html"
            filepath = target_dir / filename
            
            seo_title = item.get('seo', {}).get('title', item.get('title', ''))
            seo_desc = item.get('seo', {}).get('description', item.get('shortDesc', ''))
            
            texture = item.get('texture', 'cream')
            if 'skincare_' in str(item.get('media', {}).get('hero', '')):
                 texture = item.get('texture', 'cream')
            
            full_desc = item.get('fullDesc', '')
            if not full_desc and 'content' in item:
                full_desc = item['content'].get('tr', {}).get('fullDesc', '')
                
            short_desc = item.get('shortDesc', '')
            if not short_desc and 'content' in item:
                short_desc = item['content'].get('tr', {}).get('shortDesc', '')

            content = MASTER_TEMPLATE.format(
                id=item['id'],
                filename=filename,
                title=item.get('title', ''),
                short_desc=short_desc,
                full_desc=full_desc,
                seo_title=seo_title,
                seo_desc=seo_desc,
                texture=texture,
                duration=item.get('duration', 60),
                price=item.get('price', {}).get('amount', 0)
            )
            
            if args.apply:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f" [OK] Updated: {filename}")
            else:
                print(f" [DRY-RUN] Will update: {filename}")
            count += 1

    print(f"\n>>> COMPLETE! Processed {count} Skin Care pages.")
    if not args.apply:
        print("🔍 DRY-RUN aktif. Kaydetmek için --apply kullanın.")

if __name__ == "__main__":
    main()
