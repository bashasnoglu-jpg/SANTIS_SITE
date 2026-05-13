import os
import re
from pathlib import Path

ROOT_DIR = Path(r"C:\Users\tourg\Desktop\SANTIS_SITE")
TARGETS = [
    ROOT_DIR / "tr" / "index.html",
    ROOT_DIR / "tr" / "hamam" / "santis-pasa.html"
]

CRITICAL_CSS = """
<style id="critical-css">
/* Temel sıfırlama ve tipografi iskeleti */
body { margin: 0; background-color: #f4f3f1; font-family: 'Cormorant Garamond', 'Inter', system-ui, sans-serif; color: #1a1a1a; }
.site-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; min-height: 80px; }
/* Mutlak Mizanpaj Koruması & İskelet (Skeleton) */
.media-wrapper { position: relative; width: 100%; overflow: hidden; background-color: #f4f3f1; }
.media-wrapper::after { content: ""; position: absolute; inset: 0; background-image: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%); transform: translateX(-100%); animation: shimmer 1.5s infinite; will-change: transform; }
@keyframes shimmer { 100% { transform: translateX(100%); } }
.hero-media { aspect-ratio: 2 / 3; }
@media (min-width: 768px) { .hero-media { aspect-ratio: 2 / 1; } }
.hero-image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; opacity: 0; transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
.hero-image.loaded { opacity: 1; }
</style>
"""

def process_file(filepath):
    if not filepath.exists():
        print(f"File not found: {filepath}")
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Inject Critical CSS before first <link rel="stylesheet">
    if '<style id="critical-css">' not in content:
        # find first stylesheet link
        match = re.search(r'<link\s+[^>]*rel="stylesheet"[^>]*>', content)
        if match:
            # insert before it
            content = content[:match.start()] + CRITICAL_CSS + content[match.start():]
        else:
            # fallback: insert before </head>
            content = content.replace("</head>", CRITICAL_CSS + "</head>")
            
    # 2. Async CSS rewrite
    # Find all <link ... rel="stylesheet" ...> but avoid already processed ones
    def async_css_repl(match):
        tag = match.group(0)
        if 'media="print"' in tag or 'rel="preload"' in tag:
            return tag # already processed
        # Extract href
        href_match = re.search(r'href=["\']([^"\']+)["\']', tag)
        if not href_match:
            return tag  # Cannot parse
        href = href_match.group(1)
        
        replacement = f"""
  <link rel="preload" href="{href}" as="style">
  <link rel="stylesheet" href="{href}" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="{href}"></noscript>"""
        return replacement

    content = re.sub(r'<link\s+[^>]*rel="stylesheet"[^>]*>', async_css_repl, content)
    
    # 3. Apply defer to scripts without defer or async
    def defer_script_repl(match):
        tag = match.group(0)
        # Skip if already deferred or async or inline (no src)
        if 'defer' in tag or 'async' in tag or 'src=' not in tag:
            return tag
            
        # Add defer before >
        return tag.replace('>', ' defer>')

    content = re.sub(r'<script\s+[^>]+>', defer_script_repl, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        print(f"Processed: {filepath.name}")

for target in TARGETS:
    process_file(target)
