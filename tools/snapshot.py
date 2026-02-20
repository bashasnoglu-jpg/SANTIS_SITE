import os
import shutil
import datetime

# CONFIG
SOURCE_DIR = 'C:/Users/tourg/Desktop/SANTIS_SITE'
SNAPSHOT_DIR = 'C:/Users/tourg/Desktop/SANTIS_SITE/_snapshots'
FOLDERS_TO_BACKUP = ['assets', 'admin', 'tools']
FILES_TO_BACKUP = ['index.html', 'service-detail.html', 'manifest.json']

def create_snapshot():
    # 1. Generate Timestamp
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"v6.0_Oracle_{timestamp}"
    target_path = os.path.join(SNAPSHOT_DIR, backup_name)

    print(f"🛡️ [Santis Shield] Initiating Snapshot: {backup_name}")

    try:
        # 2. Create Target Directory
        if not os.path.exists(target_path):
            os.makedirs(target_path)

        # 3. Copy Folders
        for folder in FOLDERS_TO_BACKUP:
            src = os.path.join(SOURCE_DIR, folder)
            dst = os.path.join(target_path, folder)
            if os.path.exists(src):
                shutil.copytree(src, dst)
                print(f"   ✅ Copied: {folder}/")

        # 4. Copy Files
        for file in FILES_TO_BACKUP:
            src = os.path.join(SOURCE_DIR, file)
            dst = os.path.join(target_path, file)
            if os.path.exists(src):
                shutil.copy(src, dst)
                print(f"   ✅ Copied: {file}")

        print(f"\n🎉 Snapshot Complete! Location: {target_path}")
        print("   System secured. Ready for Phase 7 operations.")

    except Exception as e:
        print(f"❌ Snapshot Failed: {e}")

if __name__ == "__main__":
    create_snapshot()
