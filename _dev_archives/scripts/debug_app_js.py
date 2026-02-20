import os

file_path = "assets/js/app.js"
with open(file_path, "rb") as f: # Read as binary to see true bytes
    content = f.read()

# Split by newline bytes
lines = content.split(b'\n')

# Line 4756 is index 4755
target_index = 4755
if len(lines) > target_index:
    print(f"Line {target_index+1} REPR: {lines[target_index]}")
    # Decode to see chars
    try:
        print(f"Line {target_index+1} DECODED: {lines[target_index].decode('utf-8', errors='replace')}")
    except:
        pass
else:
    print(f"File shorter than expected. Lines: {len(lines)}")
