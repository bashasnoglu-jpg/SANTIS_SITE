import re

with open('hamam.html', 'r', encoding='utf-8') as f:
    raw_html = f.read()

# Hamam.html is corrupted with duplicate body and head tags inside the file due to earlier bad writes.
# We will extract the clean <head> section up to the FIRST <body class="...">
head_match = re.search(r'(.*?)(<body[^>]*>)', raw_html, re.DOTALL | re.IGNORECASE)
head_content = head_match.group(1)
body_tag = head_match.group(2)

# Now we define the exact, clean body content.
clean_body = f"""
<!-- ♾️ SANTIS V17 - OFFSCREEN QUANTUM RENDERER ♾️ -->
<canvas id="santis-god-canvas" style="position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:-1; pointer-events:none;"></canvas>

<header id="site-header" role="banner">
  <div id="navbar-container"></div>
</header>

<main id="sovereign-page-root" role="main" style="padding-top: 120px; background: #fdfdfd; min-height: 100vh;">
  
  <section class="editorial-page-header" style="padding: 100px 5vw 60px; text-align: center; max-width: 900px; margin: 0 auto; contain: layout;">
      <span style="font-family: 'Inter', sans-serif; font-size: 0.75rem; letter-spacing: 4px; color: #a0a0a0; text-transform: uppercase; display: block; margin-bottom: 20px;">Santis Sovereign</span>
      <h1 style="font-family: 'Playfair Display', serif; font-size: 3.5rem; color: #111; font-weight: 400; line-height: 1.1; margin: 0; letter-spacing: -0.02em;">Geleneksel<br><span style="color: #d4af37; font-style: italic;">Hamam</span> Ritüelleri</h1>
      <p style="font-family: 'Inter', sans-serif; font-size: 1.05rem; color: #666; font-weight: 300; margin-top: 30px; line-height: 1.7; padding: 0 20px;">
          Osmanlı saray geleneğinden ilham alan kese, köpük ve özel arınma terapileriyle bedeninizi ve ruhunuzu yeniliyoruz. Her su damlası, asırlık bir uyanışın habercisidir.
      </p>
  </section>

"""

spa_programs = [
    {"name": "Child Care Program", "steps": "Chocolate & Foam • Kid's Massage • Face Mask", "price": "80", "filter": "sepia(20%) brightness(0.95)"},
    {"name": "Relax Program", "steps": "Peeling & Foam • Classic Massage • Face Mask", "price": "100", "filter": "contrast(110%) brightness(0.9)"},
    {"name": "Medical Program", "steps": "Sea Salt & Foam • Medical Massage • Face Mask", "price": "115", "filter": "hue-rotate(15deg) grayscale(10%)"},
    {"name": "Bronze Program", "steps": "Coffee Peeling & Foam • Bronze Massage • Face Mask", "price": "105", "filter": "saturate(130%) contrast(105%)"},
    {"name": "Deluxe Program", "steps": "Coffee, Sea Salt & Algae • Combo Massage • Face Mask", "price": "175", "filter": "hue-rotate(40deg) brightness(0.95)"}
]

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

def render_card(item, is_bundle):
    slug = item['name'].lower().replace(' ', '-').replace('&', 'and')
    # Use button logic instead of pure a href=# as requested
    desc_html = f"<p class='santis-signature-desc'>{item.get('steps', item.get('desc'))}</p>"
    kicker = "Kürate Edilmiş Spa Ritüeli" if is_bundle else "Sovereign Sessiz Lüks Deneyimi"
    return f'''        <button class="santis-signature-card" data-service="{slug}" type="button" onclick="if(window.openReservationModal) window.openReservationModal('{item['name']}');" style="cursor: pointer; text-align: left; appearance: none; border: none;">
    <div class="santis-signature-visual">
        <img src="/assets/img/cards/santis_hero_massage_lux.webp" alt="{item['name']} Ritüeli" style="filter: {item['filter']};" loading="lazy" decoding="async">
        <div class="santis-signature-overlay"></div>
    </div>
    <div class="santis-signature-info">
        <span class="bento-cat" style="font-family:'Inter',sans-serif; font-size:10px; text-transform:uppercase; letter-spacing:2px; color:var(--liquid-gold, #d4af37); margin-bottom:8px; opacity:0.8;">{kicker}</span>
        <h3 class="santis-signature-name">{item['name']}</h3>
        {desc_html}
        <span class="santis-signature-cta">€{item['price']}</span>
    </div>
</button>'''

clean_body += f'''
  <section class="santis-container" style="margin-bottom: 6rem;">
      <div style="text-align: center; margin-bottom: 3rem;">
          <span class="santis-kicker">Kapsamlı Arınma Seremonileri</span>
          <h2 class="santis-title" style="font-size: 2.2rem;">Spa Programs</h2>
      </div>
      <div class="santis-native-grid" id="sov-3d-stage-spa-programs">
'''

for item in spa_programs:
    clean_body += render_card(item, True) + '\n'

clean_body += '''      </div>
  </section>
'''

clean_body += f'''
  <section class="santis-container" style="margin-bottom: 6rem;">
      <div style="text-align: center; margin-bottom: 3rem;">
          <span class="santis-kicker">Osmanlı Mirası</span>
          <h2 class="santis-title" style="font-size: 2.2rem;">Turkish Bath Program</h2>
      </div>
      <div class="santis-native-grid" id="sov-3d-stage-turkish-bath">
'''

for item in turkish_bath:
    clean_body += render_card(item, False) + '\n'

clean_body += '''      </div>
  </section>
</main>

<footer id="site-footer" role="contentinfo">
  <div id="footer-container"></div>
</footer>

<!-- CORE SCRIPTS (ZERO LEGACY CAROUSEL DEPENDENCIES) -->
<script src="/assets/js/santis-data-bridge.js" defer></script>
<script type="module" src="/assets/js/core/santis-core.js" defer></script>
<script src="/assets/js/app.js" defer></script>

<!-- SOVEREIGN OS BOOTLOADER (V35 KERNEL) -->
<script type="module" src="/assets/js/boot/santis-bootloader.js?v=V35_OMEGA" defer></script>
</body>
</html>
'''

with open('hamam.html', 'w', encoding='utf-8') as f:
    f.write(head_content + body_tag + '\n' + clean_body)

print("Hamam page fully regenerated and cleaned of duplicates/legacy.")
