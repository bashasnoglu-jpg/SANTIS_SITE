
import os
import logging
from pathlib import Path

logger = logging.getLogger("Evolution.CodePruner")

class CodePruner:
    """
    Santis Evolution - Code Pruner
    Identifies potentially unused CSS/JS files.
    """
    def __init__(self, base_dir=None):
        self.base_dir = Path(base_dir or os.getcwd())
        self.assets_dir = self.base_dir / "assets"
        self.scan_dirs = [self.assets_dir / "css", self.assets_dir / "js"]
        
    def scan(self):
        """
        Scans for unused files.
        """
        report = {"unused": [], "analyzed": 0}
        
        # 1. Build Index of Content
        # We scan HTML, JS, PY files to see if asset filenames are mentioned.
        content_index = ""
        extensions_to_scan = [".html", ".js", ".py"]
        
        logger.info("🔍 Building Content Index...")
        for ext in extensions_to_scan:
            for file_path in self.base_dir.rglob(f"*{ext}"):
                # Skip asset files themselves from index to avoid self-reference (e.g. source map)
                # But JS files index other JS files.
                # Let's just read everything except node_modules or venv.
                if "venv" in str(file_path) or "node_modules" in str(file_path):
                    continue
                    
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content_index += f.read()
                except Exception:
                    pass
                    
        # 2. Check Assets
        logger.info("🕵️ checking assets against index...")
        for scan_dir in self.scan_dirs:
            if not scan_dir.exists(): continue
            
            for asset in scan_dir.rglob("*"):
                if asset.is_dir(): continue
                if asset.suffix not in [".css", ".js"]: continue
                
                report["analyzed"] += 1
                
                # Simple string check (Primitive but effective for distinct filenames)
                if asset.name not in content_index:
                    # Double check: maybe referenced without extension? (Rare for CSS/JS)
                    # Maybe referenced with relative path?
                    # This is a heuristic.
                    report["unused"].append(str(asset.relative_to(self.base_dir)))
                    logger.info(f"🗑️ Potential Zombie: {asset.name}")

        return report

if __name__ == "__main__":
    pruner = CodePruner()
    print(pruner.scan())
