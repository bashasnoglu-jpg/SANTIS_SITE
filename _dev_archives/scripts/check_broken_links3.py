import os
import re
from pathlib import Path

def check_broken_links(root_dir):
    ignore_dirs = {
        ".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build", "core", "api", "backend", "app", 
        ".vscode", "backup", "backups", "backup_assets", "_archive", "_legacy", "_legacy_archive", 
        "_legacy_content", "_dev_archives", "SantisV5.5_Backup_20260221_122443", 
        "visual_checkpoints", "quarantine_zone", "logs", "test-results", "tests", "templates", "components", "admin", "admin-panel", "tools", "hq-dashboard"
    }
    
    html_files = []
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Prevent scanning into ignored directories
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs and not d.startswith("SantisV") and not d.startswith("_")]
        
        for f in filenames:
            if f.endswith(".html"):
                html_files.append(Path(dirpath) / f)
                
    href_re = re.compile(r'href=["\'](.*?)["\']')
    src_re = re.compile(r'src=["\'](.*?)["\']')
    
    broken_links = []
    total_links = 0
    total_files = len(html_files)
    
    for html_file in html_files:
        try:
            content = html_file.read_text(encoding="utf-8")
            all_links = href_re.findall(content) + src_re.findall(content)
            total_links += len(all_links)
            
            for link in set(all_links):
                # ignore placeholders or common protocols
                if link.startswith("http://") or link.startswith("https://") or link.startswith("#") or link.startswith("mailto:") or link.startswith("tel:") or not link or link.startswith("javascript:"):
                    continue
                
                # handle absolute vs relative paths
                if link.startswith("/"):
                    # relative to root_dir
                    clean_link = link.lstrip("/")
                    if "?" in clean_link:
                        clean_link = clean_link.split("?")[0]
                    if "#" in clean_link:
                        clean_link = clean_link.split("#")[0]
                    target_path = Path(root_dir) / clean_link
                else:
                    # relative to current file
                    clean_link = link
                    if "?" in clean_link:
                        clean_link = clean_link.split("?")[0]
                    if "#" in clean_link:
                        clean_link = clean_link.split("#")[0]
                    target_path = (html_file.parent / clean_link).resolve()
                
                # check if file exists
                if not target_path.exists():
                    broken_links.append({
                        "file": str(html_file.relative_to(root_dir)),
                        "link": link,
                        "target": str(target_path)
                    })
        except Exception as e:
            pass

    return broken_links, total_files, total_links

if __name__ == "__main__":
    root = "."
    broken, total_files, total_links = check_broken_links(root)
    
    from collections import defaultdict
    by_file = defaultdict(list)
    for b in broken:
        by_file[b["file"]].append(b["link"])
        
    with open("LIVE_BROKEN_LINKS_REPORT.md", "w", encoding="utf-8") as f:
        f.write("# 🚨 SANTIS_SITE Ultra Detaylı Kırık Link Raporu\n\n")
        f.write(f"**Taranan HTML Dosyası:** {total_files}\n")
        f.write(f"**Kontrol Edilen Toplam Link:** {total_links}\n")
        f.write(f"**Tespit Edilen Kırık Link Sayısı:** {len(broken)}\n\n")
        
        if not broken:
            f.write("✅ **Harika! Hiçbir kırık link veya eksik dosya bulunamadı.**\n")
        else:
            f.write("Aşağıdaki dosyalarda eksik veya hatalı yollar tespit edilmiştir. Lütfen özellikle `assets/` yollarının doğruluğunu (göreceli/mutlak) kontrol edin.\n\n")
            
            for file, links in sorted(by_file.items()):
                f.write(f"### 📄 `{file}`\n")
                for link in sorted(set(links)):
                    f.write(f"- ❌ `{link}` (Bulunamadı)\n")
                f.write("\n")
    print(f"DONE. Found {len(broken)} broken links across {total_files} files.")
