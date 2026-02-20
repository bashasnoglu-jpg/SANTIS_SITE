
from google import genai
import sys

# Flush output
sys.stdout.reconfigure(encoding='utf-8')
print("Listing V2 Models...", flush=True)

API_KEY = "AIzaSyBmJ2B4z_g1UAu2Q1Xcp67iAI7ZKF8GUwQ"
client = genai.Client(api_key=API_KEY)

try:
    for m in client.models.list():
        # In V2 SDK alpha/beta, attributes might vary. Just print name.
        print(f"- {m.name}", flush=True)
except Exception as e:
    print(f"List Error: {e}", flush=True)
