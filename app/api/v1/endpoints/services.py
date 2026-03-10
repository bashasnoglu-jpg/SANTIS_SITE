"""
╔══════════════════════════════════════════════════════════════╗
║   THE SOVEREIGN SCRIBE  —  services.py                      ║
║   Kart verisini services.json'a kalıcı mühürler.            ║
║   Auto-Backup + Self-Healing + category/categoryId desteği  ║
╚══════════════════════════════════════════════════════════════╝
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os
import shutil
from typing import Optional

router = APIRouter()

SERVICES_FILE = os.path.join(os.getcwd(), "assets", "data", "services.json")
BACKUP_FILE   = os.path.join(os.getcwd(), "assets", "data", "services_backup.json")


class ServiceUpdatePayload(BaseModel):
    id:          str
    title:       Optional[str] = None
    price_eur:   Optional[str] = None
    image:       Optional[str] = None
    description: Optional[str] = None
    category:    Optional[str] = None
    url:         Optional[str] = None


def _read_services() -> list:
    if not os.path.exists(SERVICES_FILE):
        raise HTTPException(status_code=500, detail="services.json bulunamadı.")
    with open(SERVICES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_services(data: list) -> None:
    with open(SERVICES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _match(item: dict, payload_id: str) -> bool:
    """id, slug veya categoryId kombinasyonuyla eşleştirir."""
    return (
        str(item.get("id", ""))         == payload_id
        or item.get("slug", "")         == payload_id
        or item.get("categoryId", "")   == payload_id
    )


# ── GET: Tüm servis listesi ──────────────────────────────────────
@router.get("/services")
async def list_services():
    return _read_services()


# ── PATCH: Tek kart güncelle ─────────────────────────────────────
@router.patch("/services/update")
async def update_service(payload: ServiceUpdatePayload):
    try:
        # 1 ── Askeri Yedekleme
        shutil.copy2(SERVICES_FILE, BACKUP_FILE)

        # 2 ── Oku
        data = _read_services()

        # 3 ── Bul & Güncelle
        item_found = False
        for item in data:
            if _match(item, payload.id):
                item_found = True

                # Başlık: iç içe content.tr.title'ı da güncelle
                if payload.title is not None:
                    item["title"] = payload.title
                    item.setdefault("content", {}).setdefault("tr", {})["title"] = payload.title

                # Fiyat: price.amount veya price_eur
                if payload.price_eur is not None:
                    try:
                        amount = float(payload.price_eur)
                        item["price_eur"] = amount
                        if isinstance(item.get("price"), dict):
                            item["price"]["amount"] = amount
                        else:
                            item["price"] = {"amount": amount, "currency": "€"}
                    except ValueError:
                        pass

                # Görsel: hem image hem media.hero
                if payload.image is not None:
                    item["image"] = payload.image
                    # media.hero için dosya adı çıkar
                    item.setdefault("media", {})["hero"] = os.path.basename(payload.image)

                # Açıklama
                if payload.description is not None:
                    item["description"] = payload.description
                    item.setdefault("content", {}).setdefault("tr", {})["shortDesc"] = payload.description

                # Kategori
                if payload.category is not None:
                    item["category"] = payload.category

                # URL
                if payload.url is not None:
                    item["url"] = payload.url
                    item["detailUrl"] = payload.url

                break

        if not item_found:
            raise HTTPException(
                status_code=404,
                detail=f"Kart bulunamadı: '{payload.id}'"
            )

        # 4 ── Fiziksel Kayıt
        _write_services(data)

        return {
            "status":  "success",
            "message": f"'{payload.title or payload.id}' başarıyla mühürlendi. ✅",
            "backup":  BACKUP_FILE
        }

    except HTTPException:
        raise
    except Exception as exc:
        # Self-Healing: yedekten geri dön
        if os.path.exists(BACKUP_FILE):
            shutil.copy2(BACKUP_FILE, SERVICES_FILE)
        raise HTTPException(status_code=500, detail=f"Sistem Hatası: {str(exc)}")


# ── GET: Yedekten geri yükle (Acil Kurtarma) ────────────────────
@router.post("/services/restore")
async def restore_from_backup():
    if not os.path.exists(BACKUP_FILE):
        raise HTTPException(status_code=404, detail="Yedek dosya bulunamadı.")
    shutil.copy2(BACKUP_FILE, SERVICES_FILE)
    return {"status": "success", "message": "Yedekten başarıyla geri yüklendi. ✅"}
