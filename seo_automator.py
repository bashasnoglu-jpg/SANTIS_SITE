
import os
import re
from pathlib import Path
from typing import Dict, Any

class SeoAutomator:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.ignore_patterns = [
            ".git", "__pycache__", ".vscode", "node_modules", 
            "PROMPT_DROP_ZONE.txt", "*.bat", "*.py", "*.json",
            "admin", "assets" # Skip admin and assets folders for SEO page injection
        ]
        
    def _is_ignored(self, file_path: Path) -> bool:
        for pattern in self.ignore_patterns:
            if pattern in file_path.parts:
                return True
        return False

    def generate_description(self, content: str) -> str:
        # Try to find h1, then p
        h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
        p_match = re.search(r'<p[^>]*>(.*?)</p>', content, re.IGNORECASE | re.DOTALL)
        
        desc = "Santis Club - Exclusive Spa & Wellness Experience."
        
        if h1_match:
            clean_h1 = re.sub(r'<[^>]+>', '', h1_match.group(1)).strip()
            if clean_h1:
                desc = f"{clean_h1} at Santis Club. "
        
        if p_match:
            clean_p = re.sub(r'<[^>]+>', '', p_match.group(1)).strip()
            # Truncate
            if len(clean_p) > 100:
                clean_p = clean_p[:100] + "..."
            desc += clean_p
            
        return desc.replace('"', '&quot;').strip()

    def run_seo_injection(self) -> Dict[str, Any]:
        results = {"scanned": 0, "injected": 0, "files_modified": []}
        
        for file_path in self.root_path.rglob("*.html"):
            if self._is_ignored(file_path):
                continue
                
            results["scanned"] += 1
            original_content = file_path.read_text(encoding="utf-8")
            content = original_content
            
            # Check for <head>
            if "<head>" not in content:
                continue
                
            modified = False
            
            # 1. Meta Description
            if '<meta name="description"' not in content:
                desc = self.generate_description(content)
                meta_tag = f'\n  <meta name="description" content="{desc}">'
                # Inject after <title> or <head>
                if "</title>" in content:
                    content = content.replace("</title>", f"</title>{meta_tag}")
                else:
                    content = content.replace("<head>", f"<head>{meta_tag}")
                modified = True
                
            # 2. Open Graph Image (Standard)
            if '<meta property="og:image"' not in content:
                og_tag = '\n  <meta property="og:image" content="/assets/img/og-standard.jpg">'
                if "</head>" in content:
                    content = content.replace("</head>", f"{og_tag}\n</head>")
                modified = True
                
            # 3. Viewport (Safety)
            if '<meta name="viewport"' not in content:
                vp_tag = '\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">'
                if "<head>" in content:
                    content = content.replace("<head>", f"<head>{vp_tag}")
                modified = True

            if modified:
                file_path.write_text(content, encoding="utf-8")
                results["injected"] += 1
                results["files_modified"].append(str(file_path.relative_to(self.root_path)))
                
        return results

if __name__ == "__main__":
    automator = SeoAutomator(".")
    print("🚀 Running SEO Automator...")
    res = automator.run_seo_injection()
    print(f"✅ Modified {res['injected']} files.")
