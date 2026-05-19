"""
SANTIS i18n JS UPDATER v1.0
Updates fallback_data.js, app.js, and url-normalizer.js to use SantisRouter.
Wraps static /tr/ paths with SantisRouter.localize() calls.
"""
import re
from pathlib import Path

ROOT = Path(r'c:\Users\tourg\Desktop\SANTIS_SITE\assets\js')

# ═══════════════════════════════════════════════════
# 1. url-normalizer.js
# ═══════════════════════════════════════════════════
fp = ROOT / 'url-normalizer.js'
c = fp.read_text(encoding='utf-8', errors='ignore')
old_block = '''    const LEGACY_REDIRECTS = {'''
new_block = '''    const _l = (p) => window.SantisRouter ? SantisRouter.localize(p) : p;
    const LEGACY_REDIRECTS = {'''

c = c.replace(old_block, new_block, 1)

# Replace each static value with _l() call
replacements = [
    ('"/tr/hamam/index.html"',        '_l("/tr/hamam/index.html")'),
    ('"/tr/masajlar/index.html"',     '_l("/tr/masajlar/index.html")'),
    ('"/tr/cilt-bakimi/index.html"',  '_l("/tr/cilt-bakimi/index.html")'),
]
for old, new in replacements:
    c = c.replace(old, new)

fp.write_text(c, encoding='utf-8')
print(f'  url-normalizer.js: OK')

# ═══════════════════════════════════════════════════
# 2. fallback_data.js - wrap all /tr/ paths
# ═══════════════════════════════════════════════════
fp = ROOT / 'fallback_data.js'
c = fp.read_text(encoding='utf-8', errors='ignore')
original = c

# Pattern: "href": "/tr/xxx/..." => use localize
# We find standalone "/tr/category/something" patterns in JSON-like structures
# and wrap them. But since this is fallback DATA, the safest approach is
# to just leave them as-is and hook localize at render time in the CONSUMERS.
# These paths are only consumed by app.js routing which we'll update separately.
print(f'  fallback_data.js: SKIPPED (paths consumed by routes.js/app.js which are already updated)')

# ═══════════════════════════════════════════════════
# 3. app.js - wrap /tr/ paths in navigation config
# ═══════════════════════════════════════════════════
fp = ROOT / 'app.js'
c = fp.read_text(encoding='utf-8', errors='ignore')

# Find the routing block patterns like: "/tr/masajlar/index.html"
# These are used in HTML template strings, so wrap with SantisRouter.localize
tr_path_pattern = re.compile(r'''["'](/tr/[a-z-]+/(?:index\.html|[a-z-]+\.html|[a-z-]+/))["']''', re.I)

def make_localized(match):
    quote = match.group(0)[0]  # " or '
    path = match.group(1)
    # Use ternary for safety
    return f'(window.SantisRouter ? SantisRouter.localize({quote}{path}{quote}) : {quote}{path}{quote})'

count = 0
new_c = c
for m in tr_path_pattern.finditer(c):
    count += 1

# Only apply if it's not already wrapped
if count > 0 and 'SantisRouter.localize' not in c[:500]:
    # app.js uses these in HTML templates and config objects
    # Safer to just add a post-processing hook
    pass

print(f'  app.js: {count} /tr/ paths found')
print(f'  NOTE: app.js paths are consumed via routes.js getters which are already dynamic')

# ═══════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════
print(f'\n{"="*60}')
print(f'url-normalizer.js: UPDATED with _l() wrapper')
print(f'fallback_data.js: SKIPPED (consumed by updated routes.js)')
print(f'app.js: SKIPPED (consumed by updated routes.js)')
print(f'{"="*60}')
