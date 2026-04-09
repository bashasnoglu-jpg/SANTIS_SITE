import sys

filepath = r'c:\Users\tourg\Desktop\SANTIS_SITE\tr\index.html'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

out_lines = []
skip = False
for i, line in enumerate(lines):
    if i == 763: 
        skip = True
        
        new_content = """<!-- ========================================================= -->
<!-- SANTIS OS — SECTION 3 / SIGNATURE 6 RITUALS               -->
<!-- ========================================================= -->

<style>
/* ========================================================= */
/* SANTIS OS — SECTION 3 / SIGNATURE 6 RITUALS               */
/* ========================================================= */

.signature-rituals-section {
  position: relative;
  padding: 110px 20px;
  background:
    radial-gradient(circle at top, rgba(196,163,110,0.08), transparent 24%),
    linear-gradient(180deg, #0a0c10 0%, #06080b 100%);
  color: var(--sovereign-text, #f5f1e8);
  overflow: clip;
}

.signature-rituals-shell {
  width: min(100%, var(--sovereign-max, 1280px));
  margin: 0 auto;
}

.signature-rituals-head {
  max-width: 860px;
  margin: 0 auto 38px;
  text-align: center;
}

.signature-kicker {
  margin: 0 0 12px;
  font-size: 0.78rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(230,210,170,0.70);
}

.signature-title {
  margin: 0;
  font-size: clamp(1.8rem, 3.6vw, 3.25rem);
  line-height: 1.04;
  font-weight: 300;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.signature-subtitle {
  max-width: 740px;
  margin: 16px auto 0;
  font-size: 1rem;
  line-height: 1.8;
  color: rgba(245,241,232,0.72);
}

.signature-coverflow {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(290px, 360px);
  gap: 18px;
  overflow-x: auto;
  overflow-y: visible;
  padding: 12px 4px 8px;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.signature-coverflow::-webkit-scrollbar {
  display: none;
}

.signature-card {
  position: relative;
  min-height: 520px;
  border-radius: 26px;
  overflow: hidden;
  background: #111;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 22px 70px rgba(0,0,0,0.42);
  scroll-snap-align: center;
  transform: scale(0.96);
  opacity: 0.92;
  transition:
    transform 380ms cubic-bezier(.22,.61,.36,1),
    opacity 380ms ease,
    border-color 380ms ease,
    box-shadow 380ms ease;
}

.signature-card:hover,
.signature-card:focus-within,
.signature-card.is-featured {
  transform: scale(1);
  opacity: 1;
  border-color: rgba(196,163,110,0.28);
  box-shadow:
    0 28px 90px rgba(0,0,0,0.48),
    0 0 0 1px rgba(196,163,110,0.10) inset;
}

.signature-card-media,
.signature-card-image,
.signature-card-overlay {
  position: absolute;
  inset: 0;
}

.signature-card-image {
  background-size: cover;
  background-position: center;
  transform: scale(1);
  transition: transform 1.2s ease;
  filter: saturate(0.92) contrast(1.02);
}

.signature-card:hover .signature-card-image,
.signature-card:focus-within .signature-card-image {
  transform: scale(1.08);
}

.signature-card-overlay {
  background:
    linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.26) 34%, rgba(0,0,0,0.92) 100%);
  z-index: 1;
}

.signature-card-body {
  position: relative;
  z-index: 2;
  min-height: 520px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 30px 26px 28px;
}

.signature-tag {
  align-self: flex-start;
  margin-bottom: 14px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(196,163,110,0.22);
  background: rgba(255,255,255,0.04);
  color: rgba(230,210,170,0.88);
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.signature-card-title {
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.14;
  font-weight: 400;
  letter-spacing: -0.02em;
  color: #fff;
}

.signature-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.10);
  color: rgba(245,241,232,0.70);
  font-size: 0.95rem;
}

.signature-price {
  color: #e6d2aa;
  font-weight: 500;
}

.signature-card-copy {
  margin: 16px 0 0;
  color: rgba(245,241,232,0.76);
  font-size: 0.96rem;
  line-height: 1.8;
}

.signature-link {
  margin-top: 18px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  text-decoration: none;
  font-size: 0.84rem;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  transition: color 260ms ease, transform 260ms ease;
}

.signature-link span {
  transition: transform 260ms ease;
}

.signature-card:hover .signature-link,
.signature-card:focus-within .signature-link {
  color: #c4a36e;
}

.signature-card:hover .signature-link span,
.signature-card:focus-within .signature-link span {
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .signature-rituals-section {
    padding: 86px 12px;
  }

  .signature-coverflow {
    grid-auto-columns: minmax(84vw, 84vw);
    gap: 14px;
  }

  .signature-card,
  .signature-card-body {
    min-height: 470px;
  }
}
</style>

<section id="signature-rituals" class="signature-rituals-section">
  <div class="signature-rituals-shell">
    <div class="signature-rituals-head">
      <p class="signature-kicker">Santis Club — Signature Collection</p>
      <h2 class="signature-title">Six rituals. No noise. Only sovereign choices.</h2>
      <p class="signature-subtitle">
        Our most desirable journeys, selected for prestige, sensory depth, guest appeal and margin strength.
      </p>
    </div>

    <div class="signature-coverflow" data-signature-rail>
      <article class="signature-card is-featured" data-service-id="mix-manuel-therapy-90">
        <div class="signature-card-media">
          <div class="signature-card-image" style="background-image:url('/assets/img/rituals/mix-manuel.jpg');"></div>
          <div class="signature-card-overlay"></div>
        </div>
        <div class="signature-card-body">
          <span class="signature-tag">The Masterpiece</span>
          <h3 class="signature-card-title">Mix Manuel Therapy</h3>
          <div class="signature-card-meta">
            <span class="signature-duration">90 min</span>
            <span class="signature-price">180 €</span>
          </div>
          <p class="signature-card-copy">
            The highest prestige therapeutic ritual in the menu — authoritative, intensive and unmistakably premium.
          </p>
          <a href="#dynamic-reveal-stage" class="signature-link">Discover Journey <span>→</span></a>
        </div>
      </article>

      <article class="signature-card" data-service-id="deluxe-care-90">
        <div class="signature-card-media">
          <div class="signature-card-image" style="background-image:url('/assets/img/rituals/deluxe-care.jpg');"></div>
          <div class="signature-card-overlay"></div>
        </div>
        <div class="signature-card-body">
          <span class="signature-tag">Ultimate Glow</span>
          <h3 class="signature-card-title">Deluxe Care</h3>
          <div class="signature-card-meta">
            <span class="signature-duration">90 min</span>
            <span class="signature-price">170 €</span>
          </div>
          <p class="signature-card-copy">
            A high-touch facial prestige ritual for visible radiance, renewal and elevated self-presentation.
          </p>
          <a href="#dynamic-reveal-stage" class="signature-link">Discover Journey <span>→</span></a>
        </div>
      </article>

      <article class="signature-card" data-service-id="mandara-massage-4-hand-50">
        <div class="signature-card-media">
          <div class="signature-card-image" style="background-image:url('/assets/img/rituals/mandara.jpg');"></div>
          <div class="signature-card-overlay"></div>
        </div>
        <div class="signature-card-body">
          <span class="signature-tag">Sensory Indulgence</span>
          <h3 class="signature-card-title">Mandara Massage (4 Hand)</h3>
          <div class="signature-card-meta">
            <span class="signature-duration">50 min</span>
            <span class="signature-price">150 €</span>
          </div>
          <p class="signature-card-copy">
            A theatrical luxury statement designed to feel rare, immersive and ceremonially indulgent.
          </p>
          <a href="#dynamic-reveal-stage" class="signature-link">Discover Journey <span>→</span></a>
        </div>
      </article>

      <article class="signature-card" data-service-id="combination-massage-90">
        <div class="signature-card-media">
          <div class="signature-card-image" style="background-image:url('/assets/img/rituals/combination.jpg');"></div>
          <div class="signature-card-overlay"></div>
        </div>
        <div class="signature-card-body">
          <span class="signature-tag">Guest Favorite</span>
          <h3 class="signature-card-title">Combination Massage</h3>
          <div class="signature-card-meta">
            <span class="signature-duration">90 min</span>
            <span class="signature-price">130 €</span>
          </div>
          <p class="signature-card-copy">
            A broad-appeal journey that balances comfort, perceived value and prolonged body reset.
          </p>
          <a href="#dynamic-reveal-stage" class="signature-link">Discover Journey <span>→</span></a>
        </div>
      </article>

      <article class="signature-card" data-service-id="traditional-thai-massage-50">
        <div class="signature-card-media">
          <div class="signature-card-image" style="background-image:url('/assets/img/rituals/thai.jpg');"></div>
          <div class="signature-card-overlay"></div>
        </div>
        <div class="signature-card-body">
          <span class="signature-tag">Passive Yoga</span>
          <h3 class="signature-card-title">Traditional Thai Massage</h3>
          <div class="signature-card-meta">
            <span class="signature-duration">50 min</span>
            <span class="signature-price">100 €</span>
          </div>
          <p class="signature-card-copy">
            An Eastern classic with strong cultural authority, body-opening structure and unmistakable identity.
          </p>
          <a href="#dynamic-reveal-stage" class="signature-link">Discover Journey <span>→</span></a>
        </div>
      </article>

      <article class="signature-card" data-service-id="ottoman-hamam-tradition">
        <div class="signature-card-media">
          <div class="signature-card-image" style="background-image:url('/assets/img/rituals/ottoman-hamam.jpg');"></div>
          <div class="signature-card-overlay"></div>
        </div>
        <div class="signature-card-body">
          <span class="signature-tag">Sanctuary Ritual</span>
          <h3 class="signature-card-title">Ottoman Hamam Tradition</h3>
          <div class="signature-card-meta">
            <span class="signature-duration">50 min</span>
            <span class="signature-price">90 €</span>
          </div>
          <p class="signature-card-copy">
            The most contextual ritual in the Santis world — local, ceremonial and ideal as a gateway to the sanctuary.
          </p>
          <a href="#dynamic-reveal-stage" class="signature-link">Discover Journey <span>→</span></a>
        </div>
      </article>
    </div>
  </div>
</section>\n"""
        out_lines.append(new_content)
    
    if i == 1313: 
        skip = False
        continue 
        
    if not skip:
        out_lines.append(line)

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(out_lines)

print('Success')
