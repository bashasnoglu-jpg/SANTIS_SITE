import asyncio
from sqlalchemy import select, func
from app.db.session import AsyncSessionLocal
from app.db.models.booking import Booking
from datetime import date

async def check():
    async with AsyncSessionLocal() as db:
        today = date.today()
        print(f"Checking bookings for today: {today}")
        
        stmt = select(func.count(Booking.id)).where(
            func.date(Booking.created_at) == today
        )
        result = await db.execute(stmt)
        count = result.scalar() or 0
        print(f"Total bookings today: {count}")
        
        # Test total bookings ever
        stmt_all = select(func.count(Booking.id))
        res_all = await db.execute(stmt_all)
        print(f"Total bookings ALL TIME: {res_all.scalar()}")

if __name__ == "__main__":
    asyncio.run(check())
