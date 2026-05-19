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
    "30 min": {"title": "Ekspres Maskeler", "kicker": "Kısa ve Etkili Dokunuşlar (30 dk)"},
    "50 min": {"title": "Klasik Bakımlar", "kicker": "Günlük Cilt Terapisi (50 dk)"},
    "90 min": {"title": "Premium Bakımlar", "kicker": "Kapsamlı Yüz Ritüelleri (90 dk)"}
}

for k in categories:
    categories[k]["items"] = []

for line in data_raw.strip().split("\n"):
    parts = [x.strip() for x in line.split('-')]
    if len(parts) == 3:
        name = parts[0]
        duration = parts[1]
        price = parts[2]
        
        cat_key = next((k for k in categories.keys() if k in duration), None)
        if cat_key:
            categories[cat_key]["items"].append({"name": name, "price": price})

html_output = ["<!-- NATIVE CSS SKINCARE GRID -->"]

filters = ["none", "hue-rotate(40deg)", "grayscale(50%)", "sepia(30%)", "contrast(120%)", "hue-rotate(-15deg)", "saturate(120%)", "brightness(0.9)", "contrast(110%)", "hue-rotate(15deg)"]

filter_idx = 0
for cat_key, cat in categories.items():
    html_output.append(f"""<section class="santis-container" style="margin-bottom: 6rem;">
    <div style="text-align: center; margin-bottom: 3rem;">
        <span class="santis-kicker">{cat['kicker']}</span>
        <h2 class="santis-title" style="font-size: 2.2rem;">{cat['title']}</h2>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; align-items: stretch; width: 100%;">""")
    
    for item in cat["items"]:
        filt = filters[filter_idx % len(filters)]
        filter_idx += 1
        
        card_html = f"""        <a href="#" class="santis-signature-card" style="height: 100%; display: flex; flex-direction: column;">
    <div class="santis-signature-visual" style="flex: 1; min-height: 300px;">
        <img src="/assets/img/cards/santis_hero_skincare_lux.webp" alt="{item['name']}" style="filter: {filt}; width: 100%; height: 100%; object-fit: cover;" loading="lazy" decoding="async">
        <div class="santis-signature-overlay"></div>
    </div>
    <div class="santis-signature-info" style="border-top: none; padding-top: 1.5rem;">
        <h3 class="santis-signature-name">{item['name']}</h3>
        <p class="santis-signature-desc">Sovereign Sessiz Lüks Deneyimi</p>
        <span class="santis-signature-cta">€{item['price'].replace('€','').strip()}</span>
    </div>
</a>"""
        html_output.append(card_html)
        
    html_output.append("    </div>\n</section>")

new_html = "\n".join(html_output)

with open("cilt-bakimi.html", "r", encoding="utf-8") as f:
    text = f.read()

# Remove bento-orchestrator if it exists
text = text.replace('<script src="/assets/js/core/bento-orchestrator.js" defer></script>\n', '')

# Replace the bento grid sections with the native CSS grid
pattern = re.compile(r"<!-- V44 BENTO GRID STAGE: SKINCARE PROGRAMS -->.*?(?=<script>\n// Sovereign OS Module Sync)", re.DOTALL)
new_text = pattern.sub(new_html + "\n", text)

with open("cilt-bakimi.html", "w", encoding="utf-8") as f:
    f.write(new_text)

print("Native Grid successfully applied.")
