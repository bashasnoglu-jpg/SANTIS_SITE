import os
import shutil
import re

# Goal: Standardize Gift Card URLs
# TR: hediye-karti/index.html
# EN/DE/FR/RU: gift-card/index.html

BASE_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE"
COMPONENTS_DIRS = [
    os.path.join(BASE_DIR, "components"),
    os.path.join(BASE_DIR, "assets", "html", "components")
]

LANGS = ['tr', 'en', 'de', 'fr', 'ru']

def move_to_folder(file_path, target_folder_path):
    if not os.path.exists(file_path):
        return # Source doesn't exist
        
    if not os.path.exists(target_folder_path):
        os.makedirs(target_folder_path)
    
    target_index = os.path.join(target_folder_path, "index.html")
    
    if os.path.isdir(file_path):
        # Case: Source is already a directory (the DE/FR/RU case)
        # We need to rename/move it to new slug
        # Check if index.html is inside
        src_index = os.path.join(file_path, "index.html")
        if os.path.exists(src_index):
             # Move index.html to target
             if not os.path.exists(target_index):
                 shutil.move(src_index, target_index)
                 print(f"Moved content from dir {file_path} to {target_index}")
             # Remove old empty dir
             try:
                 os.rmdir(file_path)
             except:
                 pass
    else:
        # Case: Source is a file (TR/EN case)
        if not os.path.exists(target_index):
            shutil.move(file_path, target_index)
            print(f"Moved file {file_path} to {target_index}")
            
            # Content Fix (Relative Paths)
            with open(target_index, 'r', encoding='utf-8') as f:
                content = f.read()
            new_content = content.replace('href="../', 'href="../../')
            new_content = new_content.replace('src="../', 'src="../../')
            new_content = new_content.replace('"assets/', '"../../assets/')
            with open(target_index, 'w', encoding='utf-8') as f:
                f.write(new_content)

def update_component_links():
    for comp_dir in COMPONENTS_DIRS:
        if not os.path.exists(comp_dir): continue
        
        for filename in os.listdir(comp_dir):
            if not filename.endswith('.html'): continue
            
            path = os.path.join(comp_dir, filename)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            # Replace TR link
            new_content = new_content.replace('href="/tr/hediye-karti.html"', 'href="/tr/hediye-karti/"')
            new_content = new_content.replace('href="hediye-karti.html"', 'href="hediye-karti/"')
            
            # Replace EN/Intl link
            new_content = new_content.replace('href="/en/gift-card.html"', 'href="/en/gift-card/"')
            new_content = new_content.replace('href="gift-card.html"', 'href="gift-card/"')
            
            # Replace explicit old directory links if existing
            new_content = new_content.replace('href="/de/hediye-karti.html"', 'href="/de/gift-card/"')
            new_content = new_content.replace('href="/fr/hediye-karti.html"', 'href="/fr/gift-card/"')
            new_content = new_content.replace('href="/ru/hediye-karti.html"', 'href="/ru/gift-card/"')

            if new_content != content:
                print(f"Updated links in {filename}")
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)

def main():
    # TR
    move_to_folder(os.path.join(BASE_DIR, "tr", "hediye-karti.html"), os.path.join(BASE_DIR, "tr", "hediye-karti"))
    
    # EN
    move_to_folder(os.path.join(BASE_DIR, "en", "gift-card.html"), os.path.join(BASE_DIR, "en", "gift-card"))
    
    # DE (Dir -> Dir)
    move_to_folder(os.path.join(BASE_DIR, "de", "hediye-karti.html"), os.path.join(BASE_DIR, "de", "gift-card"))
    
    # FR (Dir -> Dir)
    move_to_folder(os.path.join(BASE_DIR, "fr", "hediye-karti.html"), os.path.join(BASE_DIR, "fr", "gift-card"))

    # RU (Dir -> Dir)
    move_to_folder(os.path.join(BASE_DIR, "ru", "hediye-karti.html"), os.path.join(BASE_DIR, "ru", "gift-card"))
    
    update_component_links()
    print("Standardization complete.")

if __name__ == "__main__":
    main()
