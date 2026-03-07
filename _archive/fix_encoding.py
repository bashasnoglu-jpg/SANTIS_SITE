import os
import glob

dirs_to_check = ['data', 'assets/data']
files = []
for d in dirs_to_check:
    files.extend(glob.glob(os.path.join(d, '*.json')))

for path in files:
    if not os.path.exists(path): continue
    
    with open(path, 'rb') as f:
        raw = f.read()
        
    if raw.startswith(b'\xff\xfe'):
        print(f'Fixing UTF-16LE: {path}')
        text = raw.decode('utf-16le')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
    elif raw.startswith(b'\xfe\xff'):
        print(f'Fixing UTF-16BE: {path}')
        text = raw.decode('utf-16be')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
    elif raw.startswith(b'\xef\xbb\xbf'):
        print(f'Fixing UTF-8 BOM: {path}')
        text = raw.decode('utf-8-sig')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
    else:
        # Try to decode as utf-8 just to make sure, then save to strip any weirdness if we want,
        # but if it has no BOM and opens fine as utf-8 or cp1254, let's just leave it or force save
        try:
            text = raw.decode('utf-8')
        except UnicodeDecodeError:
            print(f'Warning: Not valid UTF-8, attempting to decode as windows-1254: {path}')
            try:
                text = raw.decode('cp1254')
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(text)
                print(f'Fixed encoding from windows-1254 to utf-8: {path}')
            except Exception as e:
                print(f'Error reading {path}: {e}')
                
print("Done fixing encodings.")
