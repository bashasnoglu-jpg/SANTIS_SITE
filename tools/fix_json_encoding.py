import json
import os

file_path = 'data/services_spa.json'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix common mojibake/encoding issues found in the file
content = content.replace('ar?nmak', 'arınmak')
content = content.replace('sonras?', 'sonrası')
# Add more if found, but these were visible in the view_file output

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Fixed encoding in {file_path}")
