
import google.generativeai as genai

API_KEY = "AIzaSyBmJ2B4z_g1UAu2Q1Xcp67iAI7ZKF8GUwQ"
genai.configure(api_key=API_KEY)

print("Listing available models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"List Error: {e}")

print("\nTesting 'gemini-pro'...")
try:
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content("Test")
    print("✅ Success with gemini-pro")
except Exception as e:
    print(f"❌ Fail gemini-pro: {e}")
