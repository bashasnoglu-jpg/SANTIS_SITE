
import google.generativeai as genai
import sys

# Flush stdout to ensure we see output
print("Starting Test...", flush=True)

API_KEY = "AIzaSyBmJ2B4z_g1UAu2Q1Xcp67iAI7ZKF8GUwQ"
genai.configure(api_key=API_KEY)

try:
    print("Attempting 'gemini-pro'...", flush=True)
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content("Hello")
    print(f"SUCCESS: {response.text}", flush=True)
except Exception as e:
    print(f"FAIL: {e}", flush=True)
