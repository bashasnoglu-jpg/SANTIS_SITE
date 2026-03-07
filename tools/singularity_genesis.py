import os
import json
import time
from io import BytesIO
try:
    from PIL import Image
    import requests
    from dotenv import load_dotenv
except ImportError:
    print("❌ Kritik Bağımlılık Eksik. Lütfen yükleyin: pip install Pillow requests python-dotenv")
    exit(1)

# .env dosyasını zorla oku
load_dotenv()

# OpenAI entegrasyonu (Basit HTTP request, official SDK zorunlu değil ama tavsiye edilir)
# Güvenlik için ortam değişkenlerinden alınır
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

REGISTRY_FILE = "assets_registry.json"

def genesis_core_ignition():
    print("🌌 [SINGULARITY ENGINE] Genesis Yarıiletkenleri Isınıyor...")
    
    if not OPENAI_API_KEY:
        print("⚠️ [MATRİX HATASI] OPENAI_API_KEY ortam değişkeni bulunamadı. Simülasyon modunda çalışılıyor (DALL-E çağrısı atlanacak).")
        # Gerçek run'da return ile kapatılmalı
        
    if not os.path.exists(REGISTRY_FILE):
        print(f"⚠️ [KAYIT DEFTERİ YOK] {REGISTRY_FILE} bulunamadı. Önce The Eye Of Providence (Tarayıcı) çalıştırılmalı.")
        return
        
    with open(REGISTRY_FILE, 'r', encoding='utf-8') as f:
        registry = json.load(f)
        
    print(f"📋 {len(registry)} Eksik Yaratım Paketi Tespit Edildi.")
    
    for asset_path, meta in registry.items():
        # ./assets/img/... şeklindeki veriyi fiziksel yola çevir
        physical_path = "." + asset_path
        
        if os.path.exists(physical_path):
            print(f"✅ Beden zaten mevcut, atlanıyor: {asset_path}")
            continue
            
        print(f"\n⚡ YARATIM TETİKLENİYOR: {asset_path}")
        print(f"   [+] Özellikler: {meta['ratio']} / {len(meta['prompt'])} karakter prompt.")
        
        # 1. API Çağrısı (DALL-E 3)
        image_url = call_dalle(meta['prompt'], meta['ratio'])
        
        if not image_url:
            print("❌ Yaratım Başarısız. Sıradaki slota geçiliyor.")
            continue
            
        # 2. İndirme ve Alchemist Forge (WebP kompresyonu)
        process_and_save(image_url, physical_path)
        
        # Rate limit yememek için 5 saniye bekle
        time.sleep(5)

def call_dalle(prompt, ratio):
    """OpenAI API'sini direkt REST üzerinden çağırır."""
    if not OPENAI_API_KEY:
        print("   [Simülasyon] DALL-E 3 API çağrısı yapıldı simüle edildi.")
        return None # Simülasyon için bos dön, gercekte hata fırlat
        
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }
    
    # 16:9 yatay, 3:2 yatay/dikey formata göre DALL-E boyutlandırması
    size = "1024x1024" # Default 1:1
    if ratio in ["16:9", "3:2", "4:5"]:
        size = "1792x1024" # DALL-E 3 yatay format
        
    payload = {
        "model": "dall-e-3",
        "prompt": prompt,
        "n": 1,
        "size": size,
        "quality": "hd", # Sovereign kalitesi
        "response_format": "url"
    }
    
    print(f"   [+] OpenAI Matrix'ine Gönderiliyor ({size})...")
    
    try:
        response = requests.post("https://api.openai.com/v1/images/generations", headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        return data['data'][0]['url']
    except Exception as e:
        print(f"   [HATA] Matrix Yanıt Vermedi: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"   [Detay] {e.response.text}")
        return None

def process_and_save(image_url, physical_path):
    """Resmi indirir, Pillow (Alchemist Forge) ile WebP'ye dönüştürür ve kaydeder."""
    print("   [+] Sovereign Drop / Alchemist Forge: WebP Çevirimi Başlıyor...")
    
    try:
        # Klasörleri güvenceye al
        os.makedirs(os.path.dirname(physical_path), exist_ok=True)
        
        # Belleğe indir
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()
        
        # Pillow ile aç
        img = Image.open(BytesIO(response.content))
        
        # Zaten boyutu devasa (1792x1024) olabilir, UI'ı hafifletmek için upscale veya downscale eklenebilir
        # img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        
        # Eğer uzantısı WebP değil ama yol WebP ise zorla WebP olarak kaydet
        save_path = physical_path
        if not save_path.endswith('.webp'):
            save_path = save_path.rsplit('.', 1)[0] + '.webp'
            
        img.save(
            save_path,
            "WEBP",
            quality=82, # Sovereign WebP Standardı
            method=6    # En yüksek sıkıştırma eforu
        )
        print(f"   👑 MÜHÜRLENDİ: {save_path} (Ağırlık Optimize Edildi)")
        
    except Exception as e:
        print(f"   [HATA] Alchemist Forge (Pillow) Dönüşümünde çöktü: {e}")

if __name__ == "__main__":
    genesis_core_ignition()
    print("\n[SINGULARITY ENGINE] Döngü Tamamlandı.")
