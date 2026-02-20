import os

file_path = "assets/js/app.js"
print(f"Scrubbing {file_path}...")

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
deleted_count = 0

patterns = [
    "f u n c t i o n",
    "c o n s t",
    "w i n d o w",
    "d o c u m e n t",
    "r e t u r n",
    "v a r",
    "l e t",
    " / *", 
    "* /"
]

for line in lines:
    is_bad = False
    for pat in patterns:
        if pat in line:
            is_bad = True
            break
    
    # Also check for lines that are just spaced out junk like "  }"
    if not is_bad and line.strip() == "} ) ;": # Spaced out closing
         if " ) " in line: is_bad = True

    if is_bad:
        deleted_count += 1
    else:
        new_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print(f"✅ Scrubbed {deleted_count} junk lines. New line count: {len(new_lines)}")
