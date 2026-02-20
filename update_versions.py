import os
import re

TARGET_DIRS = ["tr", "en", "de", "fr", "ru", "_build/templates"]
EXTENSIONS = [".html"]
OLD_VERSIONS = ["v=8.0", "v=6.0"]
NEW_VERSION = "v=8.1"

def update_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content
        for old_ver in OLD_VERSIONS:
            new_content = new_content.replace(old_ver, NEW_VERSION)
            
        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ Updated: {filepath}")
        else:
            # print(f"➖ Skipped (No changes): {filepath}")
            pass

    except Exception as e:
        print(f"❌ Failed to update {filepath}: {e}")

def main():
    base_dir = os.getcwd()
    print(f"🚀 Starting version bump to {NEW_VERSION}...")
    
    count = 0
    for folder in TARGET_DIRS:
        dir_path = os.path.join(base_dir, folder)
        if not os.path.exists(dir_path):
            print(f"⚠️ Directory not found: {dir_path}")
            continue
            
        for root, _, files in os.walk(dir_path):
            for file in files:
                if any(file.endswith(ext) for ext in EXTENSIONS):
                    filepath = os.path.join(root, file)
                    update_file(filepath)
                    count += 1
                    
    print(f"✨ Processed {count} files.")

if __name__ == "__main__":
    main()
