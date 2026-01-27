import os
from PIL import Image

TARGET_DIRS = ["assets/img", "images"]
MIN_SIZE_KB = 100
QUALITY = 80

def get_size_kb(path):
    return os.path.getsize(path) / 1024

def optimize():
    print("Starting Image Optimization...")
    count = 0
    saved_kb = 0

    for d in TARGET_DIRS:
        if not os.path.exists(d):
            continue
            
        for root, _, files in os.walk(d):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                    file_path = os.path.join(root, file)
                    size = get_size_kb(file_path)
                    
                    if size > MIN_SIZE_KB:
                        try:
                            # Open and Convert
                            img = Image.open(file_path)
                            
                            # Construct new path
                            new_file = os.path.splitext(file)[0] + ".webp"
                            new_path = os.path.join(root, new_file)
                            
                            # Save as WebP
                            img.save(new_path, "WEBP", quality=QUALITY)
                            
                            new_size = get_size_kb(new_path)
                            diff = size - new_size
                            
                            if diff > 0:
                                print(f"[OK] {file} ({size:.1f}KB) -> {new_file} ({new_size:.1f}KB). Saved: {diff:.1f}KB")
                                saved_kb += diff
                                count += 1
                                # Optional: We keep the original for safety unless user asks to delete
                            else:
                                print(f"[SKIP] WebP was larger for {file}")
                                if os.path.exists(new_path):
                                    os.remove(new_path)
                                    
                        except Exception as e:
                            print(f"[ERR] Failed {file}: {e}")

    print(f"\nSummary: Converted {count} images. Total Saved: {saved_kb/1024:.2f} MB")

if __name__ == "__main__":
    optimize()
