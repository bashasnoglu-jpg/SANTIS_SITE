import re
import json

try:
    html = open("cilt-bakimi.html", "r", encoding="utf-8").read()

    # 1. Parse all items
    stages = [
        ("sov-3d-stage", "highlight"),
        ("sov-3d-stage-arindirma", "arindirma"),
        ("sov-3d-stage-nem-isilti", "nem-isilti"),
        ("sov-3d-stage-anti-aging", "anti-age"),
        ("sov-3d-stage-erkek-bakimi", "homme")
    ]

    skincare_items = []

    for stage_id, cat_name in stages:
        pattern = r'<div class="santis-carousel-stage[^"]*" id="' + stage_id + r'"[^>]*>(.*?)</div>\s*</section>'
        match = re.search(pattern, html, re.DOTALL)
        if match:
            content = match.group(1)
            cards = re.findall(r'<div class="santis-stack-card"[^>]*>\s*<h3>(.*?)</h3>\s*<span class="santis-stack-meta">(.*?)</span>\s*</div>', content, re.DOTALL)
            for i, (title, meta) in enumerate(cards):
                price = ""
                if "€" in meta:
                    price = meta.replace("€", "").strip()
                    meta = ""
                
                safe_id = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-') + "-" + cat_name[:4]
                
                skincare_items.append({
                    "id": safe_id,
                    "cat": cat_name,
                    "title": title.strip(),
                    "meta": meta.strip(),
                    "price": int(price) if price.isdigit() else price,
                    "img": "skincare_lux"
                })

    # 2. Update sovereign-rituals.js
    js_content = open("assets/js/data/sovereign-rituals.js", "r", encoding="utf-8").read()
    skincare_json = ",\n        ".join(json.dumps(x, ensure_ascii=False) for x in skincare_items)
    js_content = re.sub(r'skincare:\s*\[.*?\]', f'skincare: [\n        {skincare_json}\n    ]', js_content, flags=re.DOTALL)
    open("assets/js/data/sovereign-rituals.js", "w", encoding="utf-8").write(js_content)

    # 3. Clean cilt-bakimi.html
    new_html = html

    # Remove filters and cleanup sections
    for stage_id, cat_name in stages:
        pattern = r'(<div class="santis-carousel-stage[^"]*" id="' + stage_id + r'")[^>]*>.*?</div>'
        new_html = re.sub(pattern, r'\1></div>', new_html, flags=re.DOTALL)

    new_html = new_html.replace('<!-- SOVEREIGN OS BOOTLOADER (V35 KERNEL) -->', '<!-- DATA-DRIVEN SURFACE CONTROLLER -->\n<script type="module" src="/assets/js/ui/santis-surface-controller.js" defer></script>\n\n<!-- SOVEREIGN OS BOOTLOADER (V35 KERNEL) -->')

    script_to_remove = """<script>
// Sovereign OS Module Sync (Interaction Engine Yüklenmesini Bekle)
(function awaitSovereignInteraction() {
    if (typeof window.initCoverFlowCarousel === 'function') {
        window.initCoverFlowCarousel();
        console.log("🎡 Sovereign B2B Cover Flow Carousels Inited via Retry.");
    } else {
        setTimeout(awaitSovereignInteraction, 100);
    }
})();
</script>"""
    new_html = new_html.replace(script_to_remove, "")

    new_html = new_html.replace('<canvas id="santis-god-canvas" style="position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:-1;"></canvas>', '<canvas id="santis-god-canvas" data-teardown="destroyGodCanvas"></canvas>')
    new_html = new_html.replace('<main id="santis-main" style="padding-top: 120px;">', '<main id="sovereign-page-root" class="santis-page-layout">')
    
    new_html = re.sub(r'<section class="santis-container" style="[^"]*">', '<section class="santis-massage-section">', new_html)
    new_html = re.sub(r'<div style="text-align: center; margin-bottom: 2rem;">', '<div class="santis-massage-header">', new_html)
    new_html = re.sub(r'<h2 class="santis-title" style="font-size: 2.2rem;">', '<h2 class="santis-title">', new_html)

    if '<link rel="stylesheet" href="/assets/css/pages/santis-massage.css">' not in new_html:
        new_html = new_html.replace('<link href="/assets/css/style.css" rel="stylesheet"/>', '<link rel="stylesheet" href="/assets/css/pages/santis-massage.css">\n<link href="/assets/css/style.css" rel="stylesheet"/>')

    open("cilt-bakimi.html", "w", encoding="utf-8").write(new_html)

    print(f"Extracted {len(skincare_items)} items successfully!")
except Exception as e:
    print(f"Error: {e}")
