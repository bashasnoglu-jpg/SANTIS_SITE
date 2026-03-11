import ast
import re

# 1. Clean server.py
with open('server.py', 'r', encoding='utf-8') as f:
    source_server = f.read()

tree_server = ast.parse(source_server)
funcs_server = {
    'intercept_services_json',
    'intercept_products_json',
    'get_inventory',
    'update_inventory_stock'
}

lines_server = source_server.splitlines(True)
lines_to_keep_server = [True] * len(lines_server)

for node in tree_server.body:
    if isinstance(node, (ast.AsyncFunctionDef, ast.FunctionDef)) and node.name in funcs_server:
        start = node.decorator_list[0].lineno if node.decorator_list else node.lineno
        end = node.end_lineno
        for i in range(start - 1, end):
            lines_to_keep_server[i] = False

new_source_server = ''.join([line for i, line in enumerate(lines_server) if lines_to_keep_server[i]])

router_block = """app.include_router(
    services.router,
    prefix="/api/v1/services",
    tags=["services_live_pricing"],
)
app.include_router(
    services.inventory_router,
    prefix="/api/v1/inventory",
    tags=["inventory"]
)
app.include_router(
    services.legacy_proxy_router,
    tags=["legacy_proxy"]
)"""

new_source_server = re.sub(
    r'app\.include_router\(\s*services\.router,\s*prefix="/api/v1/services",\s*tags=\["services_live_pricing"\],\s*\)',
    router_block,
    new_source_server,
    count=1
)

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(new_source_server)

# 2. Append to services.py
legacy_code = """

# --- INVENTORY & SCARCITY ENGINE (PHASE O) ---
from fastapi import Body, HTTPException
try:
    from server import neural_thought
except ImportError:
    async def neural_thought(msg, level="info"):
        pass

inventory_router = APIRouter()

@inventory_router.get("")
async def get_inventory(db: AsyncSession = Depends(get_db)):
    \"\"\"Phase O – Full inventory list with scarcity status.\"\"\"
    res = await db.execute(text(\"\"\"
        SELECT si.id, si.service_id, s.name as service_name,
               si.item_name, si.unit, si.current_stock, si.min_threshold,
               si.is_luxury, si.notes, si.updated_at
        FROM service_inventory si
        LEFT JOIN services s ON s.id = si.service_id
        ORDER BY (si.current_stock - si.min_threshold) ASC
    \"\"\"))
    rows = res.fetchall()
    items = []
    for r in rows:
        is_critical = r.current_stock <= r.min_threshold
        items.append({
            "id": r.id, "service_id": r.service_id, "service_name": r.service_name,
            "item_name": r.item_name, "unit": r.unit,
            "current_stock": r.current_stock, "min_threshold": r.min_threshold,
            "is_luxury": bool(r.is_luxury), "notes": r.notes,
            "is_critical": is_critical,
            "scarcity_bump": 0.25 if (is_critical and r.is_luxury) else (0.10 if is_critical else 0.0),
            "updated_at": str(r.updated_at)
        })
    return {"status": "success", "total": len(items), "critical": sum(1 for i in items if i["is_critical"]), "items": items}

@inventory_router.patch("/{item_id}")
async def update_inventory_stock(item_id: str, payload: dict = Body(...), db: AsyncSession = Depends(get_db)):
    \"\"\"Phase O – Update stock level for an inventory item.\"\"\"
    res = await db.execute(text("SELECT * FROM service_inventory WHERE id = :id"), {"id": item_id})
    row = res.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    new_stock = payload.get("current_stock", row.current_stock)
    await db.execute(text(\"\"\"
        UPDATE service_inventory
        SET current_stock = :stock, updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    \"\"\"), {"stock": new_stock, "id": item_id})
    await db.commit()

    is_critical = new_stock <= row.min_threshold
    bump = 0.25 if (is_critical and row.is_luxury) else (0.10 if is_critical else 0.0)

    if is_critical:
        cluster = "Aesthetic Elite" if row.is_luxury else "Recovery Athlete"
        await neural_thought(
            f"Santis Inventory ∷ '{row.item_name}' critical — {new_stock} {row.unit} left. "
            f"Scarcity +{bump:.0%} surge → {cluster} cluster targeted.",
            level="alert" if row.is_luxury else "surge"
        )
    else:
        await neural_thought(f"Santis Inventory ∷ '{row.item_name}' restocked → {new_stock} {row.unit}.", level="info")

    return {
        "status": "success",
        "item_id": item_id,
        "new_stock": new_stock,
        "scarcity_bump": bump
    }

# --- LEGACY JSON INTERCEPTORS & SWIPER FEEDER ---
from fastapi.responses import FileResponse
from app.core._config import settings

BASE_DIR = Path(__file__).resolve().parents[4]

legacy_proxy_router = APIRouter()

@legacy_proxy_router.get("/assets/data/services.json")
async def intercept_services_json(db: AsyncSession = Depends(get_db)):
    \"\"\"
    Modernized Dynamic Services Interceptor. Reads directly from DB if available, 
    otherwise falls back to static JSON. Used for legacy proxying.
    \"\"\"
    # For now, acting as a pass-through to not break the frontend format immediately, 
    # but could be fully DB-backed dynamically.
    services_path = BASE_DIR / "assets" / "data" / "services.json"
    if not services_path.exists():
         return {"error": "Services data not found"}
    return FileResponse(services_path, headers={"Cache-Control": "public, max-age=300", "X-Santis-Edge": "Intercepted-Index"})

@legacy_proxy_router.get("/assets/data/product-data.json")
async def intercept_products_json():
    # Similar mechanism for products catalog
    products_path = BASE_DIR / "assets" / "data" / "product-data.json"
    if not products_path.exists():
         return {"error": "Products data not found"}
    return FileResponse(products_path, headers={"Cache-Control": "public, max-age=300", "X-Santis-Edge": "Intercepted-Index"})

@router.get("/swiper-cards")
async def get_swiper_cards(db: AsyncSession = Depends(get_db)):
    \"\"\"
    [Phase S] Apple-Style Swiper Feeder:
    Lightweight, lazy-load optimized Service Card Data generated directly from DB.
    \"\"\"
    result = await db.execute(text(\"\"\"
        SELECT id, name, duration_minutes, current_price_eur, category, demand_multiplier 
        FROM services WHERE is_active=true AND is_deleted=false LIMIT 20
    \"\"\"))
    rows = result.fetchall()
    cards = []
    for r in rows:
        cards.append({
            "id": str(r.id),
            "name": r.name,
            "duration": f"{r.duration_minutes} min",
            "price": float(r.current_price_eur),
            "category": r.category,
            "surge": float(r.demand_multiplier) > 1.0,
            "image": f"/assets/img/services/{str(r.name).lower().replace(' ', '-')}.jpg" # Placeholder structural logic
        })
    return {"status": "success", "cards": cards}

"""

with open('app/api/v1/endpoints/services.py', 'a', encoding='utf-8') as f:
    f.write(legacy_code)

print('Successfully extracted services and inventory endpoints.')
