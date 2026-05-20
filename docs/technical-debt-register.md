# Technical Debt Register

## Santis Vite Recovery Fallback Debt

1. hq-dashboard/js/admin-radar.js şu an no-op fallback olarak oluşturuldu.
   Not: [RESOLVED CANDIDATE / INTEGRATION IN PROGRESS] Gerçek admin-radar.js kopyası _archive içinde bulundu. İleride mimariye uygun şekilde geri entegre edilmeli.

2. js/santis-decoy-matrix.js şu an no-op fallback olarak oluşturuldu.
   Not: [RESOLVED CANDIDATE / INTEGRATION IN PROGRESS] Gerçek işlevi araştırılmalı; eğer aktif sistem tarafından gerekiyorsa gerçek modül olarak yeniden yazılmalı.

3. assets/vendor/barba.umd.js.map placeholder olarak oluşturuldu.
   Not: Runtime için kritik değil, debug/source-map amacı taşır.

4. assets/vendor/swiper-bundle.min.js.map placeholder olarak oluşturuldu.
   Not: Runtime için kritik değil, debug/source-map amacı taşır.

## Missing Admin Command Launcher Module

Status: RESOLVED CANDIDATE / REBUILT AS SAFE READ-ONLY COMMAND PALETTE

admin-command-launcher.js is currently absent from the active admin dashboard path and could not be found in _archive. Its script reference in admin-dashboard.html was disabled to prevent a Vite development runtime 404. Future work should either rebuild the launcher module intentionally or permanently remove the feature path from the dashboard architecture.

The missing admin-command-launcher.js module has been rebuilt as a safe, read-only command palette. It currently avoids backend mutations, storage writes, and destructive commands. Future work may connect privileged actions only after RBAC/session guards exist.

Related file:
- admin-dashboard.html

Reason:
- Prevents runtime 404 during development.
- Keeps dashboard stable while preserving the missing command launcher as tracked technical debt.
