import re
import time

html_content = """      <div style="text-align: center; margin-bottom: 2rem;">
          <span class="santis-kicker">OSMANLI MİRASI</span>
          <h2 class="santis-title" style="font-size: 2.2rem;">Turkish Bath Program</h2>
      </div>
      <section class="santis-bento-grid" id="sov-bento-stage-1">
  <article class="sov-bento-card hero" onclick="if(window.openReservationModal) window.openReservationModal('Ottoman Hamam Tradition');" style="cursor: pointer;">
    <div class="santis-bento-content">
      <h3 style="font-family: 'Playfair Display', serif; color: #d4af37; font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 500;">Ottoman Hamam Tradition</h3>
      <p style="font-family: 'Inter', sans-serif; color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.5; margin: 0;">90 € — 50 min • Sultan Seremonisi (Geleneksel ritüellerin en lüks hali.)</p>
    </div>
  </article>

  <article class="sov-bento-card" onclick="if(window.openReservationModal) window.openReservationModal('Peeling & Foam Massage');" style="cursor: pointer;">
    <div class="santis-bento-content">
      <h3 style="font-family: 'Playfair Display', serif; color: #FFF; font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 500;">Peeling & Foam Massage</h3>
      <p style="font-family: 'Inter', sans-serif; color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.5; margin: 0;">45 € — 30 min • Geleneksel Arınma</p>
    </div>
  </article>

  <article class="sov-bento-card" onclick="if(window.openReservationModal) window.openReservationModal('Foam Massage');" style="cursor: pointer;">
    <div class="santis-bento-content">
      <h3 style="font-family: 'Playfair Display', serif; color: #FFF; font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 500;">Foam Massage</h3>
      <p style="font-family: 'Inter', sans-serif; color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.5; margin: 0;">45 € — 30 min • Nemlendirici Köpük</p>
    </div>
  </article>

  <article class="sov-bento-card" onclick="if(window.openReservationModal) window.openReservationModal('Coffee Peeling & Foam');" style="cursor: pointer;">
    <div class="santis-bento-content">
      <h3 style="font-family: 'Playfair Display', serif; color: #FFF; font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 500;">Coffee Peeling & Foam</h3>
      <p style="font-family: 'Inter', sans-serif; color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.5; margin: 0;">50 € — 30 min • Antioksidan Etki</p>
    </div>
  </article>

  <article class="sov-bento-card" onclick="if(window.openReservationModal) window.openReservationModal('Sea Salt Peeling & Foam');" style="cursor: pointer;">
    <div class="santis-bento-content">
      <h3 style="font-family: 'Playfair Display', serif; color: #FFF; font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 500;">Sea Salt Peeling & Foam</h3>
      <p style="font-family: 'Inter', sans-serif; color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.5; margin: 0;">50 € — 30 min • Derinlemesine Detoks</p>
    </div>
  </article>

  <article class="sov-bento-card" onclick="if(window.openReservationModal) window.openReservationModal('Honey & Foam Massage');" style="cursor: pointer;">
    <div class="santis-bento-content">
      <h3 style="font-family: 'Playfair Display', serif; color: #FFF; font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 500;">Honey & Foam Massage</h3>
      <p style="font-family: 'Inter', sans-serif; color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.5; margin: 0;">55 € — 30 min • Besleyici İpeksi</p>
    </div>
  </article>

  <article class="sov-bento-card" onclick="if(window.openReservationModal) window.openReservationModal('Chocolate & Foam Massage');" style="cursor: pointer;">
    <div class="santis-bento-content">
      <h3 style="font-family: 'Playfair Display', serif; color: #FFF; font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 500;">Chocolate & Foam Massage</h3>
      <p style="font-family: 'Inter', sans-serif; color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.5; margin: 0;">55 € — 30 min • Endorfin ve Rahatlama</p>
    </div>
  </article>

  <article class="sov-bento-card wide" onclick="if(window.openReservationModal) window.openReservationModal('Algae & Foam Massage');" style="cursor: pointer;">
    <div class="santis-bento-content">
      <h3 style="font-family: 'Playfair Display', serif; color: #FFF; font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 500;">Algae & Foam Massage</h3>
      <p style="font-family: 'Inter', sans-serif; color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.5; margin: 0;">55 € — 30 min • Mineral Odaklı</p>
    </div>
  </article>
</section>"""

with open('hamam.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the entire existing <section class="santis-bento-grid" id="sov-bento-stage-1">...</section> 
pattern = re.compile(r'<section class="santis-bento-grid" id="sov-bento-stage-1">.*?</section>', re.DOTALL)
text = pattern.sub(html_content, text)

# Cache bust
timestamp = str(int(time.time()))
text = re.sub(r'santis\.bento-grid\.css(\?v=[0-9A-Za-z_]+)?', f'santis.bento-grid.css?v={timestamp}', text)

with open('hamam.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Full Hamam 8-item Ritual Array Injected and Geometrically Aligned!")
