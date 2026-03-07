import asyncio
from app.db.base import Base

# We must import all models here so `Base.metadata` knows about them
from app.db.models.user import User
from app.db.models.tenant import Tenant
from app.db.models.service import Service
from app.db.models.booking import Booking
from app.db.models.customer import Customer
from app.db.models.staff import Staff
from app.db.models.room import Room
from app.db.models.audit import AuditLog
from app.db.models.commission import StaffCommission
from app.db.models.content import ContentRegistry, ContentAuditLog
from app.db.models.auth import AuthLockout
from app.db.models.consent import UserConsent
from app.db.models.resource import Resource
from app.db.models.precomputed_slot import PrecomputedSlot

from app.db.session import engine

async def init_db():
    async with engine.begin() as conn:
        print("Creating all tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created.")

if __name__ == "__main__":
    asyncio.run(init_db())
