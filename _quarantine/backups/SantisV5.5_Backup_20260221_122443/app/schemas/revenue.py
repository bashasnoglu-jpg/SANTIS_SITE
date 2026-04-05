from pydantic import BaseModel
from datetime import date
from decimal import Decimal
from typing import List, Optional
import uuid

class DailyRevenueOut(BaseModel):
    date: date
    daily_revenue: Decimal
    booking_count: int

    class Config:
        from_attributes = True

class RevenueStats(BaseModel):
    total_revenue: Decimal
    total_bookings: int
    daily_breakdown: List[DailyRevenueOut]

class TopPerformer(BaseModel):
    id: uuid.UUID
    name: str
    revenue: Decimal
    count: int

class AnalyticsOut(BaseModel):
    period_start: date
    period_end: date
    revenue_stats: RevenueStats
    top_staff: List[TopPerformer] = []
    top_services: List[TopPerformer] = []
