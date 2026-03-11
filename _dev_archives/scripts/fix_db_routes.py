import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def fix_slot_routes():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT id, slot_key, page_route FROM slot_routes"))
        routes = res.fetchall()
        
        updated = 0
        for r in routes:
            r_id, key, route = r
            if route and route.endswith(".html") and not route.endswith("index.html"):
                # Check if it should be an index file
                # If the route is /tr/hamam.html, it should likely be /tr/hamam/index.html
                # For example, if it's the main section route.
                
                # Check if the folder exists
                import os
                # path is like /tr/hamam.html
                rel_path = route.lstrip('/')
                base_dir = rel_path.replace(".html", "")
                
                if os.path.isdir(base_dir):
                    new_route = f"/{base_dir}/index.html"
                    await db.execute(text("UPDATE slot_routes SET page_route = :new_r WHERE id = :id"), {"new_r": new_route, "id": r_id})
                    updated += 1
                    print(f"Fixed {route} -> {new_route}")
        
        await db.commit()
        print(f"Total updated: {updated}")

if __name__ == "__main__":
    asyncio.run(fix_slot_routes())
