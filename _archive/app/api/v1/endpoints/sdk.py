from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db, get_db_for_admin
from app.db.models.tenant import Tenant
import hashlib

router = APIRouter()

# --- MOCK DATA FOR DEMO ---
# In production, this would use API Keys & Secrets from a robust Auth system (OAuth2/JWT)
VALID_API_KEYS = {
    "sk_live_qT5xV8z9M4_santis": "santis_hq",
    "sk_live_aB3cR7dL2_aman": "tenant_aman"
}

class IntentRequest(BaseModel):
    guest_hash: str # SHA-256 of email or phone
    current_page: str
    duration_seconds: int
    mouse_bounces: int = 0

class IntentResponse(BaseModel):
    ghost_score: int
    persona: str
    vip_affinity: float
    recommended_action: str

async def verify_sdk_key(x_api_key: str = Header(...), db: AsyncSession = Depends(get_db_for_admin)):
    # 1. API Key Check
    tenant_id = VALID_API_KEYS.get(x_api_key)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing SDK API Key"
        )
    
    # 2. Verify Tenant exists and is active
    stmt = select(Tenant).where(Tenant.id == tenant_id, Tenant.is_active == True)
    res = await db.execute(stmt)
    tenant = res.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant inactive or suspended"
        )
        
    return tenant

@router.post("/evaluate-intent", response_model=IntentResponse)
async def evaluate_intent(
    req: IntentRequest, 
    tenant: Tenant = Depends(verify_sdk_key),
    db: AsyncSession = Depends(get_db_for_admin)
):
    """
    Phase 39: Sovereign SDK (API-First Marketplace)
    Evaluates guest intent purely via API for external hotel clients.
    """
    # Pseudo-logic for Intelligence scoring
    base_score = min(100, (req.duration_seconds / 2) + (req.mouse_bounces * 5))
    
    # Check Whale Watcher Database
    from app.db.models.genome import GuestGenome
    stmt = select(GuestGenome).where(GuestGenome.guest_hash == req.guest_hash)
    res = await db.execute(stmt)
    genome = res.scalar_one_or_none()
    
    vip_affinity = genome.vip_affinity if genome else 0.1
    persona = "WHALE" if vip_affinity > 0.8 else "STANDARD"
    
    action = "HOLD"
    if base_score > 80:
        action = "SURGE"
    elif req.mouse_bounces > 3 and vip_affinity > 0.5:
        action = "RESCUE_PROTOCOL"
        
    return IntentResponse(
        ghost_score=int(base_score),
        persona=persona,
        vip_affinity=vip_affinity,
        recommended_action=action
    )

@router.get("/health")
async def sdk_health(tenant: Tenant = Depends(verify_sdk_key)):
    """ Ping the SDK Gateway """
    return {"status": "SOVEREIGN_SDK_ONLINE", "tenant_id": tenant.id, "tenant_name": tenant.name}

# --- PHASE 46: THE SOVEREIGN SYNDICATE ---

class SyndicateRequest(BaseModel):
    guest_hash: str
    target_tenant_id: str
    service_id: str
    intent_score: int
    currency: str = "USD"

class SyndicateResponse(BaseModel):
    status: str
    broker_tenant: str
    routed_tenant: str
    intelligence_fee_pct: float
    scarcity_applied: bool
    final_price_modifier: float
    message: str

@router.post("/syndicate/route", response_model=SyndicateResponse)
async def syndicate_route(
    req: SyndicateRequest,
    broker_tenant: Tenant = Depends(verify_sdk_key),
    db: AsyncSession = Depends(get_db_for_admin)
):
    """
    Phase 46: The Global Intel Hub (API Gateway v3)
    Routes requests from one hotel (broker) to another (target) within the Sovereign Network.
    Applies the 2% Intelligence Fee and checks for scarcity.
    """
    # Verify the target tenant exists
    stmt = select(Tenant).where(Tenant.id == req.target_tenant_id, Tenant.is_active == True)
    res = await db.execute(stmt)
    target_tenant = res.scalar_one_or_none()
    
    if not target_tenant:
        raise HTTPException(
            status_code=404,
            detail="Target Syndicate node not found or inactive."
        )
        
    # Intelligence Fee is hardcoded to 2% for the Syndicate
    int_fee = 0.02
    scarcity_applied = False
    price_modifier = 1.0 + int_fee
    
    # If intent is high, AI automatically surges the price
    if req.intent_score > 85:
        scarcity_applied = True
        price_modifier += 0.15 # +15% Surge
        
    return SyndicateResponse(
        status="ROUTED",
        broker_tenant=broker_tenant.id,
        routed_tenant=target_tenant.id,
        intelligence_fee_pct=int_fee,
        scarcity_applied=scarcity_applied,
        final_price_modifier=round(price_modifier, 2),
        message="Sovereign Syndicate AI successfully routed and priced the request."
    )

class VaultCheckoutRequest(BaseModel):
    transaction_id: str
    amount: float
    currency: str
    target_tenant_id: str
    guest_hash: str

class VaultCheckoutResponse(BaseModel):
    status: str
    vault_receipt_id: str
    net_amount: float
    intelligence_fee_amount: float
    tenant_credited: str
    message: str

@router.post("/vault/checkout", response_model=VaultCheckoutResponse)
async def vault_checkout(
    req: VaultCheckoutRequest,
    broker_tenant: Tenant = Depends(verify_sdk_key),
    db: AsyncSession = Depends(get_db_for_admin)
):
    """
    Phase 46: Sovereign Vault Identity
    Processes payments across the Syndicate network, automatically withholding the 2% Intelligence Fee for Santis HQ.
    """
    import uuid
    import math

    int_fee_pct = 0.02
    fee_amount = round(req.amount * int_fee_pct, 2)
    net_amount = round(req.amount - fee_amount, 2)
    
    receipt_id = f"sv_{uuid.uuid4().hex[:12].upper()}"

    # In production: Record transaction to Revenue Ledger Database here.

    return VaultCheckoutResponse(
        status="AUTHORIZED_AND_SETTLED",
        vault_receipt_id=receipt_id,
        net_amount=net_amount,
        intelligence_fee_amount=fee_amount,
        tenant_credited=req.target_tenant_id,
        message="Transaction processed via Sovereign Vault. 2% Intelligence Fee withheld for HQ."
    )

class GhostFleetRequest(BaseModel):
    guest_hash: str
    current_location_city: str
    purchased_service_id: str

class GhostFleetResponse(BaseModel):
    status: str
    cross_sell_tenant_id: str
    cross_sell_service_name: str
    incentive_message: str

@router.post("/ghost-fleet/recommend", response_model=GhostFleetResponse)
async def ghost_fleet_recommend(
    req: GhostFleetRequest,
    broker_tenant: Tenant = Depends(verify_sdk_key),
    db: AsyncSession = Depends(get_db_for_admin)
):
    """
    Phase 46: Ghost Fleet AI (Syndicate Broker)
    Autonomously cross-sells services in other Sovereign Network hotels based on guest's purchase history and status.
    """
    # Look up genome to find past habits
    from app.db.models.genome import GuestGenome
    stmt = select(GuestGenome).where(GuestGenome.guest_hash == req.guest_hash)
    res = await db.execute(stmt)
    genome = res.scalar_one_or_none()
    
    vip_affinity = genome.vip_affinity if genome else 0.5
    
    # Simple logic: Suggest an ultra-luxury experience in a different city / tenant
    # Mocking external tenant for global network expansion
    target_tenant = "tenant_aman" if broker_tenant.id != "tenant_aman" else "santis_hq"
    
    if vip_affinity > 0.8:
        service = "Private Yacht Spa Ritual - The Syndicate Elite"
        msg = f"As a valued Sovereign member, enjoy priority access to {target_tenant}'s most exclusive ritual."
    else:
        service = "Signature Welcome Massage"
        msg = f"Continue your wellness journey with {target_tenant} at global standards."
        
    return GhostFleetResponse(
        status="BROKER_MATCH_FOUND",
        cross_sell_tenant_id=target_tenant,
        cross_sell_service_name=service,
        incentive_message=msg
    )
