import os
import shutil
from pathlib import Path
from bs4 import BeautifulSoup

def sync_skincare_to_en():
    tr_dir = Path("tr/cilt-bakimi")
    en_dir = Path("en/skincare")
    
    if not tr_dir.exists() or not en_dir.exists():
        print("Dizinler bulunamadı.")
        return
        
    print(f"TR'den EN'ye yapi senkronizasyonu başlatılıyor...")
    
    # We want to copy the structure of TR to EN, but preserve the EN text content
    # For now, since the error says EN is missing Header/Footer/Hero, 
    # it means EN probably lacks the proper "data-site-root" or language tags
    
    fixed_count = 0
    
    for tr_file in tr_dir.glob("*.html"):
        if tr_file.name == "index.html":
            continue
            
        en_file = en_dir / tr_file.name
        
        if not en_file.exists():
            continue
            
        print(f"İnceleniyor: {en_file.name}")
        
        # 1. Read TR file as the template base
        with open(tr_file, "r", encoding="utf-8") as f:
            tr_content = f.read()
            
        # 2. Read EN file to extract its unique text
        with open(en_file, "r", encoding="utf-8") as f:
            en_content = f.read()
            
        tr_soup = BeautifulSoup(tr_content, "html.parser")
        en_soup = BeautifulSoup(en_content, "html.parser")
        
        # 3. Transform TR to EN struct
        
        # html lang
        html_tag = tr_soup.find("html")
        if html_tag:
            html_tag["lang"] = "en"
            html_tag["data-site-root"] = "/en/"
            
        # title, desc, schema -> pull from EN
        en_title = en_soup.find("title")
        tr_title = tr_soup.find("title")
        if en_title and tr_title:
            tr_title.string = en_title.string
            
        en_desc = en_soup.find("meta", attrs={"name": "description"})
        tr_desc = tr_soup.find("meta", attrs={"name": "description"})
        if en_desc and tr_desc:
            tr_desc["content"] = en_desc.get("content", "")
            
        en_schema = en_soup.find("script", type="application/ld+json")
        tr_schema = tr_soup.find("script", type="application/ld+json")
        if en_schema and tr_schema:
            tr_schema.string = en_schema.string
            
        # canonical
        tr_canon = tr_soup.find("link", rel="canonical")
        en_canon = en_soup.find("link", rel="canonical")
        if tr_canon and en_canon:
             tr_canon["href"] = en_canon.get("href", "")
             
        # noscript nav
        tr_ns = tr_soup.find("nav", class_="nv-noscript-nav")
        if tr_ns:
            a_tags = tr_ns.find_all("a")
            if len(a_tags) >= 2:
                a_tags[0].string = "HOME"
                idx_link = f"/en/skincare/index.html"
                a_tags[1]["href"] = idx_link
                a_tags[1].string = "SKINCARE"
                
        # breadcrumb
        tr_bc = tr_soup.find("div", class_="cin-breadcrumb")
        if tr_bc:
             a_tags = tr_bc.find_all("a")
             if len(a_tags) >= 2:
                 a_tags[0]["href"] = "/en/index.html"
                 a_tags[0].string = "Home"
                 a_tags[1]["href"] = "/en/skincare/index.html"
                 a_tags[1].string = "Skincare"

        # Content texts
        en_cin_title = en_soup.find("h1", id="cin-title")
        tr_cin_title = tr_soup.find("h1", id="cin-title")
        if en_cin_title and tr_cin_title:
             tr_cin_title.string = en_cin_title.string
             
        en_cin_sub = en_soup.find("h2", id="cin-subtitle")
        tr_cin_sub = tr_soup.find("h2", id="cin-subtitle")
        if en_cin_sub and tr_cin_sub:
             tr_cin_sub.string = en_cin_sub.string
             
        en_cin_desc = en_soup.find("p", id="cin-desc")
        tr_cin_desc = tr_soup.find("p", id="cin-desc")
        if en_cin_desc and tr_cin_desc:
             tr_cin_desc.string = en_cin_desc.string

        # Translating labels
        lbl_duration = tr_soup.find("span", text="Süre")
        if lbl_duration: lbl_duration.string = "Duration"
        
        lbl_price = tr_soup.find("span", text="Fiyat")
        if lbl_price: lbl_price.string = "Price"
        
        # Meta box values (Price/Duration info)
        en_val_dur = en_soup.find("span", id="val-duration")
        tr_val_dur = tr_soup.find("span", id="val-duration")
        if en_val_dur and tr_val_dur: tr_val_dur.string = en_val_dur.string
        
        en_val_price = en_soup.find("span", id="val-price")
        tr_val_price = tr_soup.find("span", id="val-price")
        if en_val_price and tr_val_price: tr_val_price.string = en_val_price.string

        # Actions
        btn_wa = tr_soup.find("a", id="btn-whatsapp")
        if btn_wa: btn_wa.string = "BOOK NOW"
        
        btn_back = tr_soup.find("a", class_="cin-btn", text="KOLEKSİYONA DÖN")
        if btn_back:
            btn_back.string = "BACK TO COLLECTION"
            btn_back["href"] = "/en/skincare/index.html"

        # Save the merged content back to EN
        with open(en_file, "w", encoding="utf-8") as f:
            f.write(str(tr_soup))
            
        fixed_count += 1
        print(f"✅ Onarıldı: {en_file.name}")

    print(f"\nİşlem tamam. {fixed_count} EN Skincare dosyası TR altyapısı ile güncellendi.")

if __name__ == "__main__":
    sync_skincare_to_en()
