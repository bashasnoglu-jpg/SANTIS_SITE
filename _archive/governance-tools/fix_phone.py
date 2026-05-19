import os

wrong_num = "905465427404"
correct_num = "905348350169"
root_dir = "."
count = 0

print(f"Replacing {wrong_num} with {correct_num}...")

for root, dirs, files in os.walk(root_dir):
    if '.git' in root or 'node_modules' in root or 'backup' in root:
        continue
        
    for file in files:
        if file.endswith(('.html', '.js', '.css', '.txt')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if wrong_num in content:
                    new_content = content.replace(wrong_num, correct_num)
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed: {path}")
                    count += 1
            except Exception as e:
                print(f"Skipping {path}: {e}")

print(f"Total files updated: {count}")
