import os
import json
import base64
from pathlib import Path
from PIL import Image
from io import BytesIO
from bs4 import BeautifulSoup
from openai import OpenAI

# [SOVEREIGN SEAL: SINGULARITY ENGINE V3 - THE OMEGA PROTOCOL]

client = OpenAI() # OPENAI_API_KEY .env'den otomatik alınır

# Dizin Yolları
BASE_DIR = Path.cwd() # Kök dizin (HTML'lerin aranacağı yer)
ASSETS_DIR = BASE_DIR / "assets" / "img"
PROMPT_FILE = BASE_DIR / "ai" / "prompt_matrix.json"

ASSETS_DIR.mkdir(parents=True, exist_ok=True)
PROMPT_FILE.parent.mkdir(parents=True, exist_ok=True)

# Sovereign DNA: Matriste olmayan görseller için otonom lüks prompt eklentisi
SOVEREIGN_DNA = "ultra luxury spa interior, warm marble textures, golden ambient lighting, calm wellness resort atmosphere, elegant aesthetic, photorealistic, 8k resolution, masterpiece, no text"

def scan_html_for_missing() -> set:
    """1️⃣ THE EYE: Tüm HTML dosyalarını tarar ve eksik (404) görselleri avlar."""
    print("👁️ [THE EYE] Kuantum Tarama başlatıldı. Kör noktalar (Void) aranıyor...")
    missing_files = set()
    
    # HTML dosyalarını bul (Derinlemesine)
    for html_file in BASE_DIR.rglob("*.html"):
        try:
            with open(html_file, "r", encoding="utf-8") as f:
                soup = BeautifulSoup(f.read(), "html.parser")
                
            for img in soup.find_all("img"):
                src = img.get("src")
                if src and src.endswith(('.webp', '.jpg', '.png', '.jpeg')):
                    filename = src.split("/")[-1]
                    physical_path = ASSETS_DIR / filename
                    
                    # Eğer dosya fiziksel olarak yoksa, av listesine ekle
                    if not physical_path.exists():
                        missing_files.add(filename)
        except Exception as e:
            print(f"⚠️ [WARNING] Dosya okunamadı: {html_file.name} - {e}")
                    
    return missing_files

def update_registry(missing_files: set) -> list:
    """2️⃣ AUTO REGISTRY: Eksikleri JSON matrisine otonom olarak ekler (Öğrenen Zihin)."""
    matrix = []
    if PROMPT_FILE.exists():
        try:
            with open(PROMPT_FILE, "r", encoding="utf-8") as f:
                matrix = json.load(f)
        except json.JSONDecodeError:
            print("⚠️ [WARNING] Prompt matrisi bozuk. Sıfırdan başlanıyor.")
            
    existing_files = {item["file"] for item in matrix}
    added_new = False
    
    for filename in missing_files:
        if filename not in existing_files:
            # Dosya adından otonom prompt türet (Örn: royal_suite_massage.webp -> "royal suite massage")
            clean_name = filename.replace(".webp", "").replace(".jpg", "").replace("_", " ").replace("-", " ").title()
            auto_prompt = f"Concept: {clean_name}. {SOVEREIGN_DNA}"
            
            new_node = {
                "id": f"auto_{filename.split('.')[0]}",
                "file": filename,
                "size": "1024x1024", # Varsayılan Sovereign Oranı (Kare)
                "prompt": auto_prompt
            }
            matrix.append(new_node)
            existing_files.add(filename)
            added_new = True
            print(f"🧠 [AUTO REGISTRY] Otonom Gen Eklendi: '{clean_name}'")
            
    if added_new:
        with open(PROMPT_FILE, "w", encoding="utf-8") as f:
            json.dump(matrix, f, indent=4, ensure_ascii=False)
            
    return matrix

def generate_and_forge(filename: str, prompt: str, size: str):
    """3️⃣ & 4️⃣ GENESIS & ALCHEMIST: DALL-E 3 -> RAM -> WebP -> Disk"""
    print(f"⚡ [GENESIS] Yaratılıyor: {filename}")
    
    try:
        # Genesis Core: Zero Disk I/O (b64_json)
        result = client.images.generate(
            model="dall-e-3", # Sovereign Kalitesi için DALL-E 3
            prompt=prompt,
            size=size,
            quality="hd",
            response_format="b64_json",
            n=1
        )
        
        # Alchemist Forge: Base64 to Image to WEBP
        image_data = base64.b64decode(result.data[0].b64_json)
        img = Image.open(BytesIO(image_data))
        
        # Saydamlık maskelerini ez
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        output_path = ASSETS_DIR / filename
        
        # Mühür: Kalite 82, Metot 6
        img.save(output_path, "WEBP", quality=82, method=6)
        
        kb_size = output_path.stat().st_size / 1024
        print(f"👑 [SOVEREIGN DROP] Mühürlendi: {filename} ({kb_size:.1f} KB)\n")
        
    except Exception as e:
        print(f"❌ [CRITICAL FRACTURE] {filename} yaratılamadı: {e}\n")

def ignite_singularity_v3():
    print("\n" + "═"*60)
    print("🚀 SANTIS SINGULARITY ENGINE V3 UYANDIRILDI")
    print("═"*60 + "\n")
    
    # 1. Eksikleri Avla
    missing_files = scan_html_for_missing()
    
    if not missing_files:
        print("✅ [MATRIX KUSURSUZ] Sistem taranarak doğrulandı. 404 Riski sıfır.")
        return
        
    print(f"⚠️ [VOID DETECTED] {len(missing_files)} adet eksik slot tespit edildi. Otonom onarım başlıyor...\n")
    
    # 2. Matrisi Güncelle (Öğrenme Fazı)
    matrix = update_registry(missing_files)
    
    # 3. Yaratılış Döngüsü
    for item in matrix:
        if item["file"] in missing_files:
            generate_and_forge(item["file"], item["prompt"], item["size"])
            
    print("🏆 [OMEGA PROTOCOL TAMAMLANDI] Sistem kendi kendini onardı.")

if __name__ == "__main__":
    ignite_singularity_v3()
