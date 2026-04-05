import os

TARGET_DIR = r"c:/Users/tourg/Desktop/SANTIS_SITE/admin"

def replace_links_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = content.replace('/gravity-ux-engine/', '/packages/gravity-ux-engine/')
        new_content = new_content.replace('../../gravity-ux-engine/', '../../packages/gravity-ux-engine/')

        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
    except Exception as e:
        pass

for root, dirs, files in os.walk(TARGET_DIR):
    for file in files:
        if file.endswith('.html') or file.endswith('.js') or file.endswith('.md'):
            replace_links_in_file(os.path.join(root, file))
