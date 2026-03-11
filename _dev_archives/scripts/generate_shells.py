"""
Sovereign Shell Generator
Kırık linkleri phantom shell HTML'ye dönüştürür
Çalıştır: python generate_shells.py
"""
import os, json

ROOT = os.path.dirname(os.path.abspath(__file__))

# ── Admin Kabukları ──────────────────────────────────────────────────────────
ADMIN_SHELLS = [
    "bookings.html", "crm.html", "revenue.html", "sovereign-lab.html",
    "command-center.html", "prototype-cms-v5.html", "god-mode.html",
    "boardroom.html", "black-room.html", "hotels.html"
]

ADMIN_SHELL_HTML = """\
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Santis Admin</title>
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body class="bg-[#050505] text-white min-h-screen flex items-center justify-center">
  <div class="text-center">
    <p class="text-[#D4AF37] text-xs tracking-[0.3em] uppercase mb-4">Sovereign Module</p>
    <h1 class="text-2xl font-serif mb-6">{title}</h1>
    <p class="text-gray-500 text-sm mb-8">Bu modül aktif geliştirme sürecindedir.</p>
    <a href="/admin/gods-eye.html" class="text-[#D4AF37] text-xs tracking-widest uppercase border border-[#D4AF37]/30 px-6 py-3 hover:border-[#D4AF37]">
      → God's Eye'a Dön
    </a>
  </div>
  <script src="/assets/js/app.js" defer></script>
</body>
</html>
"""

admin_dir = os.path.join(ROOT, "admin")
os.makedirs(admin_dir, exist_ok=True)
admin_created = 0
for fname in ADMIN_SHELLS:
    fpath = os.path.join(admin_dir, fname)
    if not os.path.exists(fpath):
        title = fname.replace(".html","").replace("-"," ").title()
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(ADMIN_SHELL_HTML.format(title=title))
        print(f"  ✅ admin/{fname}")
        admin_created += 1
    else:
        print(f"  ⏭️  admin/{fname} — zaten var")

# ── EN Sayfası Kabukları ─────────────────────────────────────────────────────
# TR'de var → EN'de yoksa kabuk oluştur
EN_SHELL_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Santis Club</title>
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
  <div id="navbar-container"></div>
  <main id="nv-main">
    <div id="nv-dynamic-content" class="opacity-0"></div>
  </main>
  <div id="footer-container"></div>
  <script src="/assets/js/loader.js"></script>
  <script src="/assets/js/app.js" defer></script>
</body>
</html>
"""

TR_TO_EN = {
    "tr/hamam":       "en/hammam",
    "tr/masajlar":    "en/massages",
    "tr/cilt-bakimi": "en/skincare",
    "tr/rituals":     "en/rituals",
    "tr/galeri":      "en/gallery",
    "tr/hakkimizda":  "en/about",
    "tr/rezervasyon": "en/reservation",
    "tr/urunler":     "en/products",
    "tr/hediye-karti":"en/gift-cards",
    "tr/blog":        "en/blog",
}

en_created = 0
for tr_rel, en_rel in TR_TO_EN.items():
    tr_dir = os.path.join(ROOT, tr_rel.replace("/", os.sep))
    en_dir = os.path.join(ROOT, en_rel.replace("/", os.sep))
    if not os.path.isdir(tr_dir):
        continue
    os.makedirs(en_dir, exist_ok=True)
    for fname in os.listdir(tr_dir):
        if not fname.endswith(".html"):
            continue
        en_path = os.path.join(en_dir, fname)
        if not os.path.exists(en_path):
            with open(en_path, "w", encoding="utf-8") as f:
                f.write(EN_SHELL_HTML)
            print(f"  ✅ {en_rel}/{fname}")
            en_created += 1
        else:
            pass  # sessiz geç

print(f"\n🛡️  Admin kabukları: {admin_created} adet oluşturuldu.")
print(f"🌍 EN kabukları:    {en_created} adet oluşturuldu.")
print(f"\n🦅 Sovereign Shell Generator tamamlandı!")
