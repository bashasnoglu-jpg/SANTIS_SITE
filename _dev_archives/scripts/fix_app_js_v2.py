import os

file_path = "assets/js/app.js"

print(f"Reading {file_path}...")
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False
found_start = False
found_end = False

for i, line in enumerate(lines):
    # Detect start of corruption (around line 4756)
    # The line has spaced out chars: " / *   = = ="
    # We use a loose match to be sure
    if not found_start and " / *" in line and "= =" in line: 
        print(f"🚨 Found corruption START at line {i+1}")
        skip = True
        found_start = True
    
    # Detect end of corruption (around line 5021)
    # The valid code starts with "// 👻 SANTIS GHOST LAYER AUTO CLEANER"
    if skip and "👻 SANTIS" in line:
        print(f"✅ Found content RESUME at line {i+1}")
        skip = False
        found_end = True
    
    if not skip:
        new_lines.append(line)

if found_start and found_end:
    with open(file_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print("✨ SUCCEEDED: Validated and fixed app.js. Corrupted block removed.")
else:
    print("❌ FAILED: Could not identify the boundaries of the corrupted block exactly.")
    # Fallback: Just print what we found
    if not found_start: print("Could NOT find start pattern.")
    if not found_end: print("Could NOT find end pattern.")

