
import os
from PIL import Image
from pathlib import Path

# CONFIG
TARGET_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\img"
THRESHOLD_KB = 300  # Convert images larger than this
QUALITY = 80        # WebP Quality

def convert_images():
    print(f"🚀 SANTIS DIGITAL DETOX ENGINE STARTING...")
    print(f"📂 Scanning: {TARGET_DIR}")
    
    count = 0
    saved_space = 0
    
    for root, dirs, files in os.walk(TARGET_DIR):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')) and not file.endswith('.webp'):
                file_path = os.path.join(root, file)
                size_kb = os.path.getsize(file_path) / 1024
                
                if size_kb > THRESHOLD_KB:
                    print(f"\n⚠️ Heavy Asset Found: {file} ({size_kb:.2f} KB)")
                    
                    # Target Path
                    webp_path = os.path.splitext(file_path)[0] + ".webp"
                    
                    try:
                        # Conversion
                        with Image.open(file_path) as img:
                            img.save(webp_path, "WEBP", quality=QUALITY)
                            
                        new_size_kb = os.path.getsize(webp_path) / 1024
                        diff = size_kb - new_size_kb
                        
                        print(f"✅ Converted: {os.path.basename(webp_path)} ({new_size_kb:.2f} KB)")
                        print(f"📉 Reduced by: {diff:.2f} KB")
                        
                        count += 1
                        saved_space += diff
                        
                    except Exception as e:
                        print(f"❌ Error converting {file}: {e}")

    print(f"\n🎉 DETOX COMPLETE!")
    print(f"📦 Optimized: {count} images")
    print(f"💾 Saved Space: {saved_space/1024:.2f} MB")

if __name__ == "__main__":
    convert_images()
