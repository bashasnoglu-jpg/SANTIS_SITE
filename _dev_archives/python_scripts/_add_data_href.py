import pathlib

def patch_file(filepath):
    path = pathlib.Path(filepath)
    if not path.exists(): return
    content = path.read_text(encoding='utf-8')
    
    # 1. Wabi Sabi -> shiatsu-masaji.html
    content = content.replace(
        '<div class="santis-stack-card" data-reveal="wabi-sabi"', 
        '<div class="santis-stack-card" data-href="/tr/masajlar/shiatsu-masaji.html"'
    )
    
    # 2. Wat Pho
    content = content.replace(
        '<div class="santis-stack-card" style="background-image: url(/assets/img/cards/santis_card_thai_v1.webp);',
        '<div class="santis-stack-card" data-href="/tr/masajlar/thai-masaji.html" style="background-image: url(/assets/img/cards/santis_card_thai_v1.webp);'
    )
    
    # 3. Roma (Skincare)
    content = content.replace(
        '<div class="santis-stack-card" style="background-image: url(/assets/img/cards/santis_card_skincare_v1.webp);',
        '<div class="santis-stack-card" data-href="/tr/cilt-bakimi/index.html" style="background-image: url(/assets/img/cards/santis_card_skincare_v1.webp);'
    )
    
    # 4. Watsu
    content = content.replace(
        '<div class="santis-stack-card" style="background-image: url(/assets/img/cards/santis_card_massage_medical.webp);',
        '<div class="santis-stack-card" data-href="/tr/masajlar/kombine-masaj.html" style="background-image: url(/assets/img/cards/santis_card_massage_medical.webp);'
    )
    
    path.write_text(content, encoding='utf-8')
    print(f"Patched {filepath}")

patch_file(r'c:\Users\tourg\Desktop\SANTIS_SITE\tr\index.html')
patch_file(r'c:\Users\tourg\Desktop\SANTIS_SITE\index.html')
