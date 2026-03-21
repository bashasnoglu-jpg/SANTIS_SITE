import asyncio
import os
import sys
import uuid
import random

# Add project root to python path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, text
from app.db.session import AsyncSessionLocal
from app.db.models.gallery import GalleryAsset

async def inject_intelligence_profiles():
    """
    Phase 17: Sovereign Asset Intelligence Layer
    Instantiates the 4D Taxonomy (SAS, Focus Points, Mood, Persona) for all
    existing 335 gallery assets to fuel the Sovereign Bento Matrix.
    """
    db = AsyncSessionLocal()
    try:
        # Ensure the table is ready (if missing from schemas)
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS asset_intelligence (
                id VARCHAR(36) PRIMARY KEY,
                asset_id VARCHAR(36) NOT NULL UNIQUE,
                sas_score FLOAT NOT NULL DEFAULT 0.5,
                focus_x FLOAT NOT NULL DEFAULT 0.5,
                focus_y FLOAT NOT NULL DEFAULT 0.5,
                mood VARCHAR(50),
                content_tags JSON,
                persona_affinity VARCHAR(50),
                FOREIGN KEY(asset_id) REFERENCES gallery_assets(id) ON DELETE CASCADE
            )
        """))
        await db.commit()
        
        # Fetch all physically managed assets
        result = await db.execute(select(GalleryAsset))
        assets = result.scalars().all()
        
        print(f"🦅 Scanning Sovereign Matrix: {len(assets)} raw assets detected.")
        injected = 0
        
        for asset in assets:
            # Check if intelligence already exists
            res = await db.execute(text("SELECT id FROM asset_intelligence WHERE asset_id = :aid"), {"aid": asset.id})
            if res.fetchone():
                continue # Skip if already processed
            
            # --- Simulated Neural Extraction ---
            # In production, this data comes from OpenAI Vision / skimage (Phase 18).
            # Here, we generate realistic deterministic curves to test the matrix scaling.
            
            sas = round(random.uniform(0.65, 0.98), 2)  # Score determines visual GridSpan
            fx = round(random.uniform(0.3, 0.7), 2)     # Focus X (Center weighted)
            fy = round(random.uniform(0.3, 0.7), 2)     # Focus Y
            
            # Determine Mood & Persona by Category mapping
            if asset.category == "hamam":
                moods = ["Purification", "Warmth", "Cinematic Steam"]
                persona = "Ritualist"
            elif asset.category == "masaj":
                moods = ["Deep Relief", "Serenity", "Grounding"]
                persona = "Recovery Seeker"
            elif asset.category == "cilt":
                moods = ["Luminous Core", "Precision", "Glass Skin"]
                persona = "Aesthetic Purist"
            else:
                moods = ["Sovereign Luxury", "Golden Hour", "Vast Space"]
                persona = "Whale"
            
            selected_mood = random.choice(moods)
            tags = '["luxury", "quiet"]'
            
            await db.execute(text("""
                INSERT INTO asset_intelligence 
                (id, asset_id, sas_score, focus_x, focus_y, mood, content_tags, persona_affinity)
                VALUES (:id, :aid, :sas, :fx, :fy, :mood, :tags, :persona)
            """), {
                "id": str(uuid.uuid4()),
                "aid": asset.id,
                "sas": sas,
                "fx": fx,
                "fy": fy,
                "mood": selected_mood,
                "tags": tags,
                "persona": persona
            })
            injected += 1
            
        await db.commit()
        print(f"🔥 Phase 17 Assimilation Complete. {injected} AI profiles minted to the Sovereign Database.")

    except Exception as e:
        print(f"Error executing intelligence ingestion: {e}")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(inject_intelligence_profiles())
