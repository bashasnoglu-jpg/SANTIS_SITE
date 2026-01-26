# -*- coding: utf-8 -*-
"""
SANTIS CLUB - UTF-8 Encoding Fixer (Simple)
"""

import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
EXTENSIONS = ['.html', '.js', '.css', '.md']
EXCLUDE_DIRS = ['node_modules', '.git', '_backups', 'venv']

def fix_utf8(file_path):
    """Force UTF-8 encoding"""
    try:
        # Try reading with different encodings
        content = None
        for enc in ['utf-8', 'cp1254', 'latin1', 'iso-8859-9']:
            try:
                with open(file_path, 'r', encoding=enc) as f:
                    content = f.read()
                break
            except:
                continue
        
        if content is not None:
            # Write back as UTF-8
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed: {file_path.name}")
            return True
    except Exception as e:
        print(f"❌ Error: {file_path.name} → {e}")
    return False

def main():
    print("=" * 60)
    print("   UTF-8 Encoding Fixer")
    print("=" * 60)
    
    fixed = 0
    for root, dirs, files in os.walk(PROJECT_ROOT):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            if any(file.endswith(ext) for ext in EXTENSIONS):
                file_path = Path(root) / file
                if fix_utf8(file_path):
                    fixed += 1
    
    print(f"\n✅ Total files fixed: {fixed}")

if __name__ == '__main__':
    main()
