"""
SANTIS i18n SCRIPT TAG INJECTOR v1.0
Adds <script src="..../i18n-routes.js"> before loader.js in all HTML files.
Uses simple string matching - fast and reliable.
"""
import os
from pathlib import Path

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE')
SKIP = {'_legacy_archive','_legacy_content','_snapshots','backup','backups',
        'node_modules','admin','venv','__pycache__','.git','.vscode',
        '_dev_archives','print','public','static','templates',
        'includes','reports','tools','a4','components'}

count = 0
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP]
    for f in fn:
        if not f.endswith('.html'): continue
        fp = Path(dp) / f
        c = fp.read_text(encoding='utf-8', errors='ignore')
        
        # Skip if already has i18n-routes
        if 'i18n-routes' in c:
            continue
        
        # Skip if no loader.js reference
        if 'loader.js' not in c:
            continue
        
        # Determine relative path prefix based on depth
        rel = fp.relative_to(ROOT)
        depth = len(rel.parts) - 1  # minus filename
        
        if depth == 0:
            prefix = 'assets/js/'
        elif depth == 1:
            prefix = '../assets/js/'
        elif depth == 2:
            prefix = '../../assets/js/'
        else:
            prefix = '/assets/js/'
        
        # Try to inject BEFORE loader.js
        # Handle both ../assets/js/loader.js and /assets/js/loader.js patterns
        injected = False
        for loader_pattern in [
            f'<script src="{prefix}loader.js">',
            f'<script src="{prefix}loader.js"></script>',
            '<script src="../assets/js/loader.js">',
            '<script src="/assets/js/loader.js">',
            '<script src="./assets/js/loader.js">',
            '<script src="../../assets/js/loader.js">',
        ]:
            if loader_pattern in c:
                i18n_tag = f'<script src="{prefix}i18n-routes.js"></script>\n'
                c = c.replace(loader_pattern, i18n_tag + loader_pattern, 1)
                fp.write_text(c, encoding='utf-8')
                count += 1
                injected = True
                break
        
        if not injected:
            # Fallback: just find loader.js anywhere
            idx = c.find('loader.js')
            if idx > 0:
                # Find the <script start
                script_start = c.rfind('<script', 0, idx)
                if script_start > 0:
                    i18n_tag = f'<script src="{prefix}i18n-routes.js"></script>\n'
                    c = c[:script_start] + i18n_tag + c[script_start:]
                    fp.write_text(c, encoding='utf-8')
                    count += 1

print(f'i18n-routes.js injected into {count} HTML files')
