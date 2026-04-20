import os
import json
from openai import OpenAI
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# [SOVEREIGN SEAL: THE MARKET EXPANSION ENGINE - PHASE 51]

client = OpenAI() # .env dosyasından OPENAI_API_KEY'i otonom alır

# ==============================================================================
# 1. KOGNİTİF ŞEMA (Pydantic ile %100 Kusursuz JSON Garantisi)
# ==============================================================================
class LocalizedString(BaseModel):
    en: str
    de: str  # Şimdilik EN ve DE pazarını hedefliyoruz

class SEOData(BaseModel):
    title: LocalizedString
    description: LocalizedString
    focus_keywords: list[str]

class MarketExpansionNode(BaseModel):
    template: str
    slug: LocalizedString
    seo: SEOData
    hero_image_prompt: str # Genesis Engine'i tetikleyecek Sovereign prompt
    editorial_title: LocalizedString
    editorial_content: LocalizedString # Hedef şehrin kültürüyle harmanlanmış 1500 kelimelik editoryal şaheser

# ==============================================================================
# 2. OTONOM ŞAHESER ÜRETİM MOTORU
# ==============================================================================
def forge_masterpiece(target_city: str, service_name: str):
    print(f"🌌 [THE FORGE] {target_city} için '{service_name}' şaheseri otonom olarak kurgulanıyor...")
    
    system_prompt = """
    Sen elit bir 'Sovereign Spa & Wellness' markasının Baş İçerik Mimarı ve SEO Stratejistisin.
    Görevin 'Şaheser' (Masterpiece) kalitesinde pazar genişleme sayfaları (Market Expansion) yaratmak.
    
    Kurallar:
    1. Contextual Intelligence: Hedef şehrin kültürel dokusunu (Örn: Viyana'nın tarihi termal kültürü) Santis'in modern, 'Quiet Luxury' (Sessiz Lüks) felsefesiyle birleştiren derinlemesine, büyüleyici editoryal metinler yaz.
    2. Asla ucuz satış ağzı, spam SEO kelimeleri veya robotik ifadeler kullanma.
    3. 'hero_image_prompt' alanı DALL-E 3 için İngilizce yazılmalı ve o şehre özel lüks bir spa atmosferini (Örn: Bohemian architecture spa interior, quiet luxury) tarif etmelidir.
    4. Metinler İngilizce (en) ve Almanca (de) dillerinde profesyonelce üretilmelidir.
    """
    
    user_prompt = f"Hedef Şehir: {target_city}\nHizmet: {service_name}\n\nBu pazar için eşsiz, kültürel bağlamlı ve lüks standartlarda JSON matrisini oluştur."

    try:
        # GPT-4o ile Zekanın Zirvesi ve Structured Output (Yapısal Çıktı)
        response = client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06", 
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format=MarketExpansionNode,
            temperature=0.7 # Yaratıcılık (Kültürel Füzyon) ve Tutarlılık dengesi
        )
        
        # Pydantic objesini al ve template adını sabitle
        new_node = response.choices[0].message.parsed
        new_node.template = "market_expansion"
        
        # 🚨 HUMAN-IN-THE-LOOP (HITL) ZIRHI:
        # Sistemi kendi başına bırakmıyoruz. Üretilen JSON'u doğrudan 'content_universe.json' içine gömmek yerine
        # 'Karantina' klasörüne kaydediyoruz ki Master onaylayabilsin.
        
        os.makedirs("quarantine_zone", exist_ok=True)
        node_id = f"market_{target_city.lower()}_{service_name.lower().replace(' ', '_')}"
        output_filename = f"quarantine_zone/{node_id}.json"
        
        # Sadece o 'node' yapısını kaydediyoruz
        final_json_structure = {node_id: json.loads(new_node.model_dump_json())}
        
        with open(output_filename, "w", encoding="utf-8") as f:
            json.dump(final_json_structure, f, indent=4, ensure_ascii=False)
            
        print(f"👑 [MASTERPIECE CREATED] '{target_city}' verisi otonom olarak üretildi.")
        print(f"🛡️ [HITL ARMOR] Onayınız için '{output_filename}' dosyasına mühürlendi.")
        
    except Exception as e:
        print(f"🚨 [CRITICAL FRACTURE] Şaheser üretilemedi: {e}")

if __name__ == "__main__":
    # Test Ateşlemesi: İlk pazar işgali başlıyor
    forge_masterpiece(target_city="Vienna", service_name="Premium Hammam")
