import os
import re
from pathlib import Path

def fix_html_issues(root_dir):
    ignore_dirs = {
        ".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build", "core", "api", "backend", "app", 
        ".vscode", "backup", "backups", "backup_assets", "_archive", "_legacy", "_legacy_archive", 
        "_legacy_content", "_dev_archives", "SantisV5.5_Backup_20260221_122443", 
        "visual_checkpoints", "quarantine_zone", "logs", "test-results", "tests"
    }

    html_files = []
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs and not d.startswith("SantisV") and not d.startswith("_")]
        for f in filenames:
            if f.endswith(".html"):
                html_files.append(Path(dirpath) / f)
                
    fixed_count = 0
    
    for html_file in html_files:
        try:
            original_content = html_file.read_text(encoding="utf-8")
            content = original_content
            
            # 1. Fix malformed onerror/src syntax (assets img cards ...)
            # Example: onerror="this.src=" assets img cards massage webp src="/assets/img/cards/santis_card_massage_v1.webp"
            content = re.sub(
                r'onerror="this\.src="\s+assets\s+img\s+cards\s+[a-z_]+\s+webp\s+src="([^"]+)"',
                r'src="\1"',
                content
            )
            
            # Additional cleanup for missing quotes or malformed class into src
            content = re.sub(
                r'assets\s+img\s+hero\s+general\s+webp\s+src="([^"]+)"',
                r'src="\1"',
                content
            )
            
            # 2. Fix Double Slashes ..//assets
            content = content.replace("..//assets/", "/assets/")
            
            # 3. Fix Relative Path Hell for known root folders (assets, tr, en, de, fr, ru)
            # href="../../tr/index.html" -> href="/tr/index.html"
            content = re.sub(r'(href|src)=["\'](?:\.\./)+assets/([^"\']+)["\']', r'\1="/assets/\2"', content)
            content = re.sub(r'(href|src)=["\'](?:\.\./)+tr/([^"\']+)["\']', r'\1="/tr/\2"', content)
            content = re.sub(r'(href|src)=["\'](?:\.\./)+en/([^"\']+)["\']', r'\1="/en/\2"', content)
            content = re.sub(r'(href|src)=["\'](?:\.\./)+de/([^"\']+)["\']', r'\1="/de/\2"', content)
            content = re.sub(r'(href|src)=["\'](?:\.\./)+ru/([^"\']+)["\']', r'\1="/ru/\2"', content)
            content = re.sub(r'(href|src)=["\'](?:\.\./)+fr/([^"\']+)["\']', r'\1="/fr/\2"', content)
            
            if content != original_content:
                html_file.write_text(content, encoding="utf-8")
                fixed_count += 1
                
        except Exception as e:
            print(f"Error processing {html_file}: {e}")

    return fixed_count

if __name__ == "__main__":
    count = fix_html_issues(".")
    print(f"SUCCESS: Operation completed. Repaired issues in {count} HTML files.")
