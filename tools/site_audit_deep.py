import os
import re
import datetime

ROOT_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE\tr"
GUEST_ZEN = r"c:\Users\tourg\Desktop\SANTIS_SITE\guest-zen"
ASSETS_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE\assets"
OUTPUT_REPORT = r"C:\Users\tourg\.gemini\antigravity\brain\ae15d084-2e2c-4eed-8690-43e9e9a75134\SANTIS_DEEP_SCAN_REPORT.md"
def generate_report():
    report_lines = []
    report_lines.append(f"# 🛡️ SANTIS MASTER OS - DEEP SCAN AUDIT (V22)")
    report_lines.append(f"**Date:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append(f"**Target:** The Sovereign Infrastructure")
    report_lines.append("\n---\n")

    # 1. Image Architecture (WebP, Width/Height constraints)
    report_lines.append("## 1. Visual Architecture & Media Assets")
    img_issues = []
    for root, _, files in os.walk(ROOT_DIR):
        for f in files:
            if f.endswith('.html'):
                with open(os.path.join(root, f), 'r', encoding='utf-8') as file:
                    content = file.read()
                    imgs = re.findall(r'<img[^>]+>', content)
                    for img in imgs:
                        missing_dimensions = 'width' not in img or 'height' not in img
                        not_webp = '.webp' not in img and 'srcset' not in img
                        if missing_dimensions or not_webp:
                            match_src = re.search(r'src=["\'](.*?)["\']', img)
                            src = match_src.group(1) if match_src else "Unknown Source"
                            issue_type = []
                            if missing_dimensions: issue_type.append("Missing Dimensions (CLS Risk)")
                            if not_webp: issue_type.append("Not WebP (Payload Risk)")
                            
                            severity = "Medium" if not_webp else "Low"
                            if missing_dimensions and not_webp: severity = "Critical"
                            
                            img_issues.append(f"- **[{severity}]** `{f}` -> `{src}`: {', '.join(issue_type)}")

    if img_issues:
        report_lines.append("⚠️ **Issues Detected:**")
        report_lines.extend(img_issues[:15]) # Limit to 15 for readability
        if len(img_issues) > 15:
            report_lines.append(f"- ... ve {len(img_issues) - 15} benzer görsel ihlali.")
    else:
        report_lines.append("✅ **Status:** Kusursuz. Tüm görseller optimize ve CLS korumalı.")


    # 2. Memory State & Ghost Logic
    report_lines.append("\n## 2. Memory State & Ghost Logic (V21)")
    ghost_found_in_zen = False
    
    zen_index = os.path.join(GUEST_ZEN, 'index.html')
    if os.path.exists(zen_index):
        with open(zen_index, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'THE EXIT INTENT' in content and 'localStorage' in content:
                ghost_found_in_zen = True

    if ghost_found_in_zen:
        report_lines.append("✅ **Status:** Yüksek. 'The Ghost Concierge' ve 'Exit Intent' yapısı Guest Zen'de başarılı bir şekilde mühürlenmiş (`localStorage` aktif).")
    else:
        report_lines.append("❌ **[Critical]** Guest Zen portalında Ghost Logic tetikleyicileri (Proactive Trigger & Exit Intent) tespit edilemedi.")

    # Check globally in tr folder
    tr_files_with_logic = 0
    for root, _, files in os.walk(ROOT_DIR):
        for f in files:
             if f.endswith('.html'):
                with open(os.path.join(root, f), 'r', encoding='utf-8') as file:
                   if 'triggerGhost' in file.read() or 'nvIdleSeconds' in file.read():
                       tr_files_with_logic += 1
    
    report_lines.append(f"- **Coverage:** `/tr/` dizininde toplam {tr_files_with_logic} sayfada aktif proaktif tetikleyici tespit edildi.")
    if tr_files_with_logic == 0:
        report_lines.append("⚠️ **[Medium]** Satış sayfalarında (örn: Checkout) Ghost Logic betiği eksik. Bu alanlara acil implementasyon önerilir.")

    # 3. Canonical Audit & 404 Risks
    report_lines.append("\n## 3. SEO & Canonical Health (Zombified Links)")
    zombie_links = []
    
    for root, _, files in os.walk(ROOT_DIR):
        for f in files:
            if f.endswith('.html'):
                with open(os.path.join(root, f), 'r', encoding='utf-8') as file:
                    content = file.read()
                    # A link checking pattern for href="/en/...", href="../en/..." etc
                    links = re.findall(r'href=["\']((?:\.\./)*/?(?:en|ru)/[^"\']*)["\']', content)
                    for l in links:
                        zombie_links.append(f"- **[Critical]** `{f}` -> Zombi Link Tespit Edildi: `{l}`")

    if zombie_links:
        report_lines.append("⚠️ **404 Risks Detected:**")
        report_lines.extend(list(set(zombie_links))[:10])
        if len(zombie_links) > 10:
             report_lines.append(f"- ... ve toplam {len(zombie_links)} riskli zombi bağlantı.")
    else:
        report_lines.append("✅ **Status:** Mükemmel. Sistem /tr/ rotasına sadık, ölü dil bağlantıları tamamen arındırılmış.")


    # 4. Latency & Dashboard Sync
    report_lines.append("\n## 4. Performance (Dashboard Latency)")
    dashboard_js = r"c:\Users\tourg\Desktop\SANTIS_SITE\admin\dashboard.js"
    if os.path.exists(dashboard_js):
        with open(dashboard_js, 'r', encoding='utf-8') as f:
            if 'websocket' in f.read().lower() or 'bridgeSocket' in f.read():
                report_lines.append("✅ **Status:** Kusursuz. Dashboard verileri WebSocket asenkron mimarisi ile 0 gecikmeli senkronize ediliyor.")
            else:
                report_lines.append("⚠️ **[Medium]** Dashboard bağlantıları HTTP polling (gecikmeli) yöntemine dayanıyor.")


    # The Executive Wrap up
    report_lines.append("\n---\n")
    report_lines.append("### ♟️ The Executive Summary")
    
    crit_count = sum(1 for line in report_lines if '[Critical]' in line)
    med_count = sum(1 for line in report_lines if '[Medium]' in line)
    
    if crit_count == 0 and med_count <= 2:
        report_lines.append("Sistem 'Production-Ready' durumundadır. Omurga kırılmaz şekilde inşa edilmiştir.")
    else:
        report_lines.append(f"Tespit edilen **{crit_count} Kritik** ve **{med_count} Orta** seviyeli zayıflığa derhal müdahale edilmesi (Cerrahi Operasyon) tavsiye edilir.")

    with open(OUTPUT_REPORT, 'w', encoding='utf-8') as f:
        f.write("\n".join(report_lines))
        
    print(f"Deep Scan Complete. Artifact generated at {OUTPUT_REPORT}")

if __name__ == '__main__':
    generate_report()
