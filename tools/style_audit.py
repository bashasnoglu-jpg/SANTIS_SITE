import os
import re
from pathlib import Path

ROOT = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE")

def run_audit():
    print("🚀 PROTOCOL 19: ESTHETIC & STYLE AUDIT")
    
    issues = {
        "aura": [],
        "layout": [],
        "perf": [],
        "motion": [],
        "cls": []
    }
    
    css_files = list(ROOT.rglob("*.css"))
    
    for css_file in css_files:
        if "node_modules" in css_file.parts or ".git" in css_file.parts or "_backup" in css_file.parts:
            continue
            
        try:
            content = css_file.read_text(encoding="utf-8", errors="ignore")
            lines = content.splitlines()
        except:
            continue
            
        rel_path = css_file.relative_to(ROOT)
        
        # 1. Sovereign Aura
        if "@font-face" in content:
            if "Cinzel" in content or "Playfair" in content:
                if "font-display: swap" not in content:
                    issues["aura"].append(f"🔴 CRITICAL [{rel_path}]: Luxury fonts missing `font-display: swap;`")
        
        # Flag generic colors
        for i, line in enumerate(lines):
            # very simplistic check for hardcoded colors
            if re.search(r'\b(red|blue|green|purple|yellow)\b', line, re.IGNORECASE) and '{' not in line and '}' not in line:
                if "color:" in line or "background:" in line or "background-color:" in line:
                    issues["aura"].append(f"🟠 MEDIUM [{rel_path}:{i+1}]: Hardcoded generic color detected instead of var() palette: `{line.strip()}`")

            # 2. Fluid Layout (px instead of rem/em for large values)
            px_match = re.search(r'(margin|padding)[^:]*:\s*(\d{2,})px', line)
            if px_match:
                issues["layout"].append(f"🟡 LOW [{rel_path}:{i+1}]: Hardcoded px value > 9px for {px_match.group(1)} (use rem/em): `{line.strip()}`")
                
            # 3. Perf (Z-Index Wars)
            z_match = re.search(r'z-index:\s*(\d{3,})', line)
            if z_match:
                val = int(z_match.group(1))
                if val >= 100:
                    issues["perf"].append(f"🟠 MEDIUM [{rel_path}:{i+1}]: High z-index detected ({val}): `{line.strip()}`. Possible Z-Index War.")

            # 4. Ultra-Motion (Layout thrashing transitions)
            if "transition:" in line:
                if any(x in line for x in ["all", "width", "height", "margin", "padding", "top", "left"]):
                    issues["motion"].append(f"🟠 MEDIUM [{rel_path}:{i+1}]: Layout-thrashing transition detected. Prefer transform/opacity: `{line.strip()}`")
                    
            # 5. Zero CLS (Image Wrappers)
            if ".nv-card-img" in line or "hero" in line.lower() or "wrapper" in line.lower():
                # We can't parse CSS strictly line-by-line easily for this, but we'll flag missing aspect-ratio globally if it's a wrapper file
                pass
                
        # Block level 5 check
        if "wrapper" in content.lower() or "img-box" in content.lower():
            if "aspect-ratio" not in content and "min-height" not in content:
                issues["cls"].append(f"🔴 CRITICAL [{rel_path}]: Image wrapper context detected but no `aspect-ratio` or `min-height` found.")
                
    # Quick HTML check for responsiveness
    for html_file in ROOT.rglob("*.html"):
        if "node_modules" in html_file.parts or ".git" in html_file.parts or "_backup" in html_file.parts:
            continue
        try:
            h_content = html_file.read_text(encoding="utf-8", errors="ignore")
            if "overflow-x" not in h_content and "viewport" in h_content:
                pass # Just a placeholder
        except: pass

    print("\n--- RESULTS ---")
    for category, category_issues in issues.items():
        print(f"\n[{category.upper()}] ({len(category_issues)} issues)")
        for issue in category_issues[:15]: # Limit output to avoid console flood
            print(issue)
        if len(category_issues) > 15:
            print(f"... and {len(category_issues) - 15} more.")

if __name__ == "__main__":
    run_audit()
