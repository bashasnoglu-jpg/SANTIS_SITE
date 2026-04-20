import re

with open('hamam.html', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(r'<div style="text-align: center; margin-bottom: 2rem;">\s*<span class="santis-kicker">OSMANLI MİRASI</span>\s*<h2 class="santis-title" style="font-size: 2.2rem;">Turkish Bath Program</h2>\s*</div>')

replacement = '''      <div style="text-align: center; margin-bottom: 2rem;">
          <h2 class="santis-title" style="font-size: 2.2rem; font-family: 'Playfair Display', serif; font-weight: 400; color: #111; margin-top: 5px;">Turkish Bath Program</h2>
      </div>'''

text = pattern.sub(replacement, text)

# Cache bust
import time
text = re.sub(r'santis\.bento-grid\.css(\?v=[0-9A-Za-z_]+)?', f'santis.bento-grid.css?v={str(int(time.time()))}', text)

with open('hamam.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Title fixed!")
