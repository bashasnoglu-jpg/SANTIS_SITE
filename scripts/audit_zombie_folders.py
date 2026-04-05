import os
import re

ZOMBIE_FOLDERS = [
    '_dev_archives',
    '_quarantine',
    '_archive',
    '_backup',
    'Quarantine',
    'quarantine_zone',
    'SantisV5.5_Backup_20260221_122443',
    'backup_assets',
    'backups'
]

def scan_for_references(root_dir):
    print("[*] Zombi Klasör Referans Taraması Başlatıldı...")
    found_issues = []
    total_scanned = 0

    for current_root, dirs, files in os.walk(root_dir):
        # Kendimizi ignore edelim
        if any(z in current_root for z in ZOMBIE_FOLDERS) or '.git' in current_root or 'node_modules' in current_root:
            continue
            
        for file in files:
            # Yalnızca kod dosyalarını tara
            if not file.endswith(('.html', '.js', '.css', '.json', '.ts', '.tsx', '.py', '.mjs', '.yml', '.yaml', '.md', '.txt')):
                continue
            
            filepath = os.path.join(current_root, file)
            total_scanned += 1
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    for idx, line in enumerate(lines):
                        for zombie in ZOMBIE_FOLDERS:
                            # Exact string match with typical path boundaries
                            if zombie in line:
                                found_issues.append({
                                    "file": filepath,
                                    "line": idx + 1,
                                    "zombie": zombie,
                                    "content": line.strip()
                                })
            except UnicodeDecodeError:
                pass
            except Exception as e:
                pass

    print(f"[*] Toplam taranan aktif dosya sayısı: {total_scanned}")
    
    if not found_issues:
        print("[+] GÜVENLİ: Aktif kod tabanında zombi klasörlere hiçbir referans bulunamadı!")
    else:
        print("[-] DİKKAT: Zombi klasörlere referanslar tespit edildi:")
        for issue in found_issues:
            # Check if it's just a comment or a real import
            print(f"  -> {issue['file']}:{issue['line']} | {issue['zombie']} | {issue['content']}")
            
if __name__ == "__main__":
    scan_for_references(".")
