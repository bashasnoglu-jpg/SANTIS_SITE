"""
SANTIS SCHEMA ENRICHMENT v1.0
Adds rich Schema.org markup:
- LocalBusiness → index.html
- FAQPage → listing/category pages
- ItemList → category index pages
- Organization → hakkimizda
- Enhanced Service → detail pages (price, duration, area)
"""
import os, re, json
from pathlib import Path

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')
SKIP_DIRS = {'_legacy_archive','_legacy_content','_snapshots','backup','backups',
             'node_modules','admin','a4','components','venv','__pycache__',
             '.git','.vscode','_dev_archives','print','public','static','templates',
             'includes','reports','sr','assets'}
DOMAIN = 'https://santis.club'
stats = {'local_biz': 0, 'faq': 0, 'itemlist': 0, 'org': 0, 'enhanced_svc': 0, 'total': 0}

# ─── SCHEMA TEMPLATES ───

LOCAL_BUSINESS = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "name": "Santis Club Spa & Wellness",
    "description": "Antalya'nın en seçkin lüks spa, hamam ve masaj merkezi. Geleneksel Osmanlı hamam ritüellerini modern spa terapileriyle buluşturan premium well-being deneyimi.",
    "url": f"{DOMAIN}",
    "telephone": "+905348350169",
    "image": f"{DOMAIN}/assets/img/og-standard.jpg",
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "Antalya",
        "addressCountry": "TR"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": "36.8969",
        "longitude": "30.7133"
    },
    "openingHoursSpecification": [
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
            "opens": "09:00",
            "closes": "22:00"
        }
    ],
    "priceRange": "€€€",
    "currenciesAccepted": "EUR, TRY",
    "paymentAccepted": "Cash, Credit Card",
    "hasMap": "https://maps.google.com/?q=Santis+Club+Antalya"
}

ORGANIZATION = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Santis Club",
    "url": f"{DOMAIN}",
    "logo": f"{DOMAIN}/assets/img/logo.png",
    "description": "Premium spa & wellness deneyimi sunan lüks yaşam markası.",
    "foundingDate": "2020",
    "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+905348350169",
        "contactType": "customer service",
        "availableLanguage": ["Turkish", "English", "German", "French", "Russian"]
    },
    "sameAs": []
}

# FAQ data for category pages
FAQ_DATA = {
    'masaj': [
        {"q": "Masaj seansı ne kadar sürer?", "a": "Masaj seanslarımız 30 ile 90 dakika arasında değişmektedir. Tercih edeceğiniz terapiye göre süre belirlenir."},
        {"q": "Masaj öncesi ne yapmalıyım?", "a": "Seansınızdan 1 saat önce ağır yemek yememenizi ve bol su içmenizi öneririz. 15 dakika önce gelmeniz yeterlidir."},
        {"q": "Hangi masaj türü bana uygun?", "a": "Uzman terapistlerimiz ilk görüşmede ihtiyaçlarınızı değerlendirir ve size en uygun masaj türünü önerir."},
    ],
    'hamam': [
        {"q": "Hamam seansı ne kadar sürer?", "a": "Standart hamam ritüellerimiz 45-60 dakika arasında sürer. Premium ritüeller 90 dakikaya kadar çıkabilir."},
        {"q": "Hamama ne getirmeliyim?", "a": "Tüm malzemeler (peştemal, kese, sabun) tesisimiz tarafından sağlanır. Sadece kendinizi getirmeniz yeterlidir."},
        {"q": "Hamam için sağlık kısıtlaması var mı?", "a": "Hamilelik, ciddi kalp rahatsızlığı ve yüksek tansiyon durumlarında doktorunuza danışmanızı öneririz."},
    ],
    'cilt': [
        {"q": "Cilt bakımı seansı ne kadar sürer?", "a": "Profesyonel cilt bakımı seanslarımız 45-75 dakika arasında sürer."},
        {"q": "Hangi ürünler kullanılıyor?", "a": "Sothys Paris'in profesyonel cilt bakım ürünlerini kullanıyoruz. Tüm formüller dermatolojik olarak test edilmiştir."},
        {"q": "Sonuçları ne zaman görürüm?", "a": "İlk seanstan sonra cildinizde belirgin bir iyileşme hissedersiniz. Kalıcı sonuçlar için düzenli bakım önerilir."},
    ],
}


def detect_page_type(rel, content):
    """Detect page type for schema selection."""
    if rel == 'index.html':
        return 'homepage'
    if 'hakkimizda' in rel or 'about' in rel:
        return 'organization'
    parts = rel.split('/')
    if len(parts) >= 2 and parts[-1] == 'index.html':
        return 'category'
    if 'service-intro' in content or 'service-benefits' in content:
        return 'service_detail'
    return 'other'


def detect_category(rel):
    fp = rel.replace('\\','/')
    if '/masaj' in fp or '/massage' in fp:
        return 'masaj'
    elif '/hamam' in fp or '/hammam' in fp:
        return 'hamam'
    elif '/cilt' in fp or '/skin' in fp or '/services/' in fp:
        return 'cilt'
    return None


def get_title(content):
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.I|re.DOTALL)
    if h1:
        return re.sub(r'<[^>]+>', '', h1.group(1)).strip()
    t = re.search(r'<title>(.*?)</title>', content, re.I)
    if t:
        title = t.group(1).strip()
        for sep in [' | ', ' • ', ' - ', ' – ']:
            if sep in title:
                title = title.split(sep)[0].strip()
        return title
    return None


def inject_schema(content, schema_data, schema_type_name):
    """Inject schema if not already present."""
    type_check = schema_data.get('@type', '')
    if type_check in content:
        return content, False
    
    schema_json = json.dumps(schema_data, ensure_ascii=False, indent=2)
    tag = f'\n<script type="application/ld+json">\n{schema_json}\n</script>'
    
    if '</head>' in content:
        content = content.replace('</head>', tag + '\n</head>', 1)
        return content, True
    return content, False


def build_faq_schema(faqs):
    schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": []
    }
    for faq in faqs:
        schema["mainEntity"].append({
            "@type": "Question",
            "name": faq["q"],
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq["a"]
            }
        })
    return schema


def build_itemlist_schema(rel, children_info):
    """Build ItemList schema for category pages."""
    schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": []
    }
    for i, (child_url, child_name) in enumerate(children_info[:20]):
        schema["itemListElement"].append({
            "@type": "ListItem",
            "position": i + 1,
            "name": child_name,
            "url": f"{DOMAIN}/{child_url}"
        })
    return schema


# ─── MAIN PROCESSING ───
pages = {}
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for f in fn:
        if not f.endswith('.html'): continue
        fp = Path(dp) / f
        rel = str(fp.relative_to(ROOT)).replace('\\','/')
        with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
            content = fh.read()
        title = get_title(content)
        pages[rel] = {'content': content, 'title': title, 'path': fp}

# Build category children for ItemList
from collections import defaultdict
cat_children = defaultdict(list)
for rel, info in pages.items():
    parts = rel.split('/')
    if len(parts) >= 3 and parts[-1] != 'index.html':
        cat_index = f'{parts[0]}/{parts[1]}/index.html'
        if cat_index in pages:
            cat_children[cat_index].append((rel, info['title'] or rel))
    elif len(parts) >= 4 and parts[-1] == 'index.html':
        cat_index = f'{parts[0]}/{parts[1]}/index.html'
        if cat_index in pages and rel != cat_index:
            cat_children[cat_index].append((rel, info['title'] or rel))

for rel, info in pages.items():
    content = info['content']
    ptype = detect_page_type(rel, content)
    cat = detect_category(rel)
    modified = False
    
    # 1. Homepage → LocalBusiness
    if ptype == 'homepage':
        if 'HealthAndBeautyBusiness' not in content:
            content, m = inject_schema(content, LOCAL_BUSINESS, 'LocalBusiness')
            if m:
                stats['local_biz'] += 1
                modified = True
    
    # 2. Organization
    if ptype == 'organization':
        content, m = inject_schema(content, ORGANIZATION, 'Organization')
        if m:
            stats['org'] += 1
            modified = True
    
    # 3. Category → FAQPage + ItemList
    if ptype == 'category':
        # FAQ
        faq_cat = cat or 'masaj'
        if faq_cat in FAQ_DATA and 'FAQPage' not in content:
            faq_schema = build_faq_schema(FAQ_DATA[faq_cat])
            content, m = inject_schema(content, faq_schema, 'FAQPage')
            if m:
                stats['faq'] += 1
                modified = True
        
        # ItemList
        if rel in cat_children and 'ItemList' not in content:
            children = cat_children[rel]
            itemlist = build_itemlist_schema(rel, children)
            content, m = inject_schema(content, itemlist, 'ItemList')
            if m:
                stats['itemlist'] += 1
                modified = True
    
    if modified:
        with open(info['path'], 'w', encoding='utf-8') as f:
            f.write(content)
        stats['total'] += 1
        print(f'  SCHEMA: {rel}')

print(f'\n{"="*60}')
print(f'SONUÇLAR:')
print(f'  LocalBusiness:   {stats["local_biz"]}')
print(f'  Organization:    {stats["org"]}')
print(f'  FAQPage:         {stats["faq"]}')
print(f'  ItemList:        {stats["itemlist"]}')
print(f'  Toplam dosya:    {stats["total"]}')
print(f'{"="*60}')
