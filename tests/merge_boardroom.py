import os
import re
import shutil
from pathlib import Path

ROOT_DIR = Path(r"C:\Users\tourg\Desktop\SANTIS_SITE")
ADMIN_DIR = ROOT_DIR / "admin"
ARCHIVE_DIR = ROOT_DIR / "_legacy_archive" / "admin_zombies"

# Paths
cmd_center = ADMIN_DIR / "command-center.html"
boardroom = ADMIN_DIR / "boardroom.html"
idx = ADMIN_DIR / "index.html"
omni_idx = ADMIN_DIR / "omniverse" / "index.html"

def extract_panel(html, panel_id):
    # Extremely basic but functional regex for known div structures (assuming well-formed non-nested or simple nested)
    # Actually, regex for HTML matching matched tags is hard.
    # We will use simple string finding since we know the structure.
    start_str = f'id="{panel_id}"'
    if start_str not in html:
        return ""
    
    # find the div containing this id
    idx_id = html.find(start_str)
    # find the start of the div
    start_div = html.rfind('<div', 0, idx_id)
    
    # find the matching closing div
    open_count = 0
    i = start_div
    while i < len(html):
        if html[i:i+4] == '<div':
            open_count += 1
            i += 4
        elif html[i:i+6] == '</div>':
            open_count -= 1
            if open_count == 0:
                end_div = i + 6
                return html[start_div:end_div]
            i += 6
        else:
            i += 1
            
    return ""

def execute_merge():
    if not os.path.exists(cmd_center) or not os.path.exists(boardroom):
        print("Missing required files for merge.")
        return

    with open(cmd_center, 'r', encoding='utf-8') as f:
        cmd_html = f.read()

    # Extract Cyber Shield panel
    shield_panel = extract_panel(cmd_html, 'chaos-shield-panel')
    # Extract Global Expansion panel
    expansion_panel = extract_panel(cmd_html, 'expansion-tracker')
    
    if not shield_panel and not expansion_panel:
        print("No panels extracted.")
        return
        
    # Wrap them in a module header
    merged_html = f"""
        <!-- MERGED FROM COMMAND CENTER -->
        <h3 class="text-sm font-medium mt-6 mb-4 flex items-center text-red-500">
            <span class="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
            Tactical Operations
        </h3>
        {shield_panel}
        <div class="h-4"></div>
        {expansion_panel}
        <!-- END MERGE -->
    """

    with open(boardroom, 'r', encoding='utf-8') as f:
        br_html = f.read()

    # Inject into boardroom.html right after the "Sovereign Insights" section (or before "Trend Wave")
    target_spot = '<!-- FAZ-F: TREND WAVE PANEL -->'
    if target_spot in br_html:
        br_html = br_html.replace(target_spot, merged_html + '\n\n        ' + target_spot)
    else:
        # fallback, put it before </aside>
        br_html = br_html.replace('</aside>', merged_html + '\n    </aside>')

    with open(boardroom, 'w', encoding='utf-8') as f:
        f.write(br_html)
        
    print("[SUCCESS] Merged panels into boardroom.html")

    # Move legacy files to archive
    for path in [cmd_center, idx, omni_idx]:
        if os.path.exists(path):
            try:
                shutil.move(str(path), str(ARCHIVE_DIR / path.name))
                print(f"[QUARANTINE] Archived {path.name}")
            except Exception as e:
                print(f"[ERROR] Could not archive {path}: {e}")

if __name__ == "__main__":
    execute_merge()
