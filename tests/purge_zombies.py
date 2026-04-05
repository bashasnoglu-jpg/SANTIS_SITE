import os
import shutil
import re
from pathlib import Path

# Paths
ROOT_DIR = Path(r"C:\Users\tourg\Desktop\SANTIS_SITE")
ADMIN_DIR = ROOT_DIR / "admin"
ARCHIVE_DIR = ROOT_DIR / "_legacy_archive" / "admin_zombies"

# Create archive directory
os.makedirs(ARCHIVE_DIR, exist_ok=True)

zombies = [
    "admin.bundle.js", "world_table.js", "inline-panels.js", "activity-dashboard.js", 
    "city-intelligence.js", "city-os.js", "dashboard-analytics.js", "health-overlay.js", 
    "santis-live-bridge.js", "santis-neural-beacon.js", "app.js", "audit-engine.js", 
    "audit-history-api.js", "command-center.js", "event-bindings.js", "health-badge.js", 
    "health-score.js", "i18n-dashboard.js", "media-library.js", "page-builder.js", 
    "preview-logic.js", "services-data.js", "war-room-radar.js", "admin-registry.js", 
    "api-client.js", "api-wrapper.js", "error-boundary.js", "event-bus.js", 
    "tab-engine.js", "ui-engine.js", "audit.module.js", "blog.module.js", 
    "commerce.module.js", "products.module.js", "sentinel.module.js", "services.module.js", 
    "system.module.js", "darwinian-traffic-router.js", "oracle-worker.js", "omni-engine.js", 
    "omni-renderer.js", "omni-scene.js", "omni-ui.js"
]

zombie_set = set(zombies)
purged_count = 0

print(f"[*] Initiating Zombie Scan across: {ADMIN_DIR}")

# 1. PURGE JS FILES
for root, _, files in os.walk(ADMIN_DIR):
    for f in files:
        if f in zombie_set:
            source_path = Path(root) / f
            dest_path = ARCHIVE_DIR / f
            try:
                shutil.move(str(source_path), str(dest_path))
                print(f"[PURGED] Moved {f} to quarantine.")
                purged_count += 1
            except Exception as e:
                print(f"[ERROR] Failed to move {f}: {e}")

print(f"\n[*] Muting HTML Script Tags for {len(zombie_set)} zombies...")

# 2. MUTE HTML TAGS
html_muted_count = 0
for root, _, files in os.walk(ADMIN_DIR):
    for f in files:
        if f.endswith(".html"):
            html_path = Path(root) / f
            try:
                with open(html_path, 'r', encoding='utf-8') as html_file:
                    content = html_file.read()
                
                original_content = content
                for zombie in zombie_set:
                    # Match <script src=".../zombie.js"></script> and variations
                    # Using regex to find script tag and comment it out
                    pattern = r'(<script[^>]*src=["\'][^"\']*' + re.escape(zombie) + r'["\'][^>]*>[\s\S]*?<\/script>)'
                    # Replace by wrapping in HTML comment AND a [ZOMBIE_MUTED] warning
                    content = re.sub(pattern, r'<!-- [ZOMBIE_MUTED] \1 -->', content)
                
                if content != original_content:
                    with open(html_path, 'w', encoding='utf-8') as html_file:
                        html_file.write(content)
                    print(f"[MUTED] Stripped zombie tags from {f}")
                    html_muted_count += 1
                    
            except Exception as e:
                print(f"[ERROR] Failed to process HTML {f}: {e}")

print(f"\n[*] OPERATION COMPLETE")
print(f"    - JS Files Purged:   {purged_count}/{len(zombies)}")
print(f"    - HTML Files Muted:  {html_muted_count}")
