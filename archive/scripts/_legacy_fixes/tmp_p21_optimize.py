import os
import re
import urllib.request

TARGET_DIR = r"c:/Users/tourg/Desktop/SANTIS_SITE"
VENDOR_DIR = os.path.join(TARGET_DIR, 'assets', 'vendor')

os.makedirs(VENDOR_DIR, exist_ok=True)

PRECONNECT_BLOCK = """
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
"""

# Include the ending '>' in the regex, but we will put it back in the replacement string
script_re = re.compile(r'<script([^>]*)src=["\'](http[^"\']+)["\']([^>]*)>', re.IGNORECASE)
link_css_re = re.compile(r'<link([^>]*)href=["\'](http[^"\']+\.css?[^"\']*)["\']([^>]*)rel=["\']stylesheet["\']([^>]*)>', re.IGNORECASE)
link_css_re_alt = re.compile(r'<link([^>]*)rel=["\']stylesheet["\']([^>]*)href=["\'](http[^"\']+\.css?[^"\']*)["\']([^>]*)>', re.IGNORECASE)
local_script_re = re.compile(r'<script([^>]*)src=["\']([^"\']+)["\']([^>]*)>', re.IGNORECASE)

def download_file(url, extension):
    url = url.split('"')[0].split("'")[0]
    filename = url.split('/')[-1].split('?')[0]
    if not filename.endswith(extension):
        filename += extension
    
    filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
    filepath = os.path.join(VENDOR_DIR, filename)
    
    if not os.path.exists(filepath):
        #print(f"Downloading {url} to {filename}")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response, open(filepath, 'wb') as out_file:
                out_file.write(response.read())
        except Exception as e:
            #print(f"Failed to download {url}: {e}")
            return None
    return f"/assets/vendor/{filename}"

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        def script_replacer(match):
            pre, url, post = match.groups()
            full_orig = match.group(0)
            if 'recaptcha' in url or 'googletagmanager' in url or 'google-analytics' in url or 'cloudflareinsights' in url:
                if 'defer' not in pre and 'defer' not in post and 'async' not in pre and 'async' not in post:
                    return f'<script{pre}src="{url}"{post} defer>'
                return full_orig
                
            local_url = download_file(url, '.js')
            if local_url:
                if 'defer' not in pre and 'defer' not in post and 'async' not in pre and 'async' not in post:
                    return f'<script{pre}src="{local_url}"{post} defer>'
                return f'<script{pre}src="{local_url}"{post}>'
            return full_orig

        content = script_re.sub(script_replacer, content)

        def css_replacer(match):
            full_orig = match.group(0)
            parts = list(match.groups())
            url = next((p for p in parts if p and p.startswith('http')), None)
            
            if not url: return full_orig
            if 'fonts.googleapis' in url: return full_orig
                
            local_url = download_file(url, '.css')
            if local_url:
                return full_orig.replace(url, local_url)
            return full_orig

        content = link_css_re.sub(css_replacer, content)
        content = link_css_re_alt.sub(css_replacer, content)

        def local_script_replacer(match):
            pre, url, post = match.groups()
            full_orig = match.group(0)
            if url.startswith('http'): return full_orig
            if 'defer' not in pre and 'defer' not in post and 'async' not in pre and 'async' not in post:
                if 'sw.js' not in url and 'service-worker' not in url:
                    return f'<script{pre}src="{url}"{post} defer>'
            return full_orig
            
        content = local_script_re.sub(local_script_replacer, content)

        if '<head>' in content and 'fonts.googleapis.com' in content:
            if 'preconnect' not in content:
                content = content.replace('<head>', f'<head>\n{PRECONNECT_BLOCK}')

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Optimized: {filepath}")

    except Exception as e:
        pass

for root, dirs, files in os.walk(TARGET_DIR):
    if '_archive' in root or 'node_modules' in root or '.git' in root or 'dist' in root or '_dev_archives' in root or 'tr\\' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))

