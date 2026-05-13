import os
import re
import random

# Read all webp from assets/img/gallery and some from cards
base_dir = r"c:\Users\tourg\Desktop\SANTIS_SITE"
gallery_dir = os.path.join(base_dir, "assets", "img", "gallery")

# Collect images
images = []
if os.path.exists(gallery_dir):
    for f in os.listdir(gallery_dir):
        if f.endswith('.webp'):
            images.append(f"/assets/img/gallery/{f}")

# Fallback or add more from cards if needed
cards_dir = os.path.join(base_dir, "assets", "img", "cards")
if os.path.exists(cards_dir):
    for f in os.listdir(cards_dir):
        if f.endswith('.webp'):
            images.append(f"/assets/img/cards/{f}")

# Shuffle and pick 30
random.shuffle(images)
selected_images = images[:30]

categories = ["architecture", "hammam", "massage", "skincare", "vip"]
category_labels = {
    "architecture": "Santis Architecture",
    "hammam": "Traditional Hammam",
    "massage": "Massage Variations",
    "skincare": "Sothys Skincare",
    "vip": "VIP Suite Experience"
}

grid_html = ""
for img in selected_images:
    cat = random.choice(categories)
    alt_text = f"Santis Club {category_labels[cat]}"
    grid_html += f'''
    <div class="gal-card" data-category="{cat}" style="transition: transform 0.4s ease, opacity 0.4s ease;">
        <img src="{img}" alt="{alt_text}" loading="lazy" decoding="async" width="600" height="auto" style="border-radius:2px;">
    </div>
'''

replacement = f'''<!-- FILTER BAR -->
<div class="filter-bar" style="display:flex; justify-content:center; gap:12px; margin-bottom: 50px; flex-wrap:wrap; opacity:1;">
    <button class="santis-chip is-active" data-filter="all">TÜMÜ</button>
    <button class="santis-chip" data-filter="architecture">MİMARİ</button>
    <button class="santis-chip" data-filter="hammam">HAMAM</button>
    <button class="santis-chip" data-filter="massage">MASAJ</button>
    <button class="santis-chip" data-filter="skincare">CİLT BAKIMI</button>
    <button class="santis-chip" data-filter="vip">VIP SÜİT</button>
</div>

<!-- GALLERY GRID -->
<div id="gallery-grid" class="editorial-grid-engine" style="min-height: 50vh; width: 100%; opacity: 1;">
{grid_html}
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {{
    const filters = document.querySelectorAll('.filter-bar .santis-chip');
    const cards = document.querySelectorAll('.gal-card');

    filters.forEach(btn => {{
        btn.addEventListener('click', () => {{
            filters.forEach(f => f.classList.remove('is-active'));
            btn.classList.add('is-active');

            const filter = btn.getAttribute('data-filter');

            cards.forEach(card => {{
                if (filter === 'all' || card.getAttribute('data-category') === filter) {{
                    card.style.display = 'block';
                    // Trigger reflow
                    void card.offsetWidth;
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                }} else {{
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => {{ 
                        // Double check if still not matching before hiding (prevent fast click bugs)
                        if(btn.classList.contains('is-active') && card.style.opacity === '0') {{
                            card.style.display = 'none'; 
                        }}
                    }}, 400); 
                }}
            }});
        }});
    }});
}});
</script>

</main>'''

file_path = os.path.join(base_dir, "galeri.html")
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to replace from filter bar to end of main
pattern = re.compile(r'<!-- FILTER BAR -->.*?</main>', re.DOTALL)
content = pattern.sub(replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Gallery Overhaul Python Script Completed.")
