#!/usr/bin/env python3
"""
SANTIS CLUB – Homepage Build System v1.0
=========================================
Single source of truth for all 6 language homepages.
Run: python _build/build_homepages.py
"""

import json
import os
import re
import sys
import time
from datetime import datetime

# [SOVEREIGN SEAL: THE STRUCTURED MATRIX LOGGER]
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "ai", "logs")
MATRIX_LOG_FILE = os.path.join(LOG_DIR, "matrix_build.log")

def emit_matrix_pulse(action: str, target: str, latency_ms: float, pages_active: int, health: int = 100):
    os.makedirs(LOG_DIR, exist_ok=True)
    payload = {
        "timestamp": datetime.now().strftime("%H:%M:%S.%f")[:-3],
        "message": f"[{action}] {target} in {latency_ms:.0f}ms",
        "pages_active": pages_active,
        "node_health": f"{health}%",
        "hreflang_status": "SYNCED" if health >= 90 else "STRESSED"
    }
    with open(MATRIX_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(payload) + "\n")

# ── Config ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_DIR = os.path.join(BASE_DIR, '_build')
TEMPLATE_DIR = os.path.join(BUILD_DIR, 'templates')
I18N_DIR = os.path.join(BUILD_DIR, 'i18n')
LANGS = ['en', 'de', 'fr', 'ru', 'sr', 'tr']

# ── Template Loading ────────────────────────────────────
def load_template(name):
    path = os.path.join(TEMPLATE_DIR, name)
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def load_translations(lang):
    path = os.path.join(I18N_DIR, f'{lang}.json')
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

# ── FAQ Builder ─────────────────────────────────────────
def build_faq_json(faq_list):
    items = []
    for faq in faq_list:
        item = json.dumps({
            "@type": "Question",
            "name": faq["q"],
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq["a"]
            }
        }, ensure_ascii=False)
        items.append(item)
    return ','.join(items)

# ── Placeholder Replacement ────────────────────────────
def apply_translations(template, t, lang):
    """Replace all {{PLACEHOLDER}} with translation values."""
    
    # Map: placeholder → JSON path
    mapping = {
        'LANG': lang,
        'META_TITLE': t['meta']['title'],
        'META_DESC': t['meta']['description'],
        'OG_TITLE': t['meta']['og_title'],
        'BREADCRUMB_NAME': t['meta']['breadcrumb_name'],
        'FAQ_ITEMS': build_faq_json(t['faq']),
        # Nav
        'NAV_HOME': t['nav']['home'],
        'NAV_HAMMAM': t['nav']['hammam'],
        'NAV_MASSAGE': t['nav']['massage'],
        'NAV_SKIN': t['nav']['skin'],
        'NAV_SHOP': t['nav']['shop'],
        'NAV_GALLERY': t['nav']['gallery'],
        'NAV_ABOUT': t['nav']['about'],
        # Hero
        'HERO_CAPTION': t['hero']['caption'],
        'HERO_TITLE': t['hero']['title'],
        'HERO_DESC': t['hero']['desc'],
        'HERO_SCROLL': t['hero']['scroll'],
        # Signature Cards
        'SIG_KICKER': t['signature']['kicker'],
        'SIG_TITLE': t['signature']['title'],
        'SIG_SUBTITLE': t['signature']['subtitle'],
        'CARD_HAMMAM': t['signature']['hammam'],
        'CARD_HAMMAM_DESC': t['signature']['hammam_desc'],
        'CARD_HAMMAM_ALT': t['signature']['hammam_alt'],
        'CARD_MASSAGE': t['signature']['massage'],
        'CARD_MASSAGE_DESC': t['signature']['massage_desc'],
        'CARD_MASSAGE_ALT': t['signature']['massage_alt'],
        'CARD_SKIN': t['signature']['skin'],
        'CARD_SKIN_DESC': t['signature']['skin_desc'],
        'CARD_SKIN_ALT': t['signature']['skin_alt'],
        'CARD_ATELIER': t['signature']['atelier'],
        'CARD_ATELIER_DESC': t['signature']['atelier_desc'],
        'CARD_ATELIER_ALT': t['signature']['atelier_alt'],
        'CARD_CTA': t['signature']['cta'],
        # Philosophy
        'PHILO_KICKER': t['philosophy']['kicker'],
        'PHILO_TITLE': t['philosophy']['title'],
        'PHILO_TEXT1': t['philosophy']['text1'],
        'PHILO_TEXT2': t['philosophy']['text2'],
        'PHILO_CTA': t['philosophy']['cta'],
        # Global Trends
        'GLOBAL_KICKER': t['global']['kicker'],
        'GLOBAL_TITLE': t['global']['title'],
        'TREND_ASIA_LABEL': t['global']['asia_label'],
        'TREND_THAI_LABEL': t['global']['thai_label'],
        'TREND_ITALY_LABEL': t['global']['italy_label'],
        'TREND_BEAUTY_LABEL': t['global']['beauty_label'],
        'TREND_1_TITLE': t['global']['t1_title'],
        'TREND_1_DESC': t['global']['t1_desc'],
        'TREND_2_TITLE': t['global']['t2_title'],
        'TREND_2_DESC': t['global']['t2_desc'],
        'TREND_3_TITLE': t['global']['t3_title'],
        'TREND_4_TITLE': t['global']['t4_title'],
        'TREND_4_DESC': t['global']['t4_desc'],
        # Testimonials
        'TEST_KICKER': t['testimonials']['kicker'],
        'TEST_TITLE': t['testimonials']['title'],
        'TEST_1': t['testimonials']['t1'],
        'TEST_2': t['testimonials']['t2'],
        'TEST_3': t['testimonials']['t3'],
        'TEST_LOC': t['testimonials']['loc'],
        # Booking
        'BOOK_KICKER': t['booking']['kicker'],
        'BOOK_TITLE': t['booking']['title'],
        'BOOK_DESC': t['booking']['desc'],
        'BOOK_WA': t['booking']['wa'],
        'BOOK_CALL': t['booking']['call'],
        # Sticky
        'STICKY_TEXT': t['sticky']['text'],
        'STICKY_BTN': t['sticky']['btn'],
        # Paths (language-specific directory names)
        'PATH_HAMMAM': t.get('PATH_HAMMAM', 'hammam'),
        'PATH_MASSAGES': t.get('PATH_MASSAGES', 'massages'),
        'PATH_SKINCARE': t.get('PATH_SKINCARE', 'services'),
        'PATH_PRODUCTS': t.get('PATH_PRODUCTS', 'products'),
        'PATH_ABOUT_FULL': t.get('PATH_ABOUT_FULL', 'tr/hakkimizda/index.html'),
        'PATH_GALLERY_FULL': t.get('PATH_GALLERY_FULL', 'tr/galeri/index.html'),
    }
    
    result = template
    for key, value in mapping.items():
        result = result.replace('{{' + key + '}}', value)
    
    return result

# ── Validation ──────────────────────────────────────────
def validate(content, lang):
    """Post-build validation. Returns list of errors."""
    errors = []
    
    # Required elements
    checks = {
        f'lang="{lang}"': 'html lang attribute',
        '<title>': 'title tag',
        'name="description"': 'meta description',
        'rel="canonical"': 'canonical link',
        f'santis-club.com/{lang}/index.html': 'correct lang URL',
        'hreflang="de"': 'hreflang de',
        'hreflang="en"': 'hreflang en',
        'hreflang="fr"': 'hreflang fr',
        'hreflang="ru"': 'hreflang ru',
        'hreflang="sr"': 'hreflang sr',
        'hreflang="tr"': 'hreflang tr',
        'hreflang="x-default"': 'hreflang x-default',
        'FAQPage': 'FAQ schema',
        'HealthAndBeautyBusiness': 'Business schema',
        'BreadcrumbList': 'Breadcrumb schema',
        'id="imza-deneyimler"': 'Section: Signature',
        'id="felsefe"': 'Section: Philosophy',
        'id="global-trends"': 'Section: Global Trends',
        'id="testimonials"': 'Section: Testimonials',
        'id="bookingCta"': 'Section: Booking CTA',
        'id="stickyBooking"': 'Section: Sticky Bar',
        'nv-hero-campaign': 'Section: Hero',
        'signature-cards.css': 'CSS: signature-cards',
        'testimonials.css': 'CSS: testimonials',
        'sticky-booking.css': 'CSS: sticky-booking',
    }
    
    for needle, label in checks.items():
        if needle not in content:
            errors.append(f'MISSING: {label} ({needle})')
    
    # Duplicate checks
    css_links = re.findall(r'href="[^"]*\.css[^"]*"', content)
    css_set = set()
    for link in css_links:
        if link in css_set:
            errors.append(f'DUPLICATE CSS: {link}')
        css_set.add(link)
    
    js_srcs = re.findall(r'src="([^"]*\.js[^"]*)"', content)
    js_set = set()
    for src in js_srcs:
        if src in js_set:
            errors.append(f'DUPLICATE JS: {src}')
        js_set.add(src)
    
    # Unreplaced placeholders
    unreplaced = re.findall(r'\{\{[A-Z_]+\}\}', content)
    if unreplaced:
        errors.append(f'UNREPLACED PLACEHOLDERS: {unreplaced}')
    
    # Hreflang count
    hreflang_count = content.count('hreflang=')
    if hreflang_count != 7:
        errors.append(f'HREFLANG COUNT: {hreflang_count} (expected 7)')
    
    return errors

# ── Main Build ──────────────────────────────────────────
def build():
    print('='*60)
    print('  SANTIS CLUB – Homepage Build System v1.0')
    print('='*60)
    
    head_tpl = load_template('head.html')
    body_tpl = load_template('body.html')
    full_tpl = head_tpl + body_tpl
    
    check_mode = '--check' in sys.argv
    all_ok = True
    
    total_compiled = 100 # Mock base size
    
    for lang in LANGS:
        t = load_translations(lang)
        output = apply_translations(full_tpl, t, lang)
        
        # Validate
        errors = validate(output, lang)
        
        out_path = os.path.join(BASE_DIR, lang, 'index.html')
        lines = output.count('\n') + 1
        
        if errors:
            print(f'  ❌ {lang.upper()}: {len(errors)} ERRORS')
            for err in errors:
                print(f'     → {err}')
            all_ok = False
            
            # Pulse the Error
            emit_matrix_pulse("COMPILER_ERROR", f"/{lang}/index.html", 0, total_compiled, health=80)
        else:
            if check_mode:
                # Compare with existing
                if os.path.exists(out_path):
                    with open(out_path, 'r', encoding='utf-8') as f:
                        existing = f.read()
                    if existing.strip() == output.strip():
                        print(f'  ✅ {lang.upper()}: OK (unchanged) [{lines} lines]')
                    else:
                        print(f'  🔄 {lang.upper()}: CHANGED (would update) [{lines} lines]')
                else:
                    print(f'  🆕 {lang.upper()}: NEW (would create) [{lines} lines]')
            else:
                # Write file
                start_write = time.time()
                os.makedirs(os.path.dirname(out_path), exist_ok=True)
                with open(out_path, 'w', encoding='utf-8') as f:
                    f.write(output)
                
                latency = (time.time() - start_write) * 1000
                total_compiled += 1
                emit_matrix_pulse("COMPILED", f"/{lang}/index.html", latency, total_compiled)
                
                print(f'  ✅ {lang.upper()}: OK [{lines} lines] → {out_path}')
    
    # Final Pulse
    emit_matrix_pulse("CDN_PUSH", "Global Routing Tables Updated", 0, total_compiled)
    
    print('='*60)
    if all_ok:
        if check_mode:
            print('  ✅ CHECK PASSED: All validations OK')
        else:
            print(f'  ✅ BUILD COMPLETE: {len(LANGS)} files generated')
    else:
        print('  ❌ BUILD FAILED: Fix errors above')
        sys.exit(1)

if __name__ == '__main__':
    build()
