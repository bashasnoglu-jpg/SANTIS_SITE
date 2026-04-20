
import google.generativeai as genai
import os

API_KEY = "AIzaSyBmJ2B4z_g1UAu2Q1Xcp67iAI7ZKF8GUwQ"
genai.configure(api_key=API_KEY)

print(f"Testing API Key: {API_KEY[:5]}...")

try:
    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content("Hello, are you working?")
    print(f"✅ Success! Response: {response.text}")
except Exception as e:
    print(f"❌ Error with 'gemini-1.5-flash-latest': {e}")
    
    print("Trying fallback 'gemini-1.5-flash'...")
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content("Hello?")
        print(f"✅ Success with fallback! Response: {response.text}")
    except Exception as e2:
        print(f"❌ Error with 'gemini-1.5-flash': {e2}")
