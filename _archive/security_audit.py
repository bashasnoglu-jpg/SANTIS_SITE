import requests
import logging
from urllib.parse import urljoin

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("SecurityAudit")

class SecurityAuditEngine:
    """
    Santis Security Shield (V1.0)
    Checks for security headers and exposed sensitive files.
    """
    def __init__(self):
        self.sensitive_files = [
            ".env",
            ".git/HEAD",
            ".vscode/settings.json",
            "wp-config.php",
            "config.php",
            "backup.zip",
            "backup.sql",
            "dump.sql",
            "id_rsa",
            "server.py", # Own source code
            "deep_audit.py"
        ]
        
        self.security_headers = [
            "Strict-Transport-Security",
            "Content-Security-Policy",
            "X-Frame-Options",
            "X-Content-Type-Options",
            "Referrer-Policy",
            "Permissions-Policy"
        ]

    def run_security_scan(self, base_url):
        """
        Runs a comprehensive security scan on the given URL.
        """
        results = {
            "url": base_url,
            "headers": {},
            "exposed_files": [],
            "ssl_info": {"valid": False, "protocol": "Unknown"},
            "score": 100,
            "grade": "A"
        }
        
        # 1. Check Headers & SSL
        try:
            # Verify=False because local dev often uses self-signed or http
            response = requests.get(base_url, timeout=5, verify=False) 
            
            # Check Headers
            missing_headers = 0
            for header in self.security_headers:
                val = response.headers.get(header)
                if val:
                    results["headers"][header] = {"present": True, "value": val}
                else:
                    results["headers"][header] = {"present": False, "value": None}
                    missing_headers += 1
            
            # Penalize score for missing headers (soft penalty for localhost)
            results["score"] -= (missing_headers * 5)

            # SSL Check (Basic)
            if base_url.startswith("https"):
                results["ssl_info"]["valid"] = True
                results["ssl_info"]["protocol"] = "HTTPS"
            else:
                results["score"] -= 20 # Big penalty for HTTP
                results["ssl_info"]["protocol"] = "HTTP"

        except Exception as e:
            return {"error": f"Connection failed: {str(e)}"}

        # 2. Scan Sensitive Files
        exposed_count = 0
        for file in self.sensitive_files:
            file_url = urljoin(base_url, file)
            try:
                res = requests.head(file_url, timeout=2, verify=False)
                if res.status_code == 200:
                    results["exposed_files"].append(file)
                    exposed_count += 1
            except:
                pass
        
        if exposed_count > 0:
            results["score"] -= (exposed_count * 15) # Huge penalty for exposed files

        # 3. HTML Content Analysis (New in V1.1)
        try:
            from bs4 import BeautifulSoup
            if response.text:
                soup = BeautifulSoup(response.text, "html.parser")
                
                # Check 1: Inline Scripts (CSP Risk)
                # We look for scripts without src attribute, excluding harmless ones
                inline_scripts = soup.find_all("script", src=False)
                risky_inline = 0
                for s in inline_scripts:
                    text = (s.string or "").strip()
                    # Skip empty, JSON-LD, and simple config scripts
                    if not text:
                        continue
                    if s.get("type") == "application/ld+json":
                        continue
                    if text.startswith("window.SITE_ROOT") and len(text) < 40:
                        continue
                    risky_inline += 1
                if risky_inline > 0:
                     results["exposed_files"].append(f"⚠️ {risky_inline} Inline Script(s) Found (CSP Risk)")
                     results["score"] -= min(risky_inline * 3, 15)

                # Check 2: Target Blank without Noopener
                unsafe_links = 0
                for a in soup.find_all("a", target="_blank"):
                    rel = a.get("rel", [])
                    if isinstance(rel, str): rel = rel.split()
                    if "noopener" not in rel and "noreferrer" not in rel:
                        unsafe_links += 1
                
                if unsafe_links > 0:
                    results["exposed_files"].append(f"⚠️ {unsafe_links} Unsafe '_blank' links (Reverse Tabnabbing)")
                    results["score"] -= (unsafe_links * 2)

                # Check 3: Mixed Content (HTTP links on HTTPS)
                if base_url.startswith("https"):
                    mixed_content = 0
                    for tag in soup.find_all(src=True):
                        if tag["src"].startswith("http://"):
                            mixed_content += 1
                    
                    if mixed_content > 0:
                        results["exposed_files"].append(f"⚠️ {mixed_content} Mixed Content Resources (HTTP)")
                        results["score"] -= (mixed_content * 5)

        except ImportError:
            pass # BS4 not installed or error
        except Exception as e:
            logger.error(f"HTML Analysis Error: {e}")

        # 4. Grading
        score = max(0, results["score"])
        results["score"] = score
        
        if score >= 90: results["grade"] = "A"
        elif score >= 80: results["grade"] = "B"
        elif score >= 60: results["grade"] = "C"
        elif score >= 40: results["grade"] = "D"
        else: results["grade"] = "F"

        return results
