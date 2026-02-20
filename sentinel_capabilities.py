
import importlib.util
import os

class SentinelCapabilities:
    """
    Detects available features and modules for Sentinel.
    """

    @staticmethod
    def check():
        caps = {
            "visual_ai": False,
            "memory": False,
            "auto_fix": False,
            "reporting": False,
            "security_audit": False,
            "performance_audit": False,
            "deep_audit": False
        }

        # Check Visual Audit (Playwright)
        try:
            import visual_audit
            if visual_audit.HAS_PLAYWRIGHT:
                caps["visual_ai"] = True
        except ImportError:
            pass

        # Check Memory
        try:
            import sentinel_memory
            caps["memory"] = True
        except ImportError:
            pass

        # Check Auto-Fix
        try:
            import auto_fixer
            caps["auto_fix"] = True
        except ImportError:
            pass

        # Check Reporting (ReportLab)
        try:
            import sentinel_pdf
            caps["reporting"] = True
        except ImportError:
            pass
        
        # Check Security Audit
        try:
            import security_audit
            caps["security_audit"] = True
        except ImportError:
            pass

        # Check Performance Audit
        try:
            import performance_audit
            caps["performance_audit"] = True
        except ImportError:
            pass
            
        # Check Deep Audit
        try:
            import deep_audit
            caps["deep_audit"] = True
        except ImportError:
            pass

        return caps

if __name__ == "__main__":
    print(SentinelCapabilities.check())
