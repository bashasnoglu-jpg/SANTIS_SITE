# Technical Debt Register

## Santis Vite Recovery Fallback Debt

1. hq-dashboard/js/admin-radar.js şu an no-op fallback olarak oluşturuldu.
   Not: Gerçek admin-radar.js kopyası _archive içinde bulundu. İleride mimariye uygun şekilde geri entegre edilmeli.

2. js/santis-decoy-matrix.js şu an no-op fallback olarak oluşturuldu.
   Not: Gerçek işlevi araştırılmalı; eğer aktif sistem tarafından gerekiyorsa gerçek modül olarak yeniden yazılmalı.

3. assets/vendor/barba.umd.js.map placeholder olarak oluşturuldu.
   Not: Runtime için kritik değil, debug/source-map amacı taşır.

4. assets/vendor/swiper-bundle.min.js.map placeholder olarak oluşturuldu.
   Not: Runtime için kritik değil, debug/source-map amacı taşır.
