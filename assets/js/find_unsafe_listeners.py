import os
import re

def scan_js_for_unsafe_listeners(directory):
    # Regex to find direct chained addEventListener on getElementById or querySelector
    pattern = re.compile(r'(document\.(getElementById|querySelector)\([^\)]+\))\s*\.\s*addEventListener\(')
    count = 0
    for root, dirs, files in os.walk(directory):
        for f in files:
            if f.endswith('.js'):
                path = os.path.join(root, f)
                try:
                    with open(path, 'r', encoding='utf-8') as file:
                        lines = file.readlines()
                        for i, line in enumerate(lines):
                            if pattern.search(line) and not '//' in line.split('.addEventListener')[0]:
                                print(f'Unsafe listener in {os.path.relpath(path, directory)} at line {i+1}: {line.strip()}')
                                count += 1
                except Exception:
                    pass
    print(f'\nTotal unsafe listeners found: {count}')

if __name__ == '__main__':
    scan_js_for_unsafe_listeners('.')
