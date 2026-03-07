"""Extract content from hand-written skincare pages for page_configs migration."""
import json, re
from pathlib import Path
from html.parser import HTMLParser

class ContentExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self._capture = None
        self._depth = 0
        self.sections = {}
        self._current = []

    def handle_starttag(self, tag, attrs):
        classes = dict(attrs).get("class", "")
        if "service-intro" in classes: self._capture = "intro"
        if "service-benefits" in classes: self._capture = "benefits"

    def handle_data(self, data):
        if self._capture:
            self._current.append(data.strip())

    def handle_endtag(self, tag):
        if tag == "section" and self._capture:
            self.sections[self._capture] = " ".join(filter(None, self._current))
            self._capture = None
            self._current = []

TR_DIR = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\cilt-bakimi")
EN_DIR = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE\en\skincare")

SLUG_MAP = {
    "classic-facial": "Klasik Cilt Bakımı",
    "deep-cleanse": "Derin Temizleme Bakımı",
    "enzyme-peel": "Enzim Peeling Bakımı",
    "detox-charcoal": "Detox Kömür Maske",
    "hyaluron-hydrate": "Hyaluron Nem Terapisi",
    "vitamin-c-glow": "Vitamin C Glow",
    "oxygen-boost": "Oksijen Boost Bakımı",
    "glass-skin": "Glass Skin Ritüeli",
    "collagen-lift": "Kolajen Lifting Bakımı",
    "anti-aging-pro": "Anti-Aging Pro Bakım",
    "led-rejuvenation": "LED Rejuvenation",
    "brightening-spot": "Leke Karşıtı Aydınlatıcı Bakım",
    "acne-balance": "Akne & Sebum Denge Bakımı",
    "sensitive-soothe": "Hassas Cilt Sakinleştirici Bakım",
    "barrier-repair": "Bariyer Onarıcı Bakım",
    "micro-polish": "Micro Polish Bakımı",
    "gold-mask-ritual": "Gold Mask Ritüeli",
    "eye-contour": "Göz Çevresi Bakımı",
    "lip-care": "Dudak Bakımı",
    "men-facial": "Erkek Cilt Bakımı",
}

for slug in sorted(SLUG_MAP.keys()):
    en_file = EN_DIR / f"{slug}.html"
    if en_file.exists():
        html = en_file.read_text(encoding="utf-8")
        # Extract EN title from h1
        m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.S)
        en_title = m.group(1).strip() if m else "?"
        # Extract meta desc
        m2 = re.search(r'name="description"[^>]*content="([^"]*)"', html)
        en_desc = m2.group(1).strip() if m2 else "?"
        print(f'"{slug}": {{"en": "{en_title}", "desc_en": "{en_desc}"}},')
    else:
        print(f'"{slug}": NOT FOUND')
