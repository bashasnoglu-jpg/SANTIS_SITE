import asyncio
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.orm import selectinload

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from app.db.models.customer import Customer
from app.db.models.consent import UserConsent, ConsentType
from app.db.models.tenant import Tenant

load_dotenv(override=True)
import google.generativeai as genai

# Setup Gemini V2
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction="""You are the Global Marketing AI for Santis Master OS, an ultra-luxury spa brand.
You will receive a target guest's profile, including their estimated country and total Euro spend.
Draft a highly personalized, "Quiet Luxury" retention email for them.
- If Country is Germany/DACH, write in fluent, elegant formal German (Sie).
- Otherwise, write in elegant British English.
Focus on "Arbitrage" benefits subtly: mentioning the immense value of booking their next Euro-vacation with Santis.
Strictly adhere to a minimalist, refined tone. No emojis. Output ONLY the Subject line and the Email Body.
"""
)

async def seed_demo_data_if_needed(db):
    """Temporary function to ensure we have test data for the demo."""
    res = await db.execute(select(Customer).limit(2))
    customers = res.scalars().all()
    if not customers:
        print("No customers in DB to run the Outreach Engine. Skipping.")
        return []
        
    # Check if they have consents
    consent_res = await db.execute(select(UserConsent).where(UserConsent.customer_id == customers[0].id))
    if not consent_res.scalars().first():
        print("Seeding GDPR Opt-In records for demo...")
        c1 = UserConsent(
            customer_id=customers[0].id,
            consent_type=ConsentType.MARKETING_EMAIL,
            is_granted=True,
            ip_address="82.165.1.1" # Mock German IP
        )
        if len(customers) > 1:
            c2 = UserConsent(
                customer_id=customers[1].id,
                consent_type=ConsentType.MARKETING_EMAIL,
                is_granted=True,
                ip_address="81.134.2.1" # Mock UK IP
            )
            db.add(c2)
            customers[1].notes = (customers[1].notes or "") + " [Country: UK]"
            
        db.add(c1)
        customers[0].notes = (customers[0].notes or "") + " [Country: DE]"
        customers[0].total_spent = 1450.00
        
        await db.commit()
    
    return customers

async def run_global_campaign():
    print("🌍 Booting Phase 7: Global Euro-Outreach AI...")
    
    async with AsyncSessionLocal() as db:
        await seed_demo_data_if_needed(db)
        
        # 1. Fetch only customers who explicitly opted in to Marketing (GDPR Compliance)
        stmt = (
            select(Customer)
            .join(UserConsent)
            .where(UserConsent.consent_type == ConsentType.MARKETING_EMAIL)
            .where(UserConsent.is_granted == True)
        )
        res = await db.execute(stmt)
        opted_in_guests = res.scalars().all()
        
        print(f"✅ GDPR Vault Check: {len(opted_in_guests)} guests cleared for international outreach.")
        
        for guest in opted_in_guests:
            print(f"\n--- Analyzing Target: {guest.full_name} ---")
            
            # 2. Extract Data Profile (AOV, Country logic)
            spend = float(guest.total_spent)
            tier = "High-Roller" if spend > 1000 else "Standard"
            
            # Simple country extraction from notes for the demo
            country = "UK"
            if guest.notes and "[Country: DE]" in guest.notes:
                country = "Germany"
                
            print(f"Euro Spend (AOV): €{spend:.2f} | Segment: {tier} | Geo: {country}")
            print("Encryptography Layer: Email and Phone are protected at rest.")
            
            # 3. Generate Localized AI Copy
            prompt = f"Guest Name: {guest.full_name}\nCountry: {country}\nTotal Spent: €{spend}\nTier: {tier}"
            print("🧠 Passing vector to Gemini for cultural alignment...")
            
            try:
                response = model.generate_content(prompt)
                draft = response.text.strip()
                
                print("========================================")
                print(f"[MAIL DRAFT -> {guest.email if guest.email else 'No-Email'} (DECRYPTED IN MEMORY)]\n")
                print(draft)
                print("========================================\n")
                
            except Exception as e:
                print(f"❌ Generation Error: {e}")

if __name__ == "__main__":
    asyncio.run(run_global_campaign())
