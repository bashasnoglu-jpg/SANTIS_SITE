import os

BASE_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE"

def check(condition, message):
    if condition:
        print(f"[PASS] {message}")
        return True
    else:
        print(f"[FAIL] {message}")
        return False

def check_file_not_exists(path):
    return not os.path.exists(path)

def check_file_exists(path):
    return os.path.isfile(path)

def check_dir_exists(path):
    return os.path.isdir(path)

def check_content(path, string):
    if not os.path.exists(path):
        return False
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    return string in content

def main():
    print("Starting Post-Remediation Verification...")
    
    # Phase 2: FR Massages
    # 1. Cleanup
    check(check_file_not_exists(os.path.join(BASE_DIR, "fr", "massages", "aromaterapi.html")), 
          "FR: aromaterapi.html (file) removed")
    
    # 2. Structure
    check(check_file_exists(os.path.join(BASE_DIR, "fr", "massages", "massage-aromatherapie", "index.html")), 
          "FR: massage-aromatherapie/index.html exists")
    
    # 3. Links
    # We normalized to relative or absolute in fix script. Let's check for the TARGET slug.
    # The script used `massage-aromatherapie/`
    check(check_content(os.path.join(BASE_DIR, "fr", "massages", "index.html"), "massage-aromatherapie/"), 
          "FR Index: Links updated to massage-aromatherapie/")

    # Phase 3: Gift Card
    # 4. TR Logic
    check(check_file_not_exists(os.path.join(BASE_DIR, "tr", "hediye-karti.html")), 
          "TR: hediye-karti.html (file) removed")
    check(check_file_exists(os.path.join(BASE_DIR, "tr", "hediye-karti", "index.html")), 
          "TR: hediye-karti/index.html exists")
          
    # 5. DE Logic (International standardization)
    check(check_file_not_exists(os.path.join(BASE_DIR, "de", "hediye-karti.html")), 
          "DE: hediye-karti.html (dir/file) removed")
    check(check_file_exists(os.path.join(BASE_DIR, "de", "gift-card", "index.html")), 
          "DE: gift-card/index.html exists")
          
    # 6. EN Logic
    check(check_file_not_exists(os.path.join(BASE_DIR, "en", "gift-card.html")), 
          "EN: gift-card.html (file) removed")
    check(check_file_exists(os.path.join(BASE_DIR, "en", "gift-card", "index.html")), 
          "EN: gift-card/index.html exists")

    # Phase 4: Clean Up
    # 7. Service Worker
    check(check_file_not_exists(os.path.join(BASE_DIR, "tr", "cilt-bakimi", "sw.js")), 
          "Cleanup: tr/cilt-bakimi/sw.js removed")

    # 8. Navbar Links
    # Check if navbar.html points to folder
    check(check_content(os.path.join(BASE_DIR, "components", "navbar.html"), 'href="/tr/hediye-karti/"') or 
          check_content(os.path.join(BASE_DIR, "components", "navbar.html"), 'href="hediye-karti/"'), 
          "Navbar (TR): Link updated to folder")

    # Check navbar-en.html
    check(check_content(os.path.join(BASE_DIR, "components", "navbar-en.html"), 'href="/en/gift-card/"') or
          check_content(os.path.join(BASE_DIR, "components", "navbar-en.html"), 'href="gift-card/"'), 
          "Navbar (EN): Link updated to folder")

    print("Verification Completed.")

if __name__ == "__main__":
    main()
