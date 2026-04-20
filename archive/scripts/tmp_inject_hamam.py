import re

turkish_bath = [
    {"name": "Peeling & Foam Massage", "desc": "30 min • Geleneksel Arınma", "price": "45", "filter": "none"},
    {"name": "Foam Massage", "desc": "30 min • Nemlendirici Köpük", "price": "45", "filter": "contrast(110%)"},
    {"name": "Coffee Peeling & Foam", "desc": "30 min • Antioksidan Etki", "price": "50", "filter": "sepia(30%)"},
    {"name": "Sea Salt Peeling & Foam", "desc": "30 min • Derinlemesine Detoks", "price": "50", "filter": "hue-rotate(-15deg)"},
    {"name": "Honey & Foam Massage", "desc": "30 min • Besleyici İpeksi", "price": "55", "filter": "saturate(120%)"},
    {"name": "Chocolate & Foam Massage", "desc": "30 min • Endorfin ve Rahatlama", "price": "55", "filter": "sepia(40%) contrast(110%)"},
    {"name": "Algae & Foam Massage", "desc": "30 min • Mineral Odaklı", "price": "55", "filter": "hue-rotate(15deg) saturate(90%)"},
    {"name": "Ottoman Hamam Tradition", "desc": "50 min • Sultan Seremonisi", "price": "90", "filter": "brightness(0.85) contrast(120%)"}
]

def render_card(item):
    slug = item['name'].lower().replace(' ', '-').replace('&', 'and')
    return f'''        <button class="santis-signature-card" data-service="{slug}" type="button" onclick="if(window.openReservationModal) window.openReservationModal('{item['name']}');" style="cursor: pointer; text-align: left; appearance: none; border: none; padding:0; width:100%; display: flex; flex-direction: column;">
    <div class="santis-signature-visual" style="aspect-ratio: 4/5;">
        <img src="/assets/img/cards/santis_hero_massage_lux.webp" alt="{item['name']} Ritüeli" style="filter: {item['filter']};" loading="lazy" decoding="async">
        <div class="santis-signature-overlay"></div>
    </div>
    <div class="santis-signature-info" style="flex: 1; display: flex; flex-direction: column;">
        <span class="bento-cat" style="font-family:'Inter',sans-serif; font-size:10px; text-transform:uppercase; letter-spacing:2px; color:var(--liquid-gold, #d4af37); margin-bottom:8px; opacity:0.8;">Sovereign Sessiz Lüks Deneyimi</span>
        <h3 class="santis-signature-name">{item['name']}</h3>
        <p class='santis-signature-desc'>{item['desc']}</p>
        <span class="santis-signature-cta" style="margin-top:auto;">€{item['price']}</span>
    </div>
</button>'''

new_section = f'''  <!-- V45 NATIVE GRID: SIGNATURE RITUALS (HAMAM) -->
  <section class="santis-container" style="overflow: visible; padding-top: 2rem; margin-bottom: 5rem;">
      <div style="text-align: center; margin-bottom: 2rem;">
          <span class="santis-kicker">OSMANLI MİRASI</span>
          <h2 class="santis-title" style="font-size: 2.2rem;">Turkish Bath Program</h2>
      </div>
      <div class="santis-native-grid" id="sov-3d-stage-turkish-bath">
'''
for item in turkish_bath:
    new_section += render_card(item) + '\n'
new_section += '''      </div>
  </section>'''

with open('hamam.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's replace the first "V45 COVER FLOW STAGE: SIGNATURE RITUALS (HAMAM)" block safely.
# Find everything from "<!-- V45 COVER FLOW STAGE" up to "<!-- V11 PHASE 3: THE GIANT GALLERY"
pattern1 = re.compile(r'<!-- V45 COVER FLOW STAGE: SIGNATURE RITUALS \(HAMAM\) -->.*?<!-- V11 PHASE 3: THE GIANT GALLERY \(Apple Pro Exhibition\) -->', re.DOTALL)
text = pattern1.sub(new_section + '\n\n  <!-- V11 PHASE 3: THE GIANT GALLERY (Apple Pro Exhibition) -->', text)

# Now we need to remove the other Cover Flow elements under COVER FLOW CATEGORY CAROUSELS (HAMAM) 
# because they are the old legacy stuff we don't need anymore.
pattern2 = re.compile(r'<!-- COVER FLOW CATEGORY CAROUSELS \(HAMAM\) -->.*?<script>', re.DOTALL)
# Wait, this might be too aggressive if there are scripts we need.
# Let's target the exact section.
pattern3 = re.compile(r'<!-- COVER FLOW CATEGORY CAROUSELS \(HAMAM\) -->.*?<!-- PHASE 6: SOVEREIGN RAIL', re.DOTALL)

text = pattern3.sub('<!-- PHASE 6: SOVEREIGN RAIL', text)

# Wipe orchestrator scripts again
text = re.sub(r'<script>\s*// Sovereign OS Module Sync.*?initCoverFlowCarousel.*?</script>', '', text, flags=re.DOTALL)
text = text.replace('<script src="/assets/js/core/bento-orchestrator.js" defer></script>\n', '')

with open('hamam.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Hamam injected with Native Grid localized ONLY to the necessary sections.")
