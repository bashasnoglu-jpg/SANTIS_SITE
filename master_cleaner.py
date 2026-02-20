
import os
import re
from pathlib import Path
from typing import List, Dict, Any

class MasterCleaner:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.ignore_patterns = [
            ".git", "__pycache__", ".vscode", "node_modules", 
            "PROMPT_DROP_ZONE.txt", "*.bat", "*.py", "*.json"
        ]
        self.utf8_map = {
            "Ã¼": "ü", "Ã__": "Ü", "Ã¶": "ö", "Ã–": "Ö",
            "ÅŸ": "ş", "Åž": "Ş", "Ä±": "ı", "Ä°": "İ",
            "Ã§": "ç", "Ã‡": "Ç", "ÄŸ": "ğ", "Äž": "Ğ"
        }

    def _is_ignored(self, file_path: Path) -> bool:
        for pattern in self.ignore_patterns:
            if "*" in pattern:
                if file_path.match(pattern):
                    return True
            else:
                if pattern in file_path.parts:
                    return True
        return False

    def scan_ghost_layers(self) -> Dict[str, Any]:
        """Scans for z-index issues (Ghost Layers)."""
        results = {"scanned": 0, "issues": [], "fixed": 0}
        html_files = list(self.root_path.rglob("*.html"))

        for file_path in html_files:
            if self._is_ignored(file_path):
                continue
            
            results["scanned"] += 1
            try:
                content = file_path.read_text(encoding="utf-8")
                # Look for high z-index inline styles
                matches = re.findall(r'style="[^"]*z-index:\s*(9999|999|10000)[^"]*"', content)
                if matches:
                    results["issues"].append({
                        "file": str(file_path.relative_to(self.root_path)),
                        "count": len(matches)
                    })
            except Exception as e:
                print(f"Error reading {file_path}: {e}")

        return results

    def fix_ghost_layers(self) -> Dict[str, Any]:
        """Removes z-index issues (Ghost Layers)."""
        results = {"scanned": 0, "fixed_files": [], "total_fixed": 0}
        html_files = list(self.root_path.rglob("*.html"))

        for file_path in html_files:
            if self._is_ignored(file_path):
                continue
            
            results["scanned"] += 1
            try:
                content = file_path.read_text(encoding="utf-8")
                # Remove z-index: 9999 from inline styles
                # This regex is conservative to avoid breaking other things
                new_content = re.sub(r'(z-index:\s*(9999|999|10000)\s*;?)', '', content)
                
                if new_content != content:
                    file_path.write_text(new_content, encoding="utf-8")
                    results["fixed_files"].append(str(file_path.relative_to(self.root_path)))
                    results["total_fixed"] += 1
            except Exception as e:
                print(f"Error fixing {file_path}: {e}")

        return results

    def scan_utf8_issues(self) -> Dict[str, Any]:
        """Scans for Mojibake characters."""
        results = {"scanned": 0, "issues": []}
        html_files = list(self.root_path.rglob("*.html"))

        for file_path in html_files:
            if self._is_ignored(file_path):
                continue
            
            results["scanned"] += 1
            try:
                content = file_path.read_text(encoding="utf-8")
                found_chars = []
                for bad_char in self.utf8_map.keys():
                    if bad_char in content:
                        found_chars.append(bad_char)
                
                if found_chars:
                    results["issues"].append({
                        "file": str(file_path.relative_to(self.root_path)),
                        "chars": found_chars
                    })
            except Exception as e:
                print(f"Error reading {file_path}: {e}")

        return results

    def fix_utf8_issues(self) -> Dict[str, Any]:
        """Fixes Mojibake characters."""
        results = {"scanned": 0, "fixed_files": [], "total_fixed": 0}
        html_files = list(self.root_path.rglob("*.html"))

        for file_path in html_files:
            if self._is_ignored(file_path):
                continue
            
            results["scanned"] += 1
            try:
                content = file_path.read_text(encoding="utf-8")
                new_content = content
                fixed_count = 0
                
                for bad_char, good_char in self.utf8_map.items():
                    if bad_char in new_content:
                        new_content = new_content.replace(bad_char, good_char)
                        fixed_count += 1
                
                if new_content != content:
                    file_path.write_text(new_content, encoding="utf-8")
                    results["fixed_files"].append(str(file_path.relative_to(self.root_path)))
                    results["total_fixed"] += fixed_count
            except Exception as e:
                print(f"Error fixing {file_path}: {e}")

        return results
