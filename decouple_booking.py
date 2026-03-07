import re
import os

SOURCE_FILE = "server.py"
TARGET_ROUTER = "app/api/v1/endpoints/booking_engine.py"

def decouple_booking():
    with open(SOURCE_FILE, "r", encoding="utf-8") as f:
        text = f.read()

    # Block 1: Reservation logic
    # from pydantic import BaseModel (line ~925) ... to return {"status": "success", "message": "Reservation confirmed in Master OS"} (line ~1025)
    start_str_1 = "from pydantic import BaseModel\nclass ReservationPayload(BaseModel):"
    end_str_1 = 'return {"status": "success", "message": "Reservation confirmed in Master OS"}\n'
    
    idx_start_1 = text.find(start_str_1)
    idx_end_1 = text.find(end_str_1, idx_start_1) + len(end_str_1)
    
    block_1 = text[idx_start_1:idx_end_1] if idx_start_1 != -1 and idx_end_1 != -1 else ""

    # Block 2: Admin Bookings & Revenue
    # from datetime import timedelta (line ~1112) ... to "top_service": "Deep Tissue Massage <br/><span class='text-sm text-gray-400 font-normal'>Trending</span>"\n        }\n    }\n
    start_str_2 = "from datetime import timedelta\n@app.get(\"/api/v1/admin/bookings\")"
    end_str_2 = "\"top_service\": \"Deep Tissue Massage <br/><span class='text-sm text-gray-400 font-normal'>Trending</span>\"\n        }\n    }\n"
    
    idx_start_2 = text.find(start_str_2)
    idx_end_2 = text.find(end_str_2, idx_start_2) + len(end_str_2)
    
    block_2 = text[idx_start_2:idx_end_2] if idx_start_2 != -1 and idx_end_2 != -1 else ""

    # Block 3: Inventory Engine
    # async def get_scarcity_bumps(db: AsyncSession) -> dict: (line ~2046) ... to "scarcity_bump": bump\n    }\n
    start_str_3 = "async def get_scarcity_bumps(db: AsyncSession) -> dict:"
    end_str_3 = "\"scarcity_bump\": bump\n    }\n"
    
    idx_start_3 = text.find(start_str_3)
    idx_end_3 = text.find(end_str_3, idx_start_3) + len(end_str_3)
    
    block_3 = text[idx_start_3:idx_end_3] if idx_start_3 != -1 and idx_end_3 != -1 else ""

    if not (block_1 and block_2 and block_3):
        print("Blocks not found properly!")
        print("Block 1 size:", len(block_1))
        print("Block 2 size:", len(block_2))
        print("Block 3 size:", len(block_3))
        return

    # Create new router content
    router_content = f"""from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.db.models.tenant import Tenant
from app.db.models.customer import Customer

router = APIRouter()

{block_1.replace('@app.post', '@router.post').replace('@app.get', '@router.get').replace('@app.patch', '@router.patch')}

{block_2.replace('@app.post', '@router.post').replace('@app.get', '@router.get').replace('@app.patch', '@router.patch')}

{block_3.replace('@app.post', '@router.post').replace('@app.get', '@router.get').replace('@app.patch', '@router.patch')}
"""

    # Remove the `/api/v1/` prefix from decorators since it'll be mounted under `/api/v1/booking`
    router_content = router_content.replace('"/api/v1/reservation"', '"/reservation"')
    router_content = router_content.replace('"/api/v1/admin/bookings"', '"/admin/bookings"')
    router_content = router_content.replace('"/api/v1/admin/revenue"', '"/admin/revenue"')
    router_content = router_content.replace('"/api/v1/inventory', '"/inventory')

    with open(TARGET_ROUTER, "w", encoding="utf-8") as f:
        f.write(router_content)
        
    # Remove from server.py (working backwards to preserve indices or doing text replacements)
    new_text = text.replace(block_3, "")
    new_text = new_text.replace(block_2, "")
    new_text = new_text.replace(block_1, "")

    # Mount router in server.py
    old_router_mount = 'app.include_router(\n    media_gateway.router,\n    prefix="/api/v1/media",\n    tags=["Media"]\n)'
    new_router_mount = f"""app.include_router(
    media_gateway.router,
    prefix="/api/v1/media",
    tags=["Media"]
)
app.include_router(
    booking_engine.router,
    prefix="/api/v1/booking",
    tags=["Booking Engine"]
)"""
    new_text = new_text.replace(old_router_mount, new_router_mount)
    new_text = new_text.replace('    media_gateway,\n', '    media_gateway,\n    booking_engine,\n')

    with open("server_new.py", "w", encoding="utf-8") as f:
        f.write(new_text)

    print(f"Decoupled {len(block_1) + len(block_2) + len(block_3)} characters from server.py")
    print(f"Saved to {TARGET_ROUTER} and server_new.py")

if __name__ == "__main__":
    decouple_booking()
