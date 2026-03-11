import os
import re
from pathlib import Path

def check_broken_links(root_dir):
    ignore_dirs = {".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build", "core", "api", "backend", "app", ".vscode"}
    html_files = []
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # remove ignored dirs
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
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
                    target_path = Path(root_dir) / link.lstrip("/")
                else:
                    # relative to current file
                    target_path = (html_file.parent / link).resolve()
                
                # check if file exists
                if not target_path.exists():
                    # Handle ? parameters
                    if "?" in link:
                        clean_link = link.split("?")[0]
                        target_path = (html_file.parent / clean_link).resolve() if not clean_link.startswith("/") else Path(root_dir) / clean_link.lstrip("/")
                        if target_path.exists():
                            continue
                            
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
    print(f"Scanned {total_files} HTML files, found {total_links} total links.")
    print(f"Total broken links found: {len(broken)}")
    
    # group by file
    from collections import defaultdict
    by_file = defaultdict(list)
    for b in broken:
        by_file[b["file"]].append(b["link"])
        
    for f, links in by_file.items():
        print(f"\n[{f}]")
        for l in set(links):
            print(f"  - {l}")
