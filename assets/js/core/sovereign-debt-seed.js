export const sovereignDebtSeed = [
    {
      "id": "DEBT-002",
      "title": "Missing backend Store / Core interfaces in UI Components",
      "category": "Dependency",
      "severity": "P1",
      "status": "OPEN",
      "owner": "Backend",
      "reason": "Sovereign UI bileşenleri, eksik sovereignStore.js gibi backend çekirdeklerini derlemeden (Mock-to-Build) geçirebilmek için sahte objelere bağlandı.",
      "impact": "Derleme geçse dahi runtime'da sahte bağlam (falsified context) yaratır. Ghost State oluşur, panel gerçeği yansıtmaz.",
      "nextAction": "Eksik olan ../../core/state/sovereignStore.js ve API bağlam dosyaları eklenecek, Mock'lar gerçek importlara dönüştürülecek.",
      "evidence": [
        "assets/js/components/SovereignFocusCard.js implicit mock injection",
        "Rollup dependency resolution bypass"
      ],
      "scope": [
        "admin-dashboard",
        "react-components",
        "state-store"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Vite Build Pipeline",
      "priorityScore": 98
    },
    {
      "id": "DEBT-018",
      "title": "Time-Travel side-effect contamination",
      "category": "Architecture",
      "severity": "P1",
      "status": "OPEN",
      "owner": "Architecture",
      "reason": "Temporal Time Travel 'Undo' yaptığında, eylemin API uçlarındaki gerçek izdüşümünü silmek yerine sadece sanal DOM state'ini geri sarıyor olma ihtimali var.",
      "impact": "Yönetim paneli hatalı geri alma yapar; API layer ile senkron koparsa sistemde hayalet asimetrik veri bırakır ve güveni yitirir.",
      "nextAction": "State rollback işleminin API Request Layer ile %100 idempotent olarak entegre edildiği mimari bir 'Rollback Event' zinciri yazılacak.",
      "evidence": [
        "Kernel v3 Redux DevTools architectural risk"
      ],
      "scope": [
        "temporal-kernel",
        "event-bus",
        "sovereign-store"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Temporal Audit",
      "priorityScore": 95
    },
    {
      "id": "DEBT-016",
      "title": "State Snapshot memory limits undefined",
      "category": "Performance",
      "severity": "P1",
      "status": "OPEN",
      "owner": "Frontend",
      "reason": "Temporal Kernel 'Time Travel' geçmişini tutarken state ağacına (Tree) hard-limit konulmamış durumda. Kiosk günlerce açık kalırsa RAM tüketimi lineer artar.",
      "impact": "Uzun Uptime senaryolarında (Kiosk/OS mod) browser memory leak ile çöker. Sovereign animasyonlarında kare hızı (FPS) dramatik düşer.",
      "nextAction": "Memory limit konfigürasyonu (Örn: max 50 snapshot array shift) devreye alınacak, çöp toplayıcı (GC) optimizasyonu eklenecek.",
      "evidence": [
        "santis-core.js:414 Temporal Memory Allocation observation"
      ],
      "scope": [
        "temporal-kernel",
        "kiosk-mode",
        "memory-management"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Architecture Audit",
      "priorityScore": 92
    },
    {
      "id": "DEBT-001",
      "title": "Legacy non-module script architecture in MPA pages",
      "category": "Architecture",
      "severity": "P1",
      "status": "OPEN",
      "owner": "Frontend",
      "reason": "Vite build sırasında 300+ HTML içindeki script type=\"module\" olmadığı için bundle dışı kalıyor; sistem çalışsa da governable değil.",
      "impact": "Sayfa başına bundle dışı script sayısı yüksek kaldığı için, bağımlılık ağacı (dependency tree) görünmezleşir, dead-code elimination işlemez ve lazy load yapılamaz.",
      "nextAction": "Tüm admin/ ve tr/ klasörlerindeki HTML sayfalarına bulk betiği ile type=\"module\" mühürü basılacak.",
      "evidence": [
        "vite build: script cannot be bundled without type=\"module\"",
        "300+ unresolved script nodes in console"
      ],
      "scope": [
        "mpa-build",
        "vite-config",
        "html-pages"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Vite Build Pipeline",
      "priorityScore": 90
    },
    {
      "id": "DEBT-019",
      "title": "Image Studio WebGL memory leak risk",
      "category": "Performance",
      "severity": "P2",
      "status": "OPEN",
      "owner": "Frontend",
      "reason": "Sıvı metal, parçacık (particle) ve karanlık oda animasyonları sekmeyi arka plana atınca WebGL döngüsünü askıya (pause) almıyor.",
      "impact": "CPU/GPU kaynağı sekme arka planda dahi israf edilir; bataryalı cihazlarda (iPad Kiosk) termal throttle'a ve pil tüketimine sebep olur.",
      "nextAction": "Page Visibility API hook'u ile sekme inaktif olduğunda requestAnimationFrame döngüsü 0 FPS'e sabitlenip GPU drop edilecek.",
      "evidence": [
        "neuro-detail.js:118 L3 Liquid Metal active out of view"
      ],
      "scope": [
        "threejs",
        "image-studio",
        "performance"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Performance Audit",
      "priorityScore": 88
    },
    {
      "id": "DEBT-003",
      "title": "CJS vs ESM Context Collision on Backend Boot",
      "category": "Architecture",
      "severity": "P2",
      "status": "OPEN",
      "owner": "Backend",
      "reason": "Vanilla JS geçmişi olan sunucu scriptleri (server.js), projenin geneli \"type\": \"module\" (ESM) olduğu için require() çökmeleri yaşattı. Geçici olarak .cjs yapıldı.",
      "impact": "Proje iki farklı modül ekosistemi (ESM + CJS) barındırıyor; code-sharing ve ortak environment ayarları zorlaşır.",
      "nextAction": "Tüm .cjs sunucu dosyaları %100 import/export Vanilla ESM standardına göre modüler parçalara ayrılarak refactor edilecek.",
      "evidence": [
        "ReferenceError: require is not defined in ES module scope"
      ],
      "scope": [
        "node-server",
        "api-layer",
        "build-system"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Vite Build Pipeline",
      "priorityScore": 85
    },
    {
      "id": "DEBT-011",
      "title": "Cumulative Layout Shift on Image Studio / Gallery assets",
      "category": "UI/UX",
      "severity": "P2",
      "status": "OPEN",
      "owner": "Design",
      "reason": "Resim bileşenlerinde statik width/height tanımları veya aspect-ratio kilidi (CSS lock) mevcut değil. Resim inene kadar div boyutu sıfır kalıyor.",
      "impact": "Geç yüklenen medya yüzünden CLS artar; sayfa zıpladığı için premium first-view luxury stability bozulur. SEO cezası riski yüksek.",
      "nextAction": "Tüm <img /> bileşenleri TailwindV4 aspect-video wrapper'larına alınacak veya native width/height attribute enjekte edilecek.",
      "evidence": [
        "Lighthouse CLS penalty observation",
        "Hero placeholder shift"
      ],
      "scope": [
        "image-studio",
        "galleries",
        "seo"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Lighthouse Audit",
      "priorityScore": 82
    },
    {
      "id": "DEBT-012",
      "title": "Offline PWA White Screen of Death Warning",
      "category": "UI/UX",
      "severity": "P2",
      "status": "OPEN",
      "owner": "Shared",
      "reason": "Sovereign Service Worker çevrimdışı state sırasında /offline.html'e doğru fallback etmezse Chrome standart beyaz no-internet yüzü çıkarıyor.",
      "impact": "Kiosk veya otel modunda bir anlık bağlantı kopmasında lüks marka imajı zedelenir, cihaz dondu algısı oluşur.",
      "nextAction": "PWA Offline Cache fallback stratejisi katılaştırılacak ve SovereignFallbackPanel.js root component olarak otonom ayağa kalkacak.",
      "evidence": [
        "SW Kiosk Install Complete - but missing explicit fetch intercept fallback map"
      ],
      "scope": [
        "pwa",
        "service-worker",
        "kiosk-mode"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Architecture Audit",
      "priorityScore": 80
    },
    {
      "id": "DEBT-004",
      "title": "Hardcoded Hex Colors replacing Dynamic Tailwind theme() function",
      "category": "UI/UX",
      "severity": "P3",
      "status": "ACCEPTED",
      "owner": "Frontend",
      "reason": "Tailwind v4'de JIT theme(colors.santis.dark) komutları patladığı için acil çözüm (hotfix) olarak statik HEX kodları gömüldü.",
      "impact": "Merkezi tasarım dili (Design Token governance) bypass edildi. Karanlık mod veya global tema değişikliği zorbalıkla (find/replace) yapılacak.",
      "nextAction": "Tailwind V4 @theme yapısı CSS değişkenleri var(--color-santis-dark) şekline uyarlanıp style attr refactorü sağlanacak.",
      "evidence": [
        "Could not resolve value for theme function: `theme(colors.santis.dark)`"
      ],
      "scope": [
        "inline-styles",
        "tailwind-config",
        "design-system"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Vite Build Pipeline",
      "priorityScore": 75
    },
    {
      "id": "DEBT-005",
      "title": "Unresolved Absolute Native Module imports",
      "category": "Architecture",
      "severity": "P3",
      "status": "OPEN",
      "owner": "Frontend",
      "reason": "Eski HTML yapılarında <script src=\"/assets/...\"> gibi absolute pathler kullanılıyor, path mapping (alias) ayarlanmamış.",
      "impact": "Sub-folder altından çalışan VHost'larda (örn: /v5/ klasörü) path'ler 404 patlaması garantilidir.",
      "nextAction": "Tüm HTML'lerde Absolute Path'ler Alias Configuration veya Vite path resolve plugin'i ile ../ relative sistemine bağlanacak.",
      "evidence": [
        "transforming html: module absolute path warnings"
      ],
      "scope": [
        "html-pages",
        "routing"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Architecture Audit",
      "priorityScore": 72
    },
    {
      "id": "DEBT-008",
      "title": "Multiple script duplication in single document",
      "category": "Hygiene",
      "severity": "P3",
      "status": "OPEN",
      "owner": "Frontend",
      "reason": "tr/hamam/index.html gibi sayfalarda aynı data-bridge veya observer script'i birden çok kez import edilmiş.",
      "impact": "Browser thread üzerinde fazladan AST parse payload yükü bindirir (Duplicate Parse/Compile). Ağ bazında time-to-interactive TTI değerini şişirir.",
      "nextAction": "HTML Node parser ile sayfalardaki <script> tagleri unique-map üzerinden taranacak ve tekrarlı bloklar silinecek.",
      "evidence": [
        "vite: <script src=\"/assets/js/santis-vitals.js\"> in \"/tr/hamam/index.html\" (x2)"
      ],
      "scope": [
        "html-pages",
        "performance"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Vite Logs",
      "priorityScore": 68
    },
    {
      "id": "DEBT-014",
      "title": "Missing 'Playfair Display' Custom Font Preload",
      "category": "UI/UX",
      "severity": "P3",
      "status": "OPEN",
      "owner": "Frontend",
      "reason": "Global font stylesheet asenkron çağrılıyor ancak woff2 font asset'i head içinde preload edilmiyor.",
      "impact": "Başlangıç sekansında fontlar sonradan yüklendiği için anlık sistem fontu belirir ve lüks deneyim baştan kusurlu başlar (FOUT).",
      "nextAction": "Sadece kritik Playfair Display WOFF2 fontu head tagi içine preload as=\"font\" olarak eklenecek.",
      "evidence": [
        "Visual FOUT during page load audit"
      ],
      "scope": [
        "global-styles",
        "html-head",
        "typography"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "UX Audit",
      "priorityScore": 65
    },
    {
      "id": "DEBT-017",
      "title": "Missing Re-render Prevention in Dashboard Lists",
      "category": "Performance",
      "severity": "P3",
      "status": "OPEN",
      "owner": "Frontend",
      "reason": "Uzun kayıt listelerinde (örn: Debt Board) tek bir node güncellendiğinde veya geri al (undo) yapıldığında bütün liste map'i yeniden DOM'a vuruyor olabilir.",
      "impact": "1000 satırlık tablolarda CPU cycle çalar; click/keyboard latency'yi artırır.",
      "nextAction": "Grid cell rendering mantığına windowing (virtual scroll) eklenecek ve row memoization strict hale getirilecek.",
      "evidence": [
        "React devtools profiler commit times warning"
      ],
      "scope": [
        "data-tables",
        "react-components"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Performance Audit",
      "priorityScore": 64
    },
    {
      "id": "DEBT-010",
      "title": "Ignored Directive 'use client' in admin dashboard module",
      "category": "Dependency",
      "severity": "P3",
      "status": "ACCEPTED",
      "owner": "Architecture",
      "reason": "@tanstack/react-query gibi 3. parti modüller Vite MPA yapısında NextJS'e özel 'use client' direktiflerini export ediyor ve roll-up uyarı veriyor.",
      "impact": "Build ve terminal loglarında ciddi bir bilgi kirliliğine (noise) yol açar; asıl fatal hataları gözden kaçırma riski yaratır.",
      "nextAction": "Vite diziliminde rollupOptions.onwarn üzerinden spesifik module level directives bypass veya mute edilecek.",
      "evidence": [
        "Module level directives cause errors when bundled"
      ],
      "scope": [
        "vite-config",
        "admin-deps"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Vite Output",
      "priorityScore": 60
    },
    {
      "id": "DEBT-006",
      "title": "V3 Config File Leftovers (postcss & tailwind config)",
      "category": "Hygiene",
      "severity": "P4",
      "status": "OPEN",
      "owner": "Shared",
      "reason": "Eski Tailwind V3 ve PostCSS modül configleri maskelenip tutuluyor ancak Vite plugin sisteminde zaten devredışılar.",
      "impact": "Dosya tabanlı karmaşa (cognitive overload). Geliştirici yanlış dosyaya config yazarak kendini heba edebilir.",
      "nextAction": "Postcss ve tailwind konfigürasyon proxy dosyaları dizinden %100 silinecek.",
      "evidence": [
        "postcss.config.js DEPRECATED tag",
        "tailwind.config.js DEPRECATED tag"
      ],
      "scope": [
        "root-config"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Code Review",
      "priorityScore": 55
    },
    {
      "id": "DEBT-007",
      "title": "Void Element syntax chaos inside HTML Trees",
      "category": "Hygiene",
      "severity": "P4",
      "status": "OPEN",
      "owner": "Frontend",
      "reason": "Prettier/Linter konfigürasyonu eksikliğinden ötürü kapanmaması gereken </link>, </meta>, </br> gibi HTML zombileri mevcut.",
      "impact": "Strict parser entegrasyonlarında AST error riskini barındırır; teknik hijyen zayıflığı algısı yaratır.",
      "nextAction": "HTML Linter aktif edilip tüm /admin ve /tr dosyaları bulk formattan geçirilecek.",
      "evidence": [
        "Vite parse5 parse failures fixed manually"
      ],
      "scope": [
        "html-pages",
        "linter"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Vite HTML Parser",
      "priorityScore": 50
    },
    {
      "id": "DEBT-013",
      "title": "Console Warn Spam During Sovereign Boot Sequence",
      "category": "Hygiene",
      "severity": "P4",
      "status": "OPEN",
      "owner": "Shared",
      "reason": "Sovereign Whisper, VAPID key hataları, Bootloader Long Task benchmarkları Production ortamında da consol'a verbose log döküyor.",
      "impact": "Geliştirici konsolunda gürültü yaratır. Performans metriği sızıntısı yapar.",
      "nextAction": "Gölge clusterlar ve Kernel için production durumunda çalışan sessiz Logger Wrapper yazılacak.",
      "evidence": [
        "[V39.1 APM] Long Task (996.00ms)",
        "[Sovereign Whisper] Tarayıcı Push servisi aktif değil"
      ],
      "scope": [
        "santis-core",
        "logger"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "Browser Console",
      "priorityScore": 48
    },
    {
      "id": "DEBT-015",
      "title": "Push Notification Intrusiveness",
      "category": "UI/UX",
      "severity": "P3",
      "status": "ACCEPTED",
      "owner": "Frontend",
      "reason": "Kullanıcı siteye girer girmez (Boot Sequence 1060ms sonrası) Push Subscription engellenmek üzere alert gönderiyor.",
      "impact": "Lüks hizmet deneyimini anlık olarak sabote eder, onama oranını düşürür.",
      "nextAction": "Bildirim kayıt aşaması 'Ghost Logic' ile rezervasyon checkout anına veya 'Notify Me' buton aksiyonlarına kaydırılacak.",
      "evidence": [
        "santis-notify.js execution at init"
      ],
      "scope": [
        "user-journey",
        "sw-notifications"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "UX Audit",
      "priorityScore": 45
    },
    {
      "id": "DEBT-009",
      "title": "Redundant 'NODE_ENV' config blocks in environments",
      "category": "Hygiene",
      "severity": "P4",
      "status": "RESOLVED",
      "owner": "Infra",
      "reason": "Geleneksel Node projelerindeki NODE_ENV tanımı Vite env map'ini kilitliyor ve gereksiz uyarı veriyordu.",
      "impact": "Env kirliliği.",
      "nextAction": ".env.production üzerinden VITE_ prefix mimarisine kesin dönüş yapılacak.",
      "evidence": [
        "Vite environment override warning"
      ],
      "scope": [
        "env-config",
        "vite-build"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": "2026-04-14T21:30:00Z",
      "discoveredBy": "Vite Output",
      "priorityScore": 20
    },
    {
      "id": "DEBT-020",
      "title": "Lack of Unified 'Command-K' Schema in Dashboard",
      "category": "UI/UX",
      "severity": "P3",
      "status": "BLOCKED",
      "owner": "Design",
      "reason": "Arama barı ve aksiyon terminali (Cmd+K Sentinel) diğer bileşenler (Debt Board, Image Studio) arasında standart API'ye sahip değil.",
      "impact": "Uzman kullanıcı (Power user) operasyonları yavaşlar; her sayfa için menü üzerinden klik yapmak gerekir.",
      "nextAction": "God Mode (Cmd+K) kayıt API'si açılacak ve yeni panolar otomatik indexlenecek.",
      "evidence": [
        "Missing keyboard shortcut standard"
      ],
      "scope": [
        "sentinel-terminal",
        "admin-dashboard",
        "keyboard-navigation"
      ],
      "createdAt": "2026-04-14T21:00:00Z",
      "resolvedAt": null,
      "discoveredBy": "UX Strategy",
      "priorityScore": 58
    }
];
