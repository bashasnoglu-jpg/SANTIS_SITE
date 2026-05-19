import re

with open('hamam.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove "OSMANLI MİRASI / Turkish Bath Program" Header
header_pattern = re.compile(r'<div style="text-align: center; margin-bottom: 2rem;">\s*<span class="santis-kicker">OSMANLI MİRASI</span>\s*<h2 class="santis-title"[^>]*>Turkish Bath Program</h2>\s*</div>', re.DOTALL)
html = header_pattern.sub('', html)

# 2. Remove "Classic Kese" card entirely to drop grid cell count from 9 down to 8.
kese_pattern = re.compile(r'<article class="santis-card"[^>]*>\s*<div class="santis-bento-content">\s*<h3[^>]*>Classic Kese</h3>\s*<p[^>]*>.*?45 € — Saf arınma.*?</p>\s*</div>\s*</article>', re.DOTALL)
html = kese_pattern.sub('', html)

# 3. Strip 'wide' class from "Algae & Foam" so it becomes 1 cell instead of 2.
# This makes Hero = 4 cells, Foam = 1, Honey = 1, Coffee = 1, Algae = 1. Total = 8 cells.
# 8 cells exactly fills 2 rows of a 4-column grid!
algae_pattern = re.compile(r'<article class="santis-card wide"([^>]*)onclick="if\(window.openReservationModal\) window\.openReservationModal\(\'Algae &amp; Foam\'\);"')
html = algae_pattern.sub(r'<article class="santis-card"\1onclick="if(window.openReservationModal) window.openReservationModal(\'Algae & Foam\');"', html)

# Also fix the actual click handler text which might have &amp;
algae_pattern_2 = re.compile(r'<article class="santis-card wide"([^>]*)onclick="if\(window.openReservationModal\) window\.openReservationModal\(\'Algae & Foam\'\);"')
html = algae_pattern_2.sub(r'<article class="santis-card"\1onclick="if(window.openReservationModal) window.openReservationModal(\'Algae & Foam\');"', html)

with open('hamam.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Architecture geometrically stabilized!")
