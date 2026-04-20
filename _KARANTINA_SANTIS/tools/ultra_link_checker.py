import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from colorama import Fore, Style, init
import sys
import time

# Renkleri başlat
init(autoreset=True)

# Ayarlar
BASE_URL = "http://localhost:8000"
CHECK_IMAGES = True
CHECK_CSS = True
CHECK_JS = True
TIMEOUT = 5

visited_pages = set()
broken_links = []
scanned_count = 0

print(Style.BRIGHT + Fore.CYAN + "="*50)
print(Style.BRIGHT + Fore.CYAN + f"🚀 SANTIS V5 ULTRA LINK CHECKER BAŞLATILIYOR...")
print(Style.BRIGHT + Fore.CYAN + f"🎯 Hedef: {BASE_URL}")
print(Style.BRIGHT + Fore.CYAN + "="*50 + "\n")

def is_internal(url):
    """Linkin site içi olup olmadığını kontrol eder."""
    netloc = urlparse(url).netloc
    return netloc == "" or netloc == urlparse(BASE_URL).netloc

def check_url(url, source_page, context="Link"):
    """Bir URL'e istek atıp durumunu kontrol eder."""
    try:
        r = requests.head(url, timeout=TIMEOUT)
        
        # Bazı sunucular HEAD kabul etmez, GET deneyelim
        if r.status_code == 405:
            r = requests.get(url, timeout=TIMEOUT, stream=True)
            r.close()

        if r.status_code >= 400:
            print(Fore.RED + f"❌ [KIRIK] {url}")
            print(Fore.RED + f"   ↳ Kaynak: {source_page} ({context}) -> Kod: {r.status_code}")
            broken_links.append({"url": url, "source": source_page, "code": r.status_code, "context": context})
        else:
            # print(Fore.GREEN + f"✅ {url}") # Çok fazla log olmaması için kapalı
            pass

    except Exception as e:
        print(Fore.RED + f"⚠️ [HATA] {url}")
        print(Fore.RED + f"   ↳ Kaynak: {source_page} -> {e}")
        broken_links.append({"url": url, "source": source_page, "code": "ERR", "context": context})

def crawl(url):
    """Sayfayı tarar ve içindeki linkleri bulur."""
    global scanned_count
    
    # URL normalizasyonu (Hash ve parametreleri temizle - isteğe bağlı)
    parsed = urlparse(url)
    clean_url = parsed.scheme + "://" + parsed.netloc + parsed.path
    if clean_url in visited_pages:
        return
    
    visited_pages.add(clean_url)
    scanned_count += 1
    
    print(Fore.YELLOW + f"🔍 Taranıyor ({scanned_count}): {clean_url}")

    try:
        r = requests.get(url, timeout=TIMEOUT)
        if r.status_code != 200:
            print(Fore.RED + f"❌ Sayfa Açılamadı: {url} (Kod: {r.status_code})")
            return

        soup = BeautifulSoup(r.text, "html.parser")

        # 1. <a> Etiketleri (Linkler)
        for a in soup.find_all("a", href=True):
            link = urljoin(url, a["href"])
            
            # Sadece http/https linkleri kontrol et
            if not link.startswith("http"): 
                continue

            if is_internal(link):
                # İç link ise: Önce kontrol et, sonra kuyruğa ekle (Recursive)
                # Linkin dosya olup olmadığına bak (PDF, JPG vb. crawl edilmez)
                if not any(link.lower().endswith(ext) for ext in ['.jpg', '.png', '.webp', '.pdf', '.css', '.js']):
                     if link not in visited_pages: 
                         # Derinlemesine tarama için recursive çağrı yapmıyoruz, sadece ziyaret listesine ekleyip sonraki adımda gezebiliriz
                         # Ama bu basit versiyonda sadece check yapıp geçelim, tam site haritası çıkarmak karmaşık olur.
                         # Şimdilik sadece bulduğu assetleri kontrol etsin.
                         pass
                
                # Her halükarda linkin çalışıp çalışmadığını kontrol et
                check_url(link, url, "İç Link")
            else:
                # Dış link ise sadece kontrol et
                pass # Dış linkleri taramak uzun sürer, isterseniz açabilirsiniz.

        # 2. <img> Etiketleri (Resimler)
        if CHECK_IMAGES:
            for img in soup.find_all("img", src=True):
                src = urljoin(url, img["src"])
                check_url(src, url, "Görsel")

        # 3. <link> (CSS)
        if CHECK_CSS:
            for css in soup.find_all("link", href=True):
                if "stylesheet" in css.get("rel", []):
                    href = urljoin(url, css["href"])
                    check_url(href, url, "CSS")

        # 4. <script> (JS)
        if CHECK_JS:
            for js in soup.find_all("script", src=True):
                src = urljoin(url, js["src"])
                check_url(src, url, "JS")

    except Exception as e:
        print(Fore.RED + f"❌ Kritik Hata: {url} -> {e}")

# --- ANA DÖNGÜ ---
if __name__ == "__main__":
    start_time = time.time()
    
    # Ana sayfadan başla
    crawl(BASE_URL)
    
    # Ekstra olarak bilinen alt sayfaları da tarama listesine manuel ekleyebiliriz
    # crawl(BASE_URL + "/tr/index.html")
    # crawl(BASE_URL + "/tr/urunler/index.html")

    duration = time.time() - start_time

    print("\n" + Style.BRIGHT + Fore.CYAN + "="*50)
    print(Style.BRIGHT + Fore.CYAN + "🏁 TARAMA TAMAMLANDI")
    print(Style.BRIGHT + Fore.CYAN + f"⏱️ Süre: {duration:.2f} saniye")
    print(Style.BRIGHT + Fore.CYAN + f"📄 Taranan Sayfa: {scanned_count}")
    print(Style.BRIGHT + Fore.CYAN + "="*50)

    if broken_links:
        print(Style.BRIGHT + Fore.RED + f"\n🚨 BULUNAN KIRIK LINKLER ({len(broken_links)} ADET):")
        for error in broken_links:
            print(Fore.RED + f"• {error['context']}: {error['url']}")
            print(Fore.RED + f"  Kaynak: {error['source']}")
            print(Fore.WHITE + "-"*30)
    else:
        print(Style.BRIGHT + Fore.GREEN + "\n✅ MÜKEMMEL! Hiçbir kırık link bulunamadı.")
