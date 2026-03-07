/**
 * SANTIS v13.2 — SOVEREIGN CONCIERGE (AUTONOMOUS MERCHANT ENGINE)
 * Intelligence + Commercial Action layer
 * Creates actionable buttons that trigger Sovereign modules + commercial ops
 * Dependencies: MomentumEngine, SovereignFilter, SovereignMirror (via window)
 */
window.SovereignConcierge = {
    _feed: null,
    _statusEl: null,
    _lastInsight: '',
    _insightCount: 0,
    _maxFeed: 5,
    _actionCooldowns: {},   // v13.2.1: throttle — { 'PRICE:London': timestamp }
    _cooldownMs: 60000,     // 60s cooldown per action+target

    /** Check if a city exists as a Swiper slide */
    _cityExists(city) {
        return !!document.querySelector(`.swiper-slide[data-city="${city}"]`);
    },

    init() {
        this._feed = document.getElementById('insights-feed');
        this._statusEl = document.getElementById('insights-status');
        if (!this._feed) return;

        setInterval(() => this.analyze(), 5000);
        console.log('🧠 SovereignConcierge v13.2: Merchant Engine active.');
    },

    /**
     * v13.1+13.2: ACTION ENGINE — cross-module + commercial action buttons
     */
    createAction(type, target) {
        switch (type) {
            // v13.1: Operational Actions
            case 'FILTER_CITY':
                return `<button class="santis-ai-btn" onclick="SovereignFilter.execute('ALL');document.querySelectorAll('.swiper-slide').forEach(s=>{if(s.dataset.city!=='${target}')s.classList.add('ghost-out')});if(window.triggerPulse)triggerPulse(true)">📍 ${target}</button>`;
            case 'SURGE_MODE':
                return `<button class="santis-ai-btn warn" onclick="SovereignFilter.execute('SURGE')">⚡ Surge Modu</button>`;
            case 'FOCUS_SWITCH':
                return `<button class="santis-ai-btn" onclick="(function(){var s=document.querySelector('[data-city=&quot;${target}&quot;]');if(s&&window.SovereignMirror)SovereignMirror.updateFocus(s)})()">🔀 Focus: ${target}</button>`;
            case 'CHART_TOGGLE':
                return `<button class="santis-ai-btn" onclick="MomentumEngine.toggleMode()">📊 Detay</button>`;

            // v13.2: Commercial Actions (Merchant Engine)
            case 'REORDER_STOCK':
                return `<button class="santis-ai-btn merchant" onclick="SovereignConcierge.execAction('REORDER','${target}')">📦 Sipariş: ${target}</button>`;
            case 'PRICE_ADJUST':
                return `<button class="santis-ai-btn surge-price" onclick="SovereignConcierge.execAction('PRICE','${target}')">💰 Surge Fiyatla</button>`;
            case 'ALERT_TEAM':
                return `<button class="santis-ai-btn critical" onclick="SovereignConcierge.execAction('ALERT','${target}')">⚠️ Ekibi Uyar</button>`;
            default:
                return '';
        }
    },

    /**
     * v13.2: COMMERCIAL COMMAND EXECUTOR
     * Executes merchant actions and provides feedback via insight feed
     */
    execAction(type, target) {
        // v13.2.1: Throttle guard — prevent duplicate commands
        const key = `${type}:${target}`;
        const now = Date.now();
        if (this._actionCooldowns[key] && (now - this._actionCooldowns[key]) < this._cooldownMs) {
            const remaining = Math.ceil((this._cooldownMs - (now - this._actionCooldowns[key])) / 1000);
            this.speak(`⏳ ${target} için ${type} komutu bekleme süresinde (${remaining}s). Tekrar önlendi.`, 'info', []);
            console.log(`🛡️ Throttled: ${key} — ${remaining}s remaining`);
            return;
        }
        this._actionCooldowns[key] = now;

        if (window.triggerPulse) window.triggerPulse(true);
        const ts = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        switch (type) {
            case 'REORDER':
                this.speak(`✅ Sipariş emri verildi: ${target} stok takviyesi yolda. [${ts}]`, 'info', []);
                console.log(`🦅 Sovereign Command: REORDER → ${target}`);
                break;
            case 'PRICE':
                this.speak(`✅ ${target} için dinamik fiyatlandırma (+%10 Surge) aktif edildi. [${ts}]`, 'warn', []);
                console.log(`🦅 Sovereign Command: PRICE_ADJUST → ${target} +10%`);
                break;
            case 'ALERT':
                this.speak(`🚨 ${target} operasyon ekibine kritik alarm gönderildi. [${ts}]`, 'critical', []);
                console.log(`🦅 Sovereign Command: ALERT_TEAM → ${target}`);
                break;
        }

        // Update status badge to COMMANDING
        if (this._statusEl) {
            this._statusEl.textContent = 'COMMANDING';
            this._statusEl.style.background = 'rgba(0,209,255,0.2)';
            this._statusEl.style.color = '#00D1FF';
            // Revert after 3s
            setTimeout(() => {
                this._statusEl.textContent = 'LISTENING';
                this._statusEl.style.background = 'rgba(0,255,194,0.15)';
                this._statusEl.style.color = '#00FFC2';
            }, 3000);
        }
    },

    analyze() {
        const star = window.MomentumEngine ? MomentumEngine.getRisingStar() : { city: '—', momentum: 0 };
        const focusName = document.getElementById('santis-focus-name')?.textContent || '';
        const slides = document.querySelectorAll('.swiper-slide[data-status]');
        const surgeNodes = [...slides].filter(s => s.dataset.status === 'SURGE');

        let insight = null;
        let actions = [];

        // 1. Surge alert — commercial opportunity
        if (surgeNodes.length > 0) {
            const cities = [...surgeNodes].map(s => s.dataset.city).filter(Boolean).join(', ');
            const msg = `Surge tespit: ${cities || 'Bilinmeyen'}. Talep patlaması — fiyat optimizasyonu öneriliyor.`;
            if (msg !== this._lastInsight) {
                insight = { text: msg, level: 'critical' };
                actions.push(this.createAction('SURGE_MODE'));
                if (surgeNodes[0]?.dataset.city) {
                    const sc = surgeNodes[0].dataset.city;
                    actions.push(this.createAction('PRICE_ADJUST', sc));
                    if (this._cityExists(sc)) actions.push(this.createAction('FOCUS_SWITCH', sc));
                }
            }
        }

        // 2. Rising Star momentum spike — merchant opportunity
        if (star.city !== '—' && star.momentum > 5 && !insight) {
            const msg = `${star.city} ivmesi ×${star.momentum.toFixed(1)} — talep artışı devam ediyor.`;
            if (msg !== this._lastInsight) {
                const isHot = star.momentum > 10;
                insight = { text: msg, level: isHot ? 'warn' : 'info' };
                if (isHot) actions.push(this.createAction('PRICE_ADJUST', star.city));
                if (this._cityExists(star.city)) actions.push(this.createAction('FOCUS_SWITCH', star.city));
                actions.push(this.createAction('CHART_TOGGLE'));
            }
        }

        // 3. Predictive pivot
        if (window.MomentumEngine && MomentumEngine._mode === 'momentum' && star.city !== '—' && star.city !== focusName && !insight) {
            const msg = `Trend kayması: ${star.city} yükseliyor, Focus ${focusName} üzerinde. Pivot önerisi aktif.`;
            if (msg !== this._lastInsight) {
                insight = { text: msg, level: 'info' };
                if (this._cityExists(star.city)) actions.push(this.createAction('FOCUS_SWITCH', star.city));
                actions.push(this.createAction('CHART_TOGGLE'));
            }
        }

        // 4. Simulated stock alert (v13.2 demo — every ~40s)
        if (!insight && this._insightCount > 0 && this._insightCount % 8 === 0) {
            const products = ['Deep Sea Detox', 'Royal Hammam Set', 'Ayurveda Ritual Kit', 'Swiss Thermal Pack'];
            const prod = products[this._insightCount % products.length];
            const stock = Math.floor(Math.random() * 5) + 1;
            insight = { text: `Stok uyarısı: ${prod} sadece ${stock} adet kaldı. Tedarik süresi 3 gün.`, level: 'warn' };
            actions.push(this.createAction('REORDER_STOCK', prod));
            actions.push(this.createAction('ALERT_TEAM', prod));
        }

        // 5. Stability report
        if (!insight && this._insightCount % 6 === 0 && this._insightCount > 0) {
            const fps = document.getElementById('tel-fps')?.textContent || '--';
            insight = { text: `Sistem stabil. FPS ${fps}, ${slides.length} node aktif. Anomali yok.`, level: 'info' };
        }

        this._insightCount++;

        if (insight) {
            this.speak(insight.text, insight.level, actions);
            if (this._statusEl) {
                this._statusEl.textContent = insight.level === 'critical' ? 'ALERT' : insight.level === 'warn' ? 'TRACKING' : 'LISTENING';
                this._statusEl.style.background = insight.level === 'critical' ? 'rgba(255,62,62,0.2)' : insight.level === 'warn' ? 'rgba(212,175,55,0.2)' : 'rgba(0,255,194,0.15)';
                this._statusEl.style.color = insight.level === 'critical' ? '#FF3E3E' : insight.level === 'warn' ? '#D4AF37' : '#00FFC2';
            }
        }
    },

    speak(message, level = 'info', actions = []) {
        if (!this._feed) return;
        this._lastInsight = message;

        const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const actionHtml = actions.length > 0 ? `<div class="insight-actions">${actions.join('')}</div>` : '';

        const div = document.createElement('div');
        div.className = `insight-item ${level}`;
        div.innerHTML = `${message}<div class="insight-time">${time}</div>${actionHtml}`;

        this._feed.insertBefore(div, this._feed.firstChild);

        while (this._feed.children.length > this._maxFeed) {
            this._feed.removeChild(this._feed.lastChild);
        }

        if (window.triggerPulse) window.triggerPulse(level === 'critical');
    }
};
