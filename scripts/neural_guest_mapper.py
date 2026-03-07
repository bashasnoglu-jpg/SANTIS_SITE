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
from app.db.models.booking import Booking

load_dotenv(override=True)
import google.generativeai as genai

# Setup Gemini V2
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

generation_config = {
    "temperature": 0.4,
    "top_p": 0.95,
    "top_k": 40,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config=generation_config,
    system_instruction="""You are the SANTIS MASTER OS Neural Processor, a highly advanced concierge AI.
You will be provided with a Guest's historical spa reservations and notes.
Your task is to analyze this data and generate a highly concise, 3-bullet "Intel HUD" summary for the front desk.
Do not use greetings. Output ONLY the 3 bullet points using dashes (-).

Focus on:
1. Behavioral/Service Preferences (e.g., pressure preference, punctuality).
2. Health/Physiological notes (e.g., shoulder tension, allergies).
3. Upsell/Experience potential (e.g., enjoys romance packages, prefers silence).

Keep it strictly factual, professional, and formulated as quick intel. Limit to 3 bullets max.
"""
)

async def map_guests():
    print("🧠 Booting Neural Guest Mapper (Phase 6)...")
    
    async with AsyncSessionLocal() as db:
        # Fetch all customers
        stmt = select(Customer).where(Customer.visit_count > 0)
        res = await db.execute(stmt)
        customers = res.scalars().all()
        
        print(f"📡 Found {len(customers)} active guests for neural indexing.")
        
        for customer in customers:
            print(f"\nScanning: {customer.full_name}")
            
            # Compile historical context
            history_text = f"Guest Name: {customer.full_name}\n"
            history_text += f"Total Visits: {customer.visit_count}\n"
            if customer.notes:
                history_text += f"General Notes: {customer.notes}\n"
                
            # Fetch Bookings
            booking_stmt = select(Booking).where(Booking.customer_id == customer.id)
            booking_res = await db.execute(booking_stmt)
            bookings = booking_res.scalars().all()
            
            history_text += "\n--- Past Bookings ---\n"
            for b in bookings:
                history_text += f"- Service ID {b.service_id} | Status: {b.status.value} | Time: {b.start_time}\n"
                # Removed b.notes parsing since Booking does not have notes in this schema
                    
                    
            print("  -> Compiling prompt vector to Gemini...")
            
            try:
                # Ask Gemini to process the profile
                chat = model.start_chat()
                response = chat.send_message(history_text)
                
                ai_intel = response.text.strip()
                
                # Update DB directly
                customer.ai_persona_summary = ai_intel
                await db.commit()
                print("  ✅ Intel Extracted & Saved to Master DB:")
                print("======================")
                print(f"{ai_intel}")
                print("======================")
                
            except Exception as e:
                print(f"  ❌ Sync Error on {customer.full_name}: {e}")
                
        print("\n✨ Matrix Update Complete. All active guests have sentient profiles.")

if __name__ == "__main__":
    asyncio.run(map_guests())
