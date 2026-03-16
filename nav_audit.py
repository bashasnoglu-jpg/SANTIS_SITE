import os
import re
import json
from collections import defaultdict

ROOT_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE"
EXCLUDE_DIRS = {'.git', 'node_modules', '_dev_archives', '_deploy_stage', 'gravity-ux-engine', '.gemini', 'temp', 'tmp', '_backup', '_archive'}
REPORT_PATH = os.path.join(ROOT_DIR, "admin", "reports", "SANTIS_NAVIGATION_AUDIT.md")

all_pages = set()
page_details = {}

nav_files = []
nav_links = []
link_sources = defaultdict(list)

# 1. Extract all HTML pages
for root, dirs, files in os.walk(ROOT_DIR):
    # Modify dirs in-place to skip excluded directories
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
    for file in files:
        if file.endswith('.html') or file.endswith('.htm'):
            full_path = os.path.join(root, file)
            rel_path = '/' + os.path.relpath(full_path, ROOT_DIR).replace('\\', '/')
            
            # Ignore some technical/admin templates if they are just components
            if rel_path.startswith('/components/'):
                nav_files.append(full_path)
                continue
                
            all_pages.add(rel_path)
            
            # Extract title
            title = "Unknown Title"
            try:
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
                    if title_match:
                        title = title_match.group(1).strip()
            except:
                pass
                
            page_details[rel_path] = {
                'path': rel_path,
                'title': title,
                'dir': os.path.dirname(rel_path)
            }

# 2. Extract Navigation Structure
# We include known navigation files and also scan root index for mega menus
main_indices = [
    os.path.join(ROOT_DIR, 'tr', 'index.html'),
    os.path.join(ROOT_DIR, 'en', 'index.html')
]
for mi in main_indices:
    if os.path.exists(mi):
        nav_files.append(mi)

for nav_file in nav_files:
    if not os.path.exists(nav_file): continue
    try:
        with open(nav_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
            # Look for nav blocks or a tags
            a_tags = re.finditer(r'<a[^>]+href=["\'](.*?)["\']', content, re.IGNORECASE)
            for match in a_tags:
                href = match.group(1).strip()
                href_clean = href.split('#')[0].split('?')[0]
                
                if not href_clean or href_clean.startswith('http') or href_clean.startswith('mailto:') or href_clean.startswith('tel:'):
                    continue
                
                # Normalize href
                if not href_clean.startswith('/'):
                    # If it's something like "hamam.html" in a component, it's tricky. Let's assume mostly absolute paths from root like /tr/hamam/index.html
                    # If it doesn't start with slash, we prepend it assuming it's relative to root for simplicity in components.
                    href_clean = '/' + href_clean
                
                # If it points to a directory, append index.html
                if href_clean.endswith('/'):
                    href_clean += 'index.html'
                elif not href_clean.endswith('.html') and not href_clean.endswith('.htm'):
                    # Likely a directory route without trailing slash
                    href_clean += '/index.html'
                    
                nav_links.append(href_clean)
                source_rel = '/' + os.path.relpath(nav_file, ROOT_DIR).replace('\\', '/')
                link_sources[href_clean].append(source_rel)
    except Exception as e:
        print(f"Error reading {nav_file}: {e}")

unique_nav_links = set(nav_links)

# 3. Compare Datasets
orphan_pages = all_pages - unique_nav_links

# Missing links: Pages that are orphan but look important (exclude admin/ API/ tests)
important_orphans = set()
for p in orphan_pages:
    if not p.startswith('/admin/') and not p.startswith('/test') and not 'demo' in p:
        important_orphans.add(p)

broken_links = unique_nav_links - all_pages

# Duplicate links
duplicates = {link: count for link, count in 
              {l: nav_links.count(l) for l in unique_nav_links}.items() 
              if count > 1}

# 4. Generate Report
with open(REPORT_PATH, 'w', encoding='utf-8') as f:
    f.write("# SANTIS MASTER OS NAVIGATION STRUCTURE AUDIT\n\n")
    f.write("## NAVIGATION HEALTH SCORE\n")
    
    score = 100
    score -= len(broken_links) * 5
    score -= len(important_orphans) * 2
    score -= len(duplicates) * 0.5
    score = max(0, score)
    
    f.write(f"**Health Score:** {score:.1f}/100\n")
    f.write(f"- **TOTAL PAGES:** {len(all_pages)}\n")
    f.write(f"- **TOTAL NAVBAR LINKS:** {len(nav_links)} ({len(unique_nav_links)} unique)\n")
    f.write(f"- **ORPHAN PAGE COUNT:** {len(orphan_pages)}\n")
    f.write(f"- **BROKEN LINK COUNT:** {len(broken_links)}\n\n")
    f.write("---\n\n")
    
    f.write("## CATEGORY 1 — ORPHAN PAGES (Not linked in nav)\n")
    if orphan_pages:
        for p in sorted(orphan_pages):
            details = page_details.get(p, {})
            f.write(f"- **Path:** `{p}`\n  - **Title:** {details.get('title')}\n  - **Dir:** {details.get('dir')}\n")
    else:
        f.write("*None found.*\n")
    f.write("\n")
    
    f.write("## CATEGORY 2 — NAVBAR MISSING LINKS (Important Orphans)\n")
    if important_orphans:
        for p in sorted(important_orphans):
            details = page_details.get(p, {})
            priority = "High" if "index.html" in p else "Medium"
            f.write(f"- **Path:** `{p}`\n  - **Title:** {details.get('title')}\n  - **Suggested Category:** {details.get('dir').split('/')[-1].capitalize() or 'General'}\n  - **Priority:** {priority}\n")
    else:
        f.write("*None found.*\n")
    f.write("\n")
    
    f.write("## CATEGORY 3 — BROKEN LINKS\n")
    if broken_links:
        for l in sorted(broken_links):
            sources = ", ".join(set(link_sources.get(l, [])))
            f.write(f"- **Linked Path:** `{l}`\n  - **Found in:** {sources}\n  - **Priority:** High\n")
    else:
        f.write("*None found.*\n")
    f.write("\n")
    
    f.write("## CATEGORY 4 — DUPLICATE NAVIGATION\n")
    if duplicates:
        for l, count in sorted(duplicates.items(), key=lambda x: x[1], reverse=True):
            f.write(f"- **Link:** `{l}` - Found **{count}** times.\n")
    else:
        f.write("*None found.*\n")
    f.write("\n")
    
    f.write("## 🛠️ SUGGESTED AUTOMATIC FIXES\n")
    f.write("1. **Remove Dead Links:** Clean up the broken links identified in Category 3 from `components/navbar.html` and other headers.\n")
    f.write("2. **Integrate Missing Links:** Review Category 2 orphans (especially feature pages) and add them to the Mega Menu.\n")
    f.write("3. **Merge Duplicate Routes:** Consolidate repeated links to avoid cognitive overload in the navigation.\n")

print(f"Report generated successfully at {REPORT_PATH}")
