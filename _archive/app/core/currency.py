import json
from datetime import date, datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.models.fx_rate import FXRateHistory
from app.core.redis import RedisClient

# The Sovereign Currency Engine
FX_CACHE_PREFIX = "fx:"
FX_CACHE_TTL = 3600  # 1 hour cache to avoid hammering DB/API for live rates

async def _fetch_live_rate_fallback(base: str, target: str) -> float:
    """
    Mock external API call (e.g., Fixer.io, Stripe, OpenExchangeRates).
    In production, this replaces missing DB entries with live data.
    """
    # Mocking standard rates against EUR
    mock_rates = {
        "EUR-TRY": 35.50,
        "EUR-USD": 1.08,
        "EUR-GBP": 0.85,
        "EUR-AED": 3.96
    }
    return mock_rates.get(f"{base}-{target}", 1.0)

async def get_conversion_rate(db: AsyncSession, base: str = "EUR", target: str = "EUR", req_date: Optional[date] = None) -> float:
    """
    Sovereign FX Resolver:
    1. If base == target, return 1.0.
    2. Check Redis for today's rate (if no specific date requested).
    3. Check Database for historical or today's rate.
    4. Fallback to external API if missing.
    """
    if base == target:
        return 1.0
        
    target_date = req_date or date.today()
    is_today = target_date == date.today()
    
    redis = RedisClient.get_redis()
    cache_key = f"{FX_CACHE_PREFIX}{base}_{target}_{target_date.isoformat()}"
    
    # 1. Redis Cache (only checking for 'today' or recently fetched historical)
    cached_rate = await redis.get(cache_key)
    if cached_rate is not None:
        return float(cached_rate)

    # 2. Database Lookup
    res = await db.execute(
        select(FXRateHistory.conversion_rate)
        .where(FXRateHistory.date == target_date)
        .where(FXRateHistory.base_currency == base)
        .where(FXRateHistory.target_currency == target)
    )
    db_rate = res.scalar()
    
    if db_rate:
        final_rate = float(db_rate)
    else:
        # 3. Fallback: External API Fetch + DB Store
        final_rate = await _fetch_live_rate_fallback(base, target)
        
        # Store in DB so we permanently have a snapshot for this date
        try:
            new_fx = FXRateHistory(
                date=target_date,
                base_currency=base,
                target_currency=target,
                conversion_rate=final_rate
            )
            db.add(new_fx)
            await db.commit()
        except Exception:
            await db.rollback() # Likely a race condition where another worker inserted it
            pass

    # Cache for 1 hour to prevent DB spam
    await redis.set(cache_key, str(final_rate), ex=FX_CACHE_TTL if is_today else 86400)
    
    return final_rate

async def apply_currency_vault_snapshot(db: AsyncSession, local_amount: float, local_currency: str, base_currency: str = "EUR") -> dict:
    """
    Used at the exact moment of Booking Creation.
    Calculates the base amount and returns the full Immutable Ledger tuple.
    """
    if local_currency == base_currency:
        return {
            "fx_rate_snapshot": 1.0,
            "local_currency": local_currency,
            "base_currency_amount": local_amount
        }
        
    rate = await get_conversion_rate(db, base=base_currency, target=local_currency)
    
    # A_base = A_local / Rate (If rate is 1 EUR = 35 TRY, then 350 TRY = 10 EUR)
    base_amount = round(local_amount / rate, 2)
    
    return {
        "fx_rate_snapshot": round(rate, 4),
        "local_currency": local_currency,
        "base_currency_amount": base_amount
    }
