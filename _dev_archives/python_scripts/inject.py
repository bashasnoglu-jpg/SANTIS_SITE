import os
import re

directory = "c:/Users/tourg/Desktop/SANTIS_SITE"

updated_count = 0
for root, _, files in os.walk(directory):
    if "node_modules" in root or "_archive" in root or "components" in root:
        continue
    for file in files:
        if file.endswith(".html"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            if "santis-ws-orchestrator.js" in content:
                continue
                
            new_script = '<script src="/assets/js/core/santis-ws-orchestrator.js"></script>\n'
            
            # Find app.js
            match = re.search(r'<script[^>]*src=[\'"]/assets/js/app\.js[\'"][^>]*>\s*</script>', content)
            if match:
                content = content[:match.start()] + new_script + match.group(0) + content[match.end():]
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                updated_count += 1
            else:
                # If app.js is not present, add before closing head or body
                match = re.search(r'</head>', content, re.IGNORECASE)
                if match:
                    content = content[:match.start()] + new_script + match.group(0) + content[match.end():]
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(content)
                    updated_count += 1

print(f"Injection complete. Updated {updated_count} files.")
