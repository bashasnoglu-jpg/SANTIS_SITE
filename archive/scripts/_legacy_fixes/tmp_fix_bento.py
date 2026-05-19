import re

# 1. Update CSS File
with open('assets/css/santis-v6/santis.bento-grid.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Fix the background of the normal card so it doesn't have the image
css = css.replace(
    "background: rgba(255, 255, 255, 0.05) url('/assets/img/cards/santis_hero_massage_lux.webp') center/cover;",
    "background: rgba(25, 25, 25, 0.4);" # Provide a dark elegant glass background for contrast
)
css = css.replace("background-blend-mode: overlay;", "") # Not needed for plain color
css = css.replace("card-content", "santis-bento-content")

# To prevent the right sliver issue, let's force a safer grid column sizing, like minmax(240px, 1fr)
css = css.replace(
    "grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));",
    "grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));"
)

# 2. Add safe z-index to text
css += """
.santis-bento-content {
    position: relative;
    z-index: 10;
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
}
"""

with open('assets/css/santis-v6/santis.bento-grid.css', 'w', encoding='utf-8') as f:
    f.write(css)

# 3. Update HTML File
with open('hamam.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Rename the conflicting class content
html = html.replace('class="card-content"', 'class="santis-bento-content"')

with open('hamam.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Bento visual bugs eliminated!")
