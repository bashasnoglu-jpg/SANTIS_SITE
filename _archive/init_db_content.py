import asyncio
from app.db.session import engine
from app.db.base import Base
from app.db.models.content import ContentRegistry, ContentAuditLog

async def init_content_tables():
    async with engine.begin() as conn:
        print("Creating ContentRegistry and ContentAuditLog tables...")
        await conn.run_sync(Base.metadata.create_all, tables=[ContentRegistry.__table__, ContentAuditLog.__table__])
        print("Done!")

if __name__ == "__main__":
    asyncio.run(init_content_tables())
