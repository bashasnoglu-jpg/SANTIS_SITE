import os
import re
from pathlib import Path
import urllib.request

def check_broken_links(root_dir):
    html_files = list(Path(root_dir).rglob("*.html"))
    
    href_re = re.compile(r'href=["\'](.*?)["\']')
    src_re = re.compile(r'src=["\'](.*?)["\']')
    
    broken_links = []
    
    for html_file in html_files:
        try:
            content = html_file.read_text(encoding="utf-8")
            all_links = href_re.findall(content) + src_re.findall(content)
            
            for link in all_links:
                # ignore placeholders or common protocols
                if link.startswith("http://") or link.startswith("https://") or link.startswith("#") or link.startswith("mailto:") or link.startswith("tel:") or not link:
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
                    # Check if it has query parameters
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

    return broken_links

if __name__ == "__main__":
    root = "."
    broken = check_broken_links(root)
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
