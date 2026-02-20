
from google import genai
import sys

print("Testing Gemini V2 SDK...", flush=True)

API_KEY = "AIzaSyBmJ2B4z_g1UAu2Q1Xcp67iAI7ZKF8GUwQ"
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
