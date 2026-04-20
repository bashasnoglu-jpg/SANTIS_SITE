"""
tools/create_gallery_table.py
One-shot script to create the gallery_assets table in the correct SQLite database.
"""
import sqlite3

conn = sqlite3.connect('santis.db')
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS gallery_assets (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36),
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(512) NOT NULL,
    category VARCHAR(32) NOT NULL,
    caption_tr TEXT DEFAULT '',
    caption_en TEXT DEFAULT '',
    caption_de TEXT DEFAULT '',
    linked_service_id VARCHAR(36),
    blurhash VARCHAR(64),
    cdn_url VARCHAR(512),
    sort_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT 1,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(linked_service_id) REFERENCES services(id)
)
""")
conn.commit()

cursor.execute("CREATE INDEX IF NOT EXISTS ix_gallery_assets_category ON gallery_assets(category)")
conn.commit()

# Verify
tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='gallery_assets'").fetchall()
print(f"Table exists: {len(tables) > 0}")

conn.close()
print("gallery_assets table created in santis.db successfully!")
