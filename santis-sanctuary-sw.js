/**
 * ═══════════════════════════════════════════════════════════
 * SANTIS OS - THE OFFLINE SANCTUARY (Phase 46 Act II)
 * ═══════════════════════════════════════════════════════════
 * İnternet ağının koptuğu anlardaki güvenlik filikası.
 * Vanta-Black zemin üzerinde "Ambient Mode" sığınağı sunar.
 */

const CACHE_NAME = 'sovereign-sanctuary-v11.2.7';
const SANCTUARY_URL = '/offline-sanctuary.html';

self.addEventListener('install', event => {
    // Sığınak ekranı (Offline Sovereign Mode) 
    const sanctuaryHTML = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Sovereign Sanctuary</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@300;400&family=Inter:wght@300&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { 
            margin: 0; padding: 0; height: 100vh; 
            background-color: #050505; color: #D4AF37; 
            display: flex; flex-direction: column; 
            justify-content: center; align-items: center; 
            font-family: 'Cinzel', serif; text-align: center; 
            overflow: hidden; position: relative; 
        }
        
        /* The Wabi-Sabi Ambient Overlay */
        .wabi-sabi-overlay { 
            position: absolute; top:0; left:0; right:0; bottom:0; 
            background-image: url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"n\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23n)\" opacity=\"0.04\"/%3E%3C/svg%3E'); 
            z-index: 1; pointer-events: none; 
        }

        .ambient-core {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            opacity: 0;
            animation: slowAwaken 2s cubic-bezier(0.25, 1, 0.5, 1) forwards 0.5s;
        }

        /* Sovereign Pulse Emblem */
        .sovereign-emblem { 
            width: 44px; height: 44px; 
            border: 1px solid rgba(212,175,55,0.4); 
            border-radius: 50%; 
            margin-bottom: 2.5rem; 
            animation: sovereignPulse 4s infinite cubic-bezier(0.25, 1, 0.5, 1); 
            position: relative;
        }
        .sovereign-emblem::after {
            content: '';
            position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px;
            background: rgba(212,175,55,0.1);
            border-radius: 50%;
        }

        h1 { 
            font-weight: 300; font-size: 1.4rem; letter-spacing: 0.15em; 
            margin-bottom: 10px; color: #f3f4f6; 
        }
        
        p { 
            font-family: 'Inter', sans-serif; font-size: 0.75rem; 
            color: #777; letter-spacing: 0.25em; text-transform: uppercase; 
        }

        @keyframes sovereignPulse { 
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.15); } 
            70% { transform: scale(1.1); box-shadow: 0 0 0 25px rgba(212, 175, 55, 0); } 
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); } 
        }
        
        @keyframes slowAwaken {
            0% { opacity: 0; transform: translateY(20px); filter: blur(10px); }
            100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
    </style>
</head>
<body>
    <div class="wabi-sabi-overlay"></div>
    <div class="ambient-core">
        <div class="sovereign-emblem"></div>
        <h1>Sovereign bağlantısı beklemeye alındı.</h1>
        <p>Sığınakta güvendesiniz.</p>
    </div>
</body>
</html>`;

    // Sığınağı cache'e mühürle
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.put(SANCTUARY_URL, new Response(sanctuaryHTML, {
                headers: { 'Content-Type': 'text/html' }
            }));
        })
    );
    
    // Anında devreye gir
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    // Eski barınakları (cache'leri) imha et
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (!event.request.url.startsWith('http')) return;
    // Sadece Navigation (HTML Görüntüleme) isteklerini pusuya düşür
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                // Eğer server yanıt vermiyorsa veya Wi-Fi koptuysa -> Sığınağı Ver
                return caches.match(SANCTUARY_URL);
            })
        );
    }
});
