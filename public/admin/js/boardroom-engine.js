/**
 * public/admin/js/boardroom-engine.js
 * Sovereign Boardroom Fetch Engine - Zero Bloat & Vanilla Mastery
 */
document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. State ve Konfigürasyon ---
    const ENDPOINTS = {
        summary: '/api/v1/boardroom/summary',
        liveFeed: '/api/v1/boardroom/live-feed',
        latency: '/api/v1/boardroom/latency'
    };
    
    const INTERVAL_FAST = 5000;   // 5s Live Feed & Stats
    const INTERVAL_SLOW = 30000;  // 30s Chart Updates
    const MAX_FEED_ITEMS = 50;    // Ölüm Vadisi Koruması (DOM Pruning)
    
    let mainChartInstance = null;
    let isPolling = false;

    // --- 2. Chart.js Init (Zero Memory Leak) ---
    function initChart() {
        const ctx = document.getElementById('mainChart').getContext('2d');
        
        Chart.defaults.color = 'rgba(255, 255, 255, 0.3)';
        Chart.defaults.font.family = "'Outfit', sans-serif";

        mainChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['0-50ms', '50-100ms', '100-250ms', '250-500ms', '500ms+'],
                datasets: [{
                    label: 'İşlem Frekansı',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(198, 169, 107, 0.15)', // Smoky warm-gray / brass
                    borderColor: 'rgba(198, 169, 107, 0.4)',
                    borderWidth: 1,
                    borderRadius: 4,
                    hoverBackgroundColor: 'rgba(198, 169, 107, 0.4)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: 'transparent' }, // Görünmez grid
                        border: { display: false } 
                    },
                    x: { 
                        grid: { display: false },
                        border: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#141416',
                        titleColor: '#c6a96b',
                        bodyColor: '#e0e0e3',
                        borderColor: 'rgba(255,255,255,0.05)',
                        borderWidth: 1
                    }
                },
                animation: { duration: 800, easing: 'easeOutQuart' }
            }
        });
    }

    // --- 3. DOM Manipülasyonları ---
    function updateStatus(state) {
        const dot = document.getElementById('sync-dot');
        const text = document.getElementById('sync-text');
        
        dot.className = 'status-dot';
        if (state === 'OK') {
            dot.classList.add('active');
            text.innerText = 'SYNCED';
        } else if (state === 'ERROR') {
            dot.classList.add('error');
            text.innerText = 'RECONNECTING...';
        } else {
            text.innerText = 'FETCHING';
        }
    }

    function renderFeed(events) {
        const feedContainer = document.getElementById('live-feed');
        feedContainer.innerHTML = ''; // Full flush
        
        events.forEach(event => {
            const li = document.createElement('li');
            li.className = 'live-feed-item';
            
            const timeString = new Date(event.created_at).toLocaleTimeString([], { hour12: false });
            
            // Cyberpunk Severity Highlighting
            let textClass = '';
            if (event.event_type === 'UPLOAD_FINALIZE_REJECTED' || event.event_type === 'UPLOAD_DENIED' || event.severity === 'ERROR' || event.severity === 'CRITICAL') {
                textClass = 'critical';
            } else if (event.severity === 'WARN') {
                textClass = 'warn';
            }

            let desc = `[${event.event_type}] `;
            if (event.subject) desc += `SUB:${event.subject} - `;
            
            try {
                const payload = event.payload_json ? JSON.parse(event.payload_json) : {};
                if (payload.reason) desc += payload.reason;
                else if (payload.message) desc += payload.message;
                else desc += "Zerk Edildi.";
            } catch(e) { desc += "Payload verisi..."; }

            li.innerHTML = `
                <span class="feed-time">${timeString}</span>
                <span class="feed-desc ${textClass}">${desc}</span>
            `;
            feedContainer.appendChild(li);
        });
        
        // Ölüm Vadisi Koruması (DOM Pruning)
        while (feedContainer.children.length > MAX_FEED_ITEMS) {
            feedContainer.removeChild(feedContainer.lastChild);
        }
    }

    // --- 4. Fetch Stacking Korumalı Polling (Recursive setTimeout) ---
    async function fetchFastMetrics() {
        if (isPolling) return;
        try {
            const [sumRes, feedRes] = await Promise.all([
                fetch(ENDPOINTS.summary),
                fetch(ENDPOINTS.liveFeed + "?limit=50")
            ]);
            
            // Cerberus Koruması (401 veya 403 alınırsa login'e at)
            if (sumRes.status === 401 || sumRes.status === 403 || feedRes.status === 401 || feedRes.status === 403) {
                window.location.href = 'login.html';
                return;
            }

            if (!sumRes.ok || !feedRes.ok) throw new Error("API Failure");
            
            const sumData = await sumRes.json();
            const feedData = await feedRes.json();
            
            // DOM Update Top Stats
            document.getElementById('metric-denials').innerText = sumData.deniedLastHour ?? 0;
            const incidentsEl = document.getElementById('metric-incidents');
            incidentsEl.innerText = sumData.activeIncidents ?? 0;
            if (sumData.activeIncidents > 0) incidentsEl.classList.add('metric-danger');
            else incidentsEl.classList.remove('metric-danger');
            
            document.getElementById('metric-orphans').innerText = sumData.reaperCleanupsDay ?? 0;
            
            renderFeed(feedData.events || []);
            updateStatus('OK');
        } catch (e) {
            console.error('[Boardroom Engine] Fast Fetch Error:', e);
            updateStatus('ERROR');
        } finally {
            // Recursive Polling
            setTimeout(fetchFastMetrics, INTERVAL_FAST);
        }
    }

    async function fetchSlowMetrics() {
        try {
            const res = await fetch(ENDPOINTS.latency);
            
            if (res.status === 401 || res.status === 403) {
                window.location.href = 'login.html';
                return;
            }

            if (!res.ok) throw new Error("API Failure");
            const data = await res.json();
            
            if (data.avg !== null && data.avg !== undefined) {
                document.getElementById('metric-latency').innerHTML = `${data.avg} <span style="font-size: 1rem; color: var(--santis-muted)">ms</span>`;
            }
            
            // Update Chart.js safely without re-init
            if (data.histogram && mainChartInstance) {
                mainChartInstance.data.datasets[0].data = data.histogram.map(b => b.count);
                mainChartInstance.update('none'); // Animasyonsuz akıcı güncelleme
            }
        } catch (e) {
            console.error('[Boardroom Engine] Slow Fetch Error:', e);
        } finally {
            setTimeout(fetchSlowMetrics, INTERVAL_SLOW);
        }
    }

    // --- 5. Yönetici Komutları (Command Buttons) ---
    document.getElementById('btn-reaper')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-reaper');
        btn.innerText = "TETİKLENİYOR...";
        btn.style.color = "var(--santis-brass)";
        btn.style.borderColor = "var(--santis-brass)";
        try {
            await fetch('/api/v1/boardroom/reaper/trigger', { method: 'POST' });
            setTimeout(() => {
                btn.innerText = "İNFAZI BAŞLAT";
                btn.style.color = "var(--santis-text)";
                btn.style.borderColor = "var(--glass-border)";
            }, 2000);
            // Hızlıca Live Feed'i güncelle
            fetchFastMetrics(); 
        } catch(e) { console.error('Reaper Error:', e); }
    });

    document.getElementById('btn-seal')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-seal');
        btn.innerText = "MÜHÜRLENİYOR...";
        try {
            await fetch('/api/v1/boardroom/logout', { method: 'POST' });
            window.location.href = 'login.html';
        } catch(e) { console.error('Seal Error:', e); }
    });

    // --- 6. Ateşleme (Engine Ignition) ---
    initChart();
    
    // Asenkron zincirleri başlat (Fire and Forget)
    fetchFastMetrics();
    fetchSlowMetrics();
});
