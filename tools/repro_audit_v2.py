
import asyncio
import os
import sys
from audit_engine import AuditEngine

# Force unbuffered stdout
sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("🚀 Starting AuditEngine Repro...")
    root = os.path.dirname(os.path.abspath(__file__))
    engine = AuditEngine(root)
    
    print(f"📂 Root: {root}")
    
    try:
        async for event in engine.run_flash_scan():
            print(f"📨 Event: {event.strip()}")
            if "type\":\"done" in event:
                print("✅ Scan Completed Successfully")
                break
    except Exception as e:
        print(f"💥 CRASH: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
