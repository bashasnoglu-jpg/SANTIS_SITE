
import os
from pathlib import Path
from typing import List, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AssetOptimizer")

class AssetOptimizer:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.ignore_patterns = [
            ".git", "__pycache__", ".vscode", "node_modules", 
            "PROMPT_DROP_ZONE.txt", "*.bat", "*.py", "*.json"
        ]
        self.image_extensions = {".jpg", ".jpeg", ".png"}

    def _is_ignored(self, file_path: Path) -> bool:
        for pattern in self.ignore_patterns:
            if "*" in pattern:
                if file_path.match(pattern):
                    return True
            else:
                if pattern in file_path.parts:
                    return True
        return False

    def scan_heavy_assets(self, threshold_kb: int = 500) -> Dict[str, Any]:
        """Scans for images larger than the threshold."""
        results = {"scanned": 0, "heavy_files": []}
        
        # Scan all files recursively
        for file_path in self.root_path.rglob("*"):
            if not file_path.is_file() or self._is_ignored(file_path):
                continue
                
            if file_path.suffix.lower() in self.image_extensions:
                results["scanned"] += 1
                size_kb = file_path.stat().st_size / 1024
                
                if size_kb > threshold_kb:
                    results["heavy_files"].append({
                        "file": str(file_path.relative_to(self.root_path)),
                        "size_kb": round(size_kb, 2),
                        "type": file_path.suffix.lower()
                    })

        return results

    def optimize_assets(self, threshold_kb: int = 500) -> Dict[str, Any]:
        """
        Converts heavy images to WebP using PIL.
        Requires: pip install pillow
        """
        results = {"scanned": 0, "converted": [], "errors": []}
        
        try:
            from PIL import Image
        except ImportError:
            return {"error": "Pillow library not found. Please install: pip install pillow"}

        for file_path in self.root_path.rglob("*"):
            if not file_path.is_file() or self._is_ignored(file_path):
                continue
                
            if file_path.suffix.lower() in self.image_extensions:
                results["scanned"] += 1
                size_kb = file_path.stat().st_size / 1024
                
                if size_kb > threshold_kb:
                    try:
                        # Open and Optimize
                        with Image.open(file_path) as img:
                            # Create new path
                            new_path = file_path.with_suffix(".webp")
                            
                            # Skip if WebP already exists and is smaller
                            if new_path.exists() and new_path.stat().st_size < file_path.stat().st_size:
                                continue
                                
                            # Convert
                            img.save(new_path, "WEBP", quality=80, optimize=True)
                            
                            results["converted"].append({
                                "original": str(file_path.relative_to(self.root_path)),
                                "new": str(new_path.relative_to(self.root_path)),
                                "saved_kb": round(size_kb - (new_path.stat().st_size / 1024), 2)
                            })
                            
                            logger.info(f"✅ Converted: {file_path.name} -> {new_path.name}")
                            
                    except Exception as e:
                        results["errors"].append({
                            "file": str(file_path.relative_to(self.root_path)),
                            "error": str(e)
                        })

        return results
