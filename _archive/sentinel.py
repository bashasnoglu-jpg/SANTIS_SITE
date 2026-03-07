import asyncio
import os
import json
import logging
from sentinel_core import SentinelCore

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SentinelManager")

# --- PHASE 20: FLEET CONFIGURATION ---
FLEET_CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sentinel_fleet.json")

class SentinelManager:
    def __init__(self):
        self.instances = []
        self.registry = {} # ID -> Instance

    def load_fleet_config(self):
        if not os.path.exists(FLEET_CONFIG_FILE):
            logger.warning("Fleet config not found. Using default.")
            return [{
                "id": "santis_main",
                "root": os.path.dirname(os.path.abspath(__file__)),
                "config": "sentinel_config.json"
            }]
        
        try:
            with open(FLEET_CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return [p for p in data.get("projects", []) if p.get("active", True)]
        except Exception as e:
            logger.error(f"Failed to load fleet config: {e}")
            return []

    async def start(self):
        logger.info("🚀 Sentinel Fleet Manager Starting...")
        projects = self.load_fleet_config()
        
        for p in projects:
            # Handle relative paths
            if p["root"].startswith("."):
                root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), p["root"]))
            else:
                root = p["root"]

            config_path = os.path.join(root, p["config"])
            
            # Check if root exists
            if not os.path.exists(root):
                logger.error(f"❌ Project Root not found: {root} for {p['id']}")
                continue

            instance = SentinelCore(
                project_id=p["id"], 
                project_root=root,
                config_path=config_path
            )
            self.instances.append(instance)
            self.registry[p["id"]] = instance
            await instance.start()
            
        logger.info(f"✅ Started {len(self.instances)} Sentinel Core instances.")

    async def stop(self):
        logger.info("🛑 Stopping Fleet...")
        for instance in self.instances:
            await instance.stop()

    def get_instance(self, project_id: str):
        return self.registry.get(project_id)

# Global Instance (for importing in server.py)
sentinel_manager = SentinelManager()

# Standalone Entry Point
# Standalone Entry Point
if __name__ == "__main__":
    import signal
    
    # Windows 3.10+ / 3.14+ Logic
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    async def main():
        # Handle shutdown signal
        stop_event = asyncio.Event()

        def signal_handler():
            stop_event.set()

        # Windows doesn't support add_signal_handler for SIGINT effectively in all loop types, 
        # but for clean shutdown we try. 
        # On Windows, Ctrl+C raises KeyboardInterrupt which asyncio.run handles by cancelling.
        
        await sentinel_manager.start()
        
        # Keep alive until stopped
        try:
            while not stop_event.is_set():
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            pass
        finally:
            await sentinel_manager.stop()

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        # Expected on Windows Ctrl+C
        pass
