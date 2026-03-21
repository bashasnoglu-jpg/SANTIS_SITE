import json
from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Request

from app.db.models.ui_translation import UITranslation
from app.core.redis import RedisClient

# The Omni-Lingo Engine: O(1) Memory Cache + Fallback Logic
I18N_CACHE_PREFIX = "i18n:"
I18N_CACHE_TTL = 3600 * 24  # 24 hours

async def get_translation(db: AsyncSession, tenant_id: str, lang: str, key: str, default: str = "") -> str:
    """
    Santis Omni-Lingo Resolver:
    1. Check Redis for (tenant_id, lang, key)
    2. Fallback to DB (ui_translations where tenant_id=tenant_id)
    3. Fallback to DB (ui_translations where tenant_id=None -> Global)
    4. Return default if completely missing.
    """
    redis = RedisClient.get_redis()
    cache_key = f"{I18N_CACHE_PREFIX}{tenant_id or 'global'}:{lang}:{key}"
    
    # 1. Redis O(1) Lookup
    cached_val = await redis.get(cache_key)
    if cached_val is not None:
        return cached_val

    # 2. DB Lookup: Tenant specific override
    if tenant_id:
        res = await db.execute(
            select(UITranslation.translation_value)
            .where(UITranslation.tenant_id == tenant_id)
            .where(UITranslation.lang == lang)
            .where(UITranslation.translation_key == key)
        )
        val = res.scalar()
        if val:
            await redis.set(cache_key, val, ex=I18N_CACHE_TTL)
            return val
            
    # 3. DB Lookup: Global fallback
    res_global = await db.execute(
        select(UITranslation.translation_value)
        .where(UITranslation.tenant_id.is_(None))
        .where(UITranslation.lang == lang)
        .where(UITranslation.translation_key == key)
    )
    val_global = res_global.scalar()
    
    final_val = val_global if val_global else default
    
    # Cache even the fallback/default to prevent DB spam on missing keys
    await redis.set(cache_key, final_val, ex=I18N_CACHE_TTL)
    
    return final_val

async def get_all_translations_for_tenant(db: AsyncSession, tenant_id: str, lang: str) -> Dict[str, str]:
    """
    Utility for frontend boot: fetches an entire dictionary for a specific language and tenant.
    Merges Global dict with Tenant Override dict.
    """
    redis = RedisClient.get_redis()
    cache_key = f"{I18N_CACHE_PREFIX}dict:{tenant_id or 'global'}:{lang}"
    
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)
        
    # Fetch global
    global_res = await db.execute(
        select(UITranslation.translation_key, UITranslation.translation_value)
        .where(UITranslation.tenant_id.is_(None))
        .where(UITranslation.lang == lang)
    )
    translations = {row.translation_key: row.translation_value for row in global_res}
    
    # Merge tenant overrides
    if tenant_id:
        tenant_res = await db.execute(
            select(UITranslation.translation_key, UITranslation.translation_value)
            .where(UITranslation.tenant_id == tenant_id)
            .where(UITranslation.lang == lang)
        )
        for row in tenant_res:
            translations[row.translation_key] = row.translation_value
            
    await redis.set(cache_key, json.dumps(translations), ex=I18N_CACHE_TTL)
    return translations

# FastAPI Dependency
def get_language_from_request(request: Request) -> str:
    """Extracts preferred language from Accept-Language header or default 'en'."""
    lang_header = request.headers.get("Accept-Language", "en")
    # Accept-Language: tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7
    return lang_header.split(",")[0].split("-")[0].lower()
