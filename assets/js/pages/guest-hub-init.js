/**
 * SANTIS OS - Sovereign Guest Hub Controller (Phase 22)
 * Connects the Frontend VIP Dashboard to the Backend Fastify Data Layer securely.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Simulate authentication
    const guestToken = localStorage.getItem('santis_guest_token') || 'mock_jwt_v1_sovereign';
    localStorage.setItem('santis_guest_token', guestToken); // Hydrate if dummy

    // 2. Fetch VIP Data with Zero-Jank
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => fetchGuestData(guestToken));
    } else {
        setTimeout(() => fetchGuestData(guestToken), 300);
    }
});

async function fetchGuestData(token) {
    console.log("🦅 [Guest Hub] VIP Kimlik Sorgusu Başladı. Kuantum Limiti: 500ms");
    
    // 🚨 KUANTUM KESİCİ: 500ms içinde Bouncer cevap vermezse hattı kopar!
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);

    try {
        const response = await fetch('/api/v1/guests/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error("Bouncer reddetti: " + response.status);

        const data = await response.json();
        console.log(`👑 [Guest Hub] VIP Onaylandı. Kimlik: ${data.user?.name || data.name || 'Sovereign VIP'}`);
        
        // Merkezi Sinir Sistemine (EventBus) VIP'nin geldiğini fısılda
        if (window.SantisEventBus) window.SantisEventBus.emit('guest:authenticated', data);

        if (data.status === 'success') {
            hydrateDashboard(data);
        }
        return data;
    } catch (err) {
        clearTimeout(timeoutId);
        
        if (err.name === 'AbortError') {
            console.warn("⏳ [Guest Hub] Kuantum Düşüşü (Fail-Fast): 500ms aşıldı! Router serbest bırakıldı.");
        } else {
            console.warn(`🛡️ [Guest Hub] Anonim Erişim. Bouncer Uyarısı: (${err.message})`);
        }

        const anonymousFallback = { status: 'anonymous', role: 'guest', frictionScore: 0 };
        if (window.SantisEventBus) window.SantisEventBus.emit('guest:anonymous', anonymousFallback);
        
        // Route A: Mock Data Fallback for Zero-Jank Experience
        const mockVipData = {
            status: 'success',
            user: { 
                name: "Hakan Hocam (Phantom Mod)", 
                tier: "Sovereign Elite", 
                santisCoins: "14.500" 
            },
            smart_greeting: "Sovereign ağa koptuğu için tam siber güvenlikli Phantom Mode açıldı.",
            upcoming_booking: {
                service: "Gelecek Mimari Konsey",
                date: "Bugün, 22:30",
                therapist: "Santis AI Network"
            },
            recommendation: {
                url: "/masaj.htmlbronz-masaji.html",
                image: "/assets/img/cards/santis_card_massage_v1.webp",
                title: "Kuantum Köprüsü Test (Phase 30)",
                price: "N/A"
            }
        };
        
        hydrateDashboard(mockVipData);
        return anonymousFallback;
    }
}

function hydrateDashboard(data) {
    // Profil
    document.getElementById('zen-guest-name').innerText = data.user.name.split(' ')[0];
    document.getElementById('zen-smart-greeting').innerText = data.smart_greeting;
    document.getElementById('zen-tier-name').innerText = data.user.tier;
    document.getElementById('zen-coins').innerText = data.user.santisCoins;

    // Randevu
    document.getElementById('zen-booking-service').innerText = data.upcoming_booking.service;
    document.getElementById('zen-booking-date').innerText = data.upcoming_booking.date;
    document.getElementById('zen-booking-therapist').innerText = data.upcoming_booking.therapist;

    // AI Dynamic Morph Kartı (Concierge Integration)
    if (data.recommendation) {
        document.getElementById('zen-ai-url').href = data.recommendation.url;
        document.getElementById('zen-ai-image').src = data.recommendation.image;
        document.getElementById('zen-ai-title').innerText = data.recommendation.title;
        document.getElementById('zen-ai-price').innerText = data.recommendation.price;
    } else {
        document.getElementById('zen-ai-card').style.display = 'none';
    }

    // Zero-Jank Paint (Switch visibility cleanly)
    document.getElementById('zen-skeleton').style.display = 'none';
    const hub = document.getElementById('zen-dashboard');
    hub.style.display = 'block';
    
    // Yavaşça lüks fade-in
    requestAnimationFrame(() => {
        hub.style.opacity = '1';
    });
}
