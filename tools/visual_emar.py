import os
import re
from collections import defaultdict

def scan_html_for_images(directory):
    html_files = []
    # Ignore specific directories
    for root, dirs, files in os.walk(directory):
        if "node_modules" in dirs: dirs.remove("node_modules")
        if "venv" in dirs: dirs.remove("venv")
        if ".git" in dirs: dirs.remove(".git")
        if "admin" in root or "tools" in root: continue
        for file in files:
            if file.endswith(".html"):
                html_files.append(os.path.join(root, file))
    
    # Regex for img tags, src attributes, and data-santis-slot
    image_regex = re.compile(r"<img[^>]+>")
    src_regex = re.compile(r"src=[\"\']([^\"\']+)[\"\']")
    slot_regex = re.compile(r"data-santis-slot=[\"\']([^\"\']+)[\"\']")
    
    results = defaultdict(list)
    total_images = 0
    total_slots_found = 0
    
    for file_path in html_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                
            images = image_regex.finditer(content)
            for match in images:
                total_images += 1
                img_tag = match.group(0)
                
                # Fetch src
                src_match = src_regex.search(img_tag)
                src = src_match.group(1) if src_match else "UNKNOWN_SRC"
                
                # Check for slot
                slot_match = slot_regex.search(img_tag)
                slot = slot_match.group(1) if slot_match else None
                if slot: total_slots_found += 1
                
                # Try to determine if its a Hero or Card image based on basic heuristics or class names
                is_hero = "hero" in img_tag.lower() or "fetchpriority=\"high\"" in img_tag.lower()
                is_card = "card" in file_path.lower() or "card" in img_tag.lower() or "bento" in img_tag.lower() or "gallery" in file_path.lower()
                
                rel_path = os.path.relpath(file_path, directory).replace("\\", "/")
                
                results[rel_path].append({
                    "src": src,
                    "slot": slot,
                    "type": "Hero (High Prio)" if is_hero else "Card/Gallery" if is_card else "Standard"
                })
        except Exception as e:
            pass

    return {
        "total_html_files": len(html_files),
        "total_images": total_images,
        "slotted_images": total_slots_found,
        "unslotted_images": total_images - total_slots_found,
        "details": dict(results)
    }

print("--- SISTEM GORSEL EMARI (ASSET MAP) STARTING ---")
report = scan_html_for_images(".")
print(f"\nScanned HTML Pages: {report['total_html_files']}")
print(f"Total HTML IMG Tags: {report['total_images']}")
print(f"Slotted Images ('data-santis-slot'): {report['slotted_images']}")
print(f"Unslotted Images (Standalone): {report['unslotted_images']}")

print("\n--- PAGE BASED ANALYSIS (Preview) ---")
count = 0
for file, images in report["details"].items():
    if len(images) > 0:
        print(f"\n[{file}] ({len(images)} Images)")
        for img in images[:4]:
            slot_status = f"[SLOT: {img['slot']}]" if img['slot'] else "[NO SLOT]"
            print(f"  {img['type']} | {img['src']} -> {slot_status}")
        if len(images) > 4:
            print(f"  ... and {len(images) - 4} more images.")
        count+=1
        if count > 15:
            print("\n... (Remaining results truncated)")
            break
