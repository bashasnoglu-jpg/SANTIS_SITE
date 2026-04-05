import re

def main():
    with open('tr/index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We will use regex to find each santis-stack-card and replace its contents.
    # It's safer to just do a targeted replacement for the exact text strings used across all cards.
    
    replacements = {
        # Meta Labels
        r'>SÜRE<': ' data-lang="tr">SÜRE</span>\n                          <span style="display: block; font-size: 0.8rem; color: #D4AF37; letter-spacing: 2px; display:none;" data-lang="en">DURATION<',
        r'>BÖLGE<': ' data-lang="tr">BÖLGE</span>\n                          <span style="display: block; font-size: 0.8rem; color: #D4AF37; letter-spacing: 2px; display:none;" data-lang="en">AREA<',
        r'>60 Dk<': ' data-lang="tr">60 Dk</strong>\n                          <strong style="font-size: 1.3rem; display:none;" data-lang="en">60 Min<',
        r'>Tüm Beden<': ' data-lang="tr">Tüm Beden</strong>\n                          <strong style="font-size: 1.3rem; display:none;" data-lang="en">Full Body<',
        r'>\s*HEMEN REZERVASYON\s*</a': ' data-lang="tr">\n                      HEMEN REZERVASYON\n                  </a>\n                  <a href="https://wa.me/905348350169" target="_blank" class="santis-btn santis-btn-primary santis-magnetic" style="padding: 16px 40px; font-size: 1.1rem; box-shadow: 0 10px 30px rgba(212,175,55,0.2); display:none;" data-lang="en">\n                      RESERVE NOW\n                  </a'
    }
    
    for k, v in replacements.items():
        content = re.sub(k, v, content)

    # Now we do the specific cards titles, metas and paragraphs.
    translations = [
        ("Su: Arınma Şelalesi", "Water: Purifying Cascade"),
        ("Ateş: Volkanik Taş", "Fire: Volcanic Stone"),
        ("Toprak: Kırmızı Kil", "Earth: Red Clay"),
        ("Hava: Oksijen İnfüzyonu", "Air: Oxygen Infusion"),
        ("Kristal: Ametist Frekansı", "Crystal: Amethyst Frequency"),
        ("Odun: Bambu Masajı", "Wood: Bamboo Massage"),
        ("Metal: Altın İğne V2", "Metal: Golden Needle V2"),
        ("Eter: Kuantum Dokunuş", "Ether: Quantum Touch"),
        ("Ay: Gece Onarımı", "Moon: Night Repair"),
        ("Güneş: Işık Terapisi", "Sun: Light Therapy"),
        
        ("Hidroterapi", "Hydrotherapy"),
        ("Termoterapi", "Thermotherapy"),
        ("Detoks", "Detox"),
        ("Hücresel Yenilenme", "Cellular Renewal"),
        ("Enerji Dengeleme", "Energy Balancing"),
        ("Derin Doku", "Deep Tissue"),
        ("Kolajen Aktivasyonu", "Collagen Activation"),
        ("Sovereign İmzası", "Sovereign Signature"),
        ("Melatonin Sentezi", "Melatonin Synthesis"),
        ("D Vitamini Sentezi", "Vitamin D Synthesis")
    ]

    for tr, en in translations:
        # For the h3 data-morph="title"
        h3_pattern = f'<h3 data-morph="title">{tr}</h3>'
        h3_repl = f'<h3 data-morph="title" data-lang="tr">{tr}</h3>\n              <h3 data-morph="title" data-lang="en" style="display:none;">{en}</h3>'
        content = content.replace(h3_pattern, h3_repl)
        
        # For the span.santis-stack-meta
        span_pattern = f'<span class="santis-stack-meta">{tr}</span>'
        span_repl = f'<span class="santis-stack-meta" data-lang="tr">{tr}</span>\n              <span class="santis-stack-meta" data-lang="en" style="display:none;">{en}</span>'
        content = content.replace(span_pattern, span_repl)

        # For the h2 inside reveal data
        h2_pattern = f'<h2 style="font-family: \'Playfair Display\', serif; font-size: 3.5rem; margin-bottom: 20px; color: #fff;">{tr}</h2>'
        h2_repl = f'<h2 style="font-family: \'Playfair Display\', serif; font-size: 3.5rem; margin-bottom: 20px; color: #fff;" data-lang="tr">{tr}</h2>\n                  <h2 style="font-family: \'Playfair Display\', serif; font-size: 3.5rem; margin-bottom: 20px; color: #fff; display:none;" data-lang="en">{en}</h2>'
        content = content.replace(h2_pattern, h2_repl)

    # Now paragraphs - they are standard string, just change the intro word.
    paragraphs = [
        ("Hidroterapi dünyasına", "hydrotherapy"),
        ("Termoterapi dünyasına", "thermotherapy"),
        ("Detoks dünyasına", "detox"),
        ("Hücresel Yenilenme dünyasına", "cellular renewal"),
        ("Enerji Dengeleme dünyasına", "energy balancing"),
        ("Derin Doku dünyasına", "deep tissue"),
        ("Kolajen Aktivasyonu dünyasına", "collagen activation"),
        ("Sovereign İmzası dünyasına", "Sovereign signatures"),
        ("Melatonin Sentezi dünyasına", "melatonin synthesis"),
        ("D Vitamini Sentezi dünyasına", "vitamin D synthesis")
    ]
    
    for tr_intro, en_word in paragraphs:
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

    with open('tr/index.html', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Done generating bilingual tags!")

if __name__ == "__main__":
    main()
