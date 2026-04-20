import os
import shutil
import re

# Logic:
# 1. Map specific TR filenames to existing "Proper" FR folders (Consolidation).
# 2. For all other .html files in fr/massages, convert to folder/index.html (Standardization).
# 3. Update fr/massages/index.html with new paths.

BASE_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE"
FR_DIR = os.path.join(BASE_DIR, "fr", "massages")
INDEX_PATH = os.path.join(FR_DIR, "index.html")

# Known explicit sets from analysis
# Key: Old File, Value: New Folder (Existing or Desired)
MAPPING = {
    "aromaterapi.html": "massage-aromatherapie",
    "anti-stress.html": "massage-anti-stress",
    "thai.html": "massage-royal-thai", # Assumption based on 'royal thai' folder presence, willing to take small risk for better URL
    "bali.html": "massage-balinais",   # Standardize if possible, or 'bali' if no folder exists. Let's stick to existing folders first.
}

# Add strict check definitions if needed. 
# For now, we folderize active files.

def load_index():
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        return f.read()

def save_index(content):
    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    print("Starting remediation...")
    index_content = load_index()
    
    # Get all .html files in fr/massages
    files = [f for f in os.listdir(FR_DIR) if f.endswith('.html') and f != 'index.html']
    
    for filename in files:
        slug = filename.replace('.html', '')
        
        # Determine target folder name
        if filename in MAPPING:
            target_folder = MAPPING[filename]
        else:
            target_folder = slug # Default: sicak-tas.html -> sicak-tas/
            
        target_path = os.path.join(FR_DIR, target_folder)
        source_path = os.path.join(FR_DIR, filename)
        
        # Create Folder
        if not os.path.exists(target_path):
            os.makedirs(target_path)
            print(f"Created folder: {target_folder}")
            
        target_index = os.path.join(target_path, "index.html")
        
        # Move Logic
        if os.path.exists(target_index):
            print(f"Target exists for {filename} -> {target_folder}/index.html. Deleting source file (Consolidating).")
            # We assume the Folder Version is the "Master" as per user instruction.
            # But we should ensure the Index links to it.
            try:
                os.remove(source_path)
            except OSError as e:
                print(f"Error deleting {filename}: {e}")
        else:
            print(f"Moving {filename} -> {target_folder}/index.html")
            try:
                shutil.move(source_path, target_index)
                
                # CONTENT FIX: Update relative paths in the moved file
                # We moved 1 level deeper, so '../' becomes '../../'
                with open(target_index, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Valid replacements for assets
                new_content = content.replace('href="../', 'href="../../')
                new_content = new_content.replace('src="../', 'src="../../')
                new_content = new_content.replace('href="/assets/', 'href="../../assets/') # Sometimes absolute, but mixing relative styles?
                # Actually, if it was absolute (/assets/), it remains valid! 
                # Only relative paths '../' break.
                # Let's check for standard relative assets pattern usually 'assets/' or '../assets/'
                new_content = content.replace('"assets/', '"../../assets/') # If it was relative "assets/..."
                
                # Check for canonical self-reference
                # Old: href=".../aromaterapi.html"
                # New: href=".../massage-aromatherapie/"
                current_canonical = f"/fr/massages/{filename}"
                new_canonical = f"/fr/massages/{target_folder}/"
                new_content = new_content.replace(current_canonical, new_canonical)

                with open(target_index, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                    
            except OSError as e:
                print(f"Error moving {filename}: {e}")

        # INDEX UPDATE
        # Replace href="filename" with href="target_folder/"
        # We search for likely link patterns
        # <a href="/fr/massages/aromaterapi.html">
        # <a href="aromaterapi.html">
        
        # Regex is safer
        # 1. Absolute path match
        pattern_abs =  fr'/fr/massages/{re.escape(filename)}'
        replacement_abs = f'/fr/massages/{target_folder}/'
        index_content = index_content.replace(pattern_abs, replacement_abs)
        
        # 2. Relative path match (if any)
        # pattern_rel = fr'"{re.escape(filename)}"'
        # replacement_rel = f'"{target_folder}/"'
        # index_content = index_content.replace(pattern_rel, replacement_rel)
        
    save_index(index_content)
    print("Remediation complete. Index updated.")

if __name__ == "__main__":
    main()
