import os, json, re
from pathlib import Path

ROOT = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE")

def run_step_1():
    print("STEP 1: JSON CRITICAL REPAIR")
    data_dirs = [ROOT / "assets" / "data", ROOT / "data"]
    repaired_count = 0
    for data_dir in data_dirs:
        if not data_dir.exists(): continue
        for json_file in data_dir.glob("*.json"):
            try:
                content = json_file.read_text(encoding='utf-8').strip()
                json.loads(content) # Check if valid
            except json.JSONDecodeError:
                # Attempt repair: if it starts with { and has multiple objects, wrap in []
                # or if it starts with { and ends with ] (wait, no)
                if content.startswith('{') and (content.endswith('}') or content.endswith(']')):
                    # Just forcefully try to wrap it if it failed
                    if not content.endswith(']'):
                        try_content = '[\n' + content + '\n]'
                    else:
                        try_content = '[\n' + content
                        
                    try:
                        json.loads(try_content)
                        json_file.write_text(try_content, encoding='utf-8')
                        print(f"  [+] Repaired {json_file.name}: Wrapped in array brackets.")
                        repaired_count += 1
                    except json.JSONDecodeError as e2:
                        print(f"  [!] Failed to repair {json_file.name}: {e2}")
                else:
                    print(f"  [!] Invalid format couldn't be auto-repaired for {json_file.name}")
    print(f"  > Repaired {repaired_count} JSON files.\n")

def run_step_2():
    print("STEP 2: JS RELATIVE PATH NORMALIZATION")
    js_dir = ROOT / "assets" / "js"
    modified_count = 0
    for js_file in js_dir.rglob("*.js"):
        try:
            content = js_file.read_text(encoding='utf-8', errors='ignore')
            new_content = re.sub(r'(["\'])assets/', r'\1/assets/', content)
            if new_content != content:
                js_file.write_text(new_content, encoding='utf-8')
                print(f"  [+] Normalized paths in: {js_file.relative_to(ROOT)}")
                modified_count += 1
        except Exception as e:
            print(f"  [!] Could not process {js_file.name}: {e}")
    print(f"  > Modified {modified_count} JS files.\n")

def run_step_3():
    print("STEP 3: HTML MISSING REFS & 404 CLEANUP")
    html_files = list(ROOT.rglob("*.html"))
    modified_count = 0
    
    path_regex = re.compile(r'(src|href)=["\'](\.\./)+assets/([^"\']+)["\']', re.IGNORECASE)
    vite_regex = re.compile(r'<link[^>]+href=["\']/?vite\.svg["\'][^>]*>', re.IGNORECASE)
    old_script_regex = re.compile(r'<script[^>]+src=["\']/assets/js/santis-core\.js[^>]*></script>', re.IGNORECASE)
    
    for html_file in html_files:
        if 'node_modules' in html_file.parts or '.git' in html_file.parts or '_backup' in html_file.parts: continue
        
        try:
            content = html_file.read_text(encoding='utf-8', errors='ignore')
            original = content
            
            content = path_regex.sub(r'\1="/assets/\3"', content)
            content = vite_regex.sub('', content)
            content = content.replace('src="/assets/js/app-core.js?v=15.6"', 'src="/assets/js/app.js?v=15.6"')
            content = old_script_regex.sub('', content)
            
            if content != original:
                # Force writability
                # os.chmod(str(html_file), 0o666) -> actually let's just catch Exception
                html_file.write_text(content, encoding='utf-8')
                modified_count += 1
        except Exception as e:
            print(f"  [!] Skipped {html_file.relative_to(ROOT)} (Error: {e})")
            
    print(f"  > Modified {modified_count} HTML files.\n")

if __name__ == "__main__":
    print("Executing PROTOCOL 18: THE SOVEREIGN ECLIPSE")
    run_step_1()
    run_step_2()
    run_step_3()
    print("Steps 1-3 Completed Successfully.")
