"""
scripts/seed_sovereign_media.py
Sovereign Seed Engine — Idempotent seeding of default gallery assets.
Mevcut 13+ görseli gallery_assets tablosuna is_global=True ile mühürler.
Çalıştırma: python scripts/seed_sovereign_media.py
"""
import sys
import os
import uuid
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

GALLERY_DIR = "assets/img/gallery"

# ── Sovereign Seed Registry ──
# (slot_key, filename, category, caption_tr, alt_text, priority)
SEED_ASSETS = [
    # Hero slots
    ("hero_home",       "hero-general.webp",                              "diger",  "Santis Lounge & Relax",        "Santis Club premium spa lounge alanı",           10),

    # Card slots
    ("card_hamam_1",    "santis_card_hammam_v1.webp",                    "hamam",  "Geleneksel Türk Hamamı",       "Geleneksel Türk hamamı atmosferi",               5),
    ("card_masaj_1",    "santis_card_couple_v1.webp",                    "masaj",  "Çift Masajı",                  "Çift masajı couple suite deneyimi",              5),
    ("card_skincare_1", "santis_card_skincare_v1.webp",                  "cilt",   "Sothys Cilt Bakımı",           "Sothys profesyonel cilt bakım uygulaması",       5),

    # Gallery nodes
    ("gallery_node_1",  "Hammamda köpük masajı huzuru.webp",             "hamam",  "Köpük Masajı Ritüeli",         "Hammamda köpük masajı huzuru ve rahatlama",      1),
    ("gallery_node_2",  "Altın yağı ve ellerin zarafeti.webp",           "masaj",  "Altın Yağı Masajı",            "Altın yağı ile yapılan lüks masaj uygulaması",   1),
    ("gallery_node_3",  "Şirodhara terapi anı.webp",                     "masaj",  "Şirodhara Terapisi",           "Şirodhara Ayurveda terapi anı",                  1),
    ("gallery_node_4",  "Santis-face-mask-4x5-1080x1350.webp",          "cilt",   "Premium Yüz Maskesi",          "Premium yüz maskesi cilt bakım uygulaması",      1),
    ("gallery_node_5",  "Santis_cellulite_yatay_3x2_quietlux.webp",     "cilt",   "Selülit Bakım Ritüeli",        "Selülit bakım ve vücut şekillendirme ritüeli",  1),
    ("gallery_node_6",  "Anjali Mudra with soft lighting.webp",          "diger",  "Meditasyon & Huzur",           "Anjali Mudra meditasyon ve huzur anı",           1),
    ("gallery_node_7",  "Namaste elleri ve tütsü dumanı.webp",           "diger",  "Namaste Ritüeli",              "Namaste elleri ve tütsü dumanı ritüeli",         1),
    ("gallery_node_8",  "Gemini_Generated_Image_gw02fdgw02fdgw02.webp",  "diger",  "Santis Spa Atmosferi",         "Santis Club spa atmosferi ve dinlenme alanı",    1),
    ("gallery_node_9",  "Gemini_Generated_Image_jq8hzwjq8hzwjq8h.webp", "hamam",  "Hamam İç Mekan",               "Hamam iç mekan tasarımı ve detayları",           1),
]


def seed():
    """Idempotent seed: slot+is_global=True varsa güncelle, yoksa ekle."""
    import sqlite3

    # Find the SQLite DB
    db_path = None
    for candidate in ["santis.db", "app.db", "data/santis.db", "data/app.db"]:
        full = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), candidate)
        if os.path.exists(full):
            db_path = full
            break

    if not db_path:
        print("❌ SQLite DB bulunamadı. Aranılan: santis.db, app.db")
        return

    print(f"📂 DB: {db_path}")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Ensure SII columns exist (graceful migration)
    for col_def in [
        ("is_global", "BOOLEAN DEFAULT 0"),
        ("priority", "INTEGER DEFAULT 0"),
        ("alt_text", "TEXT"),
        ("updated_at", "DATETIME"),
    ]:
        try:
            cur.execute(f"ALTER TABLE gallery_assets ADD COLUMN {col_def[0]} {col_def[1]}")
            print(f"  ✅ Column '{col_def[0]}' added")
        except sqlite3.OperationalError:
            pass  # Column already exists

    # Create composite index
    try:
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_slot_sovereign 
            ON gallery_assets (slot, tenant_id, is_global, is_published)
        """)
        print("  ✅ Composite index 'idx_slot_sovereign' created")
    except Exception:
        pass

    # Seed assets
    seeded = 0
    updated = 0
    for slot, filename, category, caption_tr, alt_text, priority in SEED_ASSETS:
        filepath = f"{GALLERY_DIR}/{filename}"

        # Check if already exists
        cur.execute(
            "SELECT id FROM gallery_assets WHERE slot = ? AND is_global = 1",
            (slot,)
        )
        existing = cur.fetchone()

        if existing:
            cur.execute("""
                UPDATE gallery_assets 
                SET filepath = ?, filename = ?, category = ?, caption_tr = ?,
                    alt_text = ?, priority = ?, is_published = 1,
                    updated_at = ?
                WHERE slot = ? AND is_global = 1
            """, (filepath, filename, category, caption_tr, alt_text, priority,
                  datetime.utcnow().isoformat(), slot))
            updated += 1
        else:
            asset_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO gallery_assets 
                    (id, tenant_id, filename, filepath, category, caption_tr, caption_en, caption_de,
                     slot, sort_order, is_published, is_global, priority, alt_text, uploaded_at)
                VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 0, 1, 1, ?, ?, ?)
            """, (asset_id, filename, filepath, category, caption_tr, caption_tr, "",
                  slot, priority, alt_text, datetime.utcnow().isoformat()))
            seeded += 1

    conn.commit()
    conn.close()

    print(f"\n🦅 Sovereign Seed Complete!")
    print(f"   📥 New: {seeded}")
    print(f"   🔄 Updated: {updated}")
    print(f"   📊 Total slots: {len(SEED_ASSETS)}")


if __name__ == "__main__":
    seed()
