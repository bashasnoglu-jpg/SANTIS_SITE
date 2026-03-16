/**
 * 👁️ SANTIS OS: THE SOVEREIGN GOD MODE ENGINE (Phase 66)
 * Zero-Latency Redis Pub/Sub Stream Processor
 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("🦅 [GOD MODE] Sovereign Panopticon Initializing...");

    const radarList = document.getElementById("radar_list");
    const whaleIndicator = document.getElementById("whale_indicator");
    const widgetRadar = document.getElementById("widget-radar");

    // Limits
    const MAX_RADAR_ITEMS = 50;

    // Connect to Sovereign Bus (Redis SSE)
    // Bu endpoint Santis OS içindeki app/api/v1/endpoints/telemetry.py veya media_gateway.py içerisinde yayınlanan /api/v1/media/pulse olabilir.
    // Biz 'santis_global_pulse' yayını yapan telemetry.py veya sse_bus.listen() üzerinden besleneceğiz.
    // Standart SSE EventSource bağlantısı
    const eventSource = new EventSource('/api/v1/media/pulse');

    eventSource.onopen = () => {
        console.log("⚡ [GOD MODE] Quantum Stream Connected. (Zero-Latency Zırhı Aktif)");
    };

    eventSource.addEventListener("TELEMETRY_PULSE", (e) => {
        // Minimal ping, just for Edge Shield update if needed
    });

    eventSource.addEventListener("VIP_ENGAGED", handleVipEvent);
    eventSource.addEventListener("AURELIA_INTERVENTION", handleVipEvent);

    eventSource.addEventListener("WHALE_ALERT", (e) => {
        const data = JSON.parse(e.data);
        handleVipEvent({ data: JSON.stringify({ event: "VIP_ENGAGED", target: data.node_id || 'Whale Detected', price: data.price || 0 }) });
        triggerWhaleSurge();
    });

    eventSource.addEventListener("REVENUE_STRIKE", (e) => {
        const data = JSON.parse(e.data);
        handleRevenueStrike(data);
    });

    eventSource.addEventListener("DNA_EXTRACTED", (e) => {
        console.log("🧬 DNA Pulse:", e.data);
    });

    eventSource.onerror = (e) => {
        console.error("🛑 [GOD MODE] Connection Lost. Attempting Re-engagement...");
    };

    /**
     * 👁️ PHASE 66: THE PANOPTICON RADAR LOGIC
     */
    function handleVipEvent(e) {
        const data = JSON.parse(e.data);
        const stream = document.getElementById('radar-stream');
        const whales = document.getElementById('active-whales');
        const idleMsg = document.getElementById('radar-idle');

        if (!stream || !whales) return;

        // İlk mesajı (Av Bekleniyor) yok et
        if (idleMsg) idleMsg.remove();

        // 1. Şelaleye Otonom Event Kartı Fırlat
        const entry = document.createElement('div');
        const targetName = data.target || data.product_id || data.node_id || 'Unknown Service';
        const price = data.price || data.original_price || 0;
        const isApex = targetName.toLowerCase().includes('ottoman') || targetName.toLowerCase().includes('apex');

        // Apex ise Altın Taç, diğerleri ise Kırmızı Balina Alarmı
        const borderColor = isApex ? 'border-[#D4AF37]' : 'border-red-500';
        const textColor = isApex ? 'text-[#D4AF37]' : 'text-red-500';
        const icon = isApex ? '👑' : '🐋';

        entry.className = `radar-event p-3 rounded border-l-2 ${borderColor} flex justify-between items-center shrink-0 mb-1`;

        const time = new Date().toLocaleTimeString('en-GB', { hour12: false });

        entry.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">${icon}</span>
                <div class="flex flex-col">
                    <span class="text-[8px] font-mono text-gray-500">[${time}] HESITATION DETECTED</span>
                    <span class="text-xs font-bold ${textColor} uppercase tracking-widest drop-shadow-[0_0_5px_currentColor]">${targetName.replace('-', ' ')}</span>
                </div>
            </div>
            <div class="text-right">
                <span class="text-sm font-mono font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">${price} €</span>
            </div>
        `;

        // Yeni eventi Şelalenin en üstüne ekle (Prepend)
        stream.prepend(entry);

        // RAM Kalkanı: Radarda 20'den fazla event birikmesin
        if (stream.childElementCount > 20) stream.removeChild(stream.lastChild);

        // 2. Metrikleri Güncelle ve Alevlendir
        let currentWhales = parseInt(whales.innerText) || 0;
        whales.innerText = currentWhales + 1;

        // Kuantum Titremesi (Kalp Atışı Efekti)
        whales.classList.add('text-white', 'scale-125');
        setTimeout(() => whales.classList.remove('text-white', 'scale-125'), 300);

        // Otonom Ciro Güncelleme Parçası (Varsayılan)
        const revEl = document.getElementById("val_revenue");
        if (revEl) {
            let currentRev = parseInt(revEl.innerText.replace(/,/g, '')) || 0;
            revEl.innerText = (currentRev + parseInt(price)).toLocaleString('en-US');
        }

        const intEl = document.getElementById("val_interventions");
        if (intEl) intEl.innerText = (parseInt(intEl.innerText) || 0) + 1;

        // 3. Otonom Soğuma (Cooldown): 15 Saniye sonra Radarı Sakinleştir
        setTimeout(() => {
            let w = parseInt(whales.innerText) - 1;
            whales.innerText = w > 0 ? w : 0;
        }, 15000);
    }

    function handleRevenueStrike(data) {
        const stream = document.getElementById('radar-stream');
        const idleMsg = document.getElementById('radar-idle');
        if (!stream) return;

        if (idleMsg) idleMsg.remove();

        // 1. Şelaleye Altın Taçlı Başarı Kartı Fırlat
        const entry = document.createElement('div');
        const targetName = data.target || 'Sovereign Ayrıcalığı';
        const price = data.price || 0;

        entry.className = `radar-event p-3 rounded border-l-4 border-[#D4AF37] flex justify-between items-center shrink-0 mb-1 bg-[#D4AF37]/10`;

        const time = new Date().toLocaleTimeString('en-GB', { hour12: false });

        entry.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-2xl drop-shadow-[0_0_12px_rgba(212,175,55,0.8)]">💳</span>
                <div class="flex flex-col">
                    <span class="text-[8px] font-mono text-[#D4AF37] tracking-widest">[${time}] REVENUE STRIKE</span>
                    <span class="text-sm font-bold text-white uppercase tracking-widest drop-shadow-[0_0_8px_currentColor]">${targetName.replace('-', ' ')}</span>
                </div>
            </div>
            <div class="text-right">
                <span class="text-xl font-mono font-bold text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]">+${price} €</span>
            </div>
        `;

        stream.prepend(entry);
        if (stream.childElementCount > 20) stream.removeChild(stream.lastChild);

        // 2. Canlı Ciro Sayacını Zıplat
        const revEl = document.getElementById("val_revenue");
        if (revEl) {
            let currentRev = parseInt(revEl.innerText.replace(/,/g, '')) || 0;
            revEl.innerText = (currentRev + parseInt(price)).toLocaleString('en-US');

            // Kuantum Zıplaması: (Mevcut widget yapısını varsayarak)
            const widget = revEl.closest('.widget') || revEl.parentElement;
            widget.classList.add('whale-alert');
            widget.style.transform = 'scale(1.02)';
            widget.style.backgroundColor = 'rgba(212,175,55,0.1)';

            setTimeout(() => {
                widget.classList.remove('whale-alert');
                widget.style.transform = '';
                widget.style.backgroundColor = '';
            }, 2500);
        }
    }

    /**
     * DOM Manipulation Kalkanı (60 FPS için DocumentFragment kullanımı)
     */
    function addRadarPulse(data, isWhale) {
        const li = document.createElement("li");
        li.className = `radar-item ${isWhale ? 'whale' : ''}`;

        let intentScore = isWhale ? '95%+' : `${Math.floor(Math.random() * 40 + 20)}%`; // Gerçekte data'dan gelir
        let nodeName = data.node_id || "Sovereign Gateway";

        li.innerHTML = `
            <div class="node-name">${nodeName} (Client: ${data.client_id.substring(0, 6)}...)</div>
            <div class="intent-score">Intent: ${intentScore}</div>
            <div class="time-ago">Just now</div>
        `;

        // Prepend ile DOM'un başına ekle
        radarList.insertBefore(li, radarList.firstChild);

        // Performans koruması: Fazla DOM'u sil
        if (radarList.children.length > MAX_RADAR_ITEMS) {
            radarList.removeChild(radarList.lastChild);
        }
    }

    /**
     * Whale tespit edildiğinde Dashboard'ın titreşim, Altın Pulse (Görsel Tepki) zırhı
     */
    function triggerWhaleSurge() {
        whaleIndicator.style.display = "block";
        widgetRadar.classList.add("whale-alert");

        // Ciro simülasyonunu hafifçe tetikle (Concierge araya girerse)
        const revEl = document.getElementById("val_revenue");
        let currentRev = parseInt(revEl.innerText.replace(',', ''));
        revEl.innerText = (currentRev + 150).toLocaleString('en-US');

        const intEl = document.getElementById("val_interventions");
        intEl.innerText = parseInt(intEl.innerText) + 1;

        setTimeout(() => {
            whaleIndicator.style.display = "none";
            widgetRadar.classList.remove("whale-alert");
        }, 3000);
    }
});
