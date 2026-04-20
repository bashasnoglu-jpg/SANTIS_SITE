
import asyncio
import os
import sys

# Ensure we can import from root
sys.path.append(os.getcwd())

from city_os import city_manager

async def test_city_os():
    print("🏙️ Testing Santis City OS V300...")
    
    # 1. Test Scan
    print("\n[1] Testing scan_city()...")
    report = city_manager.scan_city()
    print(f"Report: {report}")
    
    if "ghosts" in report and "bad_encoding" in report:
        print("✅ Scan structure valid.")
    else:
        print("❌ Scan structure invalid.")

    # 2. Test Ghost Protocol (Dry Run or Mock)
    # We won't actually run it to avoid modifying files in verification, 
    # but we check if the method exists and is callable.
    print("\n[2] Checking protocols...")
    if hasattr(city_manager, "_protocol_ghosts"):
        print("✅ Ghost Hunter protocol found.")
    else:
        print("❌ Ghost Hunter protocol MISSING.")

    if hasattr(city_manager, "_protocol_assets"):
        print("✅ Asset Molecularizer protocol found.")
    else:
        print("❌ Asset Molecularizer protocol MISSING.")

    if hasattr(city_manager, "_protocol_phone_std"):
        print("✅ Phone Standardizer protocol found.")
    else:
        print("❌ Phone Standardizer protocol MISSING.")

    if hasattr(city_manager, "_protocol_external_pulse"):
        print("✅ External Pulse protocol found.")
    else:
        print("❌ External Pulse protocol MISSING.")

    print("\n[3] Test Complete.")

if __name__ == "__main__":
    asyncio.run(test_city_os())
