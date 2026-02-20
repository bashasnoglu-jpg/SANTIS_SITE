import asyncio
import logging
from datetime import datetime
import json

# Try importing Playwright
try:
    from playwright.sync_api import sync_playwright
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("PerformanceAudit")

class PerformanceAuditEngine:
    """
    Santis Speed Demon (V1.0)
    Measures Core Web Vitals and Performance Metrics using Playwright.
    """
    def __init__(self):
        pass

    def run_performance_test(self, url):
        """
        Navigates to URL and collects performance metrics. (Sync)
        """
        if not HAS_PLAYWRIGHT:
            return {"error": "Playwright not installed."}

        metrics = {
            "url": url,
            "timestamp": datetime.now().isoformat(),
            "ttfb": 0,
            "fcp": 0,
            "lcp": 0,
            "cls": 0,
            "dom_load": 0,
            "window_load": 0,
            "resources": {"total_size": 0, "count": 0, "breakdown": {}},
            "score": 0
        }

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch()
                page = browser.new_page()
                
                # 1. Setup CDP Session for raw metrics
                client = page.context.new_cdp_session(page)
                client.send("Performance.enable")

                # 2. Navigate and measure TTFB
                start_time = datetime.now()
                response = page.goto(url, wait_until="networkidle", timeout=15000)
                
                if not response:
                    return {"error": "No response from server"}

                # TTFB Calculation (approx)
                timing = response.request.timing
                if timing:
                    metrics["ttfb"] = int(timing["responseStart"] - timing["requestStart"])

                # 3. Get Navigation Timing API
                nav_timing = page.evaluate("performance.getEntriesByType('navigation')[0].toJSON()")
                metrics["dom_load"] = int(nav_timing.get("domContentLoadedEventEnd", 0))
                metrics["window_load"] = int(nav_timing.get("loadEventEnd", 0))

                # 4. Get Performance Metrics via JS (LCP, CLS, FCP)
                
                # FCP
                fcp_list = page.evaluate("performance.getEntriesByName('first-contentful-paint')")
                if fcp_list:
                    metrics["fcp"] = int(fcp_list[0].get("startTime", 0))

                # LCP (Approximation via largest element or JS observer hack)
                lcp_eval = page.evaluate("""() => {
                    return new Promise((resolve) => {
                        let lcp = 0;
                        const observer = new PerformanceObserver((entryList) => {
                            const entries = entryList.getEntries();
                            const lastEntry = entries[entries.length - 1];
                            lcp = lastEntry.startTime;
                        });
                        observer.observe({ type: 'largest-contentful-paint', buffered: true });
                        
                        // Wait a bit then resolve
                        setTimeout(() => resolve(lcp), 500);
                    });
                }""")
                metrics["lcp"] = int(lcp_eval)

                # CLS (Approximation)
                cls_eval = page.evaluate("""() => {
                   return new Promise((resolve) => {
                        let cls = 0;
                        const observer = new PerformanceObserver((entryList) => {
                            for (const entry of entryList.getEntries()) {
                                if (!entry.hadRecentInput) {
                                    cls += entry.value;
                                }
                            }
                        });
                        observer.observe({type: 'layout-shift', buffered: true});
                        setTimeout(() => resolve(cls), 500);
                   });
                }""")
                metrics["cls"] = float(f"{cls_eval:.3f}")

                # 5. Resource Analysis
                resources = page.evaluate("performance.getEntriesByType('resource')")
                total_bytes = 0
                breakdown = {"image": 0, "script": 0, "css": 0, "other": 0}
                
                for res in resources:
                    size = res.get("transferSize", 0)
                    total_bytes += size
                    name = res.get("name", "").lower()
                    
                    if name.endswith((".jpg", ".png", ".webp", ".svg", ".jpeg")):
                        breakdown["image"] += size
                    elif name.endswith(".js"):
                        breakdown["script"] += size
                    elif name.endswith(".css"):
                        breakdown["css"] += size
                    else:
                        breakdown["other"] += size
                
                metrics["resources"]["total_size"] = round(total_bytes / 1024, 1) # KB
                metrics["resources"]["count"] = len(resources)
                metrics["resources"]["breakdown"] = {k: round(v/1024, 1) for k, v in breakdown.items()}

                # 6. Calculate Score (Simple Weighted Algo)
                score = 0
                # FCP Score
                if metrics["fcp"] < 1000: score += 25
                elif metrics["fcp"] < 3000: score += 15
                else: score += 5
                
                # LCP Score
                if metrics["lcp"] < 2500: score += 25
                elif metrics["lcp"] < 4000: score += 15
                else: score += 5
                
                # CLS Score
                if metrics["cls"] < 0.1: score += 25
                elif metrics["cls"] < 0.25: score += 15
                else: score += 5
                
                # TTFB Score
                if metrics["ttfb"] < 200: score += 25
                elif metrics["ttfb"] < 600: score += 15
                else: score += 5
                
                metrics["score"] = score

                browser.close()
                return metrics

        except Exception as e:
            logger.error(f"Performance Test Info: {e}")
            import traceback
            logger.error(traceback.format_exc())
            # Even if failed, return partial
            return {"error": str(e), "metrics": metrics}

