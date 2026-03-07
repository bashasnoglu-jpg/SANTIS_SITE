import os
import re
import json

ROOT_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE"
SCAN_DIRS = ["admin", "hq-dashboard", ""] # We will scan admin, hq-dashboard, and root HTMLs.

def scan_html_files():
    html_files = []
    for d in SCAN_DIRS:
        target_dir = os.path.join(ROOT_DIR, d)
        if not os.path.exists(target_dir): continue
        if d == "":
            for f in os.listdir(ROOT_DIR):
                if f.endswith(".html"): html_files.append(os.path.join(ROOT_DIR, f))
        else:
            for root, _, files in os.walk(target_dir):
                for f in files:
                    if f.endswith(".html"):
                        html_files.append(os.path.join(root, f))
    return html_files

def audit_buttons_and_links(html_files):
    report = {"broken_links": [], "dead_buttons": [], "total_scanned": len(html_files)}
    
    # Regex for basic extraction
    a_tag_regex = re.compile(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', re.IGNORECASE | re.DOTALL)
    button_regex = re.compile(r'<button\s+([^>]*)>(.*?)</button>', re.IGNORECASE | re.DOTALL)
    
    for file_path in html_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            file_rel = os.path.relpath(file_path, ROOT_DIR)
            
            # Check links
            links = a_tag_regex.findall(content)
            for href, text in links:
                href = href.strip()
                text = re.sub(r'<[^>]+>', '', text).strip() # strip inner HTML
                if not text: text = "[Icon/Image Link]"
                
                if href in ["#", "", "javascript:void(0)"] or href.startswith("javascript:"):
                    # Might be handled by JS event listeners, tag as warning
                    pass
                elif not href.startswith("http") and not href.startswith("mailto:") and not href.startswith("tel:"):
                    # It's a relative path, check if exists
                    # Handle root absolute vs relative
                    target_path = ""
                    if href.startswith("/"):
                        # E.g. /admin/index.html
                        target_path = os.path.join(ROOT_DIR, href.lstrip("/"))
                    else:
                        base_dir = os.path.dirname(file_path)
                        target_path = os.path.join(base_dir, href.split("#")[0].split("?")[0])
                    
                    if not os.path.exists(target_path) and not target_path.endswith((".php", ".jsp", ".asp")):
                        if not target_path.endswith(".html"):
                            # Might be a directory route, e.g. /hq-dashboard expecting index.html
                            if not os.path.exists(os.path.join(target_path, "index.html")) and not target_path.endswith("hq-dashboard") and not target_path.endswith("tenant-dashboard") and not target_path.endswith("guest-zen"):
                                report["broken_links"].append({"file": file_rel, "text": text, "href": href})
                        else:
                            report["broken_links"].append({"file": file_rel, "text": text, "href": href})

            # Check buttons
            buttons = button_regex.findall(content)
            for attrs, text in buttons:
                text = re.sub(r'<[^>]+>', '', text).strip()
                if not text: text = "[Icon Button]"
                
                # If a button has no onclick, no type="submit", and no id/class that looks like it's bound by JS... it's suspicious.
                # But it's hard to definitively say without executing JS. We will look for explicitly empty or undefined functions, or "#" onclicks.
                if 'onclick=""' in attrs or 'href="#"' in attrs:
                     report["dead_buttons"].append({"file": file_rel, "text": text, "issue": "Empty Action Trigger"})
                elif 'type="submit"' not in attrs and 'onclick' not in attrs and 'id=' not in attrs:
                     # Button with no ID, no onclick, no submit type. Very likely a dead UI button (dummy)
                     if "filter-btn" not in attrs: # ignore known classes that use querySelectorAll
                         report["dead_buttons"].append({"file": file_rel, "text": text, "issue": "Dummy/Dead Button (No ID/Onclick)"})
                         
        except Exception as e:
            # print(f"Error reading {file_path}: {e}")
            pass

    return report

html_files = scan_html_files()
report = audit_buttons_and_links(html_files)

# Print as JSON for parser
print(json.dumps(report, indent=2))
