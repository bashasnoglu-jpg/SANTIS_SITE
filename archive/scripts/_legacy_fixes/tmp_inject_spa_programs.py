import re
import time

spa_programs = [
    {"name": "Delux Program", "price": "175", "desc": "50 min • Coffee, Sea Salt & Algae<br>50 min • Combination Massage<br>15 min • Face Mask", "class": "hero"},
    {"name": "Child Care Program", "price": "80", "desc": "30 min • Chocolate & Foam<br>30 min • Kid's Massage<br>15 min • Face Mask", "class": ""},
    {"name": "Relax Program", "price": "100", "desc": "30 min • Peeling & Foam<br>50 min • Full Body Massage<br>15 min • Face Mask", "class": ""},
    {"name": "Medical Program", "price": "115", "desc": "30 min • Sea Salt & Foam<br>50 min • Medical Massage<br>15 min • Face Mask", "class": ""},
    {"name": "Bronze Program", "price": "105", "desc": "30 min • Coffee Peeling & Foam<br>50 min • Bronze Massage<br>15 min • Face Mask", "class": ""}
]

out = ['  <!-- V45 NATIVE GRID: SPA PROGRAMS -->',
       '  <section class="santis-container" style="overflow: visible; padding-top: 2rem; margin-bottom: 5rem;">',
       '      <div style="text-align: center; margin-bottom: 2rem;">',
       '          <span class="santis-kicker" style="font-family: \'Inter\', sans-serif; color: #d4af37; font-size: 0.75rem; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">KAPSAMLI ARINMA SEREMONİLERİ</span>',
       '          <h2 class="santis-title" style="font-size: 2.2rem; font-family: \'Playfair Display\', serif; font-weight: 400; color: #111; margin-top: 5px;">Spa Programs</h2>',
       '      </div>',
       '      <section class="santis-bento-grid" id="sov-bento-stage-spa">']

for item in spa_programs:
    c = f'sov-bento-card {item["class"]}'.strip()
    title_color = "#d4af37" if "hero" in item["class"] else "#FFF"
    desc_html = item['desc']
    if "hero" in item["class"]:
        # Inline styling for hero description to ensure spacing
        desc_html = f"<div style=\"display:flex; flex-direction:column; gap:8px;\"><span>{item['desc'].replace('<br>', '</span><span>')}</span></div>"
        
    out.append(f'''  <article class="{c}" onclick="if(window.openReservationModal) window.openReservationModal('{item['name']}');" style="cursor: pointer;">
    <div class="santis-bento-content">
      <h3 style="font-family: 'Playfair Display', serif; color: {title_color}; font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 500;">{item['name']}</h3>
      <p style="font-family: 'Inter', sans-serif; color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.6; margin: 0; padding-bottom: 0.5rem;">{desc_html}</p>
      <span style="font-family: 'Inter', sans-serif; color: {title_color}; font-size: 1.1rem; font-weight: 600;">€{item['price']}</span>
    </div>
  </article>''')
out.append('      </section>\n  </section>')

new_section = '\n'.join(out)

with open('hamam.html', 'r', encoding='utf-8') as f:
    text = f.read()

# We need to insert `new_section` right beneath the `editorial-page-header` section closing tag.
# Let's find the end of `editorial-page-header` and inject it.
# The string looks like:
#     </section>
# 
#   <!-- V11 PHASE 2: ORACLE LINEUP (BIOMETRIC QUICK ACCESS) -->
# Or if Oracle Lineup was removed, it goes straight to Turkish Bath Program:
#     </section>
# 
#     <!-- V45 NATIVE GRID: SIGNATURE RITUALS (HAMAM) -->

pattern = re.compile(r'(<section class="editorial-page-header"[^>]*>.*?</section>)\s*(?=<!-- V45 NATIVE GRID: SIGNATURE RITUALS \(HAMAM\) -->|<!-- V11 PHASE 2: ORACLE LINEUP|<!-- V45 COVER FLOW STAGE: SIGNATURE RITUALS)', re.DOTALL)
if pattern.search(text):
    text = pattern.sub(rf'\1\n\n{new_section}\n\n', text)
else:
    # Fallback: Just insert it right before the Turkish Bath Program section
    text = text.replace('<!-- V45 NATIVE GRID: SIGNATURE RITUALS (HAMAM) -->', new_section + '\n\n  <!-- V45 NATIVE GRID: SIGNATURE RITUALS (HAMAM) -->')

# Cache bust
timestamp = str(int(time.time()))
text = re.sub(r'santis\.bento-grid\.css(\?v=[0-9A-Za-z_]+)?', f'santis.bento-grid.css?v={timestamp}', text)

with open('hamam.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Spa Programs beautifully injected with perfect 4x2 mapping!")
