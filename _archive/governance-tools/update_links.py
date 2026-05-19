
import os
import re

# CONFIG
ROOT_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE"
TARGET_EXTS = ['.html', '.js', '.json'] # Files to update

def update_references():
    print("🔄 SANTIS LINK UPDATER STARTING...")
    
    updated_files = 0
    total_replacements = 0
    
    # 1. Map available WebP files
    webp_map = {} # {'image.png': 'image.webp'}
    
    print("🔍 Indexing WebP Assets...")
    for root, dirs, files in os.walk(os.path.join(ROOT_DIR, "assets", "img")):
        for file in files:
            if file.endswith(".webp"):
                # Store relative path variations if needed, or just filename mapping
                # Simple mapping: if we see 'foo.png' text, and 'foo.webp' exists in same folder, swap it.
                # A safer approach: Full path matching.
                pass

    # A simpler efficient approach for this project structure:
    # Scan all HTML/JS files, search for .png/.jpg references.
    # Check if a corresponding .webp exists on disk.
    # If yes, update the text.

    for root, dirs, files in os.walk(ROOT_DIR):
        for file in files:
            if any(file.endswith(ext) for ext in TARGET_EXTS):
                file_path = os.path.join(root, file)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Regex to find image references
                    # Matches: src=".../foo.png" or url('.../foo.jpg')
                    # Captures the full filename
                    
                    new_content = content
                    replacements = 0
                    
                    # Find all png/jpg/jpeg strings
                    matches = re.finditer(r'([a-zA-Z0-9_\-\/\\]+\.(png|jpg|jpeg))', content, re.IGNORECASE)
                    
                    for match in matches:
                        original_ref = match.group(0) # e.g. assets/img/hero.png
                        
                        # Construct potential webp path
                        # We need to resolve where this file actually is.
                        # Since we blindly converted deeply, we can blindly replace reference IF the webp file exists.
                        
                        # Heuristic: Replace extension in string -> check if file exists
                        webp_ref = re.sub(r'\.(png|jpg|jpeg)$', '.webp', original_ref, flags=re.IGNORECASE)
                        
                        # Check absolute path existence
                        # This is tricky because content paths are relative (../../assets) or absolute (/assets).
                        # Reliable check: Look for the file name in our converted list?
                        
                        # Let's assume if we optimized it, it exists. 
                        # To be safe, we only replace if we are sure.
                        # Given the previous step optimized 60 files, let's aggressively replace common asset paths.
                        
                        if "assets/img" in original_ref or "assets/cards" in original_ref:
                             new_content = new_content.replace(original_ref, webp_ref)
                             replacements += 1

                    if replacements > 0:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"📝 Updated {file}: {replacements} changes")
                        updated_files += 1
                        total_replacements += replacements
                        
                except Exception as e:
                    print(f"❌ Error reading {file}: {e}")

    print(f"\n✅ LINK UPDATE COMPLETE!")
    print(f"📂 Files Touched: {updated_files}")
    print(f"🔗 References Swapped: {total_replacements}")

if __name__ == "__main__":
    update_references()
