import os

file_path = "assets/js/app.js"

print(f"Reading {file_path}...")
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Indices are 0-based. Line 4756 is index 4755.
# Line 5021 is index 5020.
# We want to keep 0..4754 (Lines 1..4755)
# And keep 5020..end (Lines 5021..end)
# So we slice lines[:4755] + lines[5020:]

start_delete = 4755
end_delete = 5020 

# Validate content to be sure
print(f"Line {start_delete+1} content: {lines[start_delete][:30]}...")
print(f"Line {end_delete+1} content: {lines[end_delete][:30]}...")

if " / *" in lines[start_delete] or "/ *" in lines[start_delete]:
    print("Start check passed (roughly).")
else:
    print("WARNING: Start line does not look like comment start. Proceeding anyway based on viewing.")

if "SANTIS GHOST" in lines[end_delete]:
    print("End check passed.")
else:
    print("WARNING: End line does not look like Ghost Cleaner. Proceeding anyway.")

new_lines = lines[:start_delete] + lines[end_delete:]

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print(f"✅ Deleted lines {start_delete+1} to {end_delete}. New line count: {len(new_lines)}")
