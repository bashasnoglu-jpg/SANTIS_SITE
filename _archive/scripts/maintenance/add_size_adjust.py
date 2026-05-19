import re
from pathlib import Path

fonts_file = Path(r"C:\Users\tourg\Desktop\SANTIS_SITE\assets\css\fonts.css")

with open(fonts_file, "r", encoding="utf-8") as f:
    content = f.read()

# Append size-adjust: 98%; before the closing brace of all @font-face declarations
def inject_adjust(match):
    block = match.group(0)
    if "size-adjust:" not in block:
        # insert before the last brace
        return re.sub(r'}\s*$', '  size-adjust: 98%;\n}', block)
    return block

new_content = re.sub(r'@font-face\s*{[^}]*}', inject_adjust, content)

if new_content != content:
    with open(fonts_file, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Injected size-adjust into fonts.css")
else:
    print("No changes made or already injected.")
