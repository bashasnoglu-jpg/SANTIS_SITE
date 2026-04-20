import re
import sys

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
    "30 min": {"title": "Ekspres Maskeler", "kicker": "Kısa ve Etkili Dokunuşlar (30 dk)", "id": "sov-3d-stage-ekspres", "items": []},
    "50 min": {"title": "Klasik Bakımlar", "kicker": "Günlük Cilt Terapisi (50 dk)", "id": "sov-3d-stage-klasik", "items": []},
    "90 min": {"title": "Premium Bakımlar", "kicker": "Kapsamlı Yüz Ritüelleri (90 dk)", "id": "sov-3d-stage-premium", "items": []}
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

html_output = ["<!-- V45 COVER FLOW STAGE: SKINCARE PROGRAMS -->"]

filters = ["none", "hue-rotate(40deg)", "grayscale(50%)", "sepia(30%)", "contrast(120%)", "hue-rotate(-15deg)", "saturate(120%)", "brightness(0.9)", "contrast(110%)", "hue-rotate(15deg)"]

filter_idx = 0
for cat_key, cat in categories.items():
    html_output.append(f"""<section class="santis-container" style="margin-bottom: 5rem; overflow: visible;">
    <div style="text-align: center; margin-bottom: 2rem;">
        <span class="santis-kicker">{cat['kicker']}</span>
        <h2 class="santis-title" style="font-size: 2.2rem;">{cat['title']}</h2>
    </div>
    <div class="santis-carousel-stage custom-cover-flow" id="{cat['id']}" style="height: 60vh; min-height: 400px; width: 100%; position: relative;">""")
    
    for item in cat["items"]:
        filt = filters[filter_idx % len(filters)]
        filter_idx += 1
        
        card_html = f"""        <a href="#" class="santis-signature-card santis-reveal-up">
    <div class="santis-signature-visual">
        <img src="/assets/img/cards/santis_hero_skincare_lux.webp" alt="{item['name']}" style="filter: {filt};" loading="lazy" decoding="async">
        <div class="santis-signature-overlay"></div>
    </div>
    <div class="santis-signature-info">
        <h3 class="santis-signature-name">{item['name']}</h3>
        <p class="santis-signature-desc">Sovereign Sessiz Lüks Deneyimi</p>
        <span class="santis-signature-cta">{item['price']}</span>
    </div>
</a>"""
        html_output.append(card_html)
        
    html_output.append("    </div>\n</section>")

new_html = "\n".join(html_output)

# Write to replacement file
with open("cilt-bakimi.html", "r", encoding="utf-8") as f:
    orig_html = f.read()

# We know the old content spans from <!-- V45 COVER FLOW STAGE: SIGNATURE RITUALS --> to </section>\n\n<script> (approx line 262-1183)
import re

pattern = re.compile(r"<!-- V45 COVER FLOW STAGE: SIGNATURE RITUALS -->.*?</section>", re.DOTALL)

with open("cilt-bakimi.html", "w", encoding="utf-8") as f:
    f.write(pattern.sub(new_html, orig_html, count=1))

print("Successfully replaced content in cilt-bakimi.html")

