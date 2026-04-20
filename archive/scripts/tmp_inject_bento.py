import re

turkish_bath = [
    {"name": "Ottoman Hamam Tradition", "desc": "90 € — Geleneksel ritüellerin en lüks hali. Tüm bedeni arındıran eşsiz bir deneyim.", "class": "hero"},
    {"name": "Classic Kese", "desc": "45 € — Saf arınma", "class": ""},
    {"name": "Foam Massage", "desc": "45 € — Rahatlatıcı köpük banyosu", "class": ""},
    {"name": "Honey & Foam", "desc": "55 € — İpeksi bir dokunuş", "class": ""},
    {"name": "Coffee Peeling", "desc": "50 € — Canlandırıcı antioksidan etki", "class": ""},
    {"name": "Algae & Foam", "desc": "55 € — Mineral odaklı yenilenme", "class": "wide"}
]

def render_html():
    out = ['<section class="santis-bento-grid" id="sov-3d-stage">']
    for item in turkish_bath:
        c = f'santis-card {item["class"]}'.strip()
        title_color = "#d4af37" if "hero" in item["class"] else "#FFF"
        out.append(f'''  <article class="{c}" onclick="if(window.openReservationModal) window.openReservationModal('{item['name']}');" style="cursor: pointer;">
    <div class="card-content">
      <h3 style="font-family: 'Playfair Display', serif; color: {title_color}; font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 500;">{item['name']}</h3>
      <p style="font-family: 'Inter', sans-serif; color: rgba(255,255,255,0.7); font-size: 0.9rem; line-height: 1.5; margin: 0;">{item['desc']}</p>
    </div>
  </article>''')
    out.append('</section>')
    return '\n'.join(out)

new_section = render_html()

with open('hamam.html', 'r', encoding='utf-8') as f:
    text = f.read()

# We need to find wherever we last put the Turkish Bath Grid or the stage.
# Let's just find the entire section containing `id="sov-3d-stage"` and replace it, because in the legacy code it was nested somewhere.
# Wait, let's match the <section> that contains `sov-3d-stage` up to the next `</section>`.
pattern = re.compile(r'<div class="santis-native-grid" id="sov-3d-stage-turkish-bath">.*?</section>', re.DOTALL)

# But wait, earlier I might have swapped it or rolled it back. Let's do a reliable broad replace of the actual Hamam rituals block:
# It starts at the first 3D stage. 
text = re.sub(r'<div class="santis-carousel-stage" id="sov-3d-stage".*?</div>\s*</section>', new_section, text, flags=re.DOTALL)
text = re.sub(r'<div class="santis-native-grid" id="sov-3d-stage-turkish-bath".*?</div>', new_section, text, flags=re.DOTALL)

with open('hamam.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Hamam page infused with Native Bento!")
