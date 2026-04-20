import re
import time

with open('hamam.html', 'r', encoding='utf-8') as f:
    html = f.read()

# The dangling blocks start with:
# </div>\s*<div class="santis-signature-info" style="flex: 1; display: flex; flex-direction: column;">
# And end basically right before:
#       </div>\s*</section>\s*<!-- V11 PHASE 3: THE GIANT GALLERY (Apple Pro Exhibition) -->

pattern = re.compile(r'    </div>\s*<div class="santis-signature-info" style="flex: 1; display: flex; flex-direction: column;">.*?</button>', re.DOTALL)
html = pattern.sub('', html)

# Cache bust the CSS link again just in case.
timestamp = str(int(time.time()))
html = re.sub(r'santis\.bento-grid\.css(\?v=[0-9A-Za-z_]+)?', f'santis.bento-grid.css?v={timestamp}', html)

with open('hamam.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Dangling HTML cleanly excised!")
