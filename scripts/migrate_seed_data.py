import json
import time
import sys
import logging
import requests
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, ValidationError

# Configure Logger for the Migration Engine
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("migration")

API_PUBLISH_URL = "http://localhost:8000/api/admin/content/publish"
MAX_RETRIES = 5
BASE_BACKOFF = 3  # seconds

# --- FORENSIC-GRADE SCHEMA FREEZE (v1.0) ---

class ContentMetaSchema(BaseModel):
    title: str
    shortDesc: Optional[str] = None
    fullDesc: Optional[str] = None
    tagline: Optional[str] = None
    heroTitle: Optional[str] = None
    intro: Optional[str] = None
    steps: Optional[List[str]] = None
    effects: Optional[str] = None
    idealFor: Optional[str] = None
    signature: Optional[str] = None

class MigrationServiceSchema(BaseModel):
    schema_version: str = "1.0"
    slug: str
    locale: Dict[str, ContentMetaSchema]
    category: Optional[str] = None
    tags: List[str] = []
    duration: Optional[int] = None
    price_amount: Optional[float] = None
    price_currency: Optional[str] = None
    media_hero: Optional[str] = None

def mock_luxury_score(text: str) -> int:
    """Calculates a quick baseline luxury score for dry-run insight."""
    score = 90
    lower_text = text.lower()
    if "kampanya" in lower_text or "uygun" in lower_text or "indirim" in lower_text:
        score -= 20
    if "premium" in lower_text or "özel" in lower_text or "huzur" in lower_text:
        score += 5
    return min(100, max(0, score))

def load_legacy_services() -> List[Dict[str, Any]]:
    path = Path(__file__).resolve().parent.parent / "assets" / "data" / "services.json"
    if not path.exists():
        logger.error(f"Legacy file not found: {path}")
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def normalize_service(legacy: Dict[str, Any]) -> dict:
    """Transforms raw legacy JSON into the Strict Schema V1.0 Object"""
    slug = legacy.get("slug", legacy.get("id"))
    locales = {}
    
    # Process multiple locales if available
    content_block = legacy.get("content", {})
    for lang, data in content_block.items():
        locales[lang] = {
            "title": data.get("title", f"Untitled {lang}"),
            "shortDesc": data.get("shortDesc"),
            "fullDesc": data.get("fullDesc"),
            "tagline": data.get("tagline"),
            "heroTitle": data.get("heroTitle"),
            "intro": data.get("intro"),
            "steps": data.get("steps"),
            "effects": data.get("effects"),
            "idealFor": data.get("idealFor"),
            "signature": data.get("signature"),
        }
        
    price_obj = legacy.get("price", {})
    media_obj = legacy.get("media", {})
    
    return {
        "schema_version": "1.0",
        "slug": slug,
        "locale": locales,
        "category": legacy.get("category", legacy.get("categoryId", "unknown")),
        "tags": legacy.get("tags", []),
        "duration": legacy.get("duration"),
        "price_amount": price_obj.get("amount") if isinstance(price_obj, dict) else None,
        "price_currency": price_obj.get("currency") if isinstance(price_obj, dict) else None,
        "media_hero": media_obj.get("hero") if isinstance(media_obj, dict) else None,
    }

def publish_with_backoff(slug: str, region: str, payload: dict) -> bool:
    """Exponential Backoff Rate-Limiter Engine for API Posts"""
    headers = {
        "Content-Type": "application/json",
        "X-Audit-Action": "migration_publish",
        "X-Migration-Source": "legacy_services.json"
    }
    
    req_body = {
        "slug": slug,
        "region_id": region,
        "content": payload
    }
    
    for attempt in range(MAX_RETRIES):
        try:
            res = requests.post(API_PUBLISH_URL, headers=headers, json=req_body, timeout=10)
            
            if res.status_code == 429:
                wait_time = BASE_BACKOFF * (2 ** attempt)
                logger.warning(f"[429 Rate Limit] Backing off for {wait_time}s ... (Attempt {attempt+1}/{MAX_RETRIES})")
                time.sleep(wait_time)
                continue
                
            if res.status_code == 200:
                body = res.json()
                if body.get('status') == 'already_migrated':
                    logger.info(f"[{slug}] IDEMPOTENT SKIP. Hash {body.get('version_hash')} already active.")
                else:
                    logger.info(f"[{slug}] Publish SUCCESS. Hash: {body.get('version_hash')}")
                return True
                
            logger.error(f"[{slug}] Publish Failed with {res.status_code}: {res.text}")
            return False
            
        except requests.exceptions.RequestException as e:
            wait_time = BASE_BACKOFF * (2 ** attempt)
            logger.warning(f"Connection Error: {e}. Retrying in {wait_time}s...")
            time.sleep(wait_time)
            
    logger.error(f"[{slug}] Exhausted all {MAX_RETRIES} retries.")
    return False

def main():
    parser = argparse.ArgumentParser(description="OMNI-CORE Phase 12 - Forensic Content Migration")
    parser.add_argument("--dry-run", action="store_true", help="Report Schema compliance and mock-scores only.")
    parser.add_argument("--pilot", action="store_true", help="Execute the first 5 records only (Staged Migration).")
    args = parser.parse_args()

    logger.info(f"Starting Phase 12 Migration Engine. Dry-Run: {args.dry_run}")
    
    legacy_data = load_legacy_services()
    logger.info(f"Loaded {len(legacy_data)} records from legacy storage.")

    # 1. Pilot Filter
    if args.pilot:
        legacy_data = legacy_data[:5]
        logger.info(f"Pilot Mode Active. Capped to {len(legacy_data)} targets.")
        
    failed_payloads = []
    
    for index, raw_item in enumerate(legacy_data):
        logger.info("-" * 40)
        slug = raw_item.get("slug", raw_item.get("id", f"unknown-{index}"))
        
        # 2. Schema Normalization & Freeze Check
        normalized = normalize_service(raw_item)
        
        try:
            validated = MigrationServiceSchema(**normalized)
            if args.dry_run:
                tr_content = validated.locale.get("tr", None)
                raw_text = tr_content.fullDesc or tr_content.shortDesc or tr_content.title if tr_content else ""
                score = mock_luxury_score(raw_text)
                
                logger.info(f"✅ Schema MATCH     | Slug: {slug}")
                logger.info(f"   Luxury Score    | {score}/100")
                logger.info(f"   Locales Found   | {list(validated.locale.keys())}")
            else:
                # 3. Execution (Publish)
                logger.info(f"🚀 Pushing payload: {slug}")
                success = publish_with_backoff(slug, "tr", validated.model_dump())
                
                if not success:
                    failed_payloads.append(slug)
                    
        except ValidationError as e:
            logger.error(f"❌ Schema MISMATCH  | Slug: {slug}")
            logger.error(f"   Validation Error| {e.errors()[0]['msg']} (Loc: {e.errors()[0]['loc']})")
            failed_payloads.append(slug)

    # 4. Final Logging Output
    if args.dry_run:
        logger.info("\n[DRY-RUN] Finished scanning all payloads. No database writes generated.")
        if failed_payloads:
            logger.warning(f"{len(failed_payloads)} payloads failed validation.")
    else:
        logger.info("\n[EXECUTION] Migration Queue complete.")
        if failed_payloads:
            logger.error(f"FAILED SLUGS: {failed_payloads}")
            with open("failed_migration.log", "a") as f:
                for s in failed_payloads:
                    f.write(f"{s}\n")
            logger.info("Saved to `failed_migration.log` for resumable checks.")
            
if __name__ == "__main__":
    main()
