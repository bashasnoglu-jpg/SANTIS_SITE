"""
SANTIS ANCHOR TEXT OPTIMIZER v1.0
1. Replaces generic anchors ("Tümünü Gör") with descriptive ones
2. Diversifies overused auto-generated link anchors ("➤ Klasik Rahatlama Masajı" etc.)
"""
import os, re, random
from pathlib import Path

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')
SKIP_DIRS = {'_legacy_archive','_legacy_content','_snapshots','backup','backups',
             'node_modules','admin','a4','components','venv','__pycache__',
             '.git','.vscode','_dev_archives','print','public','static','templates',
             'includes','reports','sr','assets'}

stats = {'generic_fixed': 0, 'arrow_diversified': 0, 'files_modified': 0}

# ─── 1. GENERIC ANCHOR REPLACEMENTS ───
# Map: (generic text, href pattern) → replacement text
GENERIC_REPLACEMENTS = {
    'tümünü gör': {
        '/tr/masajlar/': 'Tüm Masaj Terapilerini Keşfet',
        '/tr/hamam/': 'Tüm Hamam Ritüellerini Keşfet',
        '/tr/cilt-bakimi/': 'Tüm Cilt Bakımı Seçeneklerini Keşfet',
        '/tr/hizmetler/': 'Tüm Özel Hizmetleri Keşfet',
        '/tr/urunler/': 'Tüm Ürünleri İncele',
        '/tr/magaza/': 'Koleksiyonu İncele',
    },
    'devamını oku': {
        '/tr/blog/': 'Yazının Tamamını Oku',
        '/tr/bilgelik/': 'Devamını Keşfet',
    },
}

# ─── 2. ARROW ANCHOR DIVERSIFICATION ───
# For auto-generated "➤ Service Name" links, create variations
ARROW_VARIATIONS = {
    'masaj': [
        '{name} Hakkında Bilgi',
        '{name} Detayları',
        '{name} Deneyimi',
        '{name} — Detaylar & Fiyat',
        '{name} Terapisi',
    ],
    'hamam': [
        '{name} Ritüeli',
        '{name} Hakkında',
        '{name} Deneyimi',
        '{name} — Detaylar',
        '{name} Keşfet',
    ],
    'cilt': [
        '{name} Bakımı Hakkında',
        '{name} — Detaylar',
        '{name} Prosedürü',
        '{name} Hakkında Bilgi',
        '{name} Keşfet',
    ],
}

def detect_category(href):
    if '/masaj' in href or '/massage' in href:
        return 'masaj'
    elif '/hamam' in href or '/hammam' in href:
        return 'hamam'
    elif '/cilt' in href or '/skin' in href or '/services/' in href:
        return 'cilt'
    return 'masaj'

def fix_generic_anchors(content, rel):
    """Replace generic anchor text with descriptive versions."""
    modified = False
    for generic, href_map in GENERIC_REPLACEMENTS.items():
        # Find all links with this generic text
        pattern = re.compile(
            r'(<a\s[^>]*href=["\'])([^"\']+)(["\'][^>]*>)\s*' + re.escape(generic) + r'\s*(</a>)',
            re.IGNORECASE
        )
        def replace_match(m):
            nonlocal modified
            href = m.group(2)
            for href_pattern, replacement in href_map.items():
                if href_pattern in href:
                    modified = True
                    return m.group(1) + href + m.group(3) + replacement + m.group(4)
            # Default: capitalize the generic
            return m.group(0)
        
        content = pattern.sub(replace_match, content)
    
    return content, modified

def diversify_arrow_anchors(content, rel):
    """Replace identical ➤ prefixed anchors with varied text."""
    modified = False
    
    # Find all ➤ links
    pattern = re.compile(r'(<a\s[^>]*href=["\'])([^"\']+)(["\'][^>]*>)\s*➤\s*([^<]+)(</a>)', re.IGNORECASE)
    matches = list(pattern.finditer(content))
    
    if len(matches) < 2:
        return content, False
    
    # Group by anchor text
    seen_texts = {}
    replacements = []
    
    for m in matches:
        href = m.group(2)
        name = m.group(4).strip()
        key = name.lower()
        cat = detect_category(href)
        variations = ARROW_VARIATIONS.get(cat, ARROW_VARIATIONS['masaj'])
        
        if key in seen_texts:
            seen_texts[key] += 1
            # Pick a variation based on count
            idx = seen_texts[key] % len(variations)
            new_text = variations[idx].format(name=name)
            replacements.append((m.start(), m.end(), 
                m.group(1) + href + m.group(3) + new_text + m.group(5)))
        else:
            seen_texts[key] = 0
    
    # Apply replacements in reverse order
    for start, end, replacement in reversed(replacements):
        content = content[:start] + replacement + content[end:]
        modified = True
    
    return content, modified


# ─── MAIN PROCESSING ───
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for f in fn:
        if not f.endswith('.html'): continue
        fp = Path(dp) / f
        rel = str(fp.relative_to(ROOT)).replace('\\','/')
        
        with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
            content = fh.read()
        
        original = content
        
        # Fix generic anchors
        content, g_mod = fix_generic_anchors(content, rel)
        if g_mod:
            stats['generic_fixed'] += 1
        
        # Diversify arrow anchors
        content, a_mod = diversify_arrow_anchors(content, rel)
        if a_mod:
            stats['arrow_diversified'] += 1
        
        if content != original:
            with open(fp, 'w', encoding='utf-8') as fh:
                fh.write(content)
            stats['files_modified'] += 1

print(f'{"="*60}')
print(f'SONUÇLAR:')
print(f'  Generic anchor düzeltilen: {stats["generic_fixed"]} dosya')
print(f'  Arrow anchor çeşitlendirilen: {stats["arrow_diversified"]} dosya')
print(f'  Toplam dosya: {stats["files_modified"]}')
print(f'{"="*60}')
