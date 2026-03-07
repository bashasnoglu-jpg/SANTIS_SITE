import os, re

mappings = {
    "klasik-rahatlama": "klasik-masaj",
    "klasik-tum-vucut-masaji": "isvec-full-body",
    "aromaterapi": "aromaterapi-masaji",
    "derin-doku": "derin-doku-masaji",
    "cift-rituel-masaji": "cift-rituel"
}

directories = [
    r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\data",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\js"
]

files_changed = 0
for d in directories:
    for root, dirs, files in os.walk(d):
        for f in files:
            if f.endswith('.json') or f.endswith('.js'):
                path = os.path.join(root, f)
                try:
                    with open(path, 'r', encoding='utf-8') as f_in:
                        content = f_in.read()
                    
                    new_content = content
                    for old, new in mappings.items():
                        new_content = re.sub(rf'("id"\s*:\s*"){old}(")', rf'\g<1>{new}\g<2>', new_content)
                        new_content = re.sub(rf'("slug"\s*:\s*"){old}(")', rf'\g<1>{new}\g<2>', new_content)
                        new_content = re.sub(rf"('id'\s*:\s*'){old}(')", rf"\g<1>{new}\g<2>", new_content)
                        new_content = re.sub(rf"('slug'\s*:\s*'){old}(')", rf"\g<1>{new}\g<2>", new_content)
                        # Replace in URLs
                        new_content = re.sub(rf'(/masajlar/){old}(\.html)', rf'\g<1>{new}\g<2>', new_content)
                        new_content = re.sub(rf'(/massages/){old}(\.html)', rf'\g<1>{new}\g<2>', new_content)
                        new_content = re.sub(rf'(/massagen/){old}(\.html)', rf'\g<1>{new}\g<2>', new_content)
                        new_content = re.sub(rf'("masajlar/){old}(\.html")', rf'\g<1>{new}\g<2>', new_content)
                        new_content = re.sub(rf'("massages/){old}(\.html")', rf'\g<1>{new}\g<2>', new_content)
                        new_content = re.sub(rf'("massagen/){old}(\.html")', rf'\g<1>{new}\g<2>', new_content)
                    
                    if new_content != content:
                        with open(path, 'w', encoding='utf-8') as f_out:
                            f_out.write(new_content)
                        files_changed += 1
                        print(f"Updated {path}")
                except Exception as e:
                    print(f"Error reading {path}: {e}")

print(f"Total files updated: {files_changed}")
