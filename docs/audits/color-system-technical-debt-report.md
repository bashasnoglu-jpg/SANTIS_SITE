# Santis OS - Color System Technical Debt & Design Token Architecture Report

## 1. Executive Summary
- **Olgunluk Seviyesi:** Santis renk sistemi şu anda **Fragmented (Parçalı)** ve **High Debt (Yüksek Borçlu)** seviyesindedir. Kök tasarım kararları (Santis Gold, Deep Black) doğru olsa da, bunların teknik uygulaması parçalanmış, çok sayıda dosyaya yayılmış ve standardını yitirmiştir.
- **Ana Riskler:** Tailwind `output.css` ile özel yazılan modüler CSS'ler (örn. `editorial.css`, `cards.css`) arasında ciddi bir izolasyon eksikliği var. Aynı semantic token'lar (`--color-bg`, `--color-text`) farklı dosyalarda farklı renklerle defalarca ezilmektedir (override edilmektedir). Glassmorphism için kullanılan rgba değerleri standart değildir.
- **En Kritik 5 Teknik Borç:**
  1. `#d4af37` (Santis Gold) renginin 159 kez hardcoded olarak kullanılması.
  2. `--color-bg`, `--color-surface` gibi temel token'ların 4 farklı değerle çakışması (Conflict).
  3. Opaklık varyasyonlarının (örn. `rgba(212, 175, 55, 0.15)`) token'laştırılmak yerine manuel girilmesi.
  4. Light/Dark mode uyumsuzluğunun global token'lar üzerinden değil lokal component sınıfları üzerinden yönetilmesi.
  5. Eski legacy CSS (`style.css`) ile yeni V6 yapısının (`santis-v6/*.css`) birbirine karışması.

## 2. Current Color Architecture Map
- **Token Kaynakları:** Projede `assets/css/tokens.css`, `santis-v6/santis.tokens.css` ve Tailwind `output.css` olmak üzere çoklu token kaynağı bulunuyor.
- **CSS Değişken Tanımları:** Çoğunlukla `:root` ve bazen `.dark` seçicileri altında yapılmış. Ancak component bazlı CSS dosyaları (örn. `cards.css`, `editorial.css`) kendi içlerinde bu tokenları tekrar tanımlayarak "scope sızıntısı" (scope leak) yaratıyor.
- **Domine Eden Dosyalar:** `editorial.css`, `style.css` ve `santis.tokens.css` renk değerlerinin en yoğun bulunduğu ve ezildiği (override edildiği) dosyalar.
- **Tailwind/output.css İlişkisi:** Tailwind `output.css` kendi utility sınıflarını (`bg-[#050505]`, `text-[#d4af37]`) basarken, aynı anda CSS dosyaları da aynı renkleri hardcoded kullanıyor. Bu "Single Source of Truth" kuralını doğrudan ihlal ediyor.

## 3. Token Inventory

| Token Adı | Tespit Edilen Değerler (Çakışmalar) | Kullanım Amacı | Risk Seviyesi | Önerilen Canonical Karşılığı |
| :--- | :--- | :--- | :--- | :--- |
| `--color-bg` | `#0a0a0c`, `#1a1423`, `#f2e9e9`, `#f9f9fb` | Ana arka plan | Kritik (P0) | `--santis-charcoal-900` |
| `--color-surface` | `#121214`, `#261f32`, `#ffffff` | Kart ve UI zeminleri | Yüksek (P1) | `--surface-primary` |
| `--color-text` | `#4a3f3f`, `hsl(220, 10%, 95%)`, `#e0d7ff` | Ana metin | Yüksek (P1) | `--text-primary` |
| `--color-border` | `rgba(255,255,255,0.05)`, `rgba(212,175,55,0.15)` | Ayırıcı çizgiler | Orta (P2) | `--border-subtle` |
| `--color-surface-glass` | `rgba(15,20,25,0.75)`, `rgba(255,255,255,0.7)` | Yarı saydam UI yüzey | Yüksek (P1) | `--surface-glass` |

*Not: HSL, HEX ve RGBA'nın bu kadar karışık kullanılması mimari olarak büyük bir maintenance yüküdür.*

## 4. Hardcoded Color Debt

| Renk Değeri | Tekrar | Hangi Dosyalarda (İlk 3) | Hangi Token'a Taşınmalı? | Öncelik |
| :--- | :--- | :--- | :--- | :--- |
| `#d4af37` | 159 | `editorial.css`, `santis.tokens.css`, `cards.css` | `--santis-gold-500` | P0 |
| `#fff` / `#ffffff` | 91 | `editorial.css`, `cards.css`, `santis-oracle...` | `--santis-white` / `--text-primary` | P1 |
| `rgba(255, 255, 255, 0.05)` | 35 | `editorial.css`, `santis.tokens.css`, `cards.css` | `--border-subtle` | P1 |
| `rgba(212, 175, 55, 0.15)` | 19 | `editorial.css`, `santis.tokens.css`, `cards.css` | `--glow-gold-subtle` | P2 |
| `#050505` | 19 | `santis.overrides.css`, `output.css`, `breadcrumb.css`| `--santis-ink-950` | P0 |
| `#c6a96b` | 13 | `santis.tokens.css`, `tokens.css`, `santis.utilities.css`| `--santis-gold-400` | P2 |

## 5. Duplicate / Conflicting Tokens
Analiz edilen kod bloklarında en büyük yapısal problem budur:
- **`--color-bg`** hem çok koyu (`#0a0a0c`) hem de çok açık (`#f2e9e9`) değerleri aynı isimle taşıyor. Bu, "Dark/Light" tema scriptlerinin doğru çalışmasını engeller.
- Local CSS modülleri, root üzerindeki `--color-text` değişkenlerini kendi başlarına `hsl(220, 10%, 15%)` yaparak global UI tutarlılığını bozuyor.
- **Glassmorphism:** Aynı blur ve rgba efekti için `rgba(26, 26, 28, 0.45)` ve `rgba(15, 20, 25, 0.75)` gibi farklı koyuluk seviyeleri rastgele kullanılmış.

## 6. Santis Quiet Luxury Palette Assessment
- **Deep black / warm charcoal:** `#050505` ve `#12100e` Santis'in "Sovereign/Quiet Luxury" hissiyatını mükemmel yansıtıyor. Ancak bu renkler bazen pure `#000` ile ezilmiş. (Needs Verification: output.css'te 187 defa #0000 veya #000 varyantı kullanılmış).
- **Santis Gold:** `#d4af37` kusursuz bir kurumsal kimlik. Ancak 0.1, 0.15, 0.2, 0.3 opacity varyantları tasarımda kirlilik yaratıyor. Standartlaşmalı.
- **Mist grey & Clinical calm tones:** Metin renkleri için HSL (`hsl(220, 10%, 70%)`) kullanımı güzel fakat HEX ile mixlenmiş durumda. OKLCH kullanımına hiç rastlanmadı; bu da "perceptual uniform" (görsel olarak pürüzsüz) bir algı yaratılmasını zorlaştırıyor.

## 7. Accessibility & Contrast Risks
- **Gold-on-dark Kullanımı:** Koyu gri arka plan (`#12100e`) üzerinde ince font ağırlıkları (300/400) ile kullanılan `%15` opacity'li `#d4af37` textlerin veya gold sınır çizgilerinin, WCAG (AA/AAA) kontrast testlerinden kalma riski oldukça yüksek (P0/P1).
- **Muted Text Riski:** `--color-text-muted` için kullanılan `#a394c5` ve `hsl(220, 10%, 40%)` karanlık modda kaybolma (unreadable) riski taşıyor.
- **Overlay/Glassmorphism:** `rgba(255, 255, 255, 0.05)` üzerine yazılan beyaz textlerin kontrast zayıflığı muhtemeldir.

## 8. Runtime & Performance Risks
- **`color-mix()` Kullanımı:** Projede toplam 28 yerde `color-mix()` kullanılmış. Eğer bu fonksiyon `transition` ve `animation` döngülerinin içine girdiyse, eski tarayıcılarda paint-cost artışına neden olabilir.
- **Tekrar Eden Kural Karmaşası:** Aynı rengin farklı component CSS dosyalarında (örneğin `.card` içinde ayrı, `.bento-item` içinde ayrı) import edilmesi CSS render blokajlarını büyütür.

## 9. Proposed Canonical Color Token System
Sistem tamamen `oklch()` veya HSL/HEX kombinasyonuyla katmanlara ayrılmalıdır. Önerilen mimari:

**Primitive Tokens (santis.tokens.css)**
```css
--santis-ink-950: #050505;
--santis-charcoal-900: #12100e;
--santis-gold-500: #d4af37;
--santis-gold-400: #c6a96b;
--santis-mist-200: hsl(220, 10%, 90%);
--santis-emerald-400: #10b981;
```
**Semantic & Component Tokens**
```css
--surface-primary: var(--santis-charcoal-900);
--surface-glass: rgba(18, 16, 14, 0.6);
--text-primary: var(--santis-mist-200);
--text-muted: hsl(220, 10%, 60%);
--border-subtle: rgba(255, 255, 255, 0.05);
--glow-gold: rgba(212, 175, 55, 0.15);
--atmosphere-fog: rgba(5, 5, 5, 0.85);
--state-success: var(--santis-emerald-400);
```

## 10. Migration Plan
1. **Phase C1 — Color Audit Freeze:** Şu andan itibaren yeni hardcoded renk veya CSS dosyası eklenmesi yasaklanır.
2. **Phase C2 — Canonical Token Registry:** `santis-v6/santis.tokens.css` tek "Source of Truth" haline getirilir. (Gereksiz dosyalar quarantine edilir).
3. **Phase C3 — Hardcoded HEX Refactor:** 159 yerde geçen `#d4af37` ve 91 yerde geçen `#fff` primitive token'lara bağlanır.
4. **Phase C4 — Component Token Mapping:** `editorial.css` ve `cards.css` içerisindeki `--color-bg` çakışmaları (conflict) temizlenir.
5. **Phase C5 — Contrast Validation:** WCAG 2.1 testi ile `text-muted` ve `glow` değerleri sabitlenir.
6. **Phase C6 — Tailwind Token Bridge:** `tailwind.config.js` doğrudan bu primitive CSS değişkenlerini okuyacak şekilde yapılandırılır.
7. **Phase C7 — Visual Regression Seal:** Tüm site görselleri check edilerek "Color System V2" mühürlenir.

## 11. Risk Matrix
| Risk Türü | Risk | Priority |
| :--- | :--- | :--- |
| **Token Conflicts (Çakışmalar)** | Componentlerin Dark/Light mode tutarlılığını kırması | **P0** |
| **Kontrast Riski** | Gold ve Muted Text'in okunabilirliği bozması | **P0** |
| **Hardcoded Tekrarı** | 150+ noktada `#d4af37` kullanımı, rebranding'i imkansız kılıyor | **P1** |
| **Dosya Kalabalığı** | `editorial.css` vs `tokens.css` arasındaki yetki karmaşası | **P2** |

## 12. Final Recommendation
- **Bu sistem şu an kullanılabilir mi?** Evet, ancak ciddi bir tasarım borcu ile ayakta duruyor. Acilen temizlenmezse ileride "Dark Mode V2" veya farklı bir lüks temaya geçiş imkansız hale gelecektir.
- **Önce hangi dosyaya dokunulmalı?** `assets/css/santis-v6/santis.tokens.css` dosyası Canonical (Master) kabul edilerek tüm primitive renkler oraya toplanmalıdır.
- **Do Not Touch:** Bu analiz sonuçlanıp C1, C2 kararları alınana kadar HTML dosyalarındaki Inline Style'lara (`<div style="...">`) kesinlikle dokunulmamalıdır.
