import re

data_raw = """
Vitamin Mask - 30 min - 50 €
Moisturizing Mask - 30 min - 50 €
Face Firming Mask - 30 min - 50 €
Renewal (Collagen) Mask - 30 min - 50 €
Vitamin Care - 50 min - 80 €
Eye Care - 50 min - 80 €
Classic Face Care - 50 min - 80 €
G5 - 50 min - 95 €
Eye Care Active Couture - 50 min - 80 €
Collagen Treatment - 50 min - 95 €
Moisture Treatment - 50 min - 95 €
Extra Moisture Treatment - 90 min - 110 €
Skin Repair Care - 90 min - 130 €
Ultra Firming Treatment - 90 min - 130 €
Couperose Treatment - 90 min - 130 €
Oily and Acne Skin Care - 90 min - 150 €
Anti-Aging (Wrinkles) - 90 min - 160 €
Anti-Aging (Age Spots) - 90 min - 160 €
Deluxe Care - 90 min - 170 €
"""

categories = {
    "30 min": {"title": "Ekspres Maskeler", "kicker": "Kısa ve Etkili Dokunuşlar (30 dk)", "id": "santis-bento-ekspres", "items": []},
    "50 min": {"title": "Klasik Bakımlar", "kicker": "Günlük Cilt Terapisi (50 dk)", "id": "santis-bento-klasik", "items": []},
    "90 min": {"title": "Premium Bakımlar", "kicker": "Kapsamlı Yüz Ritüelleri (90 dk)", "id": "santis-bento-premium", "items": []}
}

for line in data_raw.strip().split("\n"):
    parts = [x.strip() for x in line.split('-')]
    if len(parts) == 3:
        name = parts[0]
        duration = parts[1]
        price = parts[2]
        
        # Determine category
        cat_key = next((k for k in categories.keys() if k in duration), None)
        if cat_key:
            categories[cat_key]["items"].append({"name": name, "price": price})

html_output = ["<!-- V44 BENTO GRID STAGE: SKINCARE PROGRAMS -->"]

filters = ["none", "hue-rotate(40deg)", "grayscale(50%)", "sepia(30%)", "contrast(120%)", "hue-rotate(-15deg)", "saturate(120%)", "brightness(0.9)", "contrast(110%)", "hue-rotate(15deg)"]

filter_idx = 0
for cat_key, cat in categories.items():
    html_output.append(f"""<section class="santis-container" style="margin-bottom: 5rem; overflow: visible;">
    <div style="text-align: center; margin-bottom: 2rem;">
        <span class="santis-kicker">{cat['kicker']}</span>
        <h2 class="santis-title" style="font-size: 2.2rem;">{cat['title']}</h2>
    </div>
    <div class="santis-bento-universe" id="{cat['id']}">""")
    
    for item in cat["items"]:
        filt = filters[filter_idx % len(filters)]
        filter_idx += 1
        
        # For Bento, make the FIRST AND LAST items of the Premium category wide to demonstrate Bento capabilities.
        css_wide = ""
        if cat_key == "90 min" and (item == cat["items"][0] or item == cat["items"][-1]):
            css_wide = " wide"
            
        card_html = f"""        <a href="#" class="bento-card-v6 santis-await-reveal{css_wide}">
    <img src="/assets/img/cards/santis_hero_skincare_lux.webp" class="bento-card-media" alt="{item['name']}" style="filter: {filt};" loading="lazy" decoding="async">
    <div class="bento-card-protector"></div>
    <div class="bento-card-content">
        <span class="bento-meta">Sovereign Sessiz Lüks Deneyimi</span>
        <h3 class="bento-title">{item['name']}</h3>
        <p class="bento-desc">Premium Cilt Bakım Seremonisi</p>
        <span class="bento-tag bento-tag-gold">{item['price']}</span>
    </div>
</a>"""
        html_output.append(card_html)
        
    html_output.append("    </div>\n</section>")

new_html = "\n".join(html_output)

with open("cilt-bakimi.html", "r", encoding="utf-8") as f:
    text = f.read()

# I also want to make sure bento-orchestrator.js is imported. We will append it before the bootloader if missing.
if "bento-orchestrator.js" not in text:
    text = text.replace('<!-- SOVEREIGN OS BOOTLOADER (V35 KERNEL) -->', '<script src="/assets/js/core/bento-orchestrator.js" defer></script>\n<!-- SOVEREIGN OS BOOTLOADER (V35 KERNEL) -->')

# Replace the sections
pattern = re.compile(r"<!-- V45 COVER FLOW STAGE: SKINCARE PROGRAMS -->.*?(?=<script>\n// Sovereign OS Module Sync)", re.DOTALL)
new_text = pattern.sub(new_html + "\n", text)

with open("cilt-bakimi.html", "w", encoding="utf-8") as f:
    f.write(new_text)

print("Bento Grid successfully applied.")
