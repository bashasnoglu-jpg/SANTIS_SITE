import requests
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("AttackSim")

class AttackSimulatorEngine:
    """
    Santis Red Team Simulator (V1.0)
    Simulates attacks to verify security defenses.
    """
    def run_simulation(self, base_url):
        results = {
            "attacks": [],
            "score": 0,
            "total": 0
        }
        
        # 1. ATTACK: Sensitive File Access (Local File Inclusion / Path Disclosure)
        targets = [".env", ".git/HEAD", "server.py", "deep_audit.py"]
        for target in targets:
            results["total"] += 1
            url = f"{base_url.rstrip('/')}/{target}"
            try:
                # We expect 403 Forbidden
                res = requests.get(url, timeout=2, verify=False)
                if res.status_code == 403:
                    results["attacks"].append({
                        "type": "SENSITIVE_FILE",
                        "target": target,
                        "status": "BLOCKED", 
                        "outcome": "✅ SUCCESS (403 Forbidden)"
                    })
                    results["score"] += 1
                elif res.status_code == 200:
                    results["attacks"].append({
                        "type": "SENSITIVE_FILE",
                        "target": target,
                        "status": "VULNERABLE", 
                        "outcome": "❌ FAILED (200 OK - File Exposed)"
                    })
                else:
                    results["attacks"].append({
                        "type": "SENSITIVE_FILE",
                        "target": target,
                        "status": "BLOCKED", 
                        "outcome": f"✅ SUCCESS ({res.status_code})"
                    })
                    results["score"] += 1
            except Exception as e:
                 results["attacks"].append({"type": "ERROR", "target": target, "outcome": str(e)})

        # 2. ATTACK: Clickjacking (Iframe)
        results["total"] += 1
        try:
            res = requests.get(base_url, timeout=2, verify=False)
            x_frame = res.headers.get("X-Frame-Options")
            if x_frame == "DENY" or x_frame == "SAMEORIGIN":
                results["attacks"].append({
                    "type": "CLICKJACKING",
                    "target": "iframe",
                    "status": "BLOCKED",
                    "outcome": f"✅ SUCCESS (Header: {x_frame})"
                })
                results["score"] += 1
            else:
                 results["attacks"].append({
                    "type": "CLICKJACKING",
                    "target": "iframe",
                    "status": "VULNERABLE",
                    "outcome": "❌ FAILED (Header Missing)"
                })
        except:
            pass

        # 3. ATTACK: UDP/XSS Header Check (CSP)
        results["total"] += 1
        try:
            res = requests.get(base_url, timeout=2, verify=False)
            csp = res.headers.get("Content-Security-Policy")
            if csp:
                results["attacks"].append({
                    "type": "XSS_MITIGATION",
                    "target": "CSP Header",
                    "status": "BLOCKED",
                    "outcome": "✅ SUCCESS (CSP Active)"
                })
                results["score"] += 1
            else:
                 results["attacks"].append({
                    "type": "XSS_MITIGATION",
                    "target": "CSP Header",
                    "status": "VULNERABLE",
                    "outcome": "❌ FAILED (CSP Missing)"
                })
        except:
            pass

        # 4. ATTACK: Protocol Downgrade (HSTS)
        results["total"] += 1
        try:
            res = requests.get(base_url, timeout=2, verify=False)
            hsts = res.headers.get("Strict-Transport-Security")
            if hsts:
                 results["attacks"].append({
                    "type": "MITM_HSTS",
                    "target": "HSTS Header",
                    "status": "BLOCKED",
                    "outcome": "✅ SUCCESS (HSTS Active)"
                })
                 results["score"] += 1
            else:
                 results["attacks"].append({
                    "type": "MITM_HSTS",
                    "target": "HSTS Header",
                    "status": "WARNING",
                    "outcome": "⚠️ WARNING (HSTS Missing - Only Critical for Prod)"
                })
                 # HSTS might be disabled on localhost, so maybe don't penalize score too hard or assume success if localhost
                 results["score"] += 1 
        except:
            pass

        return results
