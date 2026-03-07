import os
import re

ROOT_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE\tr"

def fix_zombie_links(dir_path):
    files_modified = 0
    links_fixed = 0
    
    # Matches href="/en/...", href="../en/...", href="en/..."
    # Groups: 
    # 1: Prefix (e.g. "../" or "/" or "")
    # 2: Lang code ("en" or "ru")
    # 3: The rest of the path (e.g. "/services/facial.html")
    # 4: The href quote char
    pattern = re.compile(r'(href=["\'])((?:\.\./)*)(/?)(en|ru)(/?[^"\']*)')
    
    for root, _, files in os.walk(dir_path):
        for f in files:
            if f.endswith('.html'):
                filepath = os.path.join(root, f)
                with open(filepath, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                # We need to be careful with things like /tr/... 
                # Our pattern explicitly looks for en|ru.
                
                def link_replacer(match):
                    quote_and_attr = match.group(1) # href="
                    dots = match.group(2) # ../
                    slash = match.group(3) # /
                    lang = match.group(4) # en
                    rest_of_path = match.group(5) # /services.html
                    
                    # Target structure: ../tr/services.html?lang=en
                    # If dots exist, keep dots: ../tr/ 
                    # If absolute path: /tr/
                    # If just en/: tr/
                    
                    # Avoid appending ?lang if there's already a query param or fragment, but for simplicity:
                    new_path = f"{dots}{slash}tr{rest_of_path}"
                    
                    # Handle existing query strings or hashes
                    if '?' in new_path:
                        new_path += f"&lang={lang}"
                    elif '#' in new_path:
                        new_path = new_path.replace('#', f"?lang={lang}#")
                    elif new_path.endswith('/'):
                        # If it's just /tr/, query param can still be appended
                        new_path += f"index.html?lang={lang}"
                    else:
                        new_path += f"?lang={lang}"
                        
                    nonlocal links_fixed
                    links_fixed += 1
                    return f"{quote_and_attr}{new_path}"
                
                new_content, count = pattern.subn(link_replacer, content)
                
                if count > 0:
                    with open(filepath, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    files_modified += 1
                    
    print(f"✅ The Clean Sweep: Purge Complete.")
    print(f"Total HTML files optimized: {files_modified}")
    print(f"Total Zombie Links Re-animated (Sealed): {links_fixed}")

if __name__ == '__main__':
    fix_zombie_links(ROOT_DIR)
