import os
import re

target_version = 'v=9.1'
root_dir = os.getcwd()
count = 0

for root, dirs, files in os.walk(root_dir):
    if any(skip in root for skip in ['_deploy_', '_build_', '_backup_', '_legacy_', '.git', 'node_modules', 'venv', 'SantisV5.5_Backup']):
        continue
    
    for file_name in files:
        if not file_name.endswith('.html'):
            continue
            
        file_path = os.path.join(root, file_name)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = content
            
            # Find and append ?v=9.1 to any .js or .css inside src="" or href="" that lack query strings
            # Look for src="something.js" or href="something.css"
            # It should not already have ?v= or .js"
            
            new_content = re.sub(r'(\.js|\.css)"', rf'\1?{target_version}"', new_content)
            new_content = re.sub(r"(\.js|\.css)'", rf"\1?{target_version}'", new_content)

            if new_content != content:
                # We need to deduplicate ?v=9.1?v=9.1 if we accidentally appended to an already versioned string
                # Wait, the regex `(\.js|\.css)"` ONLY matches if it ends with exactly .js" or .css" 
                # So it won't match .js?v=8.9"
                
                try:
                    os.chmod(file_path, 0o666)
                except:
                    pass
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
        except Exception as e:
            print(f"Skipping {file_path}: {e}")

print(f"Appended version strings to naked assets in {count} HTML files")
