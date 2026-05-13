import os
import shutil

ADMIN_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE\admin"
ARCHIVE_DIR = os.path.join(ADMIN_DIR, "_archive")

# Create archive directory if it doesn't exist
os.makedirs(ARCHIVE_DIR, exist_ok=True)

# List of zombie/redundant files to archive
FILES_TO_ARCHIVE = [
    "gods-eye.html",
    "gods-eye-v2.html",
    "gods-eye-v3.html",
    "gods-eye-command.html",
    "prototype-cms-v5.html",
]

# Move files
archived = []
missing = []

for filename in FILES_TO_ARCHIVE:
    src = os.path.join(ADMIN_DIR, filename)
    dst = os.path.join(ARCHIVE_DIR, filename)
    
    if os.path.exists(src):
        # We use shutil.move which overwrites if dst is handled, but to be safe let's remove dst first if exists
        if os.path.exists(dst):
            os.remove(dst)
        shutil.move(src, dst)
        archived.append(filename)
    else:
        missing.append(filename)

print("ARCHIVE REPORT:")
print(f"✅ Successfully Archived: {archived}")
if missing:
    print(f"⚠️ Missing/Already Archived: {missing}")

# Now let's list the heavy metric scripts to confirm paths
print("\nTARGETS FOR TELEMETRY CONSOLIDATION:")
js_dir = os.path.join(ADMIN_DIR, "assets", "js")
targets = [
    os.path.join(ADMIN_DIR, "dashboard-logic.js"),
    os.path.join(ADMIN_DIR, "integrated_hub.js"),
    os.path.join(ADMIN_DIR, "dashboard.js"),
    os.path.join(ADMIN_DIR, "vue-command-center.js")
]

for t in targets:
    if os.path.exists(t):
        print(f"[FOUND] {os.path.basename(t)} ({os.path.getsize(t)/1024:.2f} KB)")
    else:
        print(f"[MISSING] {os.path.basename(t)}")
