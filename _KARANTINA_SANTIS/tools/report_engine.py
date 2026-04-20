import os
import sys
import json
import datetime
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sqlalchemy.future import select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

import google.generativeai as genai

# Santis Configuration
DB_URL = "postgresql+asyncpg://postgres:123456@localhost/santis_db"
REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "admin", "reports")

engine = create_async_engine(DB_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("WARNING: GEMINI_API_KEY environment variable not found. Mock response mode enabled.")

async def extract_day_data():
    """Extracts today's interactions, intents, and bookings from the database."""
    today = datetime.date.today()
    mock_data = {
        "date": str(today),
        "total_active_conversations": 47,
        "mood_distribution": {"Relaxed": 22, "Hesitant": 15, "High-Intent": 8, "Exploring": 2},
        "top_intent_topics": ["Sovereign Refresh", "Aromatherapy", "Pricing", "Cancellation Policy"],
        "ghost_concierge_triggers": 12,
        "ghost_concierge_rescues": 5,
        "revenue_surges": 1250.00
    }
    
    # Ideally, we query DB. For the Midnight Protocol demo, we use rich mock data mimicking a busy day.
    # In V22 this will be 100% DB-driven (SELECT COUNT(*) from sentiment_logs WHERE date = today)
    return mock_data

def generate_strategic_prompt(data):
    """Builds the strict 'Quiet Luxury' Chief of Staff prompt for Gemini."""
    prompt = f"""
SYSTEM ROLE: Santis Strategic Intelligence Unit (SIU)
OBJECTIVE: Transform raw daily metrics into a "Quiet Luxury" Executive Report for the Commander.

TONE: Sovereign, analytical, and predictive. Short, sharp sentences. Like a Chief of Staff speaking to a Monarch.
STRICT RULE: Never use generic corporate language (e.g., "We made a lot of money"). Use terms like "Revenue Surge", "Hesitation neutralized", "Sovereign Target".

RAW DATA ({data['date']}):
- Active Conversations: {data['total_active_conversations']}
- Mood Dist: {json.dumps(data['mood_distribution'])}
- Top Topics: {', '.join(data['top_intent_topics'])}
- 'The Ghost' Triggers (Hesitation catches): {data['ghost_concierge_triggers']}
- 'The Ghost' Successful Rescues (Conversions from exits): {data['ghost_concierge_rescues']}
- AI Direct Revenue (Surge): €{data['revenue_surges']}

STRUCTURE TO FOLLOW EXACTLY (Markdown format):

# THE SOVEREIGN DISPATCH: {data['date']}

## 1. THE SOVEREIGN SUMMARY
(2-sentence elite vibe check of the empire today. Was it a calm sea or a busy harbor?)

## 2. REVENUE MOMENTUM & GHOST IMPACT
(Format: "€X captured today. The Ghost intercepted X hesitation attempts, rescuing X bookings.")

## 3. PSYCHOLOGICAL LANDSCAPE
(Brief analysis of the mood vs. the topics. Example: "Hesitation peaked around Pricing, but High-Intent was focused on Sovereign Refresh.")

## 4. THE TOMORROW DOCTRINE (PREDICTIVE PRICING)
(Provide 3 specific "Power Moves" for tomorrow. Predict what price to hike or what to push based on today's hesitation metrics. Be bold.)

END WITH: "Report sealed by Santis Neural Engine."
"""
    return prompt

async def run_midnight_protocol():
    print(f"[{datetime.datetime.now()}] Initiating Midnight Protocol (V21)...")
    
    os.makedirs(REPORTS_DIR, exist_ok=True)
    report_filename = f"SANTIS_DISPATCH_{datetime.date.today().strftime('%b_%d').upper()}.md"
    report_path = os.path.join(REPORTS_DIR, report_filename)

    data = await extract_day_data()
    prompt = generate_strategic_prompt(data)

    report_content = ""
    if API_KEY:
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        print("  -> Engaging Gemini SIU Analyst...")
        try:
            response = model.generate_content(prompt)
            report_content = response.text.strip()
            print("  -> Synthesis complete.")
        except Exception as e:
            report_content = f"# ERROR\n\nNeural link severed during synthesis: {str(e)}"
    else:
        # Fallback Mock Report
        report_content = f"""# THE SOVEREIGN DISPATCH: {data['date']}
        
## 1. THE SOVEREIGN SUMMARY
The empire witnessed a steady flow of high-intent Kaptans today. A calm, calculated momentum dominated the physical and digital halls.

## 2. REVENUE MOMENTUM & GHOST IMPACT
€{data['revenue_surges']} captured directly through neural pathways. The Ghost Guardian intercepted {data['ghost_concierge_triggers']} escape / hesitation attempts, successfully converting {data['ghost_concierge_rescues']} into solid bookings.

## 3. PSYCHOLOGICAL LANDSCAPE
Hesitation centered heavily around Pricing protocols, while pure luxury intent gravitated toward the Sovereign Refresh. 

## 4. THE TOMORROW DOCTRINE (PREDICTIVE PRICING)
1. **Surge Warning:** Increase Aromatherapy pricing by 1.2x from 14:00-16:00 to test elasticity.
2. **Ghost Directive:** Program the Ghost to offer complimentary detox juices instead of discounts for Hesitant profiles.
3. **Focus Shift:** De-emphasize standard Hammam; funnel traffic to VIP Private Suites.

Report sealed by Santis Neural Engine.
"""

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)
        
    print(f"[{datetime.datetime.now()}] The Executive Report has been securely written to: {report_path}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_midnight_protocol())
