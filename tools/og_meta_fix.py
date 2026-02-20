"""
SANTIS OG & META COMPLETION v1.0
Adds missing og:title, og:description, og:image, and meta description tags.
"""
import os, re
from pathlib import Path

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')
DOMAIN = 'https://santis.club'
SKIP_DIRS = {'_legacy_archive','_legacy_content','_snapshots','backup','backups',
             'node_modules','admin','a4','components','venv','__pycache__',
             '.git','.vscode','_dev_archives','print','public','static','templates',
             'includes','reports','sr','assets'}

DEFAULT_OG_IMAGE = f'{DOMAIN}/assets/img/og-standard.jpg'
stats = {'og_title': 0, 'og_desc': 0, 'og_image': 0, 'meta_desc': 0, 'files': 0}

def get_title(content):
    t = re.search(r'<title>(.*?)</title>', content, re.I)
    if t:
        return t.group(1).strip()
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.I|re.DOTALL)
    if h1:
        return re.sub(r'<[^>]+>', '', h1.group(1)).strip()
    return None

def get_description(content):
    """Extract description from meta tag or first paragraph."""
    # Check existing meta description
    m = re.search(r'<meta\s[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\']', content, re.I)
    if not m:
        m = re.search(r'<meta\s[^>]*content=["\']([^"\']*)["\'][^>]*name=["\']description["\']', content, re.I)
    if m and len(m.group(1).strip()) > 10:
        return m.group(1).strip()
    
    # Extract from first <p>
    p = re.search(r'<p[^>]*>([^<]{30,200})', content, re.I)
    if p:
        text = p.group(1).strip()
        if len(text) > 155:
            text = text[:152] + '...'
        return text
    
    # Fallback from title
    title = get_title(content)
    if title:
        return f'{title} — Santis Club Spa & Wellness deneyimi.'
    
    return 'Santis Club — Premium spa, hamam ve wellness deneyimi.'

def get_og_image(content, rel):
    """Find an appropriate OG image."""
    # Check for existing og:image
    m = re.search(r'property=["\']og:image["\'][^>]*content=["\']([^"\']+)', content, re.I)
    if not m:
        m = re.search(r'content=["\']([^"\']+)["\'][^>]*property=["\']og:image', content, re.I)
    if m:
        return None  # Already has og:image

    # Try to find first img in page
    img = re.search(r'<img\s[^>]*src=["\']([^"\']+\.(?:jpg|jpeg|png|webp))', content, re.I)
    if img:
        src = img.group(1)
        if src.startswith('http'):
            return src
        # Convert relative to absolute
        if src.startswith('/'):
            return f'{DOMAIN}{src}'
        else:
            base = os.path.dirname(rel)
            return f'{DOMAIN}/{base}/{src}'
    
    return DEFAULT_OG_IMAGE

for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for f in fn:
        if not f.endswith('.html'): continue
        fp = Path(dp) / f
        rel = str(fp.relative_to(ROOT)).replace('\\','/')
        
        with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
            content = fh.read()
        
        original = content
        title = get_title(content)
        description = get_description(content)
        
        tags_to_add = []
        
        # 1. meta description
        has_meta_desc = bool(re.search(r'<meta\s[^>]*name=["\']description["\']', content, re.I))
        if not has_meta_desc and description:
            tags_to_add.append(f'<meta name="description" content="{description}"/>')
            stats['meta_desc'] += 1
        
        # 2. og:title
        has_og_title = bool(re.search(r'property=["\']og:title', content, re.I))
        if not has_og_title and title:
            clean_title = title.split(' | ')[0].split(' • ')[0].strip()
            tags_to_add.append(f'<meta property="og:title" content="{clean_title}"/>')
            stats['og_title'] += 1
        
        # 3. og:description
        has_og_desc = bool(re.search(r'property=["\']og:description', content, re.I))
        if not has_og_desc and description:
            tags_to_add.append(f'<meta property="og:description" content="{description}"/>')
            stats['og_desc'] += 1
        
        # 4. og:image
        has_og_image = bool(re.search(r'property=["\']og:image', content, re.I))
        if not has_og_image:
            og_img = get_og_image(content, rel)
            if og_img:
                tags_to_add.append(f'<meta property="og:image" content="{og_img}"/>')
                stats['og_image'] += 1
        
        # 5. og:url
        has_og_url = bool(re.search(r'property=["\']og:url', content, re.I))
        if not has_og_url:
            tags_to_add.append(f'<meta property="og:url" content="{DOMAIN}/{rel}"/>')
        
        # 6. og:type
        has_og_type = bool(re.search(r'property=["\']og:type', content, re.I))
        if not has_og_type:
            tags_to_add.append('<meta property="og:type" content="website"/>')
        
        if tags_to_add:
            tag_block = '\n<!-- Open Graph -->\n' + '\n'.join(tags_to_add)
            if '</head>' in content:
                content = content.replace('</head>', tag_block + '\n</head>', 1)
            
            if content != original:
                with open(fp, 'w', encoding='utf-8') as fh:
                    fh.write(content)
                stats['files'] += 1

print(f'{"="*60}')
print(f'SONUÇLAR:')
print(f'  og:title eklenen:       {stats["og_title"]} sayfa')
print(f'  og:description eklenen: {stats["og_desc"]} sayfa')
print(f'  og:image eklenen:       {stats["og_image"]} sayfa')
print(f'  meta description:       {stats["meta_desc"]} sayfa')
print(f'  Toplam dosya:           {stats["files"]}')
print(f'{"="*60}')
