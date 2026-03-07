import os

for r, d, f in os.walk('.'):
    d[:] = [x for x in d if x not in ['.git', 'node_modules', 'venv', '_backup', '_dev_archives', 'reports']]
    for file in f:
        if file.endswith('.html'):
            filepath = os.path.join(r, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as fh:
                    content = fh.read()
                
                if '<script defer="" src="/assets/js/app.js"></script>' in content and '<script src="/assets/js/app.js"></script>' in content:
                    new_c = content.replace('<script src="/assets/js/app.js"></script>\n', '')
                    new_c = new_c.replace('<script src="/assets/js/app.js"></script>', '')
                    if new_c != content:
                        with open(filepath, 'w', encoding='utf-8') as fh:
                            fh.write(new_c)
                        print(f"Fixed {filepath}")
            except Exception as e:
                pass
