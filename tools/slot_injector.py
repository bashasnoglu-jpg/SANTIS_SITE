import os
import glob
from pathlib import Path

def convert_slots():
    print("--- SOVEREIGN SLOT INJECTOR STARTING ---")
    base_dir = Path("c:/Users/tourg/Desktop/SANTIS_SITE")
    
    html_files = []
    # exclude dirs
    exclude = {"admin", "tools", ".git", "venv", ".gemini"}
    
    for root, dirs, files in os.walk(base_dir):
        # remove excluded dirs
        dirs[:] = [d for d in dirs if d not in exclude]
        for file in files:
            if file.endswith(".html"):
                html_files.append(Path(root) / file)
                
    modified_count = 0
    for file_path in html_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            if "data-cms-slot=" in content:
                new_content = content.replace("data-cms-slot=", "data-santis-slot=")
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"[Inject] Replaced slots in: {file_path.relative_to(base_dir)}")
                modified_count += 1
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            
    print(f"--- COMPLETE: {modified_count} files injected with Sovereign Slots ---")

if __name__ == "__main__":
    convert_slots()
