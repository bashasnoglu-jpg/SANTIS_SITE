import google.generativeai as genai
import os

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is required for this test.")
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
