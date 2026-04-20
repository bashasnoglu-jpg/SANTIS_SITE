"""
SANTIS BREADCRUMB INJECTOR v1.0
Adds JSON-LD BreadcrumbList schema to all pages.
"""
import os, re, json
from pathlib import Path

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')
DOMAIN = 'https://santis.club'
SKIP_DIRS = {'_legacy_archive','_legacy_content','_snapshots','backup','backups',
             'node_modules','admin','a4','components','venv','__pycache__',
             '.git','.vscode','_dev_archives','print','public','static','templates',
             'includes','reports','sr','assets'}

# Category name mappings
CATEGORY_NAMES = {
    'tr': {
        'masajlar': 'Masaj Terapileri',
        'hamam': 'Hamam Ritüelleri',
        'cilt-bakimi': 'Cilt Bakımı',
        'hizmetler': 'Özel Hizmetler',
        'magaza': 'Mağaza',
        'urunler': 'Ürünler',
        'galeri': 'Galeri',
        'hakkimizda': 'Hakkımızda',
        'blog': 'Journal',
        'bilgelik': 'Bilgelik Köşesi',
        'ekibimiz': 'Ekibimiz',
        'rezervasyon': 'Rezervasyon',
    },
    'en': {
        'massages': 'Massage Therapies',
        'hammam': 'Hammam Rituals',
        'services': 'Skincare & Services',
        'products': 'Products',
    },
    'de': {
        'massagen': 'Massage Therapien',
        'hammam': 'Hammam Rituale',
        'services': 'Hautpflege & Services',
        'untitled': 'Spezial',
    },
    'fr': {
        'massages': 'Massages',
        'hammam': 'Hammam Rituels',
        'services': 'Soins du Visage',
        'untitled': 'Spécial',
    },
    'ru': {
        'massages': 'Массаж',
        'hammam': 'Хаммам Ритуалы',
        'services': 'Уход за Кожей',
    },
}

HOME_NAMES = {
    'tr': 'Ana Sayfa', 'en': 'Home', 'de': 'Startseite',
    'fr': 'Accueil', 'ru': 'Главная'
}

def detect_lang(rel):
    parts = rel.split('/')
    if parts[0] in ('tr','en','de','fr','ru'):
        return parts[0]
    return 'tr'

def get_page_title(content):
    m = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.I|re.DOTALL)
    if m:
        return re.sub(r'<[^>]+>', '', m.group(1)).strip()
    m = re.search(r'<title>(.*?)</title>', content, re.I)
    if m:
        title = m.group(1).strip()
        for sep in [' | ', ' • ', ' - ', ' – ']:
            if sep in title:
                title = title.split(sep)[0].strip()
        return title
    return None

def build_breadcrumb(rel, content):
    """Build breadcrumb items based on URL path."""
    parts = rel.replace('\\','/').split('/')
    lang = detect_lang(rel)
    home_name = HOME_NAMES.get(lang, 'Home')
    
    items = [{'name': home_name, 'url': f'{DOMAIN}/index.html'}]
    
    if rel == 'index.html':
        return items  # Just home for root
    
    # Language home
    if parts[0] in ('tr','en','de','fr','ru'):
        lang_home = f'{DOMAIN}/{parts[0]}/index.html'
        items.append({'name': home_name, 'url': lang_home})
        path_parts = parts[1:]
    else:
        path_parts = parts
    
    # Build path segments
    cat_names = CATEGORY_NAMES.get(lang, {})
    accumulated = parts[0] if parts[0] in ('tr','en','de','fr','ru') else ''
    
    for i, part in enumerate(path_parts):
        if part == 'index.html':
            # This is the page itself, get name from content
            page_title = get_page_title(content) or cat_names.get(path_parts[i-1] if i > 0 else '', part)
            if page_title and items[-1]['name'] != page_title:
                items.append({'name': page_title, 'url': f'{DOMAIN}/{rel}'})
            break
        elif part.endswith('.html'):
            # Detail page
            page_title = get_page_title(content) or part.replace('.html','').replace('-',' ').title()
            items.append({'name': page_title, 'url': f'{DOMAIN}/{rel}'})
            break
        else:
            # Directory → category
            cat_name = cat_names.get(part, part.replace('-',' ').title())
            if accumulated:
                cat_url = f'{DOMAIN}/{accumulated}/{part}/index.html'
            else:
                cat_url = f'{DOMAIN}/{part}/index.html'
            items.append({'name': cat_name, 'url': cat_url})
            accumulated = f'{accumulated}/{part}' if accumulated else part
    
    return items

def generate_breadcrumb_schema(items):
    """Generate JSON-LD BreadcrumbList."""
    schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": []
    }
    for i, item in enumerate(items):
        schema["itemListElement"].append({
            "@type": "ListItem",
            "position": i + 1,
            "name": item["name"],
            "item": item["url"]
        })
    return json.dumps(schema, ensure_ascii=False, indent=2)

count = 0
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for f in fn:
        if not f.endswith('.html'): continue
        fp = Path(dp) / f
        rel = str(fp.relative_to(ROOT)).replace('\\','/')
        
        with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
            content = fh.read()
        
        # Skip if already has breadcrumb
        if 'BreadcrumbList' in content:
            continue
        
        # Build breadcrumb
        items = build_breadcrumb(rel, content)
        if len(items) < 2:
            continue  # Skip root with only home
        
        schema_json = generate_breadcrumb_schema(items)
        bc_tag = f'\n<script type="application/ld+json">\n{schema_json}\n</script>'
        
        # Inject before </head>
        if '</head>' in content:
            content = content.replace('</head>', bc_tag + '\n</head>', 1)
            with open(fp, 'w', encoding='utf-8') as fh:
                fh.write(content)
            count += 1

print(f'Breadcrumb eklenen sayfa: {count}')
