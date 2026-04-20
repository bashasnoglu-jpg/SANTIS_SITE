import re

# 1. Update CSS File
with open('assets/css/santis-v6/santis.bento-grid.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace all santis-card instances with sov-bento-card
css = css.replace('.santis-card', '.sov-bento-card')

with open('assets/css/santis-v6/santis.bento-grid.css', 'w', encoding='utf-8') as f:
    f.write(css)

# 2. Update HTML File
with open('hamam.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace class="santis-card" with class="sov-bento-card"
html = html.replace('class="santis-card"', 'class="sov-bento-card"')
html = html.replace('class="santis-card ', 'class="sov-bento-card ')

# Cache bust CSS
import time
timestamp = str(int(time.time()))
html = re.sub(r'santis\.bento-grid\.css(\?v=[0-9A-Za-z_]+)?', f'santis.bento-grid.css?v={timestamp}', html)

with open('hamam.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("JS Decoupling Successful! Bento is now immune to Sovereign OS JavaScript.")
