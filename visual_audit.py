import os
import asyncio
import logging
from pathlib import Path
from datetime import datetime
import hashlib
import shutil

# Try importing Playwright
try:
    from playwright.sync_api import sync_playwright
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False

# Try importing Pillow for comparison
try:
    from PIL import Image, ImageChops, ImageStat
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("VisualAudit")

class VisualAuditEngine:
    """
    Santis Visual Guardian (V1.0)
    Captures screenshots and detects visual regressions.
    """
    def __init__(self, storage_dir="visual_checkpoints"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)
        
        self.reference_dir = self.storage_dir / "reference"
        self.reference_dir.mkdir(exist_ok=True)
        
        self.current_dir = self.storage_dir / "current"
        self.current_dir.mkdir(exist_ok=True)
        
        self.diff_dir = self.storage_dir / "diffs"
        self.diff_dir.mkdir(exist_ok=True)

    def _get_filename(self, url):
        """Generates a safe filename from URL."""
        slug = url.replace("http://", "").replace("https://", "").replace(":", "_").replace("/", "_").replace("?", "_")
        if len(slug) > 100:
            slug = hashlib.md5(url.encode()).hexdigest()
        return f"{slug}.png"

    def _compare_images(self, ref_path, curr_path, diff_path):
        """
        Compares two images using Pillow. Returns match percentage (0-100).
        100 = Identical.
        """
        if not HAS_PILLOW:
            return 0, "Pillow library needed for comparison"

        try:
            img1 = Image.open(ref_path).convert('RGB')
            img2 = Image.open(curr_path).convert('RGB')
            
            # Ensure same size
            if img1.size != img2.size:
                return 0, f"Size mismatch: {img1.size} vs {img2.size}"

            # Compute difference
            diff_img = ImageChops.difference(img1, img2)
            
            # Save difference image if significant
            if diff_img.getbbox():
                diff_img.save(diff_path)
            
            # Calculate difference score RMS
            stat = ImageStat.Stat(diff_img)
            diff_sum = sum(stat.mean)
            
            # Normalize (Roughly)
            # 0 diff = 100 score
            # Higher diff = Lower score
            score = max(0, 100 - (diff_sum / 3.0)) # heuristic
            
            return score, None

        except Exception as e:
            return 0, str(e)

    def capture_and_compare(self, url, update_reference=False):
        """
        Captures screenshot of URL. (Sync version for ThreadPool)
        """
        if not HAS_PLAYWRIGHT:
            return {"error": "Playwright not installed. Run: pip install playwright && playwright install chromium"}

        filename = self._get_filename(url)
        ref_path = self.reference_dir / filename
        curr_path = self.current_dir / filename
        diff_path = self.diff_dir / filename

        try:
            with sync_playwright() as p:
                # Launch browser (headless)
                try:
                    browser = p.chromium.launch()
                    page = browser.new_page(viewport={"width": 1280, "height": 800})
                    
                    logger.info(f"📸 Snapping: {url}")
                    page.goto(url, wait_until="networkidle", timeout=10000)
                    
                    # Take screenshot
                    page.screenshot(path=str(curr_path), full_page=True)
                    browser.close()
                except Exception as e:
                    return {"error": f"Browser Error: {e}"}
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            logger.error(f"Playwright Critical Error: {repr(e)}\n{tb}")
            return {"error": f"Visual Check Failed (Playwright): {repr(e)} | {e}"}

        # Logic
        result = {
            "url": url,
            "timestamp": datetime.now().isoformat(),
            "status": "CAPTURED"
        }

        # Check Reference
        if update_reference or not ref_path.exists():
            # Save as reference
            import shutil
            shutil.copy2(curr_path, ref_path)
            result["status"] = "REFERENCE_UPDATED"
            result["score"] = 100
        else:
            # Compare
            score, err = self._compare_images(ref_path, curr_path, diff_path)
            if err:
                result["error"] = err
                result["score"] = 0
            else:
                result["score"] = round(score, 2)
                result["match"] = "PERFECT" if score == 100 else "CHANGED"
                result["diff_image"] = str(diff_path) if score < 100 else None

        return result
