import os
import re

files_to_fix = [
    r"c:\Users\tourg\Desktop\SANTIS_SITE\masaj.html",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\cilt-bakimi.html"
]

card_pattern = re.compile(
    r'<div class="santis-stack-card" style="background-image:\s*url\(\'([^\']+)\'\);\s*(?:filter:\s*([^;]+);)?">\s*<h3>([^<]+)</h3>\s*<span class="santis-stack-meta">([^<]+)</span>\s*</div>'
)

# santis-signature-card replacement template
def replace_card(match):
    img_url = match.group(1)
    filter_val = match.group(2) if match.group(2) else "none"
    title = match.group(3)
    meta = match.group(4)
    
    # Inline filter on image is much more performant than inline background on a highly animated card
    # but the goal is to clean up inline styles entirely. We'll keep the filter on the image as inline 
    # since it varies procedurally per card, but remove background-image.
    
    return f"""<a href="#" class="santis-signature-card santis-reveal-up">
    <div class="santis-signature-visual">
        <img src="{img_url}" alt="{title}" style="filter: {filter_val};" loading="lazy" decoding="async">
        <div class="santis-signature-overlay"></div>
    </div>
    <div class="santis-signature-info">
        <h3 class="santis-signature-name">{title}</h3>
        <p class="santis-signature-desc">Sovereign Sessiz Lüks Deneyimi</p>
        <span class="santis-signature-cta">{meta}</span>
    </div>
</a>"""

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, not found.")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # 1. Replace the Cards
    new_html = card_pattern.sub(replace_card, html)
    
    # 2. Cleanup some excessive container inline styles if possible
    # <section class="santis-container" style="overflow: visible; padding-top: 2rem;">
    # -> we can replace it with semantic classes if needed, but given the priority is cards we'll only strip pure visual junk.
    # We will strip `style="overflow: visible; padding-top: 2rem;"` and rely on default spacing.
    new_html = re.sub(
        r'<section class="santis-container" style="overflow: visible; padding-[a-z]+: [^"]+;">', 
        r'<section class="santis-container">', 
        new_html
    )
    new_html = re.sub(
        r'<section class="santis-container" style="overflow: visible; margin-bottom: 5rem;">', 
        r'<section class="santis-container" style="margin-bottom: 5rem;">', 
        new_html
    )

    # 3. Inject the signature stylesheet to ensure it renders correctly
    if '<link rel="stylesheet" href="/assets/css/modules/signature-cards.css">' not in new_html:
        new_html = new_html.replace(
            '<link rel="stylesheet" href="/assets/css/style.css">',
            '<link rel="stylesheet" href="/assets/css/style.css">\n    <link rel="stylesheet" href="/assets/css/modules/signature-cards.css">'
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_html)
        
    print(f"✅ Spaghetti CSS eradicated in {os.path.basename(filepath)}")
