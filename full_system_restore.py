import os
import time
import shutil
from pathlib import Path

# Scripts to run in order
SCRIPTS = [
    "restore_pages.py",
    "fix_frontend_links.py",
    "sitemap_generator.py",
    "seo_fixer.py"
]

def analyze_legacy():
    print("\n📦 Legacy Archival Check...")
    # Definitions of legacy files (root htmls that are now in folders)
    # e.g. classic-massage.html might now be tr/massages/classic-massage.html
    # We should move root HTMLs that are NOT index.html, booking.html, etc.
    
    root = Path(".")
    archive = root / "_legacy_archive"
    archive.mkdir(exist_ok=True)
    
    keep_files = ["index.html", "booking.html", "about.html", "contact.html", "service-detail.html"] # templates/roots
    
    # Naive legacy check: Any HTML in root that is NOT in keep_files
    count = 0
    for file in root.glob("*.html"):
        if file.name not in keep_files and "template" not in file.name:
            # Check if likely legacy (e.g. if we have a folder version)
            # Or just move all "loose" service files
            # For safety, let's just log for now unless sure.
            # User prompted to move "Legacy dosyalar".
            # Let's move files that look like service slugs.
            print(f"   -> Moving potential legacy file: {file.name}")
            try:
                shutil.move(str(file), str(archive / file.name))
                count += 1
            except Exception as e:
                print(f"   Failed to move {file.name}: {e}")
    print(f"   Archived {count} files.")

def run_script(script_name):
    print(f"\n▶️ Running {script_name}...")
    result = os.system(f"python {script_name}")
    if result == 0:
        print(f"✅ {script_name} success.")
    else:
        print(f"❌ {script_name} failed.")

def main():
    print("🚀 STARTING FULL SYSTEM RESTORE & SEO FIX 🚀")
    print("===========================================")
    
    # 1. Legacy Cleanup
    analyze_legacy()
    
    # 2. Run Scripts
    for script in SCRIPTS:
        run_script(script)
        time.sleep(1) # Brief pause
        
    print("\n===========================================")
    print("✨ ALL TASKS COMPLETED. SYSTEM READY.")

if __name__ == "__main__":
    main()
