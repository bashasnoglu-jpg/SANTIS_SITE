import os
import re

css_dir = r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\css"

# Find transition definitions with "all"
# e.g. "transition: all 0.4s ease;" or "transition: 0.3s all;"
pattern = re.compile(r"transition:\s*([^;{}]*)all([^;{}]*);")

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    def replacer(match):
        before = match.group(1).strip()
        after = match.group(2).strip()
        
        # Combine everything except 'all' to get the timing/easing
        rest = f"{before} {after}".strip()
        # Clean up repeated spaces
        rest = re.sub(r'\s+', ' ', rest)
        
        if not rest:
            rest = "0.3s ease" # fallback
            
        new_val = f"transition: transform {rest}, opacity {rest}, color {rest}, background-color {rest}, border-color {rest};"
        return new_val

    new_content, count = pattern.subn(replacer, content)

    if count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {count} in {os.path.basename(filepath)}")
        return count
    return 0

total = 0
for root, dirs, files in os.walk(css_dir):
    for file in files:
        if file.endswith(".css"):
            idx = process_file(os.path.join(root, file))
            total += idx

print(f"Total CSS Transitions refactored: {total}")
