import os
import re
import shutil

ADMIN_DIR = r"C:\Users\tourg\Desktop\SANTIS_SITE\admin"
QUARANTINE_DIR = r"C:\Users\tourg\Desktop\SANTIS_SITE\admin\_quarantine\zombie_scripts_v1"

# The Elite Squad
ELITE_FILES = {
    "santis-matrix-engine.js",
    "darwinian-engine.js",
    "phantom-interceptor.js",
    "integrated_hub.js",
    "admin-nav.js",
    "admin_mock.js",
    "god-mode-init.js",
    "vis-network.min.js",
    "santis-masaf-patch.js",
    "santis-neural-map.js",
    "omniverse-bridge.js",
    "sovereign-council.js"
}

def is_protected_dir(path):
    return "_archive" in path or "_deploy_stage" in path or "_quarantine" in path or "reports" in path

def quarantine_zombies():
    if not os.path.exists(QUARANTINE_DIR):
        os.makedirs(QUARANTINE_DIR)

    quarantined_basenames = set()
    quarantined_count = 0

    # 1. Identify and Move Zombie JS Files
    for root, _, files in os.walk(ADMIN_DIR):
        if is_protected_dir(root):
            continue

        for f in files:
            if f.endswith(".js"):
                if f not in ELITE_FILES:
                    source_path = os.path.join(root, f)
                    
                    # Create subdirectories in quarantine to avoid name collisions
                    rel_path = os.path.relpath(root, ADMIN_DIR)
                    dest_dir = os.path.join(QUARANTINE_DIR, rel_path)
                    if not os.path.exists(dest_dir):
                        os.makedirs(dest_dir)
                        
                    dest_path = os.path.join(dest_dir, f)
                    
                    # Move file
                    shutil.move(source_path, dest_path)
                    quarantined_basenames.add(f)
                    quarantined_count += 1
                    print(f"Quarantined: {f}")

    print(f"\nTotal scripts quarantined: {quarantined_count}")

    # 2. Clean HTML Files
    # Regex to catch <script ... src="..."></script>
    script_pattern = re.compile(r'<script\s+[^>]*src=["\']([^"\']+)["\'][^>]*>\s*</script>', re.IGNORECASE)
    cleaned_html_count = 0

    for root, _, files in os.walk(ADMIN_DIR):
        if is_protected_dir(root):
            continue

        for f in files:
            if f.endswith(".html"):
                html_path = os.path.join(root, f)
                with open(html_path, 'r', encoding='utf-8') as h_file:
                    content = h_file.read()

                modified = False
                
                # Find all scripts
                def replacer(match):
                    src_url = match.group(1)
                    basename = os.path.basename(src_url)
                    
                    # If it's a quarantined script, remove it by returning an empty string
                    if basename in quarantined_basenames:
                        return f"<!-- 🛡️ ZOMBIE QUARANTINED: {basename} -->"
                    return match.group(0)

                new_content, num_subs = script_pattern.subn(replacer, content)
                
                if num_subs > 0 and new_content != content:
                    with open(html_path, 'w', encoding='utf-8') as h_file:
                        h_file.write(new_content)
                    print(f"Cleaned HTML: {f}")
                    cleaned_html_count += 1

    print(f"\nTotal HTML files cleaned: {cleaned_html_count}")

if __name__ == "__main__":
    quarantine_zombies()
