"""
app/services/ai_multiverse.py
Sovereign OS - Phase 82.1: Tenant-Based AI Isolation Engine
Provides isolated, tenant-aware LLM agents (Aurelia Personas) with distinct voices.
"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.tenant import Tenant
from app.db.models.tenant_config import TenantConfig

# Kuantum Kişilik Matrisi (Base Personas)
SOVEREIGN_PERSONAS = {
    "santis_healer": {
        "role": "Santis Spa Healing Concierge",
        "tone": "Empatik, huzur veren, rehberlik edici",
        "rules": "Vücut arınması ve ruhsal tazelemeye odaklan. 'Misafirimiz' kelimesini kullan. Sakin ve yavaş bir atmosfer yarat.",
        "ui_aura": "zen_blue" # Ghost Engine için
    },
    "zenith_aristocrat": {
        "role": "Zenith Resort Imperial Assistant",
        "tone": "Mesafeli, buyurgan, prestijli, resmi",
        "rules": "Lüksü bir ayrıcalık olarak sun. Fiyat sormayan 'VIP (Whale)' kitleye hitap ediyorsun. 'Efendim' kelimesini ölçülü ama otoriter kullan.",
        "ui_aura": "sovereign_gold"
    },
    "omega_zen": {
        "role": "Omega Wellness Minimalist Guide",
        "tone": "Sessiz lüks, az konuşan, net",
        "rules": "Mümkün olan en az kelimeyle cevap ver. Estetiği ve sessizliği öv.",
        "ui_aura": "obsidian"
    },
    "default_luxury": {
        "role": "Sovereign Luxury Concierge",
        "tone": "Profesyonel, premium",
        "rules": "Klasik lüks otel asistanı.",
        "ui_aura": "default"
    }
}

class AIMultiverseManager:
    """Yapay Zekanın Kişilik Bölünme Orkestratörü"""
    
    @classmethod
    async def get_tenant_persona(cls, db: AsyncSession, tenant_id: str) -> dict:
        """Tenant ID alıp, o markaya özel LLM sistem komutunu (Prompt) oluşturur."""
        
        # 1. Config'i DB'den Getir
        stmt = select(TenantConfig).where(TenantConfig.tenant_id == tenant_id)
        res = await db.execute(stmt)
        config = res.scalar_one_or_none()

        # 2. Persona Seçimi
        persona_key = config.ai_persona_type if config and config.ai_persona_type else "default_luxury"
        persona = SOVEREIGN_PERSONAS.get(persona_key, SOVEREIGN_PERSONAS["default_luxury"])
        
        # 3. Özel Override Var Mı? (Usta'nın özel müdahalesi)
        custom_prompt = config.ai_system_prompt_override if config else None

        # 4. Final System Prompt Sentezi
        if custom_prompt:
            final_prompt = custom_prompt
        else:
            final_prompt = f"""You are {persona['role']}. 
Your tone should be: {persona['tone']}. 
Your core directives: {persona['rules']}

NEVER break character. You only serve the experience of this specific tenant."""

        return {
            "system_prompt": final_prompt,
            "ui_aura": persona["ui_aura"],
            "persona_key": persona_key
        }

multiverse_engine = AIMultiverseManager()
