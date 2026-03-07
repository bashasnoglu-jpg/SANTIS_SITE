import asyncio
from app.db.session import engine
from app.db.base import Base

# Ensure all models are imported so Base.metadata knows about them
from app.db.models.content import ContentRegistry, ContentAuditLog, DraftRegistry, RedirectRegistry, OutboxEvent, ContentEdge
from app.db.models.booking import Booking
from app.db.models.service import Service
from app.db.models.user import User

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())
