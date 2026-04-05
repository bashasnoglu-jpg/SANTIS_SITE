import os

TARGET_FILE_1 = r"C:\Users\tourg\Desktop\SANTIS_SITE\tr\index.html"
TARGET_FILE_2 = r"C:\Users\tourg\Desktop\SANTIS_SITE\ritueller.html"

replacements = {
    'style="font-family: \'Playfair Display\', serif; font-size: 3.5rem; margin-bottom: 20px; color: #fff;"': 'class="santis-ghost-heading"',
    'style="font-size: 1.2rem; color: rgba(255,255,255,0.9); line-height: 1.9; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; text-shadow: 0 2px 10px rgba(0,0,0,0.5);"': 'class="santis-ghost-text"',
    'style="display: flex; gap: 20px; justify-content: center; margin-bottom: 50px;"': 'class="santis-ghost-meta-container"',
    'style="background: rgba(0,0,0,0.4); padding: 15px 30px; border-radius: 12px; border: 1px solid rgba(212,175,55,0.3); backdrop-filter: blur(10px);"': 'class="santis-ghost-meta-box"',
    'style="display: block; font-size: 0.8rem; color: #D4AF37; letter-spacing: 2px;"': 'class="santis-ghost-meta-label"',
    'style="font-size: 1.3rem;"': 'class="santis-ghost-meta-value"'
}

for file_path in [TARGET_FILE_1, TARGET_FILE_2]:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")
    else:
        print(f"No changes needed for {file_path}")

