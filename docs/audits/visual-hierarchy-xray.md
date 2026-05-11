# Santis OS Visual Hierarchy X-Ray

**Durum:** Aktif Denetim  
**Hedef:** Token-only mimariye tam geçiş ve "Santis Visual Truth" anayasasının tüm katmanlarda uygulanması.

## Canonical Visual Language
- [ ] `theme-manifest.json` içindeki "Santis Visual Truth" güncellenecek (Yeni z-index ve tipografi merdiveni).
- [ ] Renk paletindeki `sovereign-` prefix'leri tüm CSS dosyalarında standart hale getirilecek.

## Active CSS Systems
- [ ] `assets/css/editorial.css`: Token dışı değerler temizlenecek.
- [ ] `assets/css/hero-slider.css`: Aşırı dominant efektler (gradient, text-shadow) azaltılacak.
- [ ] `assets/css/bento-grid.css`: Özel ölçüler manifest'e taşınacak.

## Typography Drift
- [ ] Heading için `Cinzel` ve `Playfair Display` ayrımı manifest'te netleştirilecek.
- [ ] Manuel `font-size` değerleri (örn: 5rem, 3.2rem) token karşılıklarıyla değiştirilecek.

## Color Drift
- [ ] Ham hex kodları (`#000`, `#fff`, vb.) tespit edilip `var(--color-...)` formatına geçirilecek.
- [ ] RGBA değerleri opacity token'ları ile yeniden yazılacak.

## Z-Index Conflicts
- [ ] `z-index: 9999` ve `2147483647` gibi acil durum değerleri kaldırılacak.
- [ ] Yeni z-index skalası (0, 10, 100, 300, 500, 800, 999) uygulanacak.

## Emergency Overrides
- [ ] `!important` etiketleri tespit edilecek ve CSS specificity kuralları düzeltilerek silinecek.
- [ ] "EMERGENCY FIX" yorum blokları sistem kararlarına dönüştürülecek.

## Guard Integration
- [ ] `scripts/audit-visual-hierarchy.js` raporu Phase VH backlog'una işlenecek.
- [ ] `pnpm run audit:visual` lokal ve CI kalite kapısı olarak çalıştırılacak.
- [ ] `pnpm run audit:all` görsel hiyerarşi denetimini kapsayacak şekilde güncellenecek.
