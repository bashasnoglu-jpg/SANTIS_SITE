#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Santis Site Audit Crawler
================================
Kullanım:
    python audit_crawler.py

Özellikler:
- Recursive (Özyinelemeli) tarama
- 404, 410, 500+ hatalarını tespit etme
- Görsel, Script, CSS ve Link kontrolü
- Relative linkleri absolute hale getirme
- Sonsuz döngü koruması
- Timeout ve Hata Toleransı

Gereksinimler:
    pip install requests beautifulsoup4
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import collections
import time
import sys

# Renklendirme için (Windows uyumlu olması için basit ANSI)
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_banner():
    print(f"{Colors.HEADER}========================================{Colors.ENDC}")
    print(f"{Colors.HEADER}   SANTIS SITE AUDIT CRAWLER v1.0   {Colors.ENDC}")
    print(f"{Colors.HEADER}========================================{Colors.ENDC}")

class SiteCrawler:
    def __init__(self, start_url):
        self.start_url = start_url
        self.domain = urlparse(start_url).netloc
        self.visited_urls = set()
        self.urls_to_visit = collections.deque([start_url])
        
        # Raporlama Depoları
        self.broken_links = []      # (url, page_found, type, status)
        self.redirects = []         # (old, new)
        self.access_errors = []     # (url, page_found, status)
        self.server_errors = []     # (url, page_found, status)
        self.crawled_count = 0

    def is_valid_url(self, url):
        """Domain içi kontrolü ve gereksiz dosya elemesi"""
        parsed = urlparse(url)
        return bool(parsed.netloc) and (parsed.netloc == self.domain)

    def get_resource_type(self, tag_name, url):
        if tag_name == 'img': return 'image'
        if tag_name == 'script': return 'js'
        if tag_name == 'link': return 'css/resource'
        if tag_name == 'source': return 'media'
        if url.endswith('.pdf'): return 'file'
        return 'page'

    def crawl(self):
        print(f"{Colors.OKBLUE}[*] Tarama başlatılıyor: {self.start_url}{Colors.ENDC}")
        
        while self.urls_to_visit:
            current_url = self.urls_to_visit.popleft()
            
            if current_url in self.visited_urls:
                continue
            
            self.visited_urls.add(current_url)
            self.crawled_count += 1
            print(f"Taraniyor ({self.crawled_count}): {current_url}", end='\r')

            try:
                response = requests.get(current_url, timeout=5)
                
                # Redirect Kontrolü
                if response.history:
                    for resp in response.history:
                        self.redirects.append((resp.url, response.url))
                
                # Hata Kontrolü (4xx, 5xx)
                status = response.status_code
                if status >= 400:
                    self.log_error(current_url, "Direct Visit", "page", status)
                    continue # Hatalı sayfayı parse etme

                # Sadece HTML içeriği parse et
                if 'text/html' not in response.headers.get('Content-Type', ''):
                    continue

                soup = BeautifulSoup(response.text, "html.parser")

                # 1. Linkleri Yakala (<a href>)
                for link in soup.find_all("a", href=True):
                    href = link.get("href")
                    full_url = urljoin(current_url, href)
                    
                    # Anchor (#) linkleri atla
                    if '#' in href and full_url.split('#')[0] == current_url.split('#')[0]:
                        continue
                        
                    if self.is_valid_url(full_url) and full_url not in self.visited_urls:
                        self.urls_to_visit.append(full_url)
                    elif not self.is_valid_url(full_url):
                        # Dış linkleri kontrol et (HEAD request) - Opsiyonel, şimdilik sadece iç yapıyı tarıyoruz
                        pass

                # 2. Kaynakları Kontrol Et (img, script, link, etc.)
                self.check_resources(soup, current_url)

            except requests.RequestException as e:
                print(f"\n{Colors.FAIL}[!] Request Hatası: {current_url} - {e}{Colors.ENDC}")
                continue
            except KeyboardInterrupt:
                print("\n[!] Tarama kullanıcı tarafından durduruldu.")
                break

    def check_resources(self, soup, page_url):
        """Sayfa içindeki statik kaynakları kontrol eder"""
        resources = []
        
        # img src
        for img in soup.find_all('img', src=True):
            resources.append((img.get('src'), 'image'))
            
        # script src
        for script in soup.find_all('script', src=True):
            resources.append((script.get('src'), 'js'))
            
        # link href (css)
        for link in soup.find_all('link', href=True):
            resources.append((link.get('href'), 'css'))

        for res_url, res_type in resources:
            full_url = urljoin(page_url, res_url)
            
            # Daha önce kontrol edildiyse atla (performans için visited listesine kaynakları da ekleyebiliriz ama şimdilik request optimizasyonu yapalım)
            # Basit kontrol: HEAD request at
            try:
                r = requests.head(full_url, timeout=3)
                if r.status_code >= 400:
                    self.log_error(full_url, page_url, res_type, r.status_code)
            except Exception:
                # HEAD başarısız olursa GET dene (bazen sunucular HEAD sevmez)
                try:
                    r = requests.get(full_url, stream=True, timeout=3)
                    if r.status_code >= 400:
                        self.log_error(full_url, page_url, res_type, r.status_code)
                except:
                    self.log_error(full_url, page_url, res_type, "Connection Failed")

    def log_error(self, url, page, rtype, status):
        try:
            code = int(status)
        except:
            code = 0
            
        if code == 404 or code == 410:
            self.broken_links.append((url, page, rtype, status))
        elif code == 403:
            self.access_errors.append((url, page, status))
        elif code >= 500:
            self.server_errors.append((url, page, status))

    def print_report(self):
        print(f"\n\n{Colors.OKGREEN}TARAMA TAMAMLANDI{Colors.ENDC}\n")
        
        print(f"{Colors.FAIL}KRİTİK HATALAR (404/410){Colors.ENDC}")
        if not self.broken_links:
            print("  Hata bulunamadı.")
        for url, page, rtype, status in self.broken_links:
            print(f"  [{status}] {url}")
            print(f"    └── Bulunduğu: {page} ({rtype})")

        print(f"\n{Colors.WARNING}YÖNLENDİRMELER{Colors.ENDC}")
        if not self.redirects:
            print("  Yönlendirme yok.")
        for old, new in self.redirects:
            print(f"  {old} -> {new}")

        print(f"\n{Colors.WARNING}ERİŞİM HATALARI (403 vs){Colors.ENDC}")
        for url, page, status in self.access_errors:
            print(f"  [{status}] {url} (Ref: {page})")

        print(f"\n{Colors.FAIL}SUNUCU HATALARI (500+){Colors.ENDC}")
        for url, page, status in self.server_errors:
            print(f"  [{status}] {url} (Ref: {page})")
            
        total_errors = len(self.broken_links) + len(self.access_errors) + len(self.server_errors)
        print("\n------------------------------------------------")
        print(f"TOPLAM TARAMA SAYISI: {self.crawled_count}")
        print(f"TOPLAM HATALI LİNK:   {total_errors}")
        print("------------------------------------------------")

if __name__ == "__main__":
    print_banner()
    target_url = input("Taranacak site adresini girin (Örn: http://localhost:5500): ").strip()
    
    if not target_url:
        print("URL girilmedi, çıkılıyor.")
        sys.exit()
        
    if not target_url.startswith("http"):
        target_url = "http://" + target_url

    crawler = SiteCrawler(target_url)
    crawler.crawl()
    crawler.print_report()
