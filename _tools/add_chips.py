# -*- coding: utf-8 -*-
"""Safely add chip buttons to cilt-bakimi/index.html"""

path = r'c:\Users\tourg\Desktop\SANTIS_SITE\tr\cilt-bakimi\index.html'

# Read file as bytes to preserve encoding
with open(path, 'rb') as f:
    raw = f.read()

content = raw.decode('utf-8')

# Find the exact pattern
import re
pattern = r'<div id="nvChips" class="nv-chips">\s*\n\s*<!-- Rendered by Engine -->\s*\n\s*</div>'
match = re.search(pattern, content)

if match:
    old_text = match.group(0)
    print(f'FOUND at pos {match.start()}: {repr(old_text[:60])}...')
    
    new_text = '''<div id="nvChips" class="nv-chips">
<button class="nv-chip is-active" data-target="all">T\u00fcm\u00fc</button>
<button class="nv-chip" data-target="skincare-basic">Temel Bak\u0131m</button>
<button class="nv-chip" data-target="skincare-purify">Ar\u0131nd\u0131rma</button>
<button class="nv-chip" data-target="skincare-hydra">Nemlendirme</button>
<button class="nv-chip" data-target="skincare-antiage">Anti-Aging</button>
<button class="nv-chip" data-target="skincare-special">\u00d6zel</button>
<button class="nv-chip" data-target="sothys">Sothys Rit\u00fcel</button>
</div>'''
    
    content = content[:match.start()] + new_text + content[match.end():]
    
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(content)
    
    # Verify
    with open(path, 'r', encoding='utf-8') as f:
        verify = f.read()
    print(f'Yeni dosya boyutu: {len(verify)} byte')
    print(f'Chip butonlari var mi: {"nv-chip is-active" in verify}')
    print('OK - 7 chip butonu eklendi!')
else:
    print('PATTERN BULUNAMADI')
    # Show area around nvChips
    idx = content.find('nvChips')
    if idx >= 0:
        area = content[idx-5:idx+200]
        print(f'Area:\n{repr(area)}')
