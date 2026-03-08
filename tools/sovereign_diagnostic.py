import os
import json
import re

print("🦅 [Sovereign Diagnostic] Booting Auto-Scanner...")

TARGET_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE"
PAGES_TO_CHECK = [
    "index.html",
    "guest-zen/index.html",
    "tr/index.html",
    "tr/rezervasyon/index.html",
    "tr/cilt-bakimi/index.html"
]

report = {
    "status": "Scanning",
    "findings": []
}

def check_ghost_overlay_conflicts(filepath):
    """Check if CSS or JS enforces a fixed overlay that traps the UI"""
    if not os.path.exists(filepath): return
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    if 'z-index: 9999' in content or 'fixed inset-0' in content:
        if 'pointer-events-none' not in content:
            report["findings"].append({
                "type": "UI_TRAP_RISK",
                "file": filepath,
                "detail": "High z-index overlay detected without pointer-events-none. May block clicks."
            })

def check_injector_cls(filepath):
    """Check if forge injector strips dimensions causing CLS/Layout shift"""
    if not os.path.exists(filepath): return
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    if '<img' in content and 'width=' not in content:
         report["findings"].append({
                "type": "CLS_RISK",
                "file": filepath,
                "detail": "Image injection found without width/height attributes."
         })

# 1. Scan Forge Injectors
injector_paths = [
    os.path.join(TARGET_DIR, "assets", "js", "core", "santis-forge-injector.js"),
    os.path.join(TARGET_DIR, "assets", "js", "santis-forge-injector.js"),
    os.path.join(TARGET_DIR, "assets", "js", "santis-ritual-renderer.js")
]

for p in injector_paths:
    check_injector_cls(p)
    check_ghost_overlay_conflicts(p)

ghost_scripts = [
    os.path.join(TARGET_DIR, "assets", "js", "santis-sovereign-ghost.js"),
    os.path.join(TARGET_DIR, "assets", "js", "santis-ghost.js"),
    os.path.join(TARGET_DIR, "assets", "js", "santis-revenue-brain.js")
]

for p in ghost_scripts:
    check_ghost_overlay_conflicts(p)

print("✅ Scan Complete. Potential culprits identified.")
print(json.dumps(report, indent=2))

