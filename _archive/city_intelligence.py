
import asyncio
import aiohttp
import logging
import json
import re
import time
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from core.evolution.cultural_scanner import CulturalScanner

# Logging Setup
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("CityIntel")

class CityIntelligence:
    def __init__(self, root_dir=".", base_url="http://localhost:8000"):
        self.root = Path(root_dir).resolve()
        self.base_url = base_url
        self.status = "IDLE"
        self.report = {}
        
        # Modules
        self.crawler = QuantumCrawler(self.base_url)
        self.cortex = SemanticCortex(self.root)
        
    async def run_full_scan(self):
        """Runs all intelligence modules."""
        self.status = "RUNNING"
        logger.info("🕵️‍♂️ Starting Ultra Deep Research...")
        
        # 1. Quantum Crawl (Network & Tech)
        crawl_results = await self.crawler.start_scan()
        
        # 2. Semantic Analysis (Content & Tone)
        semantic_results = await self.cortex.analyze_content()
        
        # 3. Fuse Data
        self.report = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "health_score": self._calculate_score(crawl_results, semantic_results),
            "crawler": crawl_results,
            "semantic": semantic_results,
            "ux_lab": {"status": "pending", "note": "Requires Playwright Module"}
        }
        
        # Save Report
        self._save_report()
        self.status = "COMPLETED"
        return self.report

    def _calculate_score(self, crawl, semantic):
        # Placeholder scoring logic
        score = 100
        score -= len(crawl.get("broken_links", [])) * 2
        score -= len(semantic.get("tone_violations", [])) * 5
        return max(0, score)

    def _save_report(self):
        report_path = self.root / "reports" / "PROJECT_INTELLIGENCE_REPORT.json"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(self.report, f, indent=2, ensure_ascii=False)
        logger.info(f"📄 Report saved to {report_path}")

class QuantumCrawler:
    def __init__(self, base_url, max_pages=500):
        self.base_url = base_url
        self.visited = set()
        self.queue = [base_url]
        self.broken_links = []
        self.assets = {"used": set(), "missing": []}
        self.max_pages = max_pages
        
    async def start_scan(self):
        logger.info("🕸️ Quantum Crawler Activated...")
        async with aiohttp.ClientSession() as session:
            while self.queue and len(self.visited) < self.max_pages:
                url = self.queue.pop(0)
                if url in self.visited: continue
                
                self.visited.add(url)
                await self._process_page(session, url)
                
        return {
            "pages_scanned": len(self.visited),
            "broken_links": self.broken_links,
            "missing_assets": self.assets["missing"]
        }
    
    async def _process_page(self, session, url):
        try:
            async with session.get(url, timeout=5) as response:
                if response.status != 200:
                    self.broken_links.append({"url": url, "status": response.status})
                    return
                
                html = await response.text()
                soup = BeautifulSoup(html, "html.parser")
                
                # Extract Links
                for a in soup.find_all("a", href=True):
                    link = urljoin(url, a["href"])
                    if link.startswith(self.base_url) and link not in self.visited:
                        self.queue.append(link)
                
                # Extract Assets (Img, Script, Link)
                for tag in soup.find_all(["img", "script", "link"]):
                    src = tag.get("src") or tag.get("href")
                    if src:
                        full_src = urljoin(url, src)
                        self.assets["used"].add(full_src)

        except Exception as e:
            logger.error(f"Failed to crawl {url}: {e}")

class SemanticCortex:
    def __init__(self, root_dir):
        self.root = root_dir
        self.luxury_dictionary = {
            "banned": [
                "ucuz", "şok fiyat", "indirim", "bedava", "en iyi fiyat", "patron çıldırdı",
                "herşey dahil", "sınırsız", "kampanya", "acele et", "tükeniyor", "kaçırma"
            ],
            "required": ["Santis Club", "Deneyim", "Ritüel", "Huzur", "Arınma", "Denge", "Saf", "Doğal"],
            "concepts": {
                "hamam": ["kurna", "göbek taşı", "sıcaklık", "kese", "köpük"],
                "massage": ["derin doku", "aromaterapi", "kas", "gevşeme"]
            }
        }
        self.tone_violations = []
        self.tone_violations = []
        self.consistency_issues = []
        self.scanner = CulturalScanner()

    async def analyze_content(self):
        logger.info("🧠 Semantic Cortex Scanning...")
        # Check all HTML files
        for path in self.root.rglob("*.html"):
            path_str = str(path).lower()
            if any(x in path_str for x in ["node_modules", ".git", "backups", "backup", "_old", "_legacy", "archive"]): 
                continue
            
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content_raw = f.read()
                    content_lower = content_raw.lower()
                    
                # 1. Tone Guard
                for banned in self.luxury_dictionary["banned"]:
                    # Use regex with word boundaries to avoid partial matches
                    pattern = r"\b" + re.escape(banned) + r"\b"
                    if re.search(pattern, content_lower, re.IGNORECASE):
                        self.tone_violations.append({
                            "file": str(path.relative_to(self.root)),
                            "violation": banned,
                            "context": f"Found banned term '{banned}' (Regex Match)"
                        })
                
                # 2. Consistency Checks
                if "santis spa" in content_lower and "santis club" not in content_lower:
                     self.consistency_issues.append({
                        "file": str(path.relative_to(self.root)),
                        "issue": "Used 'Santis SPA' instead of Brand Name 'Santis Club'"
                    })
                
                if "lorem ipsum" in content_lower:
                    self.consistency_issues.append({
                        "file": str(path.relative_to(self.root)),
                        "issue": "Lorem Ipsum placeholder text detected."
                    })

                # 3. Ultra Cultural Analysis (The Cortex)
                # Pass RAW content for CAPS detection, let scanner handle cleaning
                culture_audit = self.scanner.scan_text(content_raw)
                
                # If score is low or violations found, log it
                if culture_audit["luxury_score"] < 60 or culture_audit["violations"]:
                    self.consistency_issues.append({
                        "file": str(path.relative_to(self.root)),
                        "score": culture_audit["luxury_score"],
                        "tone": culture_audit["tone_status"],
                        "violations": culture_audit["violations"],
                        "keywords": culture_audit["luxury_keywords_found"]
                    })
                    
            except Exception as e:
                logger.error(f"Error scanning {path.name}: {e}")
                pass
                
        return {
            "tone_violations": self.tone_violations, # Legacy (keep for compatibility if needed)
            "cultural_report": self.consistency_issues # New detailed report
        }

# API Instance
city_intelligence = CityIntelligence()
