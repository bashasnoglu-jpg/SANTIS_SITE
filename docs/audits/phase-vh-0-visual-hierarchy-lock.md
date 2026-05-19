# Phase VH-0 — Visual Hierarchy Lock Report

## Governance Status
- Phase: VH-0
- Status: MEASURED / LOCK-PENDING
- Source: `tr/index.html`
- Runtime Changes: NONE

## Executive Summary
Santis OS "Quiet Luxury" deneyimi, görsel hiyerarşi açısından genel olarak yüksek standartlarda olsa da, özellikle **CTA Overload** (Hero Frame) ve **Visual Density Spikes** (V45 Stack) alanlarında kritik mimari riskler tespit edilmiştir. Mevcut Navbar yapısı bir "altyapı" olmaktan çıkıp, ana içerikle yarışan bir "odak katmanı" (competing focal layer) haline gelmiştir. Bu rapor, görsel hiyerarşiyi bir "mimari sistem" olarak kilitler ve gelecek PR'lar için sert sınırlamalar getirir.

## Visual Focal Point Audit

| Frame / Section | Primary Focal Point | Secondary Focal Point | Tertiary Focal Point | Noise Level | Risk | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero (V8)** | Hero Title | Hero CTA | Navbar Button | **HIGH** | CTA Overload | De-emphasize Navbar CTA |
| **Signature (V45)** | Active Stack Card | Card Meta | Section Title | **MEDIUM** | Density Spike | Reduce card count (10 -> 6) |
| **Philosophy** | Section Title | Visual Image | Outline CTA | **ZERO** | None | Maintain current balance |
| **Global Trends** | Active Card | Section Header | Card Meta | **MEDIUM** | Density Spike | Sync with V45 constraints |
| **Booking CTA** | Primary CTA (WA) | Section Title | Outline CTA | **NONE** | Minimal | Perfect focal lock |

## Detected Violations

### P0 — Must fix before visual lock
- **CTA Overload (Hero):** Aynı görsel çerçeve içinde iki adet "Rezervasyon" butonu (Hero + Navbar) birincil odak için yarışıyor.
- **Mobile Negative Space Collapse:** 340px genişliğindeki kartlar, 360px-390px mobil ekranlarda nefes alma alanını (Safe-X) tamamen yok ediyor.

### P1 — Should fix in next visual PR
- **Navbar Contamination:** 8+ link barındıran yoğun navigasyon katmanı, Hero frame'in üst kısmında "Visual Noise" yaratıyor.
- **Zero-Jank Violation (Skeleton):** 3 saniyelik "Reveal Veil" gecikmesi, algılanan performansı düşürüyor.
- **Saturation Escalation:** Kart filtrelerindeki %150 doygunluk (saturation), Santis'in "Smoky Warm Gray" paletini bozuyor.

### P2 — Monitor / Document
- **OLED Contrast Proximity:** Düşük parlaklıkta kart kenarlıklarının kaybolması (Derinlik kaybı).
- **Mobile Title Wrapping:** Hero başlığının 3+ satıra kırılarak CTA'yı fold altına itme riski.

## Typography Hierarchy Lock

| Role | Font Family | Size (Desktop) | Size (Mobile) | Weight | Letter Spacing | Constraint |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **H1 / Hero Title** | Playfair / Cormorant | 72px | 36px - 42px | 400 | Normal | Max 3 lines on mobile |
| **H2 / Section Title**| Playfair Display | 2.8rem - 3.5rem | 2.2rem | 400 | Normal | **MAX 4.0rem** cap |
| **Kicker / Eyebrow** | Inter / Outfit | 0.8rem | 0.7rem | 600 | 2px - 3px | Uppercase only |
| **Body Text** | Inter | 15px - 1.2rem | 14px - 1rem | 400 | Normal | Min contrast 4.5:1 |
| **Card Meta** | Inter | 0.8rem | 0.7rem | 400 | 2px - 3px | Muted gold color |

## CTA Hierarchy Lock
- **Rule:** Her "Sovereign Frame" içinde sadece **BİR** adet birincil (Filled/Gold) CTA bulunabilir.
- **Secondary CTAs:** Sadece `outline`, `text-only` veya `muted` stilde olabilir.
- **Shadows:** CTA gölgeleri lüks algısını bozacak kadar ağır (loud) olamaz.
- **Detection:** Hero Frame içinde Navbar CTA'sı ile Hero CTA'sı arasındaki çakışma (P0) giderilmelidir.

## Negative Space Lock
- **Desktop Section Padding:** Minimum **6rem** (Vertical).
- **Mobile Section Padding:** Minimum **4rem** (Vertical).
- **Safe-X (Mobile):** Minimum **1.25rem** (Horizontal margin).
- **Proximity:** Metin blokları ile CTA butonları arasında minimum **24px** boşluk.
- **Hero/Navbar Gap:** Navbar ve Hero başlığı arasında minimum **4rem** dikey boşluk garantisi.

## Motion & Layering Risks
- **Animation Dominance:** `santis-reveal-veil` süresi 1.5 saniyeye indirilmelidir.
- **Cursor Layer:** Genişleyen imleç halkası (Lens), metin hiyerarşisini kirletmemelidir (Contamination).
- **Parallax Risk:** %15'lik görsel kayma (inertia) hızı, metin okunabilirliğini bozmamalıdır.

## Mobile Hierarchy Risks
- **CTA Stacking:** Birden fazla buton alt alta geldiğinde "Görsel Gürültü" oluşturuyor.
- **Stack-card Overflow:** 340px kart genişliği mobil cihazlar için agresif. Dinamik ölçekleme (`vw`) gereklidir.

## Proposed Lock Rules
1. **Rule_VH_001:** No frame shall contain >1 Gold CTA.
2. **Rule_VH_002:** H2 size must not exceed 4.0rem.
3. **Rule_VH_003:** Min 4rem padding-y enforcement.
4. **Rule_VH_004:** Card saturation must not exceed 100%.
5. **Rule_VH_005:** Skeleton veil delay max 1.5s.

## Recommended Next PRs
- **PR_VH_01:** Navbar CTA de-escalation (Outline/Muted toggle).
- **PR_VH_02:** Mobile dynamic card scaling (vw units).
- **PR_VH_03:** Skeleton veil latency optimization.
- **PR_VH_04:** Typography wrap & clamp implementation.

## Validation Gates
```powershell
pnpm run audit:repo-boundary
pnpm run audit:all
pnpm run lint
pnpm run stitch:enforce
pnpm run build
git fsck
git status --short
```

---
**Status: LOCK-PENDING**  
*Awaiting Boardroom review. Runtime frozen.*
