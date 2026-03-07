from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class GuestFootprint(BaseModel):
    device_type: str        # Örn: 'iPhone Pro'
    source_url: str         # Örn: 'google_organic'
    past_bookings: int      # Örn: 3
    ghost_score: float      # Ghost Engine'den gelen anlık veri

def calculate_pi_score(footprint: GuestFootprint) -> float:
    # Basit Nöral Mantık Simülasyonu
    pi_score = 0.5 # Baz puan
    
    device = footprint.device_type.lower()
    source = footprint.source_url.lower()
    
    if "iphone" in device or "mac" in device: 
        pi_score += 0.15
    if "organic" in source or "google" in source: 
        pi_score += 0.10
    if footprint.past_bookings > 0: 
        pi_score += 0.20
    if footprint.ghost_score >= 85: 
        pi_score += 0.15
    
    # π (Predictive Probability) 1.0 ile sınırlandırılır
    return min(pi_score, 1.0)

@router.post("/score-guest-intent", tags=["Predictive Intelligence"])
async def score_guest_intent(footprint: GuestFootprint):
    """
    Kahin Algoritması: Misafirin satın alma olasılığını (π) hesaplar.
    """
    final_pi = calculate_pi_score(footprint)
    
    return {
        "predictive_probability_score": round(final_pi, 2),
        "persona": "VIP_PROSPECT" if final_pi > 0.8 else "REVENUE_TARGET"
    }
