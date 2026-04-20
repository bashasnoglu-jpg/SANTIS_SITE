import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path("C:/Users/tourg/Desktop/SANTIS_SITE")
sys.path.append(str(project_root))

from app.core.content_engine import ContentEngine

def test_content_engine():
    print("🧠 Testing Content Engine (Phase C1 - Isolated Test 1.5)...")
    
    engine = ContentEngine()
    
    # DIAGNOSTIC: Print keys related to golden-triangle
    print("\n[DIAGNOSTIC] Searching registry for 'golden-triangle' keys...")
    found_keys = []
    for k in engine._routes_cache.keys():
        if "golden-triangle" in k or "goldenes-dreieck" in k:
            found_keys.append(k)
            print(f"  Key: {k}")
            print(f"  Value: {engine._routes_cache[k]}")
    
    if not found_keys:
        print("  [WARNING] No keys found matching 'golden-triangle' or 'goldenes-dreieck'!")

    # Test 1.5: Transitive Lookup (The "Trap Key" Scenario)
    print("\n[Test 1.5] Transitive Lookup (Trap Key)")
    source = "masajlar/goldenes-dreieck-ritual/index.html" 
    target_lang = "tr"
    result = engine.resolve_target_web_path(source, target_lang)
    expected_keyword = "golden-triangle"
    
    print(f"Input: {source} ({target_lang})")
    print(f"Output: {result}")
    
    if result and expected_keyword in result:
        print("✅ PASS (Transitive resolution worked!)")
        sys.exit(0)
    else:
        print("❌ FAIL (Could not bridge the trap key)")
        sys.exit(1)

if __name__ == "__main__":
    test_content_engine()
