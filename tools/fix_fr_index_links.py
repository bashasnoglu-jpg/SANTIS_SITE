import re
import os

# Script to fix broken links in fr/massages/index.html
# Consolidates TR slugs -> FR folders
# Standardizes .html -> folder/

INDEX_PATH = r"c:\Users\tourg\Desktop\SANTIS_SITE\fr\massages\index.html"

# Mapping: Old Slug (TR/EN) -> New Target Folder (FR)
# If not in map, it defaults to Old Slug Folder (e.g. sicak-tas -> sicak-tas/)
SLUG_MAP = {
    "aromaterapi": "massage-aromatherapie",
    "thai": "massage-royal-thai",
    "bali": "massage-balinais",
    "isvec-full-body": "massage-suedois-classique",
    "anti-stress": "massage-anti-stress",
    "signature-rituel": "signature-rituel", # Explicit keep
    "klasik-rahatlama": "klasik-rahatlama", # No better match found
    "derin-doku": "derin-doku",
    "shiatsu": "shiatsu",
    "cift-senkron": "cift-senkron",
    "spor-terapi": "spor-terapi",
    "cift-rituel": "cift-rituel",
    "bas-boyun-omuz": "bas-boyun-omuz",
    "refleksoloji": "refleksoloji",
    "lenf-drenaj": "lenf-drenaj",
    "tetik-nokta": "tetik-nokta",
    "klasik-sirt": "klasik-sirt",
    "myofascial-release": "myofascial-release",
    "anne-cocuk": "anne-cocuk",
    "anti-selulit": "anti-selulit",
    "sirt-terapi": "sirt-terapi",
    "kids-nazik": "kids-nazik",
    "kranyo-sakral": "kranyo-sakral",
    "sicak-tas": "sicak-tas"
}

def fix_links():
    print(f"Reading {INDEX_PATH}...")
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    
    # 1. Regex for .html links (href and schema url)
    # Matches: /fr/massages/SLUG.html
    # Matches: https://santis-club.com/fr/massages/SLUG.html
    
    def replacer(match):
        full_match = match.group(0) # e.g. /fr/massages/aromaterapi.html
        slug = match.group(2) # aromaterapi
        
        if slug in SLUG_MAP:
            target_folder = SLUG_MAP[slug]
        else:
            target_folder = slug # Default to folderized same slug
            
        # Determine prefix (http... or /fr/...)
        prefix = match.group(1)
        
        # New format: prefix + target_folder + /
        return f"{prefix}{target_folder}/"

    # Regex breakdown:
    # Group 1: Prefix (https://.../fr/massages/ OR /fr/massages/)
    # Group 2: Slug (captured)
    # suffix: .html
    pattern = re.compile(r'(https://santis-club\.com/fr/massages/|/fr/massages/)([^/\"\']+)\.html')
    
    new_content = pattern.sub(replacer, content)
    
    if new_content != content:
        print("Changes detected. Saving...")
        with open(INDEX_PATH, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Index updated successfully.")
    else:
        print("No changes needed or regex failed.")

if __name__ == "__main__":
    fix_links()
