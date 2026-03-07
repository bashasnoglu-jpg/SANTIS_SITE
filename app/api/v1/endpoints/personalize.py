from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class InteractionData(BaseModel):
    visited_pages: List[str] = []
    duration: int = 0
    intent_score: int = 0

class PersonaResponse(BaseModel):
    persona: str
    headline: str
    subtitle: str
    hero_image: str

@router.post("/chameleon", response_model=PersonaResponse)
async def personalize_content(data: InteractionData):
    """
    Misafirin (Ghost) niyet verisine gore anlik 'Persona' dondurur.
    Gercek Gemini entegrasyonu baglanana kadar kural tabanli AI simulasyonu (Adapter).
    """
    text_corpus = " ".join(data.visited_pages).lower()
    
    # 1. Hammam Whale Persona
    if "hamam" in text_corpus or "vip" in text_corpus:
        return PersonaResponse(
            persona="Hammam Whale",
            headline="The Ancient Art of Relaxation Awaits You.",
            subtitle="Your Private Royal Hammam is Prepared.",
            hero_image="/assets/img/cards/Santis-spa-rest-graded-clean.webp"
        )
        
    # 2. Skincare Elite Persona
    elif "cilt" in text_corpus or "sothys" in text_corpus:
        return PersonaResponse(
            persona="Skincare Elite",
            headline="Radiance Engineered. Beauty Perfected.",
            subtitle="Experience Exclusive Sothys Paris Paris Rituals.",
            hero_image="/assets/img/cards/santis_card_skincare_cover.webp"
        )
        
    # 3. Deep Recovery Persona
    elif "masaj" in text_corpus or "derin" in text_corpus:
        return PersonaResponse(
            persona="Recovery Seeker",
            headline="Mastering the Art of Deep Recovery.",
            subtitle="Release Tension, Elevate Your Senses.",
            hero_image="/assets/img/cards/santis_card_deep_relax_v2.webp"
        )
        
    # 4. Default Sovereign Persona
    else:
        return PersonaResponse(
            persona="Sovereign Guest",
            headline="SANTIS CLUB",
            subtitle="Wellness & Spa",
            hero_image="/assets/img/hero-general.webp"
        )
