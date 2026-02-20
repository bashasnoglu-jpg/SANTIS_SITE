/**
 * 🧠 SANTIS CONCIERGE ENGINE v2.0 (FINAL ARCHITECTURE)
 * The Decision Making Core for the AI Assistant.
 * 
 * LOGIC FLOW:
 * 1. Input Processing -> Normalize & Tokenize
 * 2. Intent Detection -> Map Keywords to System Tags
 * 3. Scoring -> Calculate weighted scores for ProductCatalog
 * 4. Filtering -> Apply constraints (e.g. must match at least 1 tag)
 * 5. Ranking -> return Top 3
 */

(function () {
    console.log("🧠 [Concierge Engine] Booting System V2...");

    // ==========================================
    // 1. KNOWLEDGE BASE (THE DICTIONARY)
    // ==========================================
    const INTENT_DICTIONARY = [
        // PHYSICAL PAIN
        { keywords: ['ağrı', 'tutulma', 'sertlik', 'sancı', 'kramp'], intent: 'PHYSICAL_PAIN', tags: ['pain-relief'] },
        { keywords: ['bel', 'sırt', 'boyun', 'omuz', 'kulunç'], intent: 'BODY_REGION', tags: ['muscle', 'deep-tissue'] },

        // MENTAL STATE
        { keywords: ['stres', 'gergin', 'bunaldım', 'sinirli'], intent: 'STRESS', tags: ['stress'] },
        { keywords: ['uyku', 'yorgun', 'bitkin', 'halsiz'], intent: 'FATIGUE', tags: ['sleep', 'energy'] },
        { keywords: ['rahatla', 'gevşe', 'huzur', 'kafa'], intent: 'RELAX', tags: ['relax', 'mind'] },

        // BEAUTY & SKIN
        { keywords: ['cilt', 'yüz', 'leke', 'siyah nokta'], intent: 'SKINCARE', tags: ['facial', 'skincare'] },
        { keywords: ['ışıltı', 'parlak', 'canlı', 'mat'], intent: 'GLOW', tags: ['glow', 'radiance'] },
        { keywords: ['kırışık', 'yaş', 'genç', 'sarkma'], intent: 'ANTI_AGING', tags: ['anti-aging', 'youth'] },

        // EXPERIENCE / KONTEXT
        { keywords: ['otantik', 'geleneksel', 'tarihi', 'hamam'], intent: 'CULTURAL', tags: ['hammam', 'traditional'], culture: 'hydro-heritage' },
        { keywords: ['asya', 'doğu', 'uzak doğu', 'thai', 'bali'], intent: 'ASIAN', tags: ['eastern-wisdom'], culture: 'eastern-wisdom' },
        { keywords: ['zayıflama', 'incelme', 'selülit', 'ödem'], intent: 'SLIMMING', tags: ['slimming', 'detox'] },
        { keywords: ['çift', 'sevgili', 'eş', 'balayı', 'romantik'], intent: 'COUPLES', tags: ['couple', 'romantic'] }
    ];

    // ==========================================
    // 2. THE ENGINE CLASS
    // ==========================================
    class ConciergeBrain {
        constructor(catalog) {
            this.catalog = catalog || [];
        }

        // --- PHASE 1: INTENT DETECTION ---
        detectIntents(userText) {
            const normalizedText = userText.toLowerCase();
            const detectedAttributes = {
                tags: new Set(),
                cultures: new Set(),
                keywords: [] // For "Understanding" feedback
            };

            INTENT_DICTIONARY.forEach(entry => {
                const match = entry.keywords.some(kw => normalizedText.includes(kw));
                if (match) {
                    if (entry.tags) entry.tags.forEach(t => detectedAttributes.tags.add(t));
                    if (entry.culture) detectedAttributes.cultures.add(entry.culture);
                    detectedAttributes.keywords.push(entry.intent);
                }
            });

            return {
                tags: Array.from(detectedAttributes.tags),
                cultures: Array.from(detectedAttributes.cultures),
                intents: detectedAttributes.keywords
            };
        }

        // --- PHASE 2: SCORING & RANKING ---
        findRecommendations(userText) {
            const analysis = this.detectIntents(userText);

            // TELEMETRY: AI Intent Analysis
            if (window.SantisTelemetry) {
                window.SantisTelemetry.pushEvent('concierge_analysis', {
                    intents: analysis.intents.join(','),
                    tags: analysis.tags.join(','),
                    raw_text_length: userText.length
                });
            }

            // FAIL FAST: If no intent detected
            if (analysis.tags.length === 0 && analysis.cultures.length === 0) {

                // TELEMETRY: AI Miss
                if (window.SantisTelemetry) {
                    window.SantisTelemetry.pushEvent('concierge_miss', {
                        raw_text: userText // Careful with PII, maybe hash or truncate?
                    });
                }

                return { status: 'no_intent', items: [] };
            }

            console.log("🕵️ [Concierge Analysis]", analysis);

            const scoredItems = this.catalog.map(item => {
                let score = 0;
                let reasons = [];

                // RULE 1: TAG MATCH (+3 Points)
                analysis.tags.forEach(tag => {
                    const itemTags = item.tags || [];
                    if (itemTags.includes(tag) || item.category === tag || item.subcategory === tag) {
                        score += 3;
                        reasons.push(`Tag: ${tag}`);
                    }
                });

                // RULE 2: CULTURAL WORLD MATCH (+2 Points)
                if (analysis.cultures.includes(item.cultural_world)) {
                    score += 2;
                    reasons.push(`World: ${item.cultural_world}`);
                }

                // RULE 3: DESCRIPTION TEXT MATCH (+1 Point)
                if (INTENT_DICTIONARY.some(entry =>
                    entry.keywords.some(kw => (item.description || "").toLowerCase().includes(kw))
                )) {
                    score += 1;
                }

                return { ...item, _score: score, _reasons: reasons };
            });

            // --- PHASE 3: FILTERING & PRIORITY ---
            let filteredResults = scoredItems.filter(item => item._score > 0);

            // PRIORITY RULE: If "Facial/Glow" intent -> Filter out Body Massages (unless hybrid)
            if (analysis.intents.includes('SKINCARE') || analysis.intents.includes('GLOW')) {
                const hasBodyIntent = analysis.intents.includes('PHYSICAL_PAIN') || analysis.intents.includes('RELAX');
                if (!hasBodyIntent) {
                    filteredResults = filteredResults.filter(i => i.category === 'skincare' || i.category === 'facial');
                }
            }

            // SORT: Highest Score First
            filteredResults.sort((a, b) => b._score - a._score);

            // LIMIT: Top 3
            const topPicks = filteredResults.slice(0, 3);

            return {
                status: topPicks.length > 0 ? 'success' : 'no_match',
                items: topPicks,
                debug: { intent: analysis.intents, topScore: topPicks[0]?._score }
            };
        }
    }

    // ==========================================
    // 3. PUBLIC API
    // ==========================================
    window.NV_CONCIERGE = {
        brain: null,
        isOpen: false,
        isMuted: false,

        init: function () {
            // 1. Determine Data Source (Admin vs Site)
            let sourceData = window.localCatalog || window.productCatalog;

            if (!sourceData) {
                console.warn("⚠️ Concierge waiting for Product Catalog...");
                return;
            }
            this.brain = new ConciergeBrain(sourceData);
            console.log("🤖 Concierge Engine v2.0 READY. Source:", window.localCatalog ? "Admin (Live)" : "Static (Site)");

            // LOAD UI
            this.loadUI();
        },

        loadUI: function () {
            if (document.getElementById('nv-concierge-widget')) {
                this.bindUIEvents();
                return;
            }

            fetch('/components/concierge-chat.html')
                .then(r => r.text())
                .then(html => {
                    document.body.insertAdjacentHTML('beforeend', html);
                    // Add Neural Voice Badge/Toggle
                    const header = document.querySelector('.concierge-header');
                    if (header) {
                        const muteBtn = document.createElement('span');
                        muteBtn.innerHTML = '🔊';
                        muteBtn.style.cursor = 'pointer';
                        muteBtn.style.fontSize = '1.2rem';
                        muteBtn.style.marginRight = '10px';
                        muteBtn.title = 'Sesi Aç/Kapat';
                        muteBtn.onclick = () => {
                            this.isMuted = !this.isMuted;
                            muteBtn.innerHTML = this.isMuted ? '🔇' : '🔊';
                            if (this.isMuted) window.speechSynthesis.cancel();
                        };
                        header.insertBefore(muteBtn, header.firstChild);
                    }

                    this.bindUIEvents();
                })
                .catch(e => console.error("Concierge UI Load Failed", e));
        },

        bindUIEvents: function () {
            const widget = document.getElementById('nv-concierge-widget');
            if (!widget) return;

            widget.querySelectorAll('[data-concierge-action="toggle"]').forEach((node) => {
                if (node.dataset.conciergeBound === '1') return;
                node.dataset.conciergeBound = '1';
                node.addEventListener('click', () => this.toggle());

                // TELEMETRY: Toggle Open
                if (window.SantisTelemetry && !this.isOpen) { // Only track open
                    node.addEventListener('click', () => {
                        window.SantisTelemetry.pushEvent('concierge_engage', { action: 'open' });
                    }, { once: true });
                }
            });

            const input = document.getElementById('concierge-input');
            if (input && input.dataset.conciergeBound !== '1') {
                input.dataset.conciergeBound = '1';
                input.addEventListener('keydown', (event) => this.handleInput(event));
            }

            const sendBtn = widget.querySelector('[data-concierge-action="send"]');
            if (sendBtn && sendBtn.dataset.conciergeBound !== '1') {
                sendBtn.dataset.conciergeBound = '1';
                sendBtn.addEventListener('click', () => this.send());
            }

            widget.querySelectorAll('[data-concierge-suggest]').forEach((node) => {
                if (node.dataset.conciergeBound === '1') return;
                node.dataset.conciergeBound = '1';
                node.addEventListener('click', () => {
                    const prompt = (node.getAttribute('data-concierge-suggest') || '').trim();
                    if (!prompt) return;
                    const inputEl = document.getElementById('concierge-input');
                    if (inputEl) inputEl.value = prompt;
                    this.send();
                });
            });

            this.bindImageFallbacks(widget);
        },

        bindImageFallbacks: function (scope) {
            if (!scope) return;
            scope.querySelectorAll('img[data-fallback-src]').forEach((img) => {
                if (img.dataset.fallbackBound === '1') return;
                img.dataset.fallbackBound = '1';

                const fallback = img.getAttribute('data-fallback-src');
                if (!fallback) return;

                const applyFallback = () => {
                    if (img.getAttribute('src') !== fallback) img.setAttribute('src', fallback);
                };

                img.addEventListener('error', applyFallback, { once: true });
                if (img.complete && img.naturalWidth === 0) applyFallback();
            });
        },

        toggle: function () {
            this.isOpen = !this.isOpen;
            const widget = document.getElementById('nv-concierge-widget');
            if (widget) widget.classList.toggle('open', this.isOpen);
            if (this.isOpen) {
                const input = document.getElementById('concierge-input');
                if (input) input.focus();
            }
        },

        handleInput: function (e) {
            if (e.key === 'Enter') this.send();
        },

        send: function () {
            const input = document.getElementById('concierge-input');
            const text = input.value.trim();
            if (!text) return;

            // User Message
            this.appendMessage(text, 'user');
            input.value = '';

            // AI Processing
            const response = this.ask(text);

            // Bot Response (Simulate typing delay)
            setTimeout(() => {
                this.renderResponse(response);
            }, 600);
        },

        appendMessage: function (html, type) {
            const container = document.getElementById('concierge-messages');
            if (!container) return;
            const msgDiv = document.createElement('div');
            msgDiv.className = `msg ${type}`;
            msgDiv.innerHTML = `<div class="msg-text">${html}</div>`;
            container.appendChild(msgDiv);
            container.scrollTop = container.scrollHeight;
        },

        renderResponse: function (result) {
            let speakText = "";

            // TELEMETRY: Response Rendered
            if (window.SantisTelemetry && result.status === 'success') {
                window.SantisTelemetry.pushEvent('concierge_success', {
                    top_service: result.items[0]?.name
                });
            }

            if (result.status === 'success') {
                speakText = "Ruhunuzun ihtiyacı olan sessizliği bu ritüellerde buldum.";
                let html = "<div class='concierge-monk-msg'>Sizin için seçtiğim, derinleşmenize aracı olacak ritüeller:</div><br>";
                result.items.forEach(item => {
                    const price = item.price ? (typeof item.price === 'number' ? item.price + ' €' : item.price) : '';
                    let img = item.img || '/assets/img/cards/santis_card_zen.webp';
                    if (!img.includes('/assets/')) img = '/assets/img/cards/' + img;

                    // URL Generation (STATIC V5.5)
                    const lang = (window.SITE_LANG || 'tr').toLowerCase();
                    const cat = (item.categoryId || item.category || '').toLowerCase();
                    let section = 'masajlar'; // Default

                    if (cat.includes('hammam') || cat.includes('hamam')) section = 'hamam';
                    else if (cat.includes('skin') || cat.includes('cilt') || cat.includes('face') || cat.includes('sothys')) section = 'cilt-bakimi';

                    const slug = item.slug || item.id;
                    const detailUrl = slug ? `/${lang}/${section}/${slug}.html` : `/service-detail.html?id=${item.id}`;

                    // NEW: Add Tracking to Cards
                    html += `
                        <a href="${detailUrl}" class="chat-card monk-mode" data-track="concierge_click" data-track-label="${item.name}">
                            <img class="chat-card-img" src="${img}" data-fallback-src="/assets/img/cards/santis_card_zen.webp">
                            <div class="chat-card-info">
                                <span class="chat-card-title">${item.name || item.title}</span>
                                <span class="chat-card-meta">Ritüel • ${item.duration || 'Süre Belirsiz'}</span>
                            </div>
                        </a>
                    `;
                });
                this.appendMessage(html, 'bot');
                this.bindImageFallbacks(document.getElementById('concierge-messages'));
            } else {
                speakText = "Bazen sessizlik en iyi cevaptır. Lütfen hislerinizi tarif edin.";
                this.appendMessage("Zihnimdeki kütüphanede buna tam karşılık bulamadım. <br>Bana 'yorgunum', 'arınmak istiyorum' veya 'sadece susmak' gibi hislerinizden bahseder misiniz?", 'bot');
            }

            // NEURAL VOICE TRIGGER
            this.speak(speakText);
        },

        speak: function (text) {
            // Updated Voice Tone: Slower, deeper pitch
            if (window.SantisVoice) {
                window.SantisVoice.speak(text, { pitch: 0.9, rate: 0.85 });
            }
        },

        ask: function (text) {
            if (!this.brain) this.init();
            if (!this.brain) return { status: 'error', message: "System not ready" };

            return this.brain.findRecommendations(text);
        }
    };

    // Auto-init on Load
    if (window.NV_DATA_READY) {
        window.NV_CONCIERGE.init();
    } else {
        window.addEventListener('nv-data-ready', () => window.NV_CONCIERGE.init());
        // Backup init
        setTimeout(() => { if (!window.NV_CONCIERGE.brain) window.NV_CONCIERGE.init(); }, 1500);
    }

})();
