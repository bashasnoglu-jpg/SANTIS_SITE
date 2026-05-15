css = """/* ==========================================================================
   SANTIS NATIVE BENTO GRID (Quantum Glare Edition)
   ========================================================================== */

.santis-bento-grid {
  display: grid;
  grid-auto-rows: 250px;
  gap: 1.5rem;
  grid-auto-flow: dense;
  padding: 2rem 0;
  width: 100%;
  box-sizing: border-box;
}

/* --- STANDART KART YAPISI VE CAM EFEKTİ --- */
.santis-card {
  background: rgba(25, 25, 25, 0.6);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 1.5rem;
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  position: relative;
  text-decoration: none;
}

.santis-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 20%, rgba(5, 5, 5, 0.95) 100%);
  pointer-events: none;
  z-index: 1;
}

.santis-bento-content {
  position: relative;
  z-index: 10;
  opacity: 1 !important;
  visibility: visible !important;
  transform: none !important;
}

.santis-card:hover {
  transform: translateY(-8px) translateZ(0);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

/* --- BENTO MODİFİKATÖRLERİ --- */
.santis-card.hero {
  grid-column: span 2;
  grid-row: span 2;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(0,0,0,0.6)), url('/assets/img/cards/santis_hero_massage_lux.webp') center/cover;
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.santis-card.wide {
  grid-column: span 2;
}
.santis-card.tall {
  grid-row: span 2;
}


/* ==========================================================================
   MATEMATİKSEL KUSURSUZ MEDIA QUERIES
   ========================================================================== */

/* 1. MASAÜSTÜ (1025px ve üzeri) - Sürekli 4 Kolon */
@media (min-width: 1025px) {
  .santis-bento-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 2. TABLET (769px - 1024px) - Sürekli 3 Kolon */
@media (min-width: 769px) and (max-width: 1024px) {
  .santis-bento-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  /* Wide kartı span 2 yaparsak, 3. kolona sığmaz ve 4. kolonu force edip ezer! Bu yüzden span 1'e düşürüyoruz. */
  .santis-card.wide {
    grid-column: span 1;
  }
}

/* 3. MOBİL SİHİRLİ ÇÖZÜLÜM (768px Altı) - Sürekli 1 Kolon */
@media (max-width: 768px) {
  .santis-bento-grid {
    grid-template-columns: 1fr;
    grid-auto-flow: row;
    gap: 1rem;
    padding: 1rem 0;
  }
  .santis-card.hero,
  .santis-card.wide,
  .santis-card.tall {
    grid-column: span 1 !important;
    grid-row: span 1 !important;
  }
  .santis-card.hero {
    min-height: 400px;
    justify-content: flex-end;
  }
}
"""

with open('assets/css/santis-v6/santis.bento-grid.css', 'w', encoding='utf-8') as f:
    f.write(css)

# Update hamam.html to bust the cache instantly without relying on Service Worker refresh delays.
with open('hamam.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace any existing query param or add one if it doesn't exist to force a brand new fetch.
import time
timestamp = str(int(time.time()))
html = re.sub(r'santis\.bento-grid\.css(\?v=[0-9A-Za-z_]+)?', f'santis.bento-grid.css?v={timestamp}', html)

with open('hamam.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("CSS Math Fixed & Cache Bust Applied!")
