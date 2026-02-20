/**
 * SANTIS GLOBAL TREND RADAR (PHASE 60)
 * DESIGN SYSTEM V3.1: Dynamic Data & Quiet Luxury Glassmorphism
 * 
 * Displays curated global wellness trends adapted to the Santis card system.
 * Strict visual harmony with homepage services.
 * Now supports dynamic updates via assets/data/global-trends.json
 */

console.log("🚀 [Global Trends] SCRIPT LOADED v4.0 (JSON-Linked)");

document.addEventListener('DOMContentLoaded', () => {
    initGlobalTrends();
});

async function initGlobalTrends() {
    const container = document.getElementById('global-trends-grid');
    if (!container) {
        console.warn("⚠️ [Global Trends] Container #global-trends-grid not found.");
        return;
    }

    // GUARD: If static cards already exist (from build template), preserve them
    const existingCards = container.querySelectorAll('.nv-trend-card');
    if (existingCards.length > 0) {
        console.log(`✅ [Global Trends] ${existingCards.length} static cards found. Preserving HTML template.`);
        return;
    }

    try {
        // 1. Fetch Data (only if no static cards)
        const response = await fetch('/assets/data/global-trends.json?t=' + Date.now());
        if (!response.ok) throw new Error("JSON Fetch Failed");

        const trends = await response.json();
        console.log(`🌍 [Global Trends] Loaded ${trends.length} items. Raw order.`);

        // --- ADAPTIVE SORTING (Phase 40) ---
        if (window.Registry) {
            const soul = window.Registry.get().soul;
            if (soul && soul.dominant_element) {
                console.log(`🧠 [Adaptive] Re-sorting for Soul Element: ${soul.dominant_element}`);
                sortTrendsByMood(trends, soul.dominant_element);
            }
        }

        // 2. Clear & Render
        container.innerHTML = '';

        trends.forEach((trend, index) => {
            const card = createTrendCard(trend, index);
            container.appendChild(card);
        });

        // 3. Trigger Animations (if ScrollReveal or similar is used)
        if (window.ScrollReveal) {
            window.ScrollReveal().reveal('.nv-trend-card', { interval: 100 });
        }

    } catch (error) {
        console.error("❌ [Global Trends] Error:", error);
        // Don't destroy existing content on error
        if (container.children.length === 0) {
            container.innerHTML = '<div class="nv-error">Trend verileri yüklenemedi.</div>';
        }
    }
}

/**
 * Sorts trends to prioritize those matching the user's current "Soul Element".
 * Mapping:
 * - WATER (Needs Calm): Ice, Sage
 * - FIRE (High Energy): Gold, Slate
 * - AIR (Focus): Ice, Slate
 * - EARTH (Balanced): Sage, Gold
 */
function sortTrendsByMood(trends, element) {
    const priorityMap = {
        'water': ['ice', 'sage'],
        'fire': ['gold', 'slate', 'red'],
        'air': ['ice', 'slate', 'white'],
        'earth': ['sage', 'gold', 'brown']
    };

    const priorities = priorityMap[element] || [];

    trends.sort((a, b) => {
        const aP = priorities.includes(a.dimension);
        const bP = priorities.includes(b.dimension);
        // If a is priority and b is not, a comes first (-1)
        if (aP && !bP) return -1;
        if (!aP && bP) return 1;
        return 0; // Maintain relative order otherwise
    });
}

function createTrendCard(trend, index) {
    // 🎨 MODERN LUXURY CARD ARCHITECTURE
    // No wrappers, no noise. Just Content + Physics.

    const a = document.createElement('a');
    a.className = `nv-trend-card world-${trend.dimension || 'standard'}`;
    a.href = trend.link || '#';
    a.setAttribute('aria-label', `View Trend: ${trend.title}`);

    // INLINE STYLES FOR PERFORMANCE (Glass Physics)
    // We inject physics here to strictly control the pilot area
    a.style.cssText = `
        display: block;
        position: relative;
        height: 500px; /* Modern Portrait Ratio */
        border-radius: 2px; /* Precision Corner */
        overflow: hidden;
        background: var(--glass-surface);
        backdrop-filter: var(--glass-filter);
        -webkit-backdrop-filter: var(--glass-filter);
        border: 1px solid var(--border-ultra-thin);
        box-shadow: var(--shadow-diffuse);
        transition: transform 0.6s var(--ease-smooth), box-shadow 0.6s var(--ease-smooth);
        cursor: pointer;
        text-decoration: none;
    `;

    // MEDIA LAYER (Matte Finish)
    let mediaHtml = '';
    if (trend.isVideo) {
        mediaHtml = `<video class="nv-trend-bg" src="${trend.image}" autoplay loop muted playsinline poster="/assets/img/poster_trend.jpg" 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.75; filter: brightness(0.7) saturate(0.8); pointer-events: none;"></video>`;
    } else {
        mediaHtml = `<div class="nv-trend-bg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('${trend.image}'); background-size: cover; background-position: center; opacity: 0.75; filter: brightness(0.7) saturate(0.8); pointer-events: none;"></div>`;
    }

    // BADGE (Modern Pill)
    const regionBadge = trend.region ?
        `<span style="
            position: absolute; top: 24px; left: 24px; 
            font-family: 'Inter'; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; 
            color: var(--text-secondary); opacity: 0.8;
            padding: 4px 12px; border: 1px solid var(--border-ultra-thin); border-radius: 100px;
        ">${trend.region}</span>` : '';

    a.innerHTML = `
        ${mediaHtml}
        
        <!-- CONTENT LAYER (Minimalist) -->
        <div class="nv-trend-content" style="
            position: absolute; bottom: 0; left: 0; width: 100%; padding: 40px;
            background: linear-gradient(to top, rgba(11,13,15,0.95), transparent);
            pointer-events: none;
        ">
            ${regionBadge}
            
            <h3 style="
                font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 400; color: var(--text-premium); margin-bottom: 12px;
            ">${trend.title}</h3>
            
            <p style="
                font-family: 'Inter'; font-size: 0.9rem; font-weight: 300; line-height: 1.6; color: var(--text-secondary); margin-bottom: 24px;
                display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
            ">${trend.desc}</p>
            
            <span style="
                font-family: 'Inter'; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold-champagne);
                border-bottom: 1px solid rgba(198,161,91,0.3); padding-bottom: 4px;
            ">Ritüeli Keşfet</span>
        </div>
    `;

    // Dynamic Hover Physics
    a.addEventListener('mouseenter', () => {
        a.style.transform = 'translateY(-8px)';
        a.style.boxShadow = '0 30px 60px -10px rgba(0,0,0,0.5)';
        a.querySelector('.nv-trend-bg').style.opacity = '0.9';
        a.querySelector('.nv-trend-bg').style.filter = 'brightness(0.8) saturate(1)';
    });

    a.addEventListener('mouseleave', () => {
        a.style.transform = 'translateY(0)';
        a.style.boxShadow = 'none';
        a.querySelector('.nv-trend-bg').style.opacity = '0.75';
        a.querySelector('.nv-trend-bg').style.filter = 'brightness(0.7) saturate(0.8)';
    });

    // Tilt Hook
    if (window.VanillaTilt) {
        window.VanillaTilt.init(a, {
            max: 3, // Reduced for subtlety
            speed: 1000, // Slower mechanic
            glare: true,
            "max-glare": 0.1,
            scale: 1.02
        });
    }

    return a;
}
