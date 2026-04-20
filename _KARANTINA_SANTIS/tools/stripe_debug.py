"""Stripe hata detayı"""
import os, traceback
from dotenv import load_dotenv
load_dotenv()
try:
    import stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY","")
    print(f"Key: {stripe.api_key[:25]}...")
    r = stripe.Price.list(active=True, limit=3)
    for p in r.data:
        print(p.id, p.unit_amount, p.currency)
except Exception as e:
    traceback.print_exc()
    print(f"\nHATA: {e}")
