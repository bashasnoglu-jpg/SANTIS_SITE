from google import genai
import sys
import os

print("Testing Gemini V2 SDK...", flush=True)

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is required for this test.")
client = genai.Client(api_key=API_KEY)

try:
    print("Attempting 'gemini-1.5-flash'...", flush=True)
    response = client.models.generate_content(
        model="gemini-1.5-flash", 
        contents="Hello, confirm you are alive."
    )
    print(f"SUCCESS: {response.text}", flush=True)
except Exception as e:
    print(f"FAIL: {e}", flush=True)
