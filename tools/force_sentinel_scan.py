
import asyncio
import os
import sys
from pathlib import Path

# Fix Windows Asyncio Loop
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from sentinel_core import SentinelCore
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")

async def force_start_sentinel():
    print("🚀 Initializing Sentinel Core for SANTIS_MAIN...")
    
    project_root = os.getcwd() # c:\Users\tourg\Desktop\SANTIS_SITE
    config_path = os.path.join(project_root, "sentinel_config.json")
    
    if not os.path.exists(config_path):
        print(f"❌ Config not found at {config_path}")
        return

    # Initialize
    core = SentinelCore("SANTIS_MAIN", project_root)
    
    print(f"📊 Current Status: {core.status}")
    
    # Force Start a Cycle
    print("⚡ Triggering Immediate Scan Cycle...")
    await core.run_cycle()
    
    print(f"✅ Cycle Complete. New Status: {core.status}")
    print("Check admin panel for updates.")

if __name__ == "__main__":
    asyncio.run(force_start_sentinel())
