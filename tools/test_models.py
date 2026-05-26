from google import genai
import sys
import os

print("Testing Gemini V2 SDK Models...", flush=True)

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is required for this test.")
client = genai.Client(api_key=API_KEY)

models_to_test = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp", "gemini-pro"]

for m in models_to_test:
    print(f"\n👉 Testing '{m}'...", flush=True)
    try:
        response = client.models.generate_content(
            model=m, 
            contents="Confirm available."
        )
        print(f"✅ SUCCESS: {m}", flush=True)
        # found one, exit? No, test all to find best.
    except Exception as e:
        print(f"❌ FAIL {m}: {e}", flush=True)
