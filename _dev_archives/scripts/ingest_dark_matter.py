import sqlite3
import os
import glob
import uuid

DB_PATH = 'santis.db'
IMG_DIR = os.path.join(os.getcwd(), 'assets', 'img')

def categorize_image(filepath):
    """
    Intelligence Pass: Determines the canonical tag from the filename.
    """
    lower = filepath.lower()
    
    # Priority keywords based on Santis architecture
    if 'hamam' in lower or 'kese' in lower or 'peeling' in lower or 'osmanli' in lower or 'thermal' in lower:
        return 'hamam'
    elif 'masaj' in lower or 'massage' in lower or 'terapi' in lower or 'rituel' in lower or 'anti-stress' in lower or 'derin-doku' in lower or 'thai' in lower:
        return 'masaj'
    elif 'cilt' in lower or 'facial' in lower or 'anti-aging' in lower or 'mask' in lower or 'glow' in lower or 'skincare' in lower or 'hyaluron' in lower or 'collagen' in lower:
        return 'cilt'
    else:
        return 'diger'

def main():
    print("[PHASE 16] Commencing The Great Assimilation...")
    
    # 1. Connect to Matrix
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # 2. Fetch existing managed images
    cur.execute("SELECT filepath FROM gallery_assets")
    existing_paths = {row[0].replace('\\\\', '/').lower() for row in cur.fetchall()}
    
    # 3. Scan physical server files
    physical_files = glob.glob(os.path.join(IMG_DIR, '**', '*.*'), recursive=True)
    img_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.avif')
    img_files = [f for f in physical_files if f.lower().endswith(img_extensions)]
    
    assimilated_count = 0
    skipped_count = 0
    
    for file_abs_path in img_files:
        # Normalize path to Unix format exactly like the DB expects: e.g. "assets/img/..."
        rel_path = os.path.relpath(file_abs_path, os.getcwd()).replace('\\\\', '/')
        
        # Check if already assimilated
        if rel_path.lower() not in existing_paths:
            filename = os.path.basename(rel_path)
            category = categorize_image(rel_path)
            asset_id = str(uuid.uuid4())
            tenant_id = 'santis_hq' 
            
            # Print minimal telemetry to avoid console flood
            if assimilated_count % 10 == 0:
                print(f"[ASSIMILATING] {filename} -> {category.upper()}...")
            
            # Execute Insertion (is_published=true, sort_order=999 to put them at the end)
            try:
                cur.execute("""
                    INSERT INTO gallery_assets (
                        id, tenant_id, filename, filepath, category, 
                        is_published, sort_order, uploaded_at
                    ) VALUES (?, ?, ?, ?, ?, 1, 999, CURRENT_TIMESTAMP)
                """, (asset_id, tenant_id, filename, rel_path, category))
                assimilated_count += 1
            except Exception as e:
                print(f"[ERROR] Failed to assimilate {filename}: {str(e)}")
        else:
            skipped_count += 1
            
    # Seal the Matrix
    conn.commit()
    conn.close()
    
    print(f"\\n--- [PHASE 16 COMPLETE] ---")
    print(f"✅ Successfully assimilated {assimilated_count} Dark Matter assets into the Sovereign Matrix.")
    print(f"⏭ Skipped {skipped_count} already managed assets.")

if __name__ == '__main__':
    main()
