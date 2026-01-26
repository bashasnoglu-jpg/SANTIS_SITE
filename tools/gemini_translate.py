# -*- coding: utf-8 -*-
"""
SANTIS CLUB - Gemini API Bulk Translation Tool
================================================
Ürün açıklamalarını Gemini 2.5 Pro ile 5 dile toplu çeviri yapar.

Kullanım:
    python tools/gemini_translate.py --mode translate
    python tools/gemini_translate.py --mode enrich
    
Gereksinimler:
    pip install google-generativeai python-dotenv
"""

import os
import json
import time
from pathlib import Path
from typing import Dict, List, Optional
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
DB_FILE = Path(__file__).parent.parent / 'assets' / 'js' / 'db.js'
BACKUP_DIR = Path(__file__).parent.parent / '_backups'
LANGUAGES = ['tr', 'en', 'de', 'fr', 'ru']

# Gemini Model Configuration
MODEL_NAME = 'gemini-2.0-flash-exp'  # En ucuz ve hızlı model
SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]


class GeminiTranslator:
    def __init__(self):
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not found in .env file")
        
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            safety_settings=SAFETY_SETTINGS
        )
        self.products = []
        
    def load_products(self):
        """db.js'den ürünleri yükle"""
        print(f"📂 Loading products from: {DB_FILE}")
        
        if not DB_FILE.exists():
            raise FileNotFoundError(f"db.js not found at {DB_FILE}")
        
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract JSON array from JS file
        start = content.find('[')
        end = content.rfind(']') + 1
        json_str = content[start:end]
        
        self.products = json.loads(json_str)
        print(f"✅ Loaded {len(self.products)} products")
        return self.products
    
    def backup_db(self):
        """Backup current db.js"""
        BACKUP_DIR.mkdir(exist_ok=True)
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        backup_file = BACKUP_DIR / f'db_backup_{timestamp}.js'
        
        import shutil
        shutil.copy(DB_FILE, backup_file)
        print(f"💾 Backup created: {backup_file}")
    
    def translate_product(self, product: Dict, source_lang: str = 'tr') -> Dict:
        """Tek ürünü 5 dile çevir"""
        
        # Skip if already has all translations
        if all(lang in product.get('name', {}) for lang in LANGUAGES):
            if all(lang in product.get('desc', {}) for lang in LANGUAGES):
                print(f"⏭️  Skipping {product['id']} (already translated)")
                return product
        
        print(f"🔄 Translating: {product['id']}")
        
        source_name = product.get('name', {}).get(source_lang, '')
        source_desc = product.get('desc', {}).get(source_lang, '')
        
        if not source_name:
            print(f"⚠️  Warning: No source text for {product['id']}")
            return product
        
        prompt = f"""You are a luxury spa & wellness copywriter. Translate the following product name and description into EN, DE, FR, and RU. Maintain the premium, quiet luxury tone.

Source (Turkish):
Name: {source_name}
Description: {source_desc}

Output ONLY valid JSON in this exact format:
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
}}

Rules:
- Keep brand names (Sothys, Hammam, Santis) unchanged
- Use refined, minimal language
- DE: formal "Sie" form
- FR: sophisticated, spa-appropriate terms
- RU: premium wellness terminology
- No markdown, no extra text, ONLY JSON"""

        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean markdown if present
            if result_text.startswith('```'):
                result_text = result_text.split('```')[1]
                if result_text.startswith('json'):
                    result_text = result_text[4:]
            
            translations = json.loads(result_text)
            
            # Merge with existing
            if 'name' not in product:
                product['name'] = {}
            if 'desc' not in product:
                product['desc'] = {}
            
            product['name'][source_lang] = source_name
            product['desc'][source_lang] = source_desc
            
            for lang in ['en', 'de', 'fr', 'ru']:
                product['name'][lang] = translations['name'][lang]
                product['desc'][lang] = translations['desc'][lang]
            
            print(f"✅ Translated {product['id']}")
            time.sleep(1)  # Rate limiting
            
        except Exception as e:
            print(f"❌ Error translating {product['id']}: {e}")
        
        return product
    
    def enrich_product(self, product: Dict) -> Dict:
        """Ürün açıklamalarını zenginleştir (benefits, usage tips vb.)"""
        
        source_name = product.get('name', {}).get('tr', '')
        source_desc = product.get('desc', {}).get('tr', '')
        
        prompt = f"""You are a luxury spa product expert. For this product, generate:
1. Key benefits (3-5 bullet points)
2. How to use (short guide)
3. Ingredients highlight (if applicable)

Product:
Name: {source_name}
Description: {source_desc}

Output ONLY valid JSON:
{{
  "benefits": ["...", "...", "..."],
  "usage": "...",
  "ingredients_highlight": "..."
}}

Keep it premium, concise, spa-appropriate."""

        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            if result_text.startswith('```'):
                result_text = result_text.split('```')[1]
                if result_text.startswith('json'):
                    result_text = result_text[4:]
            
            enrichment = json.loads(result_text)
            product['benefits'] = enrichment.get('benefits', [])
            product['usage'] = enrichment.get('usage', '')
            product['ingredients_highlight'] = enrichment.get('ingredients_highlight', '')
            
            print(f"✅ Enriched {product['id']}")
            time.sleep(1)
            
        except Exception as e:
            print(f"❌ Error enriching {product['id']}: {e}")
        
        return product
    
    def save_products(self):
        """Save updated products to db.js"""
        print(f"💾 Saving to: {DB_FILE}")
        
        # Format as JS
        json_str = json.dumps(self.products, ensure_ascii=False, indent=2)
        content = f"const productsDB = {json_str};\n"
        
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Saved successfully")
    
    def run_translation(self):
        """Main translation workflow"""
        print("\n🚀 Starting bulk translation...\n")
        
        self.load_products()
        self.backup_db()
        
        total = len(self.products)
        for idx, product in enumerate(self.products, 1):
            print(f"\n[{idx}/{total}]", end=' ')
            self.products[idx-1] = self.translate_product(product)
        
        self.save_products()
        print("\n✨ Translation complete!")
    
    def run_enrichment(self):
        """Main enrichment workflow"""
        print("\n🚀 Starting content enrichment...\n")
        
        self.load_products()
        self.backup_db()
        
        total = len(self.products)
        for idx, product in enumerate(self.products, 1):
            print(f"\n[{idx}/{total}]", end=' ')
            self.products[idx-1] = self.enrich_product(product)
        
        self.save_products()
        print("\n✨ Enrichment complete!")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Gemini API Translation Tool')
    parser.add_argument('--mode', choices=['translate', 'enrich'], required=True,
                        help='translate: Çoklu dil çevirisi | enrich: İçerik zenginleştirme')
    
    args = parser.parse_args()
    
    translator = GeminiTranslator()
    
    if args.mode == 'translate':
        translator.run_translation()
    elif args.mode == 'enrich':
        translator.run_enrichment()


if __name__ == '__main__':
    main()
