import re

file_path = r"c:\Users\tourg\Desktop\SANTIS_SITE\dunya-ritueli.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the inner hero-content logic and the scroll-down div
pattern = r'(<header class="world-hero">\s*<div class="hero-content">.*?</div>\s*<div class="scroll-down">.*?</div>\s*</header>)'
    
replacement = """<header class="world-hero">
<div class="hero-content">
<!-- Only the title remains as per user instruction -->
<h1>Santis World</h1>
</div>
</header>"""

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Removed extra texts from hero section in dunya-ritueli.html")
