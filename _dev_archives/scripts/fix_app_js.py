import os

file_path = "assets/js/app.js"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # Detect start of corruption (around line 4756)
    # The line is has spaced out chars: " / *   = = ="
    if " / *   = = =" in line and "S A N T I S" in lines[i+1]: 
        print(f"Found corruption start at line {i+1}")
        skip = True
    
    # Detect end of corruption (around line 5021)
    # The valid code starts with "// 👻 SANTIS GHOST LAYER AUTO CLEANER"
    if "👻 SANTIS GHOST LAYER AUTO CLEANER" in line:
        print(f"Found valid code resume at line {i+1}")
        skip = False
    
    if not skip:
        new_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("✅ app.js fixed!")
