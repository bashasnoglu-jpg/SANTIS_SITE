
import asyncio
import json
import os
from audit_engine import AuditEngine
from master_cleaner import MasterCleaner

async def main():
    print("🚀 STARTING ULTRA DEEP SYSTEM SCAN...")
    root = os.getcwd()
    
    # 1. Audit Engine (Links & Assets)
    print("\n📊 PHASE 1: LINK & ASSET AUDIT")
    audit = AuditEngine(root)
    audit_results = {
        "scanned": 0,
        "assets": 0,
        "errors": []
    }
    
    try:
        async for event in audit.run_flash_scan():
            if "data: " in event:
                data = json.loads(event.replace("data: ", ""))
                if data.get("type") == "done":
                    audit_results["scanned"] = data["scanned"]
                    audit_results["assets"] = data["assets"]
                    audit_results["errors"] = data["errors"]
    except Exception as e:
        print(f"❌ Audit Engine Error: {e}")

    # 2. Master Cleaner (Ghost Layers & UTF-8)
    print("\n👻 PHASE 2: GHOST LAYER SCAN")
    cleaner = MasterCleaner(root)
    ghost_results = cleaner.scan_ghost_layers()
    
    print("\n🔤 PHASE 3: UTF-8 INTEGRITY SCAN")
    utf8_results = cleaner.scan_utf8_issues()

    # 3. Report Generation
    report = {
        "audit": audit_results,
        "ghosts": ghost_results,
        "utf8": utf8_results
    }
    
    with open("system_health_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print("\n✅ SCAN COMPLETE. Results saved to 'system_health_report.json'.")
    print(f"   - Files Scanned: {audit_results['scanned']}")
    print(f"   - Audit Errors: {len(audit_results['errors'])}")
    print(f"   - Ghost Layers: {len(ghost_results['issues'])}")
    print(f"   - UTF-8 Issues: {len(utf8_results['issues'])}")

if __name__ == "__main__":
    asyncio.run(main())
