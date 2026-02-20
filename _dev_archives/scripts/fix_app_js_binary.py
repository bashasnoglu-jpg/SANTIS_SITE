import os

file_path = "assets/js/app.js"
print(f"Binary scrubbing {file_path}...")

with open(file_path, "rb") as f:
    lines = f.readlines()

new_lines = []
deleted_count = 0

for line in lines:
    # If line contains null byte, it is likely corrupted (unless it's a binary asset but this is a JS file)
    if b'\x00' in line:
        deleted_count += 1
    else:
        new_lines.append(line)

with open(file_path, "wb") as f:
    f.writelines(new_lines)

print(f"✅ Scrubbed {deleted_count} binary-corrupted lines. New line count: {len(new_lines)}")
