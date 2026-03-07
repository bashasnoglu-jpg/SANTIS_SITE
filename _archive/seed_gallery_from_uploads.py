"""
seed_gallery_from_uploads.py
=============================
assets/img/uploads/*.webp dosyalarini galeri DB'ye kaydet.
Zaten kayitli olanlar atlanir (filename kontrolu ile).
"""
import asyncio, asyncpg, uuid, os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

UPLOADS_DIR = Path("assets/img/uploads")

# Kategori tahmin: dosya ismi yoksa "diger" fallback
def guess_category(fn: str) -> str:
    n = fn.lower()
    if any(k in n for k in ["hamam","kese","hammam","ottoman","bath"]):
        return "hamam"
    if any(k in n for k in ["masaj","massage","relax"]):
        return "masaj"
    if any(k in n for k in ["cilt","bakım","sothys","skin","facial"]):
        return "cilt"
    return "diger"

async def main():
    conn = await asyncpg.connect("postgresql://postgres@localhost:5432/santisdb")

    # Aktif tenant
    tenant_row = await conn.fetchrow(
        "SELECT id FROM tenants WHERE is_active = true LIMIT 1"
    )
    if not tenant_row:
        print("❌ Tenant bulunamadı.")
        await conn.close()
        return
    tenant_id = tenant_row["id"]
    print(f"🏛️ Tenant: {tenant_id}")

    # Mevcut dosya adları
    existing = await conn.fetch("SELECT filename FROM gallery_assets")
    existing_fns = {r["filename"] for r in existing}
    print(f"🗄️  Mevcut kayıt: {len(existing_fns)}")

    # uploads/ klasöründeki webp'leri tara
    webp_files = list(UPLOADS_DIR.glob("*.webp"))
    print(f"📁 Bulunan .webp: {len(webp_files)}")

    inserted = 0
    skipped  = 0

    for fpath in webp_files:
        fn = fpath.name
        if fn in existing_fns:
            skipped += 1
            continue

        filepath = f"assets/img/uploads/{fn}"
        category = guess_category(fn)
        aid = str(uuid.uuid4())

        await conn.execute("""
            INSERT INTO gallery_assets
                (id, tenant_id, filename, filepath, category,
                 is_published, uploaded_at)
            VALUES
                ($1::uuid, $2::uuid, $3, $4, $5, true, NOW())
        """, aid, str(tenant_id), fn, filepath, category)
        inserted += 1

    await conn.close()

    print(f"\n✅ Galeri seed tamamlandı!")
    print(f"   ➕ Eklendi:   {inserted}")
    print(f"   ⏭️  Atlandı:  {skipped}")

if __name__ == "__main__":
    asyncio.run(main())
