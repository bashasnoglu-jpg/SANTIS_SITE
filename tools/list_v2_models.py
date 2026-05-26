from google import genai
import sys
import os

# Flush output
sys.stdout.reconfigure(encoding='utf-8')
print("Listing V2 Models...", flush=True)

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is required for this test.")

client = genai.Client(api_key=API_KEY)

try:
    for m in client.models.list():
        # In V2 SDK alpha/beta, attributes might vary. Just print name.
        print(f"- {m.name}", flush=True)
except Exception as e:
    print(f"List Error: {e}", flush=True)
