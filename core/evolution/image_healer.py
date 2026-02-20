
import os
import logging
from pathlib import Path
import time

logger = logging.getLogger("Evolution.ImageHealer")

class ImageHealer:
    """
    Santis Evolution - Image Healer
    Automatically converts legacy formats (JPG/PNG) to Next-Gen WebP.
    """
    def __init__(self, base_dir=None):
        self.base_dir = base_dir or os.getcwd()
        self.assets_dir = Path(self.base_dir) / "assets" / "img"
        try:
            from PIL import Image
            self.Image = Image
            self.enabled = True
        except ImportError:
            logger.warning("❌ Pillow not found. Image Healer disabled.")
            self.enabled = False

    def heal(self):
        """
        Scans and converts images to WebP.
        Returns report of converted files.
        """
        if not self.enabled:
            return {"status": "skipped", "reason": "No Pillow library"}

        report = {
            "converted": [],
            "saved_bytes": 0,
            "already_optimized": 0,
            "total_savings": 0,
            "errors": []
        }

        logger.info("🎨 Image Healer: Scanning for optimization candidates...")
        
        # extensions to look for
        targets = ["*.jpg", "*.jpeg", "*.png"]
        
        count = 0
        for ext in targets:
            # Use rglob for recursive search
            for file_path in self.assets_dir.rglob(ext):
                count += 1
                # Check if .webp version already exists
                webp_path = file_path.with_suffix(".webp")
                if webp_path.exists():
                    report["already_optimized"] += 1
                    report["total_savings"] += (file_path.stat().st_size - webp_path.stat().st_size)
                    continue

                try:
                    # Convert
                    original_size = file_path.stat().st_size
                    
                    # Open and Convert
                    img = self.Image.open(file_path)
                    
                    img.save(webp_path, "WEBP", quality=80) 
                    
                    new_size = webp_path.stat().st_size
                    saved = original_size - new_size
                    
                    if saved > 0:
                        report["converted"].append(str(file_path.name))
                        report["saved_bytes"] += saved
                        report["total_savings"] += saved
                        logger.info(f"✨ Optimized: {file_path.name} ({saved/1024:.1f}KB saved)")
                    else:
                        # WebP is larger, discard it
                        webp_path.unlink()
                        logger.info(f"⚠️ Skipped: {file_path.name} (WebP was larger)")
                    
                except Exception as e:
                    # logger.error(f"Failed: {file_path.name}: {e}")
                    report["errors"].append(str(file_path.name))
        
        logger.info(f"Scan Complete. Optimized: {len(report['converted'])}, Already: {report['already_optimized']}, Total Saved: {report['total_savings']/1024/1024:.2f}MB")
        return report
        
        logger.info(f"Scanned {count} files.")
        return report

if __name__ == "__main__":
    healer = ImageHealer()
    print(healer.heal())
