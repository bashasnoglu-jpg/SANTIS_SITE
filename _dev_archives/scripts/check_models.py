
import os
from google import genai

API_KEY = "AIzaSyDb4c1M6K98ncBht8Y-oMspDgvRdn0y8c4"

try:
    print(f"🔑 Testing Key: {API_KEY[:10]}...")
    client = genai.Client(api_key=API_KEY)
    
    print("📡 Fetching available models...")
    pager = client.models.list()
    
    print("\n✅ AVAILABLE MODELS:")
    for m in pager:
        # Just print the name to be safe
        print(f"   - {m.name}")

except Exception as e:
    print(f"\n❌ ERROR: {e}")
