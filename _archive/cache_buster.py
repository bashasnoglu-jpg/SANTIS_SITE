import os
import re

def cache_bust():
    root_dir = os.getcwd()
    target_version = 'v=9.1'
    
    count = 0
    for root, dirs, files in os.walk(root_dir):
        # skip generated dirs
        if any(skip in root for skip in ['_deploy_', '_build_', '_backup_', '_legacy_', '.git', 'node_modules', 'venv', 'SantisV5.5_Backup']):
            continue
            
        for file_name in files:
            if not (file_name.endswith('.html') or file_name.endswith('.js')):
                continue
                
            file_path = os.path.join(root, file_name)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                new_content = re.sub(r'(\.js|\.css|\.json)\?v=\d+\.\d+', rf'\1?{target_version}', content)
                new_content = new_content.replace('v=8.1', target_version)
                new_content = new_content.replace('v=8.2', target_version)
                new_content = new_content.replace('v=8.5', target_version)
                new_content = new_content.replace('v=8.6', target_version)
                new_content = new_content.replace('v=8.7', target_version)
                new_content = new_content.replace('v=8.8', target_version)
                new_content = new_content.replace('v=8.9', target_version)
                new_content = new_content.replace('v=9.0', target_version)
                
                if new_content != content:
                    try:
                        os.chmod(file_path, 0o666)
                    except:
                        pass
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    count += 1
            except Exception as e:
                print(f"Skipping {file_path}: {e}")
                
    print(f"Updated {count} HTML files to use {target_version}")

if __name__ == "__main__":
    cache_bust()
