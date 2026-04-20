"""Stripe'taki Santis planlarının Price ID'lerini listele"""
import os, sys
from dotenv import load_dotenv
load_dotenv()
import stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

products = stripe.Product.search(query="active:'true'", limit=10)
for p in products.data:
    if "santis" in p.name.lower():
        prices = stripe.Price.list(product=p.id, active=True, limit=3)
        for pr in prices.data:
            if pr.recurring:
                print(f"{p.name}: {pr.id}  ({pr.unit_amount/100:.2f} {pr.currency.upper()}/mo)")
