/**
 * SANTIS GLOBAL TREND RADAR (PHASE 9)
 * Displays global wellness trends to establish authority.
 * Adapted from Admin Panel for Client Side.
 */

document.addEventListener('DOMContentLoaded', () => {
    initGlobalTrends();
});

function initGlobalTrends() {
    const container = document.getElementById('global-trends-grid');
    if (!container) return;

    // Static Data (Source of Truth)
    const trends = [
        { city: 'Tokyo', trend: 'Wabi-Sabi Aesthetics', icon: '🇯🇵', desc: 'Kusurların mükemmelliği ve sadelik.', link: '/tr/urunler/detay.html?id=thai-royal' },
        { city: 'Bangkok', trend: 'Wat Pho Wisdom', icon: '🇹🇭', desc: '2500 yıllık şifa mirası ve pasif yoga.', link: '/tr/urunler/detay.html?id=thai-golden' },
        { city: 'Milan', trend: 'Travertine Stone Textures', icon: '🇮🇹', desc: 'Doğal taş dokuları ve minimalizm.', link: '/tr/urunler/detay.html?id=1' }, // Sothys
        { city: 'Kerala', trend: 'Ayurvedic Healing', icon: '🇮🇳', desc: 'Sıcak yağlar ve 3. Göz terapisi (Shirodhara).', link: '/tr/urunler/detay.html?id=ayur-vedic' },
        { city: 'Bali', trend: 'Royal Lulur Ritual', icon: '🇮🇩', desc: 'Java prenseslerinin altın ışıltılı güzellik sırrı.', link: '/tr/urunler/detay.html?id=bali-lulur' },
        { city: 'Brittany', trend: 'Thalasso Slimming', icon: '🇫🇷', desc: 'Okyanus yosunları ile klinik detoks ve sıkılaşma.', link: '/tr/urunler/detay.html?id=detox-thalasso' }
    ];

    // Render
    let html = '';
    trends.forEach(t => {
        html += `
            <a href="${t.link || '#'}" class="santis-trend-card-link" style="text-decoration: none; color: inherit;">
                <div class="santis-trend-card">
                    <div class="santis-trend-icon">${t.icon}</div>
                    <div class="santis-trend-info">
                        <span class="santis-trend-city">${t.city}</span>
                        <h3 class="santis-trend-title">${t.trend}</h3>
                        <p class="santis-trend-desc">${t.desc}</p>
                    </div>
                </div>
            </a>
        `;
    });

    container.innerHTML = html;
}
