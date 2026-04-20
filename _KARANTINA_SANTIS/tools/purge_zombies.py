import re
import os

html_path = r"c:\Users\tourg\Desktop\SANTIS_SITE\site-haritasi.html"

with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

# Dead language patterns
dead_langs = ["/en/", "/de/", "/fr/", "/ru/", "/sr/"]

# Split content into lines to safely remove li elements containing these links
lines = content.split('\n')
cleaned_lines = []

in_dead_section = False
for line in lines:
    # Check if line contains a dead link
    if any(f'href="{lang}' in line for lang in dead_langs) or any(f'href="{lang[:-1]}.html' in line for lang in dead_langs):
        continue # Skip this line
    elif any(f'href="/{lang}' in line for lang in ["en", "de", "fr", "ru", "sr"]):
         continue
        
    cleaned_lines.append(line)

new_content = '\n'.join(cleaned_lines)

# Remove empty category cards that might be left behind
# A simple regex to find cards with empty link-lists
new_content = re.sub(r'<div class="category-card">\s*<h3 class="category-title">.*?</h3>\s*<ul class="link-list">\s*</ul>\s*</div>', '', new_content, flags=re.DOTALL)

# Remove entire lang-sections if they have become empty (no category cards left)
new_content = re.sub(r'<section class="lang-section">\s*<h2 class="lang-title">.*?</h2>\s*<div class="category-grid">\s*</div>\s*</section>', '', new_content, flags=re.DOTALL)


with open(html_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Zombie links purged from site-haritasi.html")
