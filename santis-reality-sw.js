// santis-reality-sw.js
// SDCR V52.0 OMEGA - THE INTERCEPTOR & AMPUTATION ENGINE

const CORE_VERSION = 'SDCR-V52-OMEGA';
const AMPUTATION_THRESHOLD = 600; // 🔴 Kırmızı Bölge Sınırı

let currentSSS = 0; // The Sensor Sync Variable

// -----------------------------
// 1. NEURAL LINK (SİNİR AĞI)
// -----------------------------
self.addEventListener('message', (event) => {
  // Syncing with Telemetry via either payload or sss property
  if (event.data && (event.data.type === 'SYNC_SSS' || event.data.type === 'SDCR_SSS_UPDATE')) {
    currentSSS = event.data.payload || event.data.sss;
  }
});

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Eski kalkanı bekleme, anında devreye gir.
  console.log(`[SDCR:SW] ${CORE_VERSION} - Giyotin Bileniyor...`);
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim()); // Tüm açık sekmeleri anında kontrol altına al.
  console.log(`[SDCR:SW] ${CORE_VERSION} - GERÇEKLİK İZOLASYONU AKTİF.`);
});

// -----------------------------
// 2. DYNAMIC MODULE INTERCEPTION
// -----------------------------
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Kural 1: Sadece JS modüllerini denetle
  if (!url.pathname.endsWith('.js')) return;

  // Hangi modüller lüks? (Gerçekte Cortex manifest'inden gelir, simüle ediyoruz)
  const isLuxury = url.pathname.match(/luxury|heavy|3d/i) || url.searchParams.has('sdcr_luxury');

  // Kural 2: RESURRECTION HOOK (Diriliş Tohumu)
  // Cortex sistem soğuduğunda "?sdcr_resurrect=true" parametresiyle dosyayı GERİ isterse kalkanı indir.
  const isResurrection = url.searchParams.has('sdcr_resurrect');

  // 🔴 KURAL 3: GİYOTİN (AMPUTASYON ZAMANI)
  if (isLuxury && !isResurrection && currentSSS >= AMPUTATION_THRESHOLD) {
    console.warn(`[SDCR:SW] 🪚 KRİZ (SSS: ${currentSSS.toFixed(0)}). UZUV KESİLDİ: ${url.pathname}`);

    // -----------------------------
    // 3. SAFE STUB INJECTION (Proxy Blackhole)
    // -----------------------------
    // Eğer HTTP 404/500 dönersek V8 'Uncaught TypeError' verir ve sistem çöker.
    // Bunun yerine HTTP 200 ile çalışan ama "içi boş" ve her metodu yutan bir ESM Proxy yutturuyoruz.
    const syntheticTissue = `
      console.warn('[SDCR:AMPUTATION] Lüks modül bloke edildi. Sistem hayatta tutuluyor: ${url.pathname}');
      
      const blackhole = new Proxy(() => {}, {
        get: function(target, prop) {
          // Diriliş ve Cortex kontrolü için genetik izler
          if (prop === '__sdcr_amputated') return true;
          if (prop === '__original_url') return '${url.href}';
          
          // Modülün (olmayan) alt fonksiyonlarına yapılan çağrıları yutan REKÜRSİF KORUMA
          return new Proxy(() => {}, this);
        },
        apply: function() { 
          // Fonksiyon olarak çağrılırsa da sessizce yut
          return undefined; 
        }
      });

      export default blackhole;
    `;

    const survivalResponse = new Response(syntheticTissue, {
      status: 200, // 🔴 Sisteme "başarıyla indi" yalanı söylüyoruz
      statusText: 'Amputated (Yielded to System Survival)',
      headers: { 
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-store', // Asla önbelleğe alma, diriliş geldiğinde asıl dosya inebilsin!
        'X-SDCR-State': 'AMPUTATED'
      }
    });

    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(c => c.postMessage({ 
          type: 'BLACKBOX_LOG', 
          action: 'AMPUTATE', 
          reason: 'SSS_THRESHOLD_EXCEEDED', 
          meta: { url: url.pathname }
        }));
      })
    );

    event.respondWith(survivalResponse);
    return;
  }

  // SSS yeşil bölgedeyse veya dosya hayati (çekirdek) ise normal ağa gitmesine izin ver
  event.respondWith(fetch(event.request));
});
