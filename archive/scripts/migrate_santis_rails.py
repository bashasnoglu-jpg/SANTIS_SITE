import re
import os

filepath = r"c:\Users\tourg\Desktop\SANTIS_SITE\masaj.html"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add CSS tokens and components to head
css_links = """
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/tokens/sovereign-geometry.css">
    <link rel="stylesheet" href="/assets/css/tokens/sovereign-motion.css">
    <link rel="stylesheet" href="/assets/css/components/sovereign-card.css">
    <link rel="stylesheet" href="/assets/css/components/sovereign-rail.css">
"""
content = re.sub(r'<link rel="stylesheet" href="/assets/css/style.css">', css_links.strip(), content)

# Remove old modules if present
content = re.sub(r'<link rel="stylesheet" href="/assets/css/modules/cards\.css">\n?', '', content)
content = re.sub(r'<link rel="stylesheet" href="/assets/css/modules/santis-cover-flow\.css">\n?', '', content)
content = re.sub(r'<link rel="stylesheet" href="/assets/css/santis-v6/santis\.bento-grid\.css">\n?', '', content)

# 2. Add Module Script
js_script = '<script type="module" src="/assets/js/core/santis-sovereign-rail.js"></script>'
# remove old drag script block
old_script_pattern = r'<!-- Sovereign Premium Rail Dragger -->\s*<script>[\s\S]*?<\/script>'
content = re.sub(old_script_pattern, js_script, content)


# 3. Transform padding/classes of sections to match V2 Shell Standard
# From: <section class="mt-12 santis-container santis-reveal-up santis-reveal-up--first" style="margin-bottom: 5rem;">
# To: <section class="santis-rail-shell mt-12 santis-container santis-reveal-up santis-reveal-up--first" style="margin-bottom: 5rem;">
content = re.sub(r'(<section class=")(mt-12 santis-container santis-reveal-up)', r'\1santis-rail-shell \2', content)

# Transform header to include rail nav
header_pattern = r'(<div class="santis-reveal-up__header" style="[^"]*padding-left: 5vw;[^"]*">)\s*(<h2[^>]*>.*?<\/h2><h2[^>]*>.*?<\/h2>)\s*(<span[^>]*>.*?<\/span><span[^>]*>.*?<\/span>)\s*(<\/div>)'

def repl_header(match):
    start_tag = match.group(1).replace('marginBottom', 'margin-bottom').replace('margin-bottom: 1.5rem;', 'margin-bottom: 1.5rem; padding-right: 5vw;')
    h2s = match.group(2)
    spans = match.group(3)
    # We want: <div class="santis-rail-header" ...> 
    start_tag = start_tag.replace('santis-reveal-up__header', 'santis-rail-header')
    
    new_heading = f"""
    <div class="santis-rail-heading">
        {spans}
        {h2s}
    </div>
    <div class="santis-rail-nav">
        <button type="button" class="santis-rail-arrow santis-rail-arrow--prev" data-rail-nav="prev" aria-label="Önceki kartlar"></button>
        <button type="button" class="santis-rail-arrow santis-rail-arrow--next" data-rail-nav="next" aria-label="Sonraki kartlar"></button>
    </div>
    """
    return f"{start_tag}{new_heading}</div >"

content = re.sub(header_pattern, repl_header, content)

# 4. Transform Cards
card_pattern = r'<div class="santis-stack-card santis-signature-card"\s*data-service-id="([^"]+)"\s*data-category="([^"]+)"\s*style="--card-img:\s*url\(([^)]+)\);\s*--card-fx:\s*([^;]+);"([^>]*)>\s*<h3[^>]*data-lang="tr">([^<]+)</h3>\s*<h3[^>]*data-lang="en"[^>]*>([^<]+)</h3>\s*<span[^>]*data-lang="tr">([^<]+)</span>\s*<span[^>]*data-lang="en"[^>]*>([^<]+)</span>\s*</div>'

def repl_card(match):
    service_id = match.group(1)
    category = match.group(2)
    img_src = match.group(3)
    card_fx = match.group(4)
    # ignore match.group(5) which has onclick and onmouseenter telemetry
    title_tr = match.group(6)
    title_en = match.group(7)
    meta_tr = match.group(8)
    meta_en = match.group(9)
    
    new_card = f"""<article class="sovereign-card" data-card-id="{service_id}" data-card-type="service" data-service-name="{title_tr}" data-service-category="{category}">
      <a href="/spa-booking.html?service={service_id}" class="sovereign-card__link">
        <div class="sovereign-card__media">
          <img src="{img_src}" alt="{title_tr}" class="sovereign-card__image" style="filter: {card_fx};" loading="lazy" decoding="async">
        </div>
        <div class="sovereign-card__overlay"></div>
        <div class="sovereign-card__content">
            <h3 class="sovereign-card__title">
                <span data-lang="tr">{title_tr}</span>
                <span data-lang="en" style="display:none;">{title_en}</span>
            </h3>
            <p class="sovereign-card__meta">
                <span data-lang="tr">{meta_tr}</span>
                <span data-lang="en" style="display:none;">{meta_en}</span>
            </p>
        </div>
      </a>
    </article>"""
    return new_card

content = re.sub(card_pattern, repl_card, content)

# Also let's set data-rail="" on the rails
content = re.sub(r'<div class="santis-premium-rail" id="rail-massage-classic">', r'<div class="santis-premium-rail" id="rail-massage-classic" data-rail="classic-massages" data-rail-snap="soft">', content)
content = re.sub(r'<div class="santis-premium-rail" id="rail-massage-asian">', r'<div class="santis-premium-rail" id="rail-massage-asian" data-rail="asian-massages" data-rail-snap="soft">', content)
content = re.sub(r'<div class="santis-premium-rail" id="rail-massage-extra">', r'<div class="santis-premium-rail" id="rail-massage-extra" data-rail="extra-massages" data-rail-snap="soft">', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("masaj.html migrated to Sovereign Rail V2.")
