"""
Batch generate EN skincare detail pages from TR sources.
Reads each TR cilt-bakimi/*.html, translates key content, writes to en/skincare/*.html
"""
import os, re

TR_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\cilt-bakimi"
EN_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE\en\skincare"

# Translation map: TR title -> EN title, TR desc -> EN desc
TRANSLATIONS = {
    "acne-balance.html": {
        "title": "Acne & Sebum Balance Treatment",
        "desc": "Purification + balance — targeted treatment for oily/combination skin.",
        "intro": "Purification + balance — targeted treatment for oily and combination skin types. Powered by Sothys Paris scientific formulas, this treatment restores your skin's natural equilibrium. Applied by Santis Club's professional skincare specialists using a personalised protocol."
    },
    "anti-aging-pro.html": {
        "title": "Anti-Aging Pro Treatment",
        "desc": "Advanced anti-aging protocol targeting fine lines and loss of firmness.",
        "intro": "An advanced anti-aging protocol targeting fine lines, wrinkles, and loss of firmness. Utilising Sothys Paris's cutting-edge formulations, this treatment stimulates collagen production and restores youthful radiance. Delivered by Santis Club's expert aestheticians with a bespoke approach."
    },
    "barrier-repair.html": {
        "title": "Barrier Repair Treatment",
        "desc": "Restores and strengthens the skin's protective barrier for lasting resilience.",
        "intro": "A restorative treatment that rebuilds and strengthens your skin's natural protective barrier. Using Sothys Paris specialised formulas, this protocol addresses sensitivity, dehydration, and environmental damage. Tailored to your skin's unique needs by our professional team."
    },
    "brightening-spot.html": {
        "title": "Brightening Spot Treatment",
        "desc": "Targets dark spots and uneven skin tone for a luminous, even complexion.",
        "intro": "A targeted treatment that addresses dark spots, pigmentation, and uneven skin tone. Sothys Paris brightening actives work to reveal a luminous, even complexion. Our specialists create a personalised protocol for visible, lasting results."
    },
    "classic-facial.html": {
        "title": "Classic Facial",
        "desc": "A timeless facial ritual combining deep cleansing, hydration, and relaxation.",
        "intro": "A timeless facial ritual that combines thorough cleansing, gentle exfoliation, deep hydration, and complete relaxation. This foundational treatment is ideal for all skin types and provides immediate visible improvement. Performed with premium Sothys Paris products."
    },
    "collagen-lift.html": {
        "title": "Collagen Lift Treatment",
        "desc": "Intensive collagen-boosting treatment for firmer, more supple skin.",
        "intro": "An intensive treatment designed to boost collagen production and restore firmness. Sothys Paris's advanced lifting formulas work at the cellular level to visibly tighten and rejuvenate. Ideal for mature skin seeking renewed elasticity and definition."
    },
    "deep-cleanse.html": {
        "title": "Deep Cleanse Treatment",
        "desc": "Professional deep-cleansing facial to purify pores and refresh the complexion.",
        "intro": "A thorough deep-cleansing facial designed to purify pores, remove impurities, and refresh your complexion. Using Sothys Paris professional-grade products, this treatment leaves skin feeling clean, balanced, and revitalised. Perfect as a regular maintenance ritual."
    },
    "detox-charcoal.html": {
        "title": "Detox Charcoal Mask",
        "desc": "Activated charcoal mask for deep detoxification and pore refinement.",
        "intro": "An intensive detoxification treatment using activated charcoal to draw out impurities, toxins, and excess sebum. This purifying mask refines pores, mattifies the complexion, and leaves skin feeling deeply clean and refreshed."
    },
    "enzyme-peel.html": {
        "title": "Enzyme Peel Treatment",
        "desc": "Gentle enzymatic exfoliation for smoother, brighter skin without irritation.",
        "intro": "A gentle yet effective enzymatic exfoliation that dissolves dead skin cells without abrasion. This treatment reveals smoother, brighter skin while maintaining the skin barrier. Ideal for sensitive skin types that cannot tolerate chemical peels."
    },
    "eye-contour.html": {
        "title": "Eye Contour Treatment",
        "desc": "Specialised care for the delicate eye area — reduces puffiness, dark circles, and fine lines.",
        "intro": "A specialised treatment targeting the delicate skin around the eyes. This protocol addresses puffiness, dark circles, fine lines, and loss of firmness using Sothys Paris's dedicated eye-contour formulas. Gentle, precise, and remarkably effective."
    },
    "glass-skin.html": {
        "title": "Glass Skin Ritual",
        "desc": "Multi-layer hydration ritual for the coveted 'glass skin' glow effect.",
        "intro": "A multi-layered hydration ritual designed to achieve the coveted 'glass skin' effect — skin so hydrated and luminous it appears translucent. Combining serums, essences, and moisture-locking techniques for an ethereal, dewy finish."
    },
    "gold-mask-ritual.html": {
        "title": "Gold Mask Ritual",
        "desc": "Luxurious 24K gold mask treatment for radiance, firmness, and ultimate indulgence.",
        "intro": "Our most luxurious facial experience featuring a 24K gold-infused mask. Gold particles stimulate cell renewal, boost circulation, and impart an unmistakable glow. A ritual of pure indulgence that leaves your skin radiant and supremely nourished."
    },
    "hyaluron-hydrate.html": {
        "title": "Hyaluron Hydration Therapy",
        "desc": "Deep hyaluronic acid infusion for intense, long-lasting moisture.",
        "intro": "An intensive hydration treatment that infuses multiple weights of hyaluronic acid deep into the skin. This therapy delivers profound, long-lasting moisture, plumps fine lines, and restores a healthy, bouncy texture. Essential for dehydrated and mature skin."
    },
    "led-rejuvenation.html": {
        "title": "LED Rejuvenation",
        "desc": "LED light therapy for skin regeneration, collagen stimulation, and healing.",
        "intro": "Advanced LED light therapy that harnesses specific wavelengths to stimulate cellular regeneration, boost collagen production, and accelerate healing. A non-invasive treatment suitable for all skin types, delivering visible results from the very first session."
    },
    "lip-care.html": {
        "title": "Lip Care Treatment",
        "desc": "Nourishing treatment for softer, smoother, and more defined lips.",
        "intro": "A dedicated treatment for the lip area that exfoliates, hydrates, and nourishes. This protocol addresses dryness, fine lines around the mouth, and loss of volume, leaving lips beautifully soft, smooth, and subtly plumped."
    },
    "men-facial.html": {
        "title": "Men's Facial",
        "desc": "Tailored facial treatment designed specifically for men's skin needs.",
        "intro": "A facial treatment specifically formulated for men's thicker, oilier skin. Addressing razor irritation, ingrown hairs, and environmental damage, this protocol cleanses deeply, soothes inflammation, and leaves skin clear, refined, and energised."
    },
    "micro-polish.html": {
        "title": "Micro Polish Treatment",
        "desc": "Precision micro-exfoliation for refined texture and renewed radiance.",
        "intro": "A precision exfoliation treatment that uses micro-particles to polish away dull, uneven skin. This refinement protocol reveals a smoother, more radiant complexion and enhances the absorption of subsequent skincare products."
    },
    "oxygen-boost.html": {
        "title": "Oxygen Boost Treatment",
        "desc": "Revitalising oxygen infusion for tired, dull skin in need of instant radiance.",
        "intro": "A revitalising treatment that delivers pure oxygen and active ingredients deep into the skin. Instantly brightens tired, dull complexions, boosts circulation, and restores a healthy, vibrant glow. Perfect before special occasions."
    },
    "sensitive-soothe.html": {
        "title": "Sensitive Skin Soothing Treatment",
        "desc": "Calming, anti-inflammatory treatment for reactive and sensitive skin types.",
        "intro": "A gentle, calming treatment designed for reactive and sensitive skin. This anti-inflammatory protocol reduces redness, soothes irritation, and strengthens the skin barrier using Sothys Paris's most delicate formulations. Comfort and relief in every step."
    },
    "vitamin-c-glow.html": {
        "title": "Vitamin C Glow",
        "desc": "High-potency vitamin C treatment for brightening, protection, and antioxidant defence.",
        "intro": "A high-potency vitamin C treatment that brightens, protects, and defends against environmental aggressors. This antioxidant-rich protocol evens skin tone, boosts collagen synthesis, and delivers an unmistakable healthy glow."
    }
}

# Common EN benefits and process
BENEFITS_EN = """<section class="service-benefits">
<h2>Benefits</h2>
<ul>
<li>Strengthens the skin barrier</li>
<li>Optimises moisture balance</li>
<li>Evens out skin tone</li>
<li>Reduces signs of ageing</li>
</ul>
</section>"""

PROCESS_EN = """<section class="service-process">
<h2>Treatment Process</h2>
<p>A comprehensive treatment performed with Sothys products suited to your skin type, following analysis, cleansing, toning, masking, and moisturising stages.</p>
<ol class="service-steps">
<li><strong>Skin Analysis:</strong> Your needs are determined through digital skin analysis.</li>
<li><strong>Cleansing:</strong> Deep cleansing with professional-grade products.</li>
<li><strong>Application:</strong> Personalised active-ingredient formulation.</li>
<li><strong>Protection:</strong> Preservation of treatment results with SPF and moisture barrier.</li>
</ol>
<p>Suitable for anyone seeking professional-level skincare with long-lasting results.</p>
</section>"""

os.makedirs(EN_DIR, exist_ok=True)
count = 0

for filename, t in TRANSLATIONS.items():
    slug = filename.replace('.html', '')
    en_path = os.path.join(EN_DIR, filename)
    
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>{t["title"]} | Santis Club</title>
<meta content="{t["desc"]}" name="description"/>
<link href="https://santis-club.com/en/skincare/{filename}" rel="canonical"/>
<meta content="{t["title"]}" property="og:title"/>
<meta content="{t["desc"]}" property="og:description"/>
<meta content="service" property="og:type"/>
<meta content="https://santis-club.com/en/skincare/{filename}" property="og:url"/>
<meta content="../../assets/img/cards/facial.webp" property="og:image"/>
<script type="application/ld+json">
{{
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "{t["title"]}",
    "description": "{t["desc"]}",
    "provider": {{
        "@type": "LocalBusiness",
        "name": "Santis Club Spa & Wellness",
        "image": "https://santis-club.com/assets/img/logo.png",
        "address": {{ "@type": "PostalAddress", "addressCountry": "TR" }}
    }},
    "offers": {{ "@type": "Offer", "price": "65", "priceCurrency": "EUR" }}
}}
</script>
<link href="../../assets/css/style.css?v=6.0" rel="stylesheet"/>
<link href="../../assets/css/service-detail.css?v=6.0" rel="stylesheet"/>
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {{"@type":"ListItem","position":1,"name":"Home","item":"https://santis-club.com/index.html"}},
    {{"@type":"ListItem","position":2,"name":"Home","item":"https://santis-club.com/en/index.html"}},
    {{"@type":"ListItem","position":3,"name":"Skincare","item":"https://santis-club.com/en/skincare/index.html"}},
    {{"@type":"ListItem","position":4,"name":"{t["title"]}","item":"https://santis-club.com/en/skincare/{filename}"}}
  ]
}}
</script>
<script defer src="../../assets/js/i18n-routes.js"></script>
<script src="../../assets/js/hreflang-injector.js" defer></script>
<link rel="alternate" hreflang="en" href="https://santis-club.com/en/skincare/{filename}" data-static-hreflang="self">
<link rel="alternate" hreflang="tr" href="https://santis-club.com/tr/cilt-bakimi/{filename}">
<link rel="alternate" hreflang="x-default" href="https://santis-club.com/en/skincare/{filename}" data-static-hreflang="default">
</head>
<body>
<noscript>
<nav class="nv-noscript-nav">
<a href="/index.html" class="nv-ns-home">HOME</a>
<a href="/en/hammam/index.html">HAMMAM</a>
<a href="/en/massages/index.html">MASSAGES</a>
<a href="/en/skincare/index.html">SKINCARE</a>
<a href="/en/gallery/index.html">GALLERY</a>
</nav>
</noscript>

<header id="nv-header">
<div class="nv-container">
<h1>{t["title"]}</h1>
</div>
</header>
<main class="service-detail nv-container">
<section class="service-intro">
<p>{t["intro"]}</p>
</section>
{BENEFITS_EN}
{PROCESS_EN}
<section class="service-duration">
<h2>Duration & Experience</h2>
<p>60 min</p>
</section>
<section class="related-services">
<h2>Related Services</h2>
<ul>
<li><a href="/en/massages/classic-swedish.html">Classic Massage</a></li>
<li><a href="/en/hammam/kese-kopuk.html">Hammam Kese & Foam</a></li>
<li><a href="/en/skincare/deep-cleanse.html">Deep Cleanse</a></li>
</ul>
</section>
<section class="booking-cta">
<a class="btn-primary" href="https://wa.me/905348350169">Book Now</a>
</section>
</main>
<footer>
<p>&copy; 2026 Santis Club</p>
</footer>
<script defer src="../../assets/js/app.js?v=6.0"></script>
</body>
</html>'''
    
    with open(en_path, 'w', encoding='utf-8') as f:
        f.write(html)
    count += 1
    print(f"  ✅ {filename}")

print(f"\n{'='*50}")
print(f"  ✅ COMPLETE: {count} EN skincare pages generated")
