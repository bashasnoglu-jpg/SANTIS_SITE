import sys
import os

# Ensure we can import from app
sys.path.insert(0, os.path.abspath("."))

from app.core.vector_engine import vector_core

def test_vector_engine():
    print("Testing vector engine...")
    try:
        text_dna = vector_core.extract_text_dna("Luxury Hamam Spa")
        print(f"Success! Text DNA length: {len(text_dna)}")
        print(f"Sample data: {text_dna[:5]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_vector_engine()
