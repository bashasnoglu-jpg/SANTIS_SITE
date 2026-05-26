import google.generativeai as genai
import sys
import os

# Flush stdout to ensure we see output
print("Starting Test...", flush=True)

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is required for this test.")
genai.configure(api_key=API_KEY)

try:
    print("Attempting 'gemini-pro'...", flush=True)
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content("Hello")
    print(f"SUCCESS: {response.text}", flush=True)
except Exception as e:
    print(f"FAIL: {e}", flush=True)
