import re

def main():
    with open('tr/index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # The Custom Cards
    translations = [
        ("Wabi-Sabi", "Wabi-Sabi", "Japon Estetiği", "Japanese Aesthetics", "Japon Estetiği dünyasına", "Japanese aesthetics"),
        ("Wat Pho Masajı", "Wat Pho Massage", "Tayland", "Thailand", "Tayland dünyasına", "Thailand"),
        ("Roma Termal", "Roman Thermal", "İTALYA", "ITALY", "İTALYA dünyasına", "Roman baths"),
        ("Sothys: Paris Zarafeti", "Sothys: Parisian Elegance", "BİLİM VE DOĞA", "SCIENCE AND NATURE", "BİLİM VE DOĞA dünyasına", "scientific nature"),
        ("Sultan Hamamı", "Sultan Hammam", "Geleneksel Miras", "Traditional Heritage", "Geleneksel Miras dünyasına", "traditional heritage"),
        ("Aura Aromaterapi", "Aura Aromatherapy", "Zihinsel Denge", "Mental Balance", "Zihinsel Denge dünyasına", "mental balance"),
        ("Safir Işıltı", "Sapphire Radiance", "Premium Cilt Bakımı", "Premium Skincare", "Premium Cilt Bakımı dünyasına", "premium skincare"),
        ("Ayurvedik Dokunuş", "Ayurvedic Touch", "İçsel Huzur", "Inner Peace", "İçsel Huzur dünyasına", "inner peace"),
        ("Sothys Paris", "Sothys Paris", "Dermatolojik Lüks", "Dermatological Luxury", "Dermatolojik Lüks dünyasına", "dermatological luxury"),
        ("Güneş: Bronz Işıltı", "Sun: Bronze Glow", "Altın Oran Terapisi", "Golden Ratio Therapy", "Altın Oran Terapisi dünyasına", "Golden Ratio therapy")
    ]

    for tr_title, en_title, tr_meta, en_meta, tr_intro, en_word in translations:
        # Title
        t_pattern = f'<h3 data-morph="title">{tr_title}</h3>'
        t_repl = f'<h3 data-morph="title" data-lang="tr">{tr_title}</h3>\n              <h3 data-morph="title" data-lang="en" style="display:none;">{en_title}</h3>'
        content = content.replace(t_pattern, t_repl)

        # Meta
        m_pattern = f'<span class="santis-stack-meta">{tr_meta}</span>'
        m_repl = f'<span class="santis-stack-meta" data-lang="tr">{tr_meta}</span>\n              <span class="santis-stack-meta" data-lang="en" style="display:none;">{en_meta}</span>'
        content = content.replace(m_pattern, m_repl)

        # Main H2
        h2_pattern = f'<h2 style="font-family: \'Playfair Display\', serif; font-size: 3.5rem; margin-bottom: 20px; color: #fff;">{tr_title}</h2>'
        h2_repl = f'<h2 style="font-family: \'Playfair Display\', serif; font-size: 3.5rem; margin-bottom: 20px; color: #fff;" data-lang="tr">{tr_title}</h2>\n                  <h2 style="font-family: \'Playfair Display\', serif; font-size: 3.5rem; margin-bottom: 20px; color: #fff; display:none;" data-lang="en">{en_title}</h2>'
        content = content.replace(h2_pattern, h2_repl)

        # Paragraph
        p_pattern = f"""<p style="font-size: 1.2rem; color: rgba(255,255,255,0.9); line-height: 1.9; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">
                      {tr_intro} hoş geldiniz. Bu özel ritüel, bedensel yorgunluğunuzu atarken ruhunuzu derin bir sessizliğe davet ediyor. Sovereign Club ayrıcalıklarıyla donatılmış premium bir dokunuş hissedeceksiniz.
                  </p>"""
                  
        p_repl = f"""<p style="font-size: 1.2rem; color: rgba(255,255,255,0.9); line-height: 1.9; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; text-shadow: 0 2px 10px rgba(0,0,0,0.5);" data-lang="tr">
                      {tr_intro} hoş geldiniz. Bu özel ritüel, bedensel yorgunluğunuzu atarken ruhunuzu derin bir sessizliğe davet ediyor. Sovereign Club ayrıcalıklarıyla donatılmış premium bir dokunuş hissedeceksiniz.
                  </p>
                  <p style="font-size: 1.2rem; color: rgba(255,255,255,0.9); line-height: 1.9; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; text-shadow: 0 2px 10px rgba(0,0,0,0.5); display:none;" data-lang="en">
                      Welcome to the world of {en_word}. This signature ritual relieves physical tension while guiding your spirit into profound stillness. Experience a premium touch elevated by Sovereign Club privileges.
                  </p>"""
        content = content.replace(p_pattern, p_repl)

    # Static blocks remaining at bottom
    blocks = {
        r'<p style="font-size:16px; opacity:0\.8; max-width:500px; margin:0 auto;">Suyun, taşın ve sessizliğin uyumuyla bedeninizi yeniden keşfedin\. Her nefes, yeni bir başlangıçtır\.</p>': 
        '<p style="font-size:16px; opacity:0.8; max-width:500px; margin:0 auto;" data-lang="tr">Suyun, taşın ve sessizliğin uyumuyla bedeninizi yeniden keşfedin. Her nefes, yeni bir başlangıçtır.</p>\n      <p style="font-size:16px; opacity:0.8; max-width:500px; margin:0 auto; display:none;" data-lang="en">Rediscover your body through the harmony of water, stone, and silence. Every breath is a new beginning.</p>',
        
        r'<h2 style="font-family:\'Cormorant Garamond\', serif; font-size:44px; margin-bottom:16px;">Bir Ritüel, Bin Duygu</h2>':
        '<h2 style="font-family:\'Cormorant Garamond\', serif; font-size:44px; margin-bottom:16px;" data-lang="tr">Bir Ritüel, Bin Duygu</h2>\n      <h2 style="font-family:\'Cormorant Garamond\', serif; font-size:44px; margin-bottom:16px; display:none;" data-lang="en">One Ritual, a Thousand Emotions</h2>',
        
        r'<span class="hero-kicker" style="font-size:12px; letter-spacing:0\.2em; opacity:0\.8; margin-bottom:12px; display:block;">DERİNLEŞEN BAĞ</span>':
        '<span class="hero-kicker" style="font-size:12px; letter-spacing:0.2em; opacity:0.8; margin-bottom:12px; display:block;" data-lang="tr">DERİNLEŞEN BAĞ</span>\n      <span class="hero-kicker" style="font-size:12px; letter-spacing:0.2em; opacity:0.8; margin-bottom:12px; display:block; display:none;" data-lang="en">DEEPENING CONNECTION</span>',
        
        r'<p style="font-family:\'Cormorant Garamond\',serif; font-size:1\.4rem; font-style:italic; color:#888; margin-bottom:15px;">Tüm dünya miraslarını tek bir ritüelde birleştirdik\.</p>':
        '<p style="font-family:\'Cormorant Garamond\',serif; font-size:1.4rem; font-style:italic; color:#888; margin-bottom:15px;" data-lang="tr">Tüm dünya miraslarını tek bir ritüelde birleştirdik.</p>\n    <p style="font-family:\'Cormorant Garamond\',serif; font-size:1.4rem; font-style:italic; color:#888; margin-bottom:15px; display:none;" data-lang="en">We have united all world heritages in a single ritual.</p>',
        
        r'>\s*SANTIS WORLD\'Ü KEŞFET\s*</a':
        ' data-lang="tr">\n        SANTIS WORLD\'Ü KEŞFET\n    </a>\n    <a href="/dunya-ritueli.html" class="santis-btn santis-magnetic" style="border:1px solid #d4af37; color:#d4af37; padding:15px 40px; font-size:14px; letter-spacing:2px; display:inline-block; transition:all 0.4s ease; background:rgba(212,175,55,0.05); text-decoration:none; display:none;" data-lang="en">\n        DISCOVER SANTIS WORLD\n    </a',

        # Rails headers
        r'>Premium Deneyim</span>': ' data-lang="tr">Premium Deneyim</span>\n          <span style="color:#D4AF37;font-size:.65rem;letter-spacing:.3em;text-transform:uppercase;display:none;margin-bottom:.5rem" data-lang="en">Premium Experience</span>',
        r'>Sovereign Masajlar</h2>': ' data-lang="tr">Sovereign Masajlar</h2>\n          <h2 style="color:#fff;font-size:1.75rem;font-family:\'Cinzel\',serif;margin:0;display:none" data-lang="en">Sovereign Massages</h2>',
        r'>Tümünü Gör &rarr;</a>': ' data-lang="tr">Tümünü Gör &rarr;</a>\n        <a href="/masaj.html" style="color:#888;font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;transition:color .3s;display:none;" onmouseover="this.style.color=\'#D4AF37\'" onmouseout="this.style.color=\'#888\'" data-lang="en">View All &rarr;</a>',
        r'>Sothys Paris</span>': ' data-lang="tr">Sothys Paris</span>\n          <span style="color:#D4AF37;font-size:.65rem;letter-spacing:.3em;text-transform:uppercase;display:none;margin-bottom:.5rem" data-lang="en">Sothys Paris</span>',
        r'>Özel Cilt Bakımı</h2>': ' data-lang="tr">Özel Cilt Bakımı</h2>\n          <h2 style="color:#fff;font-size:1.75rem;font-family:\'Cinzel\',serif;margin:0;display:none" data-lang="en">Exclusive Skincare</h2>'
    }

    for k, v in blocks.items():
        content = re.sub(k, v, content)

    with open('tr/index.html', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Final Translations Applied!")

if __name__ == "__main__":
    main()
