import os

# Project Root
ROOT = os.getcwd()
print(f"🛑 DOĞRULAMA BAŞLATILIYOR... (Kök Dizin: {ROOT})")
print("-" * 50)

# Critical Files to Check (based on user complaints)
files_to_check = [
    "assets/js/santis-core-v6.js",
    "assets/js/santis-nav.js",
    "assets/js/animations.js",
    "assets/js/loader.js",
    "assets/js/gallery-data.js",
    "assets/css/style.css",
    "tr/urunler/index.html",
    "tr/galeri/index.html",
    "admin/index.html"
]

missing_count = 0

for rel_path in files_to_check:
    full_path = os.path.join(ROOT, rel_path.replace("/", os.sep))
    exists = os.path.exists(full_path)
    
    status = "✅ VAR" if exists else "❌ YOK"
    if not exists: missing_count += 1
    
    print(f"{status} : {rel_path}")

print("-" * 50)
if missing_count == 0:
    print("🚀 SONUÇ: TÜM DOSYALAR MEVCUT! SORUN YOK.")
    print("⚠️  Eğer panelde hala hata görüyorsanız, lütfen tarayıcı önbelleğini (CTRL + SHIFT + R) temizleyin veya 'BASLAT.bat' dosyasını yeniden çalıştırın.")
else:
    print(f"💥 SONUÇ: {missing_count} adet eksik dosya var. Hemen düzeltilmeli!")
