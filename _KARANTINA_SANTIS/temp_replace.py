import re
import os

files = ['admin/modules/hub.js', 'admin/modules/command_center.js']
for p in files:
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            content = f.read()

        # Regex to find <a href="/admin/..."> and remove target="_blank" and add data-link
        def replacer(m):
            a_tag = m.group(0)
            a_tag = re.sub(r'\s*target=["\']_blank["\']', '', a_tag)
            if 'data-link' not in a_tag:
                a_tag = a_tag.replace('<a ', '<a data-link ')
            return a_tag

        content = re.sub(r'<a[^>]+href=["\']/admin/[^"\']+["\'][^>]*>', replacer, content)

        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)
print('Done modifying data-links')
