import os

path = r"C:\Users\tourg\Desktop\SANTIS_SITE\admin\app-admin.js"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Define the start of garbage and end
start_marker = "// 3. Generative Captioning (Template Based)"
end_marker = "async function uploadFile"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    print(f"Removing garbage from index {start_idx} to {end_idx}")
    new_content = content[:start_idx] + "\n\n" + content[end_idx:]
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Fixed.")
else:
    print("Markers not found.")
