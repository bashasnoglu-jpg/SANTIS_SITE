import json
import os

input_file = r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\data\services.json"
output_file = r"C:\Users\tourg\.gemini\antigravity\brain\c474f50a-c532-4475-a67a-fbbe43c34777\Services_Report.md"

try:
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)
except Exception as e:
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(f"Error loading JSON: {e}")
    exit(1)

hammam = []
massages = []
skincare = []

for item in data:
    cat = (item.get("category") or item.get("categoryId") or "").lower()
    
    # Simple assignment logic based on ID, CATEGORY, TITLE
    is_hammam = False
    is_massage = False
    is_skin = False
    
    title = item.get("title", item.get("name", "")).lower()
    item_id = str(item.get("id", "")).lower()
    
    if "hammam" in cat or "hamam" in cat or "hamam" in item_id:
        is_hammam = True
    elif "massage" in cat or "masaj" in cat or "mass" in item_id:
        is_massage = True
    elif "skin" in cat or "cilt" in cat or "face" in cat or "sothys" in cat or "skincare" in cat:
        is_skin = True
        
    if not (is_hammam or is_massage or is_skin):
        if "peeling" in title or "hamam" in title:
            is_hammam = True
        elif "massage" in title or "masaj" in title or "refleksoloji" in title or "shiatsu" in title or "thai" in title or "ayurveda" in title or "lomi" in title:
            is_massage = True
        elif "cilt" in title or "bakım" in title or "face" in title:
            is_skin = True
            
    if is_hammam:
        hammam.append(item)
    elif is_massage:
        massages.append(item)
    elif is_skin:
        skincare.append(item)

def format_item(item):
    price = item.get("price_eur", item.get("price", {}).get("amount", "Bilinmeyen"))
    duration = item.get("duration", "Bilinmeyen")
    
    # Check for deep content
    content = item.get("content", {}).get("tr", {})
    if content:
        title = content.get("title", item.get("title", item.get("name", "İsimsiz")))
        short_desc = content.get("shortDesc", "")
        full_desc = content.get("fullDesc", "")
        tagline = content.get("tagline", "")
        steps = content.get("steps", [])
        effects = content.get("effects", "")
        
        md = f"### 🔹 {title} ({duration} dk | {price} €)\n"
        if tagline: md += f"> **{tagline}**\n\n"
        if short_desc: md += f"**Özet:** {short_desc}\n\n"
        if full_desc: md += f"**Detay:** {full_desc}\n\n"
        if effects: md += f"**Etkileri:** {effects}\n\n"
        if steps:
            md += "**Ritüel Adımları:**\n"
            for step in steps:
                md += f"- {step}\n"
            md += "\n"
    else:
        title = item.get("title", item.get("name", "İsimsiz"))
        desc = item.get("description", item.get("desc", ""))
        md = f"### 🔹 {title} ({duration} dk | {price} €)\n"
        if desc: md += f"**Açıklama:** {desc}\n\n"
        
    return md

with open(output_file, "w", encoding="utf-8") as f:
    f.write("# 🦅 Santis v10 Tüm Hizmetler: Ultra-Detaylı Rapor\n\n")
    f.write("Aşağıda veritabanından çekilen tüm Hamam, Masaj ve Cilt Bakımı programlarının eksiksiz ve derinlemesine raporu yer almaktadır.\n\n")
    
    f.write(f"## 🛁 HAMAM RİTÜELLERİ ({len(hammam)})\n---\n")
    for item in hammam:
        f.write(format_item(item))
        
    f.write(f"## 💆🏽‍♀️ MASAJ TERAPİLERİ ({len(massages)})\n---\n")
    for item in massages:
        f.write(format_item(item))
        
    f.write(f"## ✨ CİLT BAKIMLARI ({len(skincare)})\n---\n")
    for item in skincare:
        f.write(format_item(item))
