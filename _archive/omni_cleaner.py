import os
import re
import json

# Antigravity Core Settings
TARGET_DIR = "."
DATA_DIR = os.path.join(TARGET_DIR, "assets", "data")
JS_DIR = os.path.join(TARGET_DIR, "assets", "js")
SERVER_FILE = os.path.join(TARGET_DIR, "server.py")

def log(msg):
    print(f"🌌 [Antigravity Core]: {msg}")

def fix_json_arrays():
    log("STEP 1: JSON Critical Repair Initiated...")
    if not os.path.exists(DATA_DIR): return
    
    for filename in os.listdir(DATA_DIR):
        if filename.endswith(".json"):
            filepath = os.path.join(DATA_DIR, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read().strip()
            
            # Eğer JSON { veya [ ile başlamıyorsa, kırık bir dizidir. Antigravity zırhı ekle:
            if content and not (content.startswith('{') or content.startswith('[')):
                fixed_content = f"[\n{content}\n]"
                try:
                    json.loads(fixed_content) # Doğrulamadan kaydetme
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(fixed_content)
                    log(f"  ✅ Repaired Invalid JSON Array: {filename}")
                except json.JSONDecodeError:
                    log(f"  ❌ Failed to auto-repair: {filename} (Manual check required)")

def normalize_js_paths():
    log("STEP 2: JS Relative Path Normalization...")
    if not os.path.exists(JS_DIR): return
    
    for root, _, files in os.walk(JS_DIR):
        for file in files:
            if file.endswith(".js"):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # "assets/... veya 'assets/... olan yolları /assets/... yap (API yollarını bozmadan)
                new_content = re.sub(r'(?<!/)(["\'])assets/', r'\1/assets/', content)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    log(f"  ✅ Normalized paths in: {file}")

def cleanup_html_refs():
    log("STEP 3: HTML Missing Refs & 404 Cleanup...")
    for root, _, files in os.walk(TARGET_DIR):
        for file in files:
            if file.endswith(".html"):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 1. ../assets/ veya ../../assets/ çöplüğünü /assets/ yap
                content = re.sub(r'(\.\./)+assets/', '/assets/', content)
                # 2. Eski ?v=15.6 hardcoded script izlerini sil (Yenileri Phantom Injector halleder)
                content = re.sub(r'\?v=15\.6', '', content)
                # 3. Kırık vite.svg referanslarını temizle
                content = re.sub(r'<link[^>]*href="[^"]*vite\.svg"[^>]*>', '', content)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

def debloat_server_py():
    log("STEP 4: Python Server.py De-Bloating...")
    if not os.path.exists(SERVER_FILE): return
    
    with open(SERVER_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    clean_lines = []
    for line in lines:
        # Kullanılmayan kirlilikleri atla
        if line.strip() in ["import warnings", "from fastapi import High", "import High"]:
            continue
        clean_lines.append(line)
        
    with open(SERVER_FILE, 'w', encoding='utf-8') as f:
        f.writelines(clean_lines)
    log("  ✅ server.py sanitized.")

if __name__ == "__main__":
    print("🚀 SOVEREIGN ECLIPSE PROTOCOL ACTIVATED")
    fix_json_arrays()
    normalize_js_paths()
    cleanup_html_refs()
    debloat_server_py()
    print("🛡️ OMNI-CLEANER Execution Complete. Zero Bug Policy Enforced.")
