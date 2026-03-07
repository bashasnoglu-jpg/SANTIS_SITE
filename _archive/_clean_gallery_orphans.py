import asyncio, asyncpg, os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

async def main():
    conn = await asyncpg.connect("postgresql://postgres@localhost:5432/santisdb")
    
    # Tüm gallery assetleri kontrol et
    rows = await conn.fetch(
        "SELECT id, filename, filepath FROM gallery_assets"
    )
    
    to_delete = []
    for r in rows:
        fp = str(r["filepath"]).lstrip("/")
        full_path = Path(fp)
        if not full_path.exists():
            to_delete.append(r["id"])
            print(f"  ❌ MISSING: {r['filename'][:50]} → {fp[:60]}")
        else:
            print(f"  ✅ OK:      {r['filename'][:50]}")
    
    print(f"\nSilinecek: {len(to_delete)} / Toplam: {len(rows)}")
    
    if to_delete:
        result = await conn.execute(
            "DELETE FROM gallery_assets WHERE id = ANY($1::text[])",
            [str(x) for x in to_delete]
        )
        print(f"🗑️  {result} kayıt silindi.")
    
    await conn.close()
    print("✅ Temizleme tamamlandı.")

asyncio.run(main())
