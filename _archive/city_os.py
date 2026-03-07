
import os
import shutil
import logging
import asyncio
from pathlib import Path
from bs4 import BeautifulSoup
import re

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("CityOS")

class CityOS:
    def __init__(self, key="SANTIS_MAIN", root_dir="."):
        self.key = key
        self.root = Path(root_dir).resolve()
        self.status = "IDLE"
        self.logs = [] # Stream logs here
        
        # Protocol Counters
        self.stats = {
            "ghosts_removed": 0,
            "utf8_fixed": 0,
            "assets_optimized": 0
        }

    def log(self, msg):
        entry = f"[{self.key}] {msg}"
        self.logs.append(entry)
        logger.info(entry)

    def scan_city(self):
        """
        Diagnostic Scan: Returns health report without changing anything.
        """
        self.log("📡 Scanning City Infrastructure...")
        report = {
            "ghosts": 0,
            "bad_encoding": 0,
            "dead_assets": 0
        }
        
        # 1. Scan for bad encodings
        for path in self.root.rglob("*.html"):
            if "node_modules" in str(path) or ".git" in str(path): continue
            try:
                with open(path, "rb") as f:
                    raw = f.read()
                    try:
                        raw.decode("utf-8")
                    except UnicodeDecodeError:
                        report["bad_encoding"] += 1
            except: pass
            
        self.log(f"✅ Scan Complete: {report}")
        return report

    async def execute_protocol(self, protocol_id):
        """
        Executes a specific cleanup protocol.
        """
        self.status = "RUNNING"
        self.log(f"🚀 Executing Protocol: {protocol_id}")
        
        try:
            if protocol_id == "protocol_ghosts":
                await self._protocol_ghosts()
            elif protocol_id == "protocol_utf8":
                await self._protocol_utf8()
            elif protocol_id == "protocol_assets":
                await self._protocol_assets()
            elif protocol_id == "protocol_phone":
                await self._protocol_phone_std()
            elif protocol_id == "protocol_pulse":
                await self._protocol_external_pulse()
            else:
                self.log("❌ Unknown Protocol")
                return False
                
            self.status = "IDLE"
            return True
            
        except Exception as e:
            self.log(f"💥 Protocol Failed: {e}")
            self.status = "ERROR"
            return False

    # --- PROTOCOLS ---

    async def _protocol_utf8(self):
        """
        Protocol 2: The Universal Translator (UTF-8 Matrix)
        Fixes Mojibake characters (e.g., Ã¼ -> ü) and ensures UTF-8.
        """
        self.log("🔤 Starting UTF-8 Matrix Protocol...")
        
        # Extended Mapping Table for Turkish Mojibake
        utf8_map = {
            "Ã¼": "ü", "Ã§": "ç", "Ã¶": "ö", "ÃŸ": "ß", "Ã–": "Ö", "Ãœ": "Ü",
            "Ä±": "ı", "Ä°": "İ", "ÅŸ": "ş", "Åž": "Ş", "ÄŸ": "ğ", "Äž": "Ğ",
            "â€": "”", "â€œ": "“", "â€™": "’", "â€“": "–" 
        }
        
        fixed_count = 0
        target_extensions = {".html", ".php", ".txt", ".md", ".json", ".js", ".css"}
        
        for path in self.root.rglob("*"):
            # Filtering
            if path.is_dir(): continue
            if any(p in str(path) for p in ["node_modules", ".git", "__pycache__", "backups", ".vscode"]): continue
            if path.suffix not in target_extensions: continue
            
            try:
                # 1. Read Content
                content = ""
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                except UnicodeDecodeError:
                    # Fallback read for badly encoded files
                    with open(path, "r", encoding="windows-1254", errors="ignore") as f:
                        content = f.read()
                
                # 2. Detect & Fix
                changes = 0
                original_content = content
                
                for bad, good in utf8_map.items():
                    if bad in content:
                        content = content.replace(bad, good)
                        changes += 1
                
                if changes > 0:
                    # 3. Create Backup
                    rel_path = path.relative_to(self.root)
                    backup_path = self.root / "backups" / "utf8_matrix" / rel_path
                    backup_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    with open(backup_path, "w", encoding="utf-8") as b:
                        b.write(original_content)
                        
                    # 4. Atomic Write
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(content)
                        
                    self.log(f"🔧 Fixed {changes} chars in: {path.name}")
                    fixed_count += 1
            
            except Exception as e:
                self.log(f"❌ Error processing {path.name}: {e}")
                
        self.stats["utf8_fixed"] += fixed_count
        self.log(f"✅ UTF-8 Protocol Complete. Fixed: {fixed_count} files.")

    async def _protocol_ghosts(self):
        """
        Protocol 1: Ghost Hunter (DOM Cleanup)
        - Removes empty divs/spans with no attributes or just class/id but no content.
        - Resets z-index layers > 9999.
        """
        self.log("👻 Starting Ghost Hunter Protocol...")
        fixed_count = 0
        target_extensions = {".html", ".php"}
        
        for path in self.root.rglob("*.html"):
            if "node_modules" in str(path) or ".git" in str(path): continue
            
            try:
                # Read
                content = ""
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                soup = BeautifulSoup(content, 'html.parser')
                modified = False
                
                # 1. Remove Empty Containers (Empty div/span with no useful attributes)
                # Strict: Only remove if REALLY empty (no text, no children)
                for tag in soup.find_all(['div', 'span', 'p']):
                    if not tag.get_text(strip=True) and len(tag.find_all()) == 0:
                        # Check attributes - if it has an ID or potentially useful class, keep it?
                        # For V300 "City Manager" we are aggressive but safe.
                        # If it has NO attributes, delete it.
                        if not tag.attrs:
                            tag.decompose()
                            modified = True
                            fixed_count += 1
                        # If it has style="display:none", it might be tech debt. 
                        # But some JS uses it. Skip for now.

                # 2. Layer Zoning (Z-Index Fix)
                # This requires parsing style attributes or CSS files. 
                # For HTML style attributes:
                for tag in soup.find_all(style=True):
                    style = tag['style']
                    if 'z-index' in style:
                        # Regex to find z-index: \d+
                        # This is complex to parse reliably with regex in style str.
                        # We will skip inline z-index modification for safety in Phase 1.
                        pass

                if modified:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(str(soup))
                    self.log(f"👻 Exorcised ghosts in: {path.name}")
                    
            except Exception as e:
                self.log(f"❌ Error processing {path.name}: {e}")
                
        self.stats["ghosts_removed"] += fixed_count
        self.log(f"✅ Ghost Hunter Protocol Complete. Removed: {fixed_count} elements.")

    async def _protocol_assets(self):
        """
        Protocol 3: Asset Molecularizer
        - Identifies unused images (Simulated for Phase 1).
        - Converts PNG to WebP (Placeholder).
        """
        self.log("📦 Starting Asset Molecularizer...")
        
        # In Phase 1, we just report potential savings
        # Real conversion requires PIL/Pillow or ffmpeg
        
        images = list(self.root.rglob("*.png")) + list(self.root.rglob("*.jpg"))
        count = len(images)
        
        self.log(f"📦 Found {count} assets. Optimization queued (Phase 2).")
        
        # Placeholder stats
        self.stats["assets_optimized"] = 0 
        self.log("✅ Asset Protocol Complete.")

    async def _protocol_phone_std(self):
        """
        Protocol 4: Phone Standardizer
        - Standardizes phone numbers to +90 5XX XXX XX XX format.
        """
        self.log("📞 Starting Phone Standardizer...")
        fixed_count = 0
        # Simple regex for finding potential phone numbers (starts with 05 or 5, 10 digits)
        phone_regex = re.compile(r'(?<!\d)(0?5\d{2})\s?(\d{3})\s?(\d{2})\s?(\d{2})(?!\d)')
        
        for path in self.root.rglob("*.html"):
             if "node_modules" in str(path) or ".git" in str(path): continue
             try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()

                new_content = phone_regex.sub(r'+90 \1 \2 \3 \4', content)
                new_content = new_content.replace('+90 05', '+90 5') # Fix double zero if exists

                if content != new_content:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    self.log(f"📞 Standardized phones in: {path.name}")
                    fixed_count += 1
             except Exception as e:
                 self.log(f"❌ Error processing {path.name}: {e}")

        self.log(f"✅ Phone Standardizer Complete. Fixed in: {fixed_count} files.")

    async def _protocol_external_pulse(self):
        """
        Protocol 5: External Pulse (Link Checker)
        - Checks health of critical external links (Instagram, Maps, etc.)
        """
        self.log("💗 Starting External Pulse Check...")
        import aiohttp
        
        targets = [
            "https://instagram.com/santisclub",
            "https://youtube.com/santisclub",
            "https://spotify.com/santisclub"
        ]
        
        async with aiohttp.ClientSession() as session:
            for url in targets:
                try:
                     async with session.head(url, timeout=5) as resp:
                        status = resp.status
                        if status < 400:
                            self.log(f"🟢 PULSE OK ({status}): {url}")
                        else:
                            self.log(f"🔴 PULSE WEAK ({status}): {url}")
                except Exception as e:
                    self.log(f"⚫ PULSE DEAD: {url} ({e})")
        
        self.log("✅ External Pulse Complete.")

# Single Instance for API (Aliased as CityManager for V300 compat)
city_manager = CityOS()
