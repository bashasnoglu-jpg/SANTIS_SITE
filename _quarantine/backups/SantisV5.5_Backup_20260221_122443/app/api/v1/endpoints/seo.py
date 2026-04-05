from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from email.utils import formatdate
import xml.etree.ElementTree as ET

from database import get_db
from app.db.models.content import ContentRegistry

router = APIRouter(tags=["SEO Engine"])

@router.get("/sitemap.xml", response_class=Response)
async def generate_dynamic_sitemap(db: AsyncSession = Depends(get_db)):
    """
    [Blok D4] Dynamic Sitemap Generator
    Builds a fresh sitemap.xml on the fly from the ContentRegistry.
    """
    stmt = select(ContentRegistry).order_by(ContentRegistry.updated_at.desc())
    result = await db.execute(stmt)
    registries = result.scalars().all()

    urlset = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    
    # 1. Base URL (Homepage)
    base_domain = "https://santis.club"
    
    home_url = ET.SubElement(urlset, "url")
    ET.SubElement(home_url, "loc").text = f"{base_domain}/"
    ET.SubElement(home_url, "changefreq").text = "daily"
    ET.SubElement(home_url, "priority").text = "1.0"
    
    # 2. Dynamic Slugs from Registry
    for reg in registries:
        url = ET.SubElement(urlset, "url")
        loc = f"{base_domain}/{reg.region}/services/{reg.slug}"
        ET.SubElement(url, "loc").text = loc
        
        # Format updated_at as W3C Datetime (YYYY-MM-DDThh:mm:ssTZD)
        # SQLAlchemy returns naive datetime if not aware, but fallback to naive string split
        dt_str = reg.updated_at.isoformat() if reg.updated_at else ""
        if dt_str:
            ET.SubElement(url, "lastmod").text = dt_str
            
        ET.SubElement(url, "changefreq").text = "weekly"
        ET.SubElement(url, "priority").text = "0.8"

    xml_str = ET.tostring(urlset, encoding="utf-8", xml_declaration=True).decode("utf-8")
    
    return Response(content=xml_str, media_type="application/xml")
