import asyncio
import uuid
import sys
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.db.base import Base

import os
import sys
# Make sure app path is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.db.models.slot_route import SlotRoute
from app.db.models.tenant import Tenant
from sqlalchemy.future import select

# SOVEREIGN ROUTE MAP (Migrating from hardcoded)
SLOT_TO_ROUTE = {
    # Ana Sayfa
    "card-hamam": "/tr/index.html",
    "card-masaj": "/tr/index.html",
    "card-cilt": "/tr/index.html",
    "card-atolye": "/tr/index.html",
    "philosophy-hero": "/tr/index.html",
    
    # Hamam
    "osmanli-ritueli": "/tr/hamam.html",
    "kese-ve-kopuk-masaji": "/tr/hamam.html",
    "kopuk-masaji": "/tr/hamam.html",
    "tuz-peeling": "/tr/hamam.html",
    "kahve-peeling": "/tr/hamam.html",
    "bal-masaji": "/tr/hamam.html",
    "cikolata-bakimi": "/tr/hamam.html",
    "yosun-bakimi": "/tr/hamam.html",
    "santis-pasa": "/tr/hamam.html",

    # Masaj
    "klasik-masaj": "/tr/masaj.html",
    "aromaterapi-masaji": "/tr/masaj.html",
    "derin-doku-masaji": "/tr/masaj.html",
    "sicak-tas-masaji": "/tr/masaj.html",
    "thai-masaji": "/tr/masaj.html",
    "anti-stress-masaji": "/tr/masaj.html",
    "spor-terapi": "/tr/masaj.html",
    "signature-rituel": "/tr/masaj.html",

    # Cilt Bakımı
    "classic-facial": "/tr/cilt-bakimi.html",
    "anti-aging-pro": "/tr/cilt-bakimi.html",
    "hyaluron-hydrate": "/tr/cilt-bakimi.html",
    "gold-mask-ritual": "/tr/cilt-bakimi.html",
    "collagen-lift": "/tr/cilt-bakimi.html",
    "glass-skin": "/tr/cilt-bakimi.html",
    "deep-cleanse": "/tr/cilt-bakimi.html",
    "vitamin-c-glow": "/tr/cilt-bakimi.html"
}


async def run_migration():
    engine = create_async_engine("sqlite+aiosqlite:///./santis.db", echo=False)
    async with engine.begin() as conn:
        # Create slot_routes table specifically
        await conn.run_sync(SlotRoute.__table__.create, checkfirst=True)
        print("Mühür Basıldı: slot_routes tablosu oluşturuldu.")
        
    AsyncSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with AsyncSessionLocal() as session:
        # Get active tenant id
        tenant_res = await session.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
        current_tenant = tenant_res.scalar_one_or_none()
        tenant_id = str(current_tenant.id) if current_tenant else ""
        
        # Checking existing routes
        existing_res = await session.execute(select(SlotRoute).where(SlotRoute.tenant_id == tenant_id))
        existing_slots = {sr.slot_key: sr for sr in existing_res.scalars().all()}
        
        added_count = 0
        for slot, route in SLOT_TO_ROUTE.items():
            if slot not in existing_slots:
                new_route = SlotRoute(
                    tenant_id=tenant_id,
                    slot_key=slot,
                    page_route=route,
                    is_global=True # Anahtar sistem ayarı olduğu için global işaretledik
                )
                session.add(new_route)
                added_count += 1
                
        if added_count > 0:
            await session.commit()
            print(f"Toplam {added_count} statik rota, dinamik Sovereign Registry veritabanına mühürlendi.")
        else:
            print("Tüm rotalar zaten Registry'da mevcut.")
        
if __name__ == "__main__":
    asyncio.run(run_migration())
