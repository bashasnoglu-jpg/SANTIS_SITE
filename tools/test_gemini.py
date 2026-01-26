# -*- coding: utf-8 -*-
"""
SANTIS CLUB - Gemini API Test Script
======================================
Gemini API'yi tek ürün üzerinde test eder.

Kullanım:
    python tools/test_gemini.py
"""

import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load .env
load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

def test_connection():
    """API bağlantısını test et"""
    print("\n🔍 Testing Gemini API connection...")
    
    if not GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY not found in .env file!")
        print("\n📝 Steps to fix:")
        print("1. Copy .env.example to .env")
        print("2. Get your API key from: https://aistudio.google.com/app/apikey")
        print("3. Paste it in .env file")
        return False
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Simple test
        response = model.generate_content("Say 'API connection successful' in Turkish")
        print(f"\n✅ Connection successful!")
        print(f"📡 Response: {response.text}")
        return True
        
    except Exception as e:
        print(f"\n❌ Connection failed: {e}")
        return False


def test_translation():
    """Örnek ürün çevirisi test et"""
    print("\n🔍 Testing product translation...")
    
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    # Test product
    test_product = {
        "name": "Savon Noir - Okaliptüs",
        "desc": "Geleneksel hamam ritüeli için özel formül. Doğal okaliptüs özü ile zenginleştirilmiş premium siyah sabun."
    }
    
    prompt = f"""You are a luxury spa copywriter. Translate this product to EN, DE, FR, RU. Keep premium tone.

Turkish:
Name: {test_product['name']}
Description: {test_product['desc']}

Output ONLY valid JSON:
{{
  "name": {{
    "en": "...",
    "de": "...",
    "fr": "...",
    "ru": "..."
  }},
  "desc": {{
    "en": "...",
    "de": "...",
    "fr": "...",
    "ru": "..."
  }}
}}"""

    try:
        response = model.generate_content(prompt)
        result = response.text.strip()
        
        # Clean markdown
        if result.startswith('```'):
            result = result.split('```')[1]
            if result.startswith('json'):
                result = result[4:]
        
        translations = json.loads(result)
        
        print("\n✅ Translation successful!")
        print("\n📋 Results:")
        print(json.dumps(translations, ensure_ascii=False, indent=2))
        
        return True
        
    except Exception as e:
        print(f"\n❌ Translation failed: {e}")
        return False


def test_cost_estimate():
    """Maliyet tahmini göster"""
    print("\n💰 Cost Estimate:")
    print("─" * 50)
    print("Model: Gemini 2.0 Flash")
    print("Pricing: $0.075 / 1M input, $0.30 / 1M output")
    print()
    print("For 50 products (full translation):")
    print("  • Input tokens:  ~25,000  →  $0.002")
    print("  • Output tokens: ~100,000 →  $0.030")
    print("  • Total cost:              ~$0.03")
    print()
    print("For 100 products:")
    print("  • Total cost:              ~$0.06")
    print("─" * 50)


def main():
    print("=" * 60)
    print("   SANTIS CLUB - Gemini API Test")
    print("=" * 60)
    
    # Test 1: Connection
    if not test_connection():
        return
    
    # Test 2: Translation
    input("\n⏸️  Press Enter to test translation...")
    if not test_translation():
        return
    
    # Test 3: Cost estimate
    test_cost_estimate()
    
    print("\n" + "=" * 60)
    print("   All tests passed! ✨")
    print("=" * 60)
    print("\n📌 Next step:")
    print("   python tools/gemini_translate.py --mode translate")
    print()


if __name__ == '__main__':
    main()
