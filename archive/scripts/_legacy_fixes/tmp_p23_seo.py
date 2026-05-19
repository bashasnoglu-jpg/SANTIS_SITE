import os
from bs4 import BeautifulSoup

TARGET_DIR = r"c:/Users/tourg/Desktop/SANTIS_SITE"

# Directories that must be isolated (noindex)
ISOLATED_DIRS = ['admin', 'admin-panel', 'packages', 'components', 'gravity-ux-engine', 'tenant-dashboard', 'hq-dashboard']

def process_file(filepath):
    try:
        # Determine if file is in an isolated directory
        rel_path = os.path.relpath(filepath, TARGET_DIR).replace('\\', '/')
        is_isolated = any(rel_path.startswith(d + '/') for d in ISOLATED_DIRS)

        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # We will use BeautifulSoup carefully to not destroy template structure if possible
        # However, for pure string manipulation on regex it's safer for exact attribute preservation.
        # But for H1, BeautifulSoup is great. Let's use regex for safety on templates.
        
        original_content = content
        
        # 1. Noindex Injection
        if is_isolated:
            if '<head>' in content and 'name="robots"' not in content:
                content = content.replace('<head>', '<head>\n    <meta name="robots" content="noindex, nofollow">')
            elif '<head ' in content and 'name="robots"' not in content:
                # regex replacement for <head ...>
                import re
                content = re.sub(r'(<head[^>]*>)', r'\1\n    <meta name="robots" content="noindex, nofollow">', content, count=1)

        # 2. H1 Downgrade (Only for public pages)
        if not is_isolated:
            # Find all <h1> elements using a simple regex since we want to avoid bs4 rewriting the whole HTML 
            # and messing up liquid tags or special template syntax.
            import re
            h1_pattern = re.compile(r'<h1([^>]*)>(.*?)</h1>', re.IGNORECASE | re.DOTALL)
            matches = list(h1_pattern.finditer(content))
            
            if len(matches) > 1:
                # Keep the first one, change the rest to h2
                offset = 0
                for match in matches[1:]:
                    start = match.start() + offset
                    end = match.end() + offset
                    original_tag = match.group(0)
                    new_tag = f'<h2{match.group(1)}>{match.group(2)}</h2>'
                    content = content[:start] + new_tag + content[end:]
                    offset += len(new_tag) - len(original_tag)

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"SEOPatched: {filepath}")

    except Exception as e:
        print(f"Error on {filepath}: {e}")

for root, dirs, files in os.walk(TARGET_DIR):
    if '_archive' in root or 'node_modules' in root or '.git' in root or 'dist' in root or '_dev_archives' in root or 'tr\\' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))
