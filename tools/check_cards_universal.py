"""
NEUROVA / SANTIS CLUB - UNIVERSAL CARD CHECKER
----------------------------------------------
Bu script, belirtilen sayfalardaki ürün kartlarının (nv-product-v2) 
doğru şekilde render edildiğini kontrol eder.

GEREKSİNİMLER:
1. Python yüklü olmalı.
2. Selenium yüklü olmalı: `pip install selenium webdriver-manager`
3. Chrome tarayıcısı yüklü olmalı.

KULLANIM:
Terminalden çalıştırın: `python check_cards_universal.py`
"""

import time
import sys

# List of pages to check
PAGES = [
    "http://127.0.0.1:8000/tr/urunler/index.html",
    "http://127.0.0.1:8000/tr/masajlar/index.html",
    "http://127.0.0.1:8000/tr/hamam/index.html",
    "http://127.0.0.1:8000/tr/cilt-bakimi/index.html"
]

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.options import Options
    from webdriver_manager.chrome import ChromeDriverManager
except ImportError:
    print("❌ HATA: Selenium veya webdriver-manager yüklü değil.")
    print("Lütfen şu komutu çalıştırın: pip install selenium webdriver-manager")
    sys.exit(1)

def check_site():
    print("🚀 Başlatılıyor: Chrome (Headless Mod)...")
    
    options = Options()
    options.add_argument("--headless") # Arka planda çalışır
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    
    print("-" * 50)
    print(f"{'SAYFA':<40} | {'DURUM':<10} | {'KART SAYISI'}")
    print("-" * 50)

    for url in PAGES:
        try:
            # Sayfayı aç (Local file path ise 'file:///' kullanın)
            # Eğer Live Server kullanıyorsanız http:// localhost adresini kullanın.
            # Script içinde dosya yolu düzeltmesi:
            if "http" not in url:
                # Varsayım: Dosya sistemi (absolute path gerekebilir)
                pass 
            
            driver.get(url)
            
            # JS Yüklenmesi için bekle (3-4 sn)
            time.sleep(4)
            
            # Kartları Bul
            cards = driver.find_elements(By.CSS_SELECTOR, ".prod-card-v2, .nv-product-card, .nv-product-v2, .product-card")
            count = len(cards)
            
            status = "✅ OK" if count > 0 else "⚠️ BOŞ"
            print(f"{url.split('/')[-2] + '/' + url.split('/')[-1]:<40} | {status:<10} | {count}")
            
        except Exception as e:
            print(f"{url:<40} | ❌ HATA    | {str(e)[:20]}")

    print("-" * 50)
    driver.quit()
    print("🏁 Tamamlandı.")

if __name__ == "__main__":
    check_site()
