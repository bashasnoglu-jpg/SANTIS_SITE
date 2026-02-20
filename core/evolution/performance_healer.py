
import os
import logging
from pathlib import Path

logger = logging.getLogger("Evolution.PerformanceHealer")

class PerformanceHealer:
    """
    Santis Evolution - Performance Healer
    Identifies heavy assets that impact load time / LCP.
    """
    def __init__(self, base_dir=None):
        self.base_dir = Path(base_dir or os.getcwd())
        self.assets_dir = self.base_dir / "assets"
        
        # Thresholds (bytes)
        self.WARNING_THRESHOLD = 500 * 1024 # 500KB
        self.CRITICAL_THRESHOLD = 1 * 1024 * 1024 # 1MB

    def scan(self):
        """
        Scans for heavy files.
        """
        report = {
            "critical": [],
            "warning": [],
            "total_size": 0,
            "suggestion": ""
        }
        
        logger.info("⚡ Performance Healer: Scanning for heavy assets...")
        
        if not self.assets_dir.exists():
            return {"error": "Assets directory not found"}

        for file_path in self.assets_dir.rglob("*"):
            if not file_path.is_file(): continue
            
            size = file_path.stat().st_size
            report["total_size"] += size
            
            rel_path = str(file_path.relative_to(self.base_dir))
            
            if size > self.CRITICAL_THRESHOLD:
                report["critical"].append({
                    "file": rel_path,
                    "size_mb": round(size / (1024 * 1024), 2)
                })
                logger.warning(f"🚨 CRITICAL: {rel_path} ({report['critical'][-1]['size_mb']}MB)")
                
            elif size > self.WARNING_THRESHOLD:
                report["warning"].append({
                    "file": rel_path,
                    "size_kb": round(size / 1024, 2)
                })
                # logger.info(f"⚠️ WARNING: {rel_path} ({report['warning'][-1]['size_kb']}KB)")

        # Generate Caching Suggestions
        if report["critical"]:
            report["suggestion"] = "Consider lazy-loading these assets or moving them to a CDN. Ensure Cache-Control: max-age=31536000 is set."
        else:
            report["suggestion"] = "System is healthy. Standard caching rules apply."
            
        logger.info(f"Scan Complete. Critical: {len(report['critical'])}, Warning: {len(report['warning'])}")
        return report

if __name__ == "__main__":
    healer = PerformanceHealer()
    print(healer.scan())
