/**
 * Santis Master OS - Integrated Command Center (The Sovereign View)
 * Version 1.0 - Unites Visual Ingestion, Living Asset Matrix, and Neural Pulse Stream
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- STATE ---
    let pendingFile = null;

    // --- DOM ELEMENTS ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadPanel = document.getElementById('upload-panel');
    const previewImg = document.getElementById('preview-img');
    const btnIngest = document.getElementById('btn-ingest');
    const progressOverlay = document.getElementById('upload-progress');

    const assetMatrix = document.getElementById('asset-matrix');
    const matrixCount = document.getElementById('matrix-count');

    const pulseFeed = document.getElementById('pulse-feed');
    const healthAov = document.getElementById('health-aov');

    const btnSurgeOff = document.getElementById('btn-surge-off');
    const surgeMultiplierInput = document.getElementById('surge-multiplier');

    // DOM Yüklendiğinde stream'i başlat
    // Boot up
    document.addEventListener('DOMContentLoaded', () => {
        fetchFilters();
        fetchAssets();
        initializeNeuralStream(); // Omni-Sentient Matrix Bağlantısını Kur
        initSovereignObserver(); // Ghost Leak Kalkanı
    });

    // DOM'un Görünmez Muhafızı (Sentinel)
    function initSovereignObserver() {
        const matrixContainer = document.getElementById('asset-matrix');
        if (!matrixContainer) return;

        const observer = new MutationObserver((mutations) => {
            let needsRewiring = false;
            for (let mutation of mutations) {
                // Eğer Matrix'e yeni düğümler (kartlar) eklendiyse
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    needsRewiring = true;
                    break;
                }
            }

            if (needsRewiring) {
                // Yeni mermiler düştü, hemen draggable (taşınabilir) yeteneği kazandır
                if (typeof wireMatrixDragSource === 'function') {
                    wireMatrixDragSource();
                }
            }
        });

        // Sadece alt elementlerin (kartların) eklenip silinmesini izle
        observer.observe(matrixContainer, { childList: true, subtree: true });
    }

    // --- FILTER ELEMENTS ---
    const filterSearch = document.getElementById('filter-search');
    const filterCategory = document.getElementById('filter-category');
    const filterSlotGroup = document.getElementById('filter-slot-group');
    const filterReset = document.getElementById('filter-reset');
    let searchTimeout;

    // --- FLOATING TABS LOGIC ---
    const tabBtns = document.querySelectorAll('.cc-tab-btn');
    const tabPill = document.getElementById('active-tab-pill');
    if (tabBtns.length > 0 && tabPill) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update hidden select to maintain backend compatibility
                if (filterCategory) {
                    filterCategory.value = btn.dataset.val;
                    filterCategory.dispatchEvent(new Event('change'));
                }

                // Switch Text Colors
                tabBtns.forEach(b => {
                    b.classList.remove('text-santis-gold');
                    b.classList.add('text-gray-500');
                    b.classList.add('hover:text-gray-300');
                });
                btn.classList.add('text-santis-gold');
                btn.classList.remove('text-gray-500');
                btn.classList.remove('hover:text-gray-300');

                // Animate Floating Pill
                tabPill.style.width = btn.offsetWidth + 'px';
                tabPill.style.transform = `translateX(${btn.offsetLeft}px)`;
            });

            // Phase 18: Magnetic Intent Engine (Apple-tier UX)
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                // Pull constraint (max 4px translation)
                const pullX = x * 0.15;
                const pullY = y * 0.25;

                btn.style.transform = `translate(${pullX}px, ${pullY}px) scale(1.05)`;
                btn.style.transition = 'transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0px, 0px) scale(1)';
                btn.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
            });
        });

        // Ensure default pill position is exact on load
        setTimeout(() => {
            const defaultBtn = document.querySelector('.cc-tab-btn[data-val=""]');
            if (defaultBtn) {
                tabPill.style.width = defaultBtn.offsetWidth + 'px';
                tabPill.style.transform = `translateX(${defaultBtn.offsetLeft}px)`;
            }
        }, 100);
    }

    // --- FILTER EVENT LISTENERS ---
    // ─── AbortController for filter debounce (FIX 5) ────────────────────────────
    let _fetchAbortController = null;

    if (filterSearch) {
        filterSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => fetchAssets(), 500); // 300→500ms
        });
    }
    if (filterCategory) filterCategory.addEventListener('change', () => fetchAssets());
    if (filterSlotGroup) filterSlotGroup.addEventListener('change', () => fetchAssets());
    if (filterReset) filterReset.addEventListener('click', () => {
        if (filterSearch) filterSearch.value = '';
        if (filterCategory) filterCategory.value = '';
        if (filterSlotGroup) filterSlotGroup.value = '';

        if (tabBtns.length > 0) {
            tabBtns[0].click(); // Reset Floating Tabs
        } else {
            fetchAssets();
        }
    });

    // ==========================================
    // 0. DYNAMIC FILTERS INITIALIZATION (Phase 6 / Sovereign view)
    // ==========================================
    async function fetchFilters() {
        try {
            const res = await fetch('/api/v1/media/filters');
            if (!res.ok) return;
            const data = await res.json();

            const mapCategory = document.getElementById('map-category');
            const mapSlot = document.getElementById('map-slot');

            if (data.categories && data.categories.length > 0) {
                // Phase 15 CMS Overhaul: Removed malicious override of the filter UI.
                // We keep the mapCategory (for uploads) but leave the filterCategory locked to the 4 canonical HTML slots.
                // const catOpts = `<option value="all">All Categories</option>` + data.categories.map(c => `<option value="${c}">${c}</option>`).join('');
                // if (filterCategory) filterCategory.innerHTML = catOpts;
                if (mapCategory) mapCategory.innerHTML = data.categories.map(c => `<option value="${c}">${c}</option>`).join('');
            }

            if (data.slots && data.slots.length > 0) {
                const mapSlotName = (s) => (s && s.name) ? s.name : s;
                const mapSlotRoute = (s) => (s && s.page_route) ? ` - ${s.page_route}` : '';

                // Phase 22.1 CMS Overhaul: Locked down the top Matrix Filter UI (`filterSlotGroup`).
                // We leave it static and canonical to preserve the Master's <optgroup> readable layout.
                // const slotOpts = `<option value="">All Slots</option>` + data.slots.map(s => `<option value="${mapSlotName(s)}">${mapSlotName(s)}${mapSlotRoute(s)}</option>`).join('');
                // if (filterSlotGroup) filterSlotGroup.innerHTML = slotOpts;

                // Removed malicious overwrite of mapSlot (Target Slot UI Dropdown)
                // Let it remain static and canonical per command-center.html
            }
        } catch (e) {
            console.warn("Failed to fetch dynamic filters", e);
        }
    }

    // ==========================================
    // 1. VISUAL INGESTION UNIT (Drag & Drop)
    // ==========================================

    // Click to browse
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-active'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-active'), false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    // Handle browsed files
    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length === 0) return;
        const file = files[0];

        if (!file.type.startsWith('image/')) {
            alert('Lütfen sadece görsel yükleyin (WEBP, JPG, PNG).');
            return;
        }

        pendingFile = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            uploadPanel.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    window.cancelUpload = function () {
        pendingFile = null;
        fileInput.value = '';
        uploadPanel.classList.add('hidden');
        previewImg.src = '';
    };

    window.executeIngestion = async function () {
        if (!pendingFile) return;

        const category = document.getElementById('map-category')?.value || 'diger';
        const serviceIdRaw = document.getElementById('map-service-id');
        const serviceId = serviceIdRaw ? serviceIdRaw.value.trim() : '';
        const captionRaw = document.getElementById('map-caption');
        const caption = captionRaw ? captionRaw.value.trim() : '';
        const slotRaw = document.getElementById('map-slot');
        const slot = slotRaw ? slotRaw.value : '';

        const formData = new FormData();
        formData.append('file', pendingFile);
        formData.append('category', category);
        if (serviceId) formData.append('linked_service_id', serviceId);
        if (slot) formData.append('slot', slot);
        if (caption) formData.append('caption_tr', caption);

        // UI Loading State (SADECE ONAY İÇİN)
        btnIngest.disabled = true;
        progressOverlay.classList.remove('hidden');

        try {
            const response = await fetch('/api/v1/media/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === "SCANNING") {
                    if (typeof pushPulseSignal === 'function') {
                        pushPulseSignal("DNA LAB 🧬", `Görev alındı: Ajan ${data.asset_id.substring(0, 8)} laboratuvarda.`, "text-blue-400 font-bold");
                    }
                    if (typeof injectScanningGhostCard === 'function') {
                        injectScanningGhostCard(data.asset_id, pendingFile, category);
                    }
                    // Ajan ID'sini kasaya ekle
                    window.SovereignPendingVault.add(data.asset_id);
                }

                cancelUpload();
                // OMNI-INJECTION: Artık fetchAssets() YAPMIYORUZ! SSE dinleyecek.

                // Phase 8.7: Refresh Live Mirror (Optional, can wait for SSE too)
                try { document.getElementById('live-mirror').contentWindow.location.reload(); } catch (e) { }
            } else {
                const err = await response.json();
                pushPulseSignal("ERROR", `Ingest failed: ${err.detail || 'Unknown server error'}`, "text-red-500");
            }
        } catch (e) {
            console.error("Upload error:", e);
            pushPulseSignal("ERROR", "Connection to Image Factory failed.", "text-red-500");
        } finally {
            btnIngest.disabled = false;
            progressOverlay.classList.add('hidden');
        }
    };


    // ==========================================
    // OMNI-SENTIENT MATRIX PROTOCOL (SSE Pulse)
    // ==========================================
    window.neuralStream = null;
    window.SovereignPendingVault = new Set();

    window.initializeNeuralStream = function () {
        if (window.neuralStream) return;

        window.neuralStream = new EventSource('/api/v1/media/pulse'); // Backend URL

        window.neuralStream.onopen = () => {
            console.log("⚡ [Neural Pulse] SSE Hattı Aktif. İstihbarat dinleniyor...");
        };

        // Backend'den DNA_EXTRACTED eventi gelirse
        window.neuralStream.addEventListener('DNA_EXTRACTED', (event) => {
            const data = JSON.parse(event.data);
            console.log(`🧬 [DNA LAB] Ajan hazır! SAS: ${data.sas_score}`, data);

            // İşlem bitti, ajanı bekleyenler kasasından sil
            window.SovereignPendingVault.delete(data.id);

            // Matrix'teki geçici 'SCANNING' kartını bul
            const ghostCard = document.querySelector(`[data-asset-id="${data.id}"]`);

            if (ghostCard) {
                // FAZ 1: Altın Takla (Görünmez yap)
                ghostCard.style.transform = "rotateY(90deg)";
                ghostCard.style.transition = "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)";

                setTimeout(() => {
                    // Pulse Bildirimi
                    if (typeof pushPulseSignal === 'function') {
                        pushPulseSignal("DNA LAB 🧬", `Ajan ${data.id.substring(0, 8)} Matrix'e uyandı! SAS: ${data.sas_score}`, "text-santis-gold font-bold");
                    }

                    // Grid'i güncel verilerle arka planda yenile
                    // Aslında sadece o kartın HTML'ini dönüştürebiliriz ama şimdilik güvenli yol: fetchAssets
                    // Gerçek Omni-Injection single-DOM update gerektirir:
                    fetchAssets().then(() => {
                        setTimeout(() => {
                            const newCard = document.querySelector(`[data-asset-id="${data.id}"]`);
                            if (newCard) {
                                newCard.style.transform = "rotateY(90deg)";
                                newCard.style.transition = "none";
                                void newCard.offsetWidth; // Force reflow
                                newCard.style.transition = "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
                                newCard.style.transform = "rotateY(0deg)";
                                // Altın parlama
                                newCard.classList.add('shadow-[0_0_30px_rgba(212,175,55,0.8)]', 'border-santis-gold');
                                setTimeout(() => {
                                    newCard.classList.remove('shadow-[0_0_30px_rgba(212,175,55,0.8)]', 'border-santis-gold');
                                }, 1500);
                            }
                        }, 50);
                    });

                }, 400); // 90 derece dönüş beklemesi
            } else {
                // SENARYO B: Master başka sekmede. Sessiz İnfaz (Silent Refresh)
                console.log(`🛡️ [GHOST LEAK SEALED] Ajan ${data.id} laboratuvardan çıktı. Sekme senkronize ediliyor...`);

                if (typeof pushPulseSignal === 'function') {
                    pushPulseSignal("DNA LAB 🧬", `Arka plan analizi tamamlandı: ${data.id.substring(0, 8)}`, "text-emerald-400 font-bold");
                }

                // DOM'da kart yok, o zaman mevcut filtreleri bozmadan Matrix'i otonom yenile
                if (typeof fetchAssets === 'function') fetchAssets();
                if (window.initGodMode) window.initGodMode(true);
            }
        });

        // 🚨 OMEGA DIRECTIVE: GÖZLERİ AÇ! (TELEMETRY SHIELD & LIVE HEATMAP)
        const handlePulse = (event) => {
            const data = JSON.parse(event.data);

            // Eğer matrix hazırsa veriyi render motoruna yönlendir
            if (window.SantisMatrix) {
                // Ensure event.type is passed down for visual logic inside SantisMatrix if needed
                data.event = event.type;
                window.SantisMatrix.visualizeTelemetry(data);
            }

            // Pulse Console'una Düşür
            if (typeof pushPulseSignal === 'function') {
                if (data.is_whale) {
                    pushPulseSignal("WHALE 🐋", `Hayalet VIP Tespit Edildi! Kararsızlık: ${data.hesitation_events[0]?.hesitation_ms || 'N/A'}ms`, "text-red-500 font-bold");
                } else {
                    pushPulseSignal("TELEMETRY 👁️", "Ziyaretçi Matriste Geziyor...", "text-blue-400");
                }
            }
        };

        window.neuralStream.addEventListener('TELEMETRY_PULSE', handlePulse);
        window.neuralStream.addEventListener('WHALE_ALERT', handlePulse);
    }

    // Ghost kartı yaratan yardımcı fonksiyon
    window.injectScanningGhostCard = function (asset_id, file, category) {
        const previewUrl = URL.createObjectURL(file);
        const cardHtml = `
            <div data-asset-id="${asset_id}" style="view-transition-name: asset-${asset_id};" class="matrix-card relative w-full h-full min-h-[150px] bg-black/40 backdrop-blur-md rounded-xl border border-blue-500/50 overflow-hidden flex flex-col group transition-all duration-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] col-span-1 row-span-1">
                <img src="${previewUrl}" class="w-full h-full object-cover opacity-20 grayscale blur-[3px]" />
                
                <!-- Siberpunk Tarama Lazer Efekti -->
                <div class="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent h-20 w-full animate-[scan_2s_ease-in-out_infinite]" style="animation: scan 2s linear infinite;">
                    <style>@keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(300%); } }</style>
                </div>
                
                <div class="absolute inset-0 flex flex-col items-center justify-center text-center bg-black/60 backdrop-blur-[2px]">
                    <span class="text-blue-400 text-[12px] font-mono font-bold animate-pulse tracking-widest drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">SCANNING 🧬</span>
                    <span class="text-blue-200/50 text-[8px] font-mono mt-2 uppercase tracking-tight">Neural Tagging Process</span>
                    <span class="text-gray-500 text-[7px] font-mono mt-1 uppercase">[${category}]</span>
                </div>
            </div>
        `;

        const matrix = document.getElementById('asset-matrix');
        const matrixCount = document.getElementById('matrix-count');
        if (matrix) {
            // Placeholder'ı sil
            if (matrix.innerHTML.includes("Awaiting first")) matrix.innerHTML = '';

            const div = document.createElement('div');
            div.innerHTML = cardHtml.trim();
            // Başa ekle
            matrix.insertBefore(div.firstChild, matrix.firstChild);

            // Sayacı geçici artır
            if (matrixCount) matrixCount.textContent = parseInt(matrixCount.textContent || 0) + 1;
        }
    };

    // ─── PHASE 45.1: THE GENESIS UI (MATRIX DROP) ──────────────────────────────────
    window.triggerMatrixDropGenesis = function (asset, mrrLift) {
        // 1. Kognitif Nabzı (Pulse Spike ECharts) Tavana Fırlat
        if (window.SovereignCharts) {
            window.SovereignCharts.triggerPulseSpike(mrrLift || 4500);
        }

        // 2. DOM Mutasyonu: Otonom Ajanı (DALL-E 3) Matrix'e Altýn Mühürle İndir (SSE Queue üzerinden)
        if (window.SantisMatrix) {
            window.SantisMatrix.injectGenesisCard(asset);
        } else {
            console.warn("Matrix Engine not loaded yet, falling back to fetchAssets");
            fetchAssets();
        }

        const matrixCount = document.getElementById('matrix-count');
        if (matrixCount) matrixCount.textContent = parseInt(matrixCount.textContent || 0) + 1;
    };


    // ==========================================
    // 2. THE LIVING ASSET MATRIX
    // ==========================================

    window.fetchAssets = async function () {
        try {
            const params = new URLSearchParams({ lang: 'tr' });
            const search = filterSearch ? filterSearch.value.trim() : '';
            const category = filterCategory ? filterCategory.value : '';
            const slotGroup = filterSlotGroup ? filterSlotGroup.value : '';

            if (search) params.set('search', search);
            if (category) params.set('category', category);
            if (slotGroup) params.set('slot', slotGroup);

            const res = await fetch(`/api/v1/media/assets?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch assets');

            const data = await res.json();
            window.currentAssetMatrix = data.assets; // Cache for Asset Director
            renderMatrix(data.assets);

        } catch (error) {
            console.error('Matrix fetch error:', error);
            assetMatrix.innerHTML = `<div class="col-span-full text-center py-10 text-red-500 font-mono text-xs">Error loading matrix. Check API connection.</div>`;
        }
    };

    function renderGhostImage(asset) {
        let url = asset.cdn_url || asset.url || '';
        if (url && !url.startsWith('/') && !url.startsWith('http')) {
            url = '/' + url; // root-relative path zorla (Sovereign Fix)
        }

        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        // Ensure default backfill
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 32, 32);

        // Fallback or actual Blurhash decode
        if (typeof blurhash !== 'undefined' && asset.blurhash && asset.blurhash.length >= 6) {
            try {
                const pixels = blurhash.decode(asset.blurhash, 32, 32);
                const imageData = ctx.createImageData(32, 32);
                imageData.data.set(pixels);
                ctx.putImageData(imageData, 0, 0);
            } catch (e) { console.warn("Blurhash Decode fail:", e); }
        }

        // Cache-busting & Security Check (Resilience Core)
        const safeUrl = url.includes('?') ? `${url}&v=Sovereign_1` : `${url}?v=Sovereign_1`;

        // Fluid Aspect Ratio (Void Engine Setup)
        const ratioStr = asset.heightRatio ? (asset.heightRatio * 100) + '%' : '56.25%';

        return `
            <div class="void-skeleton relative w-full shrink-0 bg-[#0a0a0a]" style="padding-bottom: ${ratioStr};">
                <img src="${canvas.toDataURL()}" class="absolute inset-0 w-full h-full object-cover blur-sm opacity-50 z-0" />
                <img data-src="${safeUrl}" crossorigin="anonymous" decoding="async" onload="this.style.opacity=1" class="void-target absolute inset-0 w-full h-full object-cover opacity-0 group-hover:scale-105 transition-all duration-700 z-10" />
                <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-none"></div>
                ${asset.blurhash ? `<div class="absolute bottom-2 right-2 bg-black/60 rounded px-1.5 py-0.5 text-[8px] text-gray-500 font-mono tracking-widest uppercase border border-gray-800 z-30" title="Blurhash">DNA: ${asset.blurhash.substring(0, 8)}</div>` : ''}
            </div>
        `;
    }

    function renderMatrix(assets) {
        // Fallback or Native View Transition
        if (!document.startViewTransition) {
            updateDOM(assets);
        } else {
            document.startViewTransition(() => {
                updateDOM(assets);
            });
        }
    }

    window.renderMatrixCardHTML = function (asset) {
        // Determine active glows based on backend flags
        let glowClass = "";
        let badgeHtml = "";

        if (asset.surge_glow) {
            glowClass = "gold-glow";
            badgeHtml = `<div class="absolute top-2 left-2 bg-santis-gold text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow shadow-santis-gold/50 tracking-widest uppercase">SURGE ${asset.live_multiplier ? asset.live_multiplier.toFixed(2) : '1.00'}x</div>`;
        } else if (asset.is_critical_stock) {
            glowClass = "critical-glow";
            badgeHtml = `<div class="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow shadow-red-600/50 tracking-widest uppercase animate-pulse">CRITICAL STOCK</div>`;
        }

        const slotBadge = asset.slot
            ? `<div class="absolute top-2 left-2 bg-santis-gold/90 text-black text-[8px] font-bold px-1.5 py-0.5 rounded font-mono tracking-wider uppercase z-10 shadow-lg max-w-[90%] truncate" title="${asset.slot}">${asset.slot}</div>`
            : '';

        const intel = asset.intelligence || { sas_score: 0.5, focus: { x: 0.5, y: 0.5 }, mood: 'Unknown', persona: 'Unknown' };

        // ─── PHASE 27: ROI LIFT CALCULATOR ───────────────────────────
        const _slotWeight = asset.slot && asset.slot.toLowerCase().includes('hero') ? 1.45
            : asset.slot && asset.slot.toLowerCase().includes('card') ? 1.18 : 1.05;
        const _cat = (asset.category || 'diger').toLowerCase();
        const _catBase = { hamam: 0.92, masaj: 0.88, cilt: 0.85, havuz: 0.82, diger: 0.72 }[_cat] || 0.75;
        const _mo = new Date().getMonth() + 1;
        const _seasonIdx = [3, 4].includes(_mo) ? 1.22 : [12, 1].includes(_mo) ? 1.18 : [6, 7, 8].includes(_mo) ? 1.10 : 1.0;
        const _persona = (intel.persona || '').toLowerCase();
        const _personaMult = _persona === 'whale' ? 1.32 : _persona.includes('devotee') ? 1.18 : 1.05;
        const roiLift = ((intel.sas_score || 0.5) * _slotWeight * _catBase * _seasonIdx * _personaMult * 580).toFixed(0);
        const roiColor = roiLift >= 400 ? 'text-santis-gold' : roiLift >= 250 ? 'text-emerald-400' : 'text-gray-400';
        const roiBadgeHtml = `<div class="absolute bottom-[48px] left-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                <div class="flex items-center gap-1 bg-black/80 backdrop-blur-md border border-santis-gold/30 rounded px-2 py-1 shadow-[0_0_12px_rgba(212,175,55,0.3)]">
                    <span class="text-santis-gold text-[8px] font-mono tracking-wider uppercase opacity-70">Est. Lift</span>
                    <span class="sas-live-badge ${roiColor} text-[11px] font-bold font-mono tracking-tight animate-pulse">+€${roiLift}/mo</span>
                </div>
            </div>`;
        // ─────────────────────────────────────────────────────────────

        let assetUrl = asset.cdn_url || asset.url || '';
        if (assetUrl && !assetUrl.startsWith('/') && !assetUrl.startsWith('http')) {
            assetUrl = '/' + assetUrl;
        }

        // Phase 52: Sovereign Matrix Engine (Whale Logic)
        const isWhale = (intel.sas_score || 0.5) > 0.90;
        const whaleClass = isWhale ? "whale-node" : "";

        return `
                <div data-asset-id="${asset.id}" style="view-transition-name: asset-${asset.id};" class="matrix-asset-card ${whaleClass} relative w-full h-full cursor-grab active:cursor-grabbing group ${glowClass}">
                    ${badgeHtml}
                    ${slotBadge}
                    ${roiBadgeHtml}

                    <!-- Deleting Button -->
                <button onclick="deleteAsset('${asset.id}')" class="absolute top-2 right-2 bg-black/80 hover:bg-red-600 text-gray-400 hover:text-white rounded px-2 py-0.5 text-xs z-30 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md border border-gray-700 hover:border-red-500 shadow-xl" title="Purge Asset">×</button>
                
                <!-- Phase 30: Sovereign Commerce Insight Button -->
                <button onclick="analyzeCommerce('${asset.id}', ${intel.sas_score || 0.5})" class="absolute top-10 right-2 bg-black/80 hover:bg-santis-gold text-santis-gold hover:text-black rounded px-2 py-0.5 text-xs z-30 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md border border-santis-gold/50 shadow-[0_0_10px_rgba(212,175,55,0.2)] font-mono flex items-center gap-1" title="Get Commerce Insight">
                    <span>🛍️</span> Sell
                </button>

                <!-- Base Image Viewer & Action Link -->
                <a href="${assetUrl}" target="_blank" class="block overflow-hidden relative flex-grow cursor-pointer group/link">
                        ${renderGhostImage(asset)}
                        
                        <!-- Neural Radar Hover Layer (Phase 17) -->
                        <div class="absolute inset-0 bg-black/20 backdrop-blur-[2px] opacity-0 group-hover/link:opacity-100 transition-opacity duration-500 z-10 pointer-events-none">
                            <!-- Focus Ring -->
                            <div class="absolute w-12 h-12 border border-santis-gold/80 rounded-full animate-ping opacity-50 pointer-events-none" style="left: calc(${(intel.focus || { x: 0.5 }).x * 100}% - 24px); top: calc(${(intel.focus || { y: 0.5 }).y * 100}% - 24px);"></div>
                            <div class="absolute w-2 h-2 bg-santis-gold rounded-full shadow-[0_0_10px_rgba(212,175,55,1)] pointer-events-none" style="left: calc(${(intel.focus || { x: 0.5 }).x * 100}% - 4px); top: calc(${(intel.focus || { y: 0.5 }).y * 100}% - 4px);"></div>
                        </div>

                        <!-- Sovereign View Source Overlay (v2.0) -->
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover/link:opacity-100 transition-opacity backdrop-blur-sm flex items-center justify-center z-10 flex-col gap-2">
                            <span class="text-white font-mono text-[10px] border border-white/20 px-4 py-1.5 rounded-full bg-white/10 tracking-widest uppercase shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                OPEN SOVEREIGN ASSET ↗
                            </span>
                            <span class="text-[9px] text-santis-gold uppercase tracking-tighter">Click to expand source</span>
                        </div>
                    </a>

                    <!--Phase 17.1: Neural Intelligence Overlay(HUD)-->
                    <div class="absolute top-4 right-4 bg-black/80 backdrop-blur-[12px] border ${intel.sas_score > 0.85 ? 'border-santis-gold' : 'border-gray-700'} rounded p-2.5 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-none min-w-[120px]">
                        
                        <div class="flex justify-between items-center border-b ${intel.sas_score > 0.85 ? 'border-santis-gold/50' : 'border-gray-700'} pb-1.5 mb-2">
                            <span class="text-[7px] ${intel.sas_score > 0.85 ? 'text-santis-gold' : 'text-gray-400'} font-bold font-mono tracking-widest uppercase flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full ${intel.sas_score > 0.85 ? 'bg-santis-gold animate-pulse shadow-[0_0_5px_#D4AF37]' : 'bg-gray-500'}"></span>
                                NEURAL HUD
                            </span>
                            <span class="text-[9px] font-mono text-white ml-2">${(intel.sas_score || 0.5).toFixed(2)}</span>
                        </div>
                        
                        <!-- Mood & Persona Mapping -->
                        <div class="flex flex-col gap-1.5 font-mono text-[8px] mb-2">
                            <div class="flex items-center gap-2">
                                <span class="text-gray-500 w-10">MOOD:</span>
                                <span class="text-white flex items-center gap-1 uppercase truncate" title="${intel.mood || 'Unknown'}">
                                    ${(intel.mood || 'Unknown').toLowerCase().includes('warm') || (intel.mood || 'Unknown').toLowerCase().includes('cinematic') ? '🔥' : '💧'} ${(intel.mood || 'Unknown').substring(0, 10)}
                                </span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-gray-500 w-10">TARGET:</span>
                                <span class="text-blue-300 flex items-center gap-1 uppercase truncate" title="${intel.persona || 'Unknown'}">
                                    ${(intel.persona || 'Unknown').toLowerCase() === 'whale' ? '🐋' : '👤'} ${(intel.persona || 'Unknown').substring(0, 10)}
                                </span>
                            </div>
                        </div>

                        <!-- Engagement Pulse -->
                        ${(() => {
                const engScore = (((intel.sas_score || 0.5) * 0.8) + (((parseInt(asset.id.slice(0, 4), 16) || 1) % 100) / 100) * 0.2);
                const ranking = ((intel.sas_score || 0.5) * 0.6) + (engScore * 0.4);
                const engColor = ranking > 0.8 ? 'bg-emerald-400' : ranking > 0.6 ? 'bg-santis-gold' : 'bg-gray-500';

                return `
                            <div class="mt-1.5 pt-1.5 border-t border-gray-800">
                                <div class="flex justify-between text-[7px] text-gray-500 mb-1">
                                    <span>24H PULSE</span>
                                    <span>${(ranking * 100).toFixed(1)}%</span>
                                </div>
                                <div class="w-full bg-gray-900 rounded-full h-1 overflow-hidden">
                                    <div class="${engColor} h-1 rounded-full" style="width: ${ranking * 100}%"></div>
                                </div>
                            </div>
                            `;
            })()}
                    </div>
                    
                    <!--Cinematic Hover - Reveal Info Glass-->
                    <div class="absolute inset-x-0 bottom-[44px] bg-gradient-to-t from-black via-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 pt-12 flex flex-col justify-end text-[10px] font-mono text-gray-300 z-20 pointer-events-none">
                        <span class="text-[10px] font-bold text-santis-gold uppercase block truncate mb-0.5" style="font-family:'Space Grotesk',sans-serif">${asset.category}</span>
                        <span class="truncate block w-full text-white font-medium" title="${asset.filename}">${asset.filename}</span>
                    </div>

                    <!--Sovereign Bottom Control Bar-->
<div class="p-2.5 bg-black/90 backdrop-blur-xl flex justify-between items-center border-t border-gray-800 relative z-30 shrink-0 h-[44px]">
    <div class="flex gap-2 items-center">
        <button onclick="copyToClipboard('${assetUrl}')" class="text-gray-500 hover:text-santis-gold transition-colors flex items-center group/btn" title="Copy Edge URL">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
        </button>
        <button onclick="downloadAsset('${assetUrl}', '${asset.filename}')" class="text-gray-500 hover:text-white transition-colors flex items-center group/btn" title="Download Asset">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        </button>
    </div>

    <div class="flex items-center gap-2 mx-auto">
        ${asset.linked_service_id ? `<span class="text-[8px] font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-900/40 px-1.5 py-0.5 rounded cursor-help shadow-[0_0_5px_rgba(52,211,153,0.2)] flex items-center gap-1" title="Service: ${asset.linked_service_id}"><span>🔗</span> BOUND</span>` : ''}
        <span class="text-[10px] font-bold text-santis-gold uppercase tracking-widest">SAS: ${(intel.sas_score || 0.5).toFixed(2)}</span>
    </div>

    <button onclick="openAssetDirector('${asset.id}')" class="text-gray-500 hover:text-white transition-colors flex items-center gap-1.5 group/btn" title="Edit Asset Meta">
        <span class="text-[9px] font-mono uppercase opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap hidden sm:inline-block">Configure</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
    </button>
</div>
                </div>
    `;
    };

    function updateDOM(assets) {
        if (!assets || assets.length === 0) {
            matrixCount.textContent = "0";
            assetMatrix.innerHTML = `<div class="col-span-full text-center py-10 text-gray-600 font-mono text-xs">Awaiting first visual ingestion...</div>`;
            return;
        }

        matrixCount.textContent = assets.length;
        assetMatrix.innerHTML = ''; // clear

        // DOM string birleştirme (Kuantum Matrix motoruna basmadan önce)
        let htmlBuffer = '';
        assets.forEach(asset => {
            htmlBuffer += window.renderMatrixCardHTML(asset);
        });

        assetMatrix.innerHTML = htmlBuffer;

        // --- INITIATE THE OMEGA CORE ---
        // Sayfadaki assetMatrix div'ini temizleyip yeni img'ler koyduğumuz için Matrix Engine'i başlat
        if (!window.SantisMatrix) {
            window.SantisMatrix = new window.SovereignMatrix('asset-matrix', { gap: 20, minColWidth: 320 });

            // 🚨 THE OMEGA DIRECTIVE: GÖZLERİ AÇ!
            window.SantisMatrix.activateTelemetry();
        }
        window.SantisMatrix.ingestDOMNodes();
    }

    window.deleteAsset = async function (assetId) {
        if (!confirm('Are you sure you want to delete this asset? This cannot be undone.')) return;

        try {
            const res = await fetch('/api/v1/media/assets/' + assetId, { method: 'DELETE' });
            if (res.ok) {
                pushPulseSignal('SYSTEM', 'Asset purged from Sovereign View.', 'text-gray-400');
                if (window.SantisMatrix) {
                    window.SantisMatrix.purgeCard(assetId);
                } else {
                    fetchAssets();
                }
            } else {
                pushPulseSignal('ERROR', 'Failed to purge asset.', 'text-red-500');
            }
        } catch (e) {
            console.error('Delete error', e);
        }
    };


    // ==========================================
    // 3. NEURAL PULSE STREAM DISPLAY
    // ==========================================

    window.pushPulseSignal = function (tag, message, colorClass = "text-gray-400") {
        const ph = pulseFeed.querySelector('.animate-pulse');
        if (ph && ph.textContent.includes('Listening')) ph.remove();

        const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
        const row = document.createElement('div');
        row.className = `pulse - entry pl - 2 border - l border - gray - 800`;

        row.innerHTML = `
< span class= "text-gray-600 block mb-0.5 text-[8px]" > [${ts}] ${tag}</span >
<span class="${colorClass}">${message}</span>
        `;

        pulseFeed.appendChild(row);
        pulseFeed.scrollTop = pulseFeed.scrollHeight;

        if (pulseFeed.children.length > 50) {
            pulseFeed.removeChild(pulseFeed.firstChild);
        }
    };

    // Tiny background job for the health panel simulation
    async function updateAOVHealth() {
        // console.warn("[AOV Health] Offline Mode Mock - Muting 404");
        return; // Disable real fetch to prevent 404s
        try {
            const res = await window.SantisCore.apiFetch('/api/v1/analytics/metrics');
            const data = await res.json();
            if (data && data.today_revenue) {
                // Mocking AOV Health for now as conversions are not fully populated in MVP
                healthAov.textContent = `+€${parseFloat(data.today_revenue * 0.15).toFixed(2)}`;
            }
        } catch (e) { }
    }

    // ==========================================
    // 4. AI REVENUE BRAIN WIDGET
    // ==========================================
    async function updateAIBrain() {
        // console.warn("[AI Brain] Offline Mode Mock - Muting 404");
        return; // Disable real fetch to prevent 404s
        try {
            const res = await fetch('/api/v1/ai/forecast');
            if (!res.ok) return;
            const d = await res.json();

            const recEl = document.getElementById('ai-recommendation');
            const colors = { SURGE: 'text-santis-gold font-bold', DISCOUNT: 'text-blue-400', HOLD: 'text-emerald-400' };
            const icons = { SURGE: '🔥', DISCOUNT: '💎', HOLD: '🟢' };
            recEl.className = colors[d.ai_recommendation] || 'text-gray-400';
            recEl.textContent = `${icons[d.ai_recommendation] || ''} ${d.ai_recommendation} `;

            document.getElementById('ai-forecast').textContent = `~${d.forecast_tomorrow} bookings`;
            document.getElementById('ai-occupancy').textContent = `${d.forecast_occupancy_pct}% `;
            document.getElementById('ai-velocity').textContent = d.revenue_velocity;
            document.getElementById('ai-today-rev').textContent = `€${d.today_revenue.toFixed(2)} `;
        } catch (e) { }
    }

    // ==========================================
    // 5. SHADOW MODE LOG & DECISION ENGINE
    // ==========================================
    async function updateShadowLog() {
        // console.warn("[Shadow Log] Offline Mode Mock - Muting 404");
        return;
        try {
            const res = await fetch('/api/v1/ai/shadow-log');
            if (!res.ok) return;
            const d = await res.json();

            const feedBox = document.getElementById('shadow-log-feed');
            const logs = d.decisions || d.logs || [];
            if (!feedBox || logs.length === 0) return;

            feedBox.innerHTML = '';
            let totalLift = 0;

            logs.forEach(log => {
                const isAuto = log.was_autonomous === 1;
                const lift = parseFloat(log.lift_estimate || 0);
                totalLift += lift;

                const ruleColor = log.rule_decision === 'SURGE' ? 'text-santis-gold font-bold' :
                    log.rule_decision === 'FLASH_OFFER' ? 'text-blue-400 font-bold' : 'text-emerald-400';

                const statusBadge = isAuto
                    ? `< span class="text-[7px] bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded font-bold" >⚡ AUTO</span > `
                    : `< span class="text-[7px] text-gray-700" > SHADOW</span > `;

                const timeStr = (log.created_at || '').split('T')[1]?.substring(0, 8) || '—';

                const logItemHTML = `
    < div class="flex justify-between items-center text-[8px] text-gray-500" >
        <span>[${timeStr}] EVT-${String(log.event_id || '').substring(0, 6).toUpperCase()}</span>
                        ${statusBadge}
                    </div >
    <div class="flex justify-between items-center bg-gray-900/40 px-2 py-1 rounded">
        <div class="flex flex-col">
            <span class="text-[7px] text-gray-600">AI PROPOSED</span>
            <span class="text-gray-400">${log.ai_recommendation}</span>
        </div>
        <div class="text-gray-600 text-[9px]">⚖️</div>
        <div class="flex flex-col text-right">
            <span class="text-[7px] text-santis-gold">SOVEREIGN RULE</span>
            <span class="${ruleColor}">${log.rule_decision}</span>
        </div>
    </div>
                    ${lift > 0 ? `<div class="text-right text-[8px] text-yellow-500/70">+€${lift.toFixed(0)} lift potential</div>` : ''}
`;

                // PHASE 19.5: Emit Custom Event for Vue Command Center Reactivity instead of DOM append
                window.dispatchEvent(new CustomEvent('santis:shadow-log', {
                    detail: {
                        id: Math.random().toString(),
                        html: logItemHTML,
                        isAuto: isAuto
                    }
                }));
            });

            // Update the Revenue Lift counter in the AI Brain widget
            const liftEl = document.getElementById('revenue-lift-counter');
            if (liftEl) liftEl.textContent = `+€${totalLift.toFixed(0)} `;

        } catch (e) {
            console.error("Shadow Log Sync Error:", e);
        }
    }

    // ==========================================
    // 6. SOVEREIGN TELEMETRY & GROWTH ENGINE
    // ==========================================
    async function updateSovereignTelemetry() {
        try {
            // Gerçek bir backend ucu olana kadar mock veriler veya API çağrısı
            let d;
            /* ASIL FETCH KODUNU YORUMA AL (BACKEND HAZIR OLANA DEK)
            try {
                const res = await fetch('/api/v1/ai/telemetry-stats');
                if (res.ok) d = await res.json();
                else throw new Error('API Sync Failed');
            } catch (e) {
            */
            // Mock State (until Python endpoint matches Phase 1 Telemetry Data Vault)
            const baseScore = Math.floor(Math.random() * (150 - 70 + 1)) + 70; // 70-150 arası rastgele
            d = {
                ghost_score: baseScore,
                score_trend: Math.random() > 0.3 ? 'up' : 'down',
                win_rate: 14.2 + (Math.random() * 2),
                conversions: 34,
                personas: {
                    recovery: Math.floor(Math.random() * 5) + 12,
                    sovereign: Math.floor(Math.random() * 2) + 4,
                    explorer: Math.floor(Math.random() * 8) + 18
                },
                sync_status: 'BEACON SYNC'
            };

            const el = (id) => document.getElementById(id);

            // Live Ghost Score
            if (el('tel-ghost-score')) {
                const arrow = d.score_trend === 'up' ? '<span class="text-[8px] text-emerald-500">▲</span>' : '<span class="text-[8px] text-red-500">▼</span>';
                el('tel-ghost-score').innerHTML = `${d.ghost_score} ${arrow} `;
            }
            if (el('tel-score-bar')) {
                // Score bar is percentage of 150 (max score config in engine)
                const pct = Math.min(100, (d.ghost_score / 150) * 100);
                el('tel-score-bar').style.width = `${pct}% `;

                // Color shift based on threshold (70 is rescue)
                if (d.ghost_score >= 70) {
                    el('tel-score-bar').className = "bg-gradient-to-r from-red-500/50 to-red-500 h-full shadow-[0_0_8px_#ef4444]";
                } else {
                    el('tel-score-bar').className = "bg-gradient-to-r from-santis-gold/50 to-santis-gold h-full shadow-[0_0_8px_#C9A96E]";
                }
            }

            // Rescue Win Rate
            if (el('tel-win-rate')) el('tel-win-rate').textContent = `${d.win_rate.toFixed(1)}% `;
            if (el('tel-conversions-count')) el('tel-conversions-count').textContent = `${d.conversions} Conversions`;

            // Active Personas
            if (el('tel-persona-recovery')) el('tel-persona-recovery').textContent = d.personas.recovery;
            if (el('tel-persona-sovereign')) el('tel-persona-sovereign').textContent = d.personas.sovereign;
            if (el('tel-persona-explorer')) el('tel-persona-explorer').textContent = d.personas.explorer;

        } catch (e) { /* silent */ }
    }

    // ==========================================
    // 7. SOVEREIGN PULSE OMNI DASHBOARD (Phase 39.5)
    // ==========================================
    let pulseChart = null;
    let fallbackHistory = Array(10).fill(1.0);

    function initPulseChart() {
        const ctx = document.getElementById('sovereign-pulse-chart')?.getContext('2d');
        if (!ctx) return;

        pulseChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(15).fill(''), // 10 historic + 5 forecast
                datasets: [
                    {
                        label: 'Historical',
                        data: Array(10).fill(1.0),
                        borderColor: '#d4af37',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0
                    },
                    {
                        label: 'Predictive Shadow',
                        data: Array(15).fill(null), // Only last 6 will be populated
                        borderColor: 'rgba(212, 175, 55, 0.4)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        tension: 0.4,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                    x: { display: false },
                    y: { display: false, min: 0.9, max: 1.8 }
                },
                layout: { padding: 0 }
            }
        });

        // Setup slider listener
        const slider = document.getElementById('surge-slider');
        if (slider) {
            slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value).toFixed(2);
                document.getElementById('metric-surge').textContent = `${val} x`;
                document.getElementById('metric-surge-status').textContent = 'MANUAL OVERRIDE';
                document.getElementById('metric-surge-status').className = 'text-[9px] font-mono text-red-500 font-bold animate-pulse';
                updateAuraColor(parseFloat(val));
                // In a real app, send POST request to lock this in DB/Redis
            });
        }
    }

    function updateAuraColor(multiplier) {
        const aura = document.getElementById('pulse-aura');
        if (!aura) return;

        aura.classList.remove('border-santis-gold', 'border-emerald-500', 'border-red-500', 'shadow-[0_0_20px_rgba(16,185,129,0.3)]', 'shadow-[0_0_20px_rgba(212,175,55,0.3)]', 'shadow-[0_0_20px_rgba(239,68,68,0.5)]');

        if (multiplier >= 1.30) {
            // Vivid Ruby
            aura.classList.add('border-red-500', 'shadow-[0_0_20px_rgba(239,68,68,0.5)]');
        } else if (multiplier >= 1.10) {
            // Santis Gold
            aura.classList.add('border-santis-gold', 'shadow-[0_0_20px_rgba(212,175,55,0.3)]');
        } else {
            // Soft Emerald
            aura.classList.add('border-emerald-500', 'shadow-[0_0_20px_rgba(16,185,129,0.3)]');
        }
    }

    async function updateSovereignPulse() {
        // console.warn("[Sovereign Pulse] Offline Mode Mock - Muting 404");
        return;
        try {
            // 1. Fetch Real-time Occupancy & Surge
            const resOccupancy = await fetch('/api/v1/revenue/occupancy', { headers: { 'X-Tenant-ID': 'santis_hq' } });

            // 2. Fetch Predictive Data
            const resPredict = await fetch('/api/v1/revenue/predict', { headers: { 'X-Tenant-ID': 'santis_hq' } });

            if (!resOccupancy.ok || !resPredict.ok) return;

            const oData = await resOccupancy.json();
            const pData = await resPredict.json();

            // Override Check (If admin touches slider, visually stop auto-updates for the main textual multiplier)
            const statusEl = document.getElementById('metric-surge-status');
            const isOverride = statusEl && statusEl.textContent === 'MANUAL OVERRIDE';

            if (!isOverride) {
                const surgeEl = document.getElementById('metric-surge');
                if (surgeEl) surgeEl.textContent = `${oData.current_multiplier.toFixed(2)} x`;

                const slider = document.getElementById('surge-slider');
                if (slider) slider.value = oData.current_multiplier;

                if (statusEl) {
                    statusEl.textContent = oData.status === 'AUTO_PILOT'
                        ? `Auto - Pilot Active ${oData.surge_active ? '(Surging)' : '(Nominal)'} `
                        : 'Manual Override';
                    statusEl.className = oData.surge_active ? 'text-[9px] font-mono mt-1 text-santis-gold font-bold animate-pulse' : 'text-[9px] text-gray-500 font-mono mt-1';
                }

                updateAuraColor(oData.current_multiplier);
            }

            // Other metrics
            const capEl = document.getElementById('metric-capacity');
            if (capEl) capEl.textContent = oData.local_occupancy_pct;

            const heatEl = document.getElementById('metric-heat');
            if (heatEl) heatEl.textContent = oData.page_demand_active;

            // Update Chart
            if (pulseChart) {
                const history = pData.history || fallbackHistory;
                const forecast = pData.forecast || [];

                pulseChart.data.datasets[0].data = history; // 10 items

                // Predictive line starts from the last historical point
                const predictiveArray = Array(15).fill(null);
                predictiveArray[9] = history[9]; // connection point

                for (let i = 0; i < forecast.length; i++) {
                    predictiveArray[10 + i] = forecast[i];
                }

                pulseChart.data.datasets[1].data = predictiveArray;
                pulseChart.update();
            }

        } catch (err) {
            console.warn("⚠️ Revenue Pulse: Backend link broken. Retrying...");
        }
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    initPulseChart();
    fetchFilters().then(() => {
        fetchAssets();
    });
    updateAOVHealth();
    updateAIBrain();
    updateShadowLog();
    updateSovereignTelemetry();
    updateSovereignPulse();

    // ==========================================
    // PHASE 19: DYNAMIC REVENUE SIMULATION SANDBOX
    // ==========================================
    const simSurgeSlider = document.getElementById('sim-surge-slider');
    const simAestheticSlider = document.getElementById('sim-aesthetic-slider');
    const simSurgeVal = document.getElementById('sim-surge-val');
    const simAestheticVal = document.getElementById('sim-aesthetic-val');
    const simProjectedMrr = document.getElementById('sim-projected-mrr');
    const simProjectedVol = document.getElementById('sim-projected-vol');
    const simProjectedOcc = document.getElementById('sim-projected-occ');
    const simProjectedPrice = document.getElementById('sim-projected-price');
    let sandboxTimeout;

    async function triggerSandboxSimulation() {
        if (!simSurgeSlider || !simAestheticSlider) return;

        const surge = parseFloat(simSurgeSlider.value);
        const aesthetic = parseFloat(simAestheticSlider.value);

        // Immediate UI Update for smoothness
        simSurgeVal.textContent = `+ ${Math.round(surge * 100)}% `;
        simAestheticVal.textContent = `SAS: ${aesthetic.toFixed(2)} `;

        try {
            const res = await fetch('/api/v1/analytics/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    base_price: 150.0,
                    surge_multiplier: surge,
                    aesthetic_threshold: aesthetic
                })
            });
            if (!res.ok) throw new Error('Simulation Engine Offline');

            const data = await res.json();

            // Format number naturally
            simProjectedMrr.textContent = `€${data.predicted_mrr.toLocaleString('en-US')} `;
            simProjectedVol.textContent = data.predicted_bookings;
            simProjectedOcc.textContent = `${data.predicted_occupancy_pct}% `;
            simProjectedPrice.textContent = data.dynamic_price;

            // Pulse the MRR number via CSS for a cinematic effect
            simProjectedMrr.classList.remove('scale-105', 'text-white');
            void simProjectedMrr.offsetWidth; // trigger reflow
            simProjectedMrr.classList.add('scale-105', 'text-white');
            setTimeout(() => simProjectedMrr.classList.remove('scale-105', 'text-white'), 150);

        } catch (e) {
            console.warn("[Sandbox] Simulation failed", e);
        }
    }

    if (simSurgeSlider && simAestheticSlider) {
        // Run initial pipeline simulation
        triggerSandboxSimulation();

        const attachSimulation = (slider) => {
            slider.addEventListener('input', () => {
                // Update text immediately
                if (slider.id === 'sim-surge-slider') simSurgeVal.textContent = `+ ${Math.round(slider.value * 100)}% `;
                if (slider.id === 'sim-aesthetic-slider') simAestheticVal.textContent = `SAS: ${parseFloat(slider.value).toFixed(2)} `;

                // Debounce backend request
                clearTimeout(sandboxTimeout);
                sandboxTimeout = setTimeout(triggerSandboxSimulation, 100);
            });
        };
        attachSimulation(simSurgeSlider);
        attachSimulation(simAestheticSlider);
    }

    // Phase 21: Sentient Optimizer Trigger
    const btnSentience = document.getElementById('btn-engage-sentience');
    if (btnSentience) {
        btnSentience.addEventListener('click', async () => {
            btnSentience.disabled = true;
            btnSentience.innerHTML = '<span class="animate-spin text-white">🔄</span> Initiating Sentience...';
            btnSentience.classList.add('bg-emerald-600', 'text-white');

            try {
                const res = await fetch('/api/v1/analytics/optimize_matrix', { method: 'POST' });
                if (!res.ok) throw new Error("Optimizer Offline");
                // The actual UI update relies on the 'OPTIMIZE_COMPLETE' WebSocket broadcast via santis-core.js
            } catch (err) {
                console.warn("[Sentience Engine]", err);
            } finally {
                setTimeout(() => {
                    btnSentience.disabled = false;
                    btnSentience.innerHTML = '<span class="group-hover:animate-spin">🔄</span> Engage Sentient Loop';
                    btnSentience.classList.remove('bg-emerald-600', 'text-white');
                }, 2000);
            }
        });
    }

    setInterval(updateAIBrain, 30000);
    setInterval(updateShadowLog, 3000);
    setInterval(updateSovereignTelemetry, 3000); // Telemetry Live Sync (Pulse) every 3s
    setInterval(updateSovereignPulse, 4000);   // Sovereign Pulse tracking

});

// ==========================================
// PHASE 42: CYBER-WARFARE & FLASH-SURGE MOCK
// ==========================================
async function triggerFlashSurgeUI() {
    const statusEl = document.getElementById("chaos-status");
    const blockedEl = document.getElementById("chaos-blocked");
    const loadEl = document.getElementById("chaos-load");
    const shieldLed = document.getElementById("shield-led");
    const panel = document.getElementById("chaos-shield-panel");
    const bgPulse = document.getElementById("chaos-bg-pulse");

    if (!statusEl) return;

    // 1. Initiate Attack Sequence
    statusEl.textContent = "UNDER ATTACK";
    statusEl.className = "text-red-500 font-bold animate-pulse";
    panel.style.borderColor = "rgba(220, 38, 38, 0.8)";
    panel.style.boxShadow = "0 0 40px rgba(220, 38, 38, 0.2)";
    bgPulse.style.opacity = "1";
    shieldLed.style.animation = "ping 0.5s cubic-bezier(0, 0, 0.2, 1) infinite";

    // 2. Simulate Load & Blocks
    let blocks = 0;
    let load = 1.0;

    // Call the actual chaos API in background
    try {
        fetch("/api/v1/revenue/flash-recovery/simulate");
    } catch (e) { }

    const attackInterval = setInterval(() => {
        blocks += Math.floor(Math.random() * 5) + 1;
        load = Math.min(load + (Math.random() * 0.1), 1.8);

        blockedEl.textContent = blocks;
        loadEl.textContent = load.toFixed(2) + "x";

        // Log to feed using Custom Event (Vue Compatible)
        if (Math.random() > 0.5) {
            window.dispatchEvent(new CustomEvent('santis:shadow-log', {
                detail: {
                    id: Math.random().toString(),
                    html: `🛡️[Sentinel] Blocked 403 Forbidden - Cross - Tenant SQLi from node_${Math.floor(Math.random() * 9000)} `,
                    isDanger: true
                }
            }));
        }
    }, 400);

    // 3. Resolve Attack
    setTimeout(() => {
        clearInterval(attackInterval);
        statusEl.textContent = "SECURE (BLOCKS LOGGED)";
        statusEl.className = "text-emerald-500 font-bold";
        panel.style.borderColor = "rgba(16, 185, 129, 0.4)";
        panel.style.boxShadow = "0 0 20px rgba(16, 185, 129, 0.05)";
        shieldLed.className = "w-2 h-2 rounded-full bg-emerald-500";
        bgPulse.style.opacity = "0";
        shieldLed.style.animation = "none";

        window.dispatchEvent(new CustomEvent('santis:shadow-log', {
            detail: {
                id: Math.random().toString(),
                html: `✅[Sentinel] Alert Resolved.Total Blocked: ${blocks}. Network Stabilized.`,
                isSuccess: true
            }
        }));
    }, 8000);
}

// ==========================================
// PHASE 22: SOVEREIGN ASSET DIRECTOR (Steering Wheel)
// ==========================================

window.dynamicSlotsLoaded = false;
window.loadDynamicSlots = async function () {
    if (window.dynamicSlotsLoaded) return;
    try {
        const res = await window.SantisCore.apiFetch('/api/v1/services');
        if (res.ok) {
            const services = await res.json();
            const select = document.getElementById('director-slot');

            // Create a new optgroup for the database services
            const optgroup = document.createElement('optgroup');
            optgroup.label = "🔮 All Database Services (Live)";

            services.forEach(svc => {
                const opt = document.createElement('option');
                opt.value = svc.slug;
                opt.textContent = `${svc.name} (${svc.category})`;
                opt.dataset.category = svc.category; // Ensure category is accessible for filtering
                optgroup.appendChild(opt);
            });

            select.appendChild(optgroup);
            window.dynamicSlotsLoaded = true;
            console.log(`[Asset Director] Loaded ${services.length} dynamic slots.`);
        }
    } catch (e) {
        console.error("Failed to load dynamic slots", e);
    }
};

window.openAssetDirector = async function (assetId) {
    const asset = (window.currentAssetMatrix || []).find(a => a.id === assetId);
    if (!asset) return;

    await window.loadDynamicSlots();

    document.getElementById('director-asset-id').value = asset.id;
    document.getElementById('director-id-display').textContent = asset.id.substring(0, 8) + '...';

    document.getElementById('director-preview').src = asset.url;
    document.getElementById('director-category').value = asset.category || 'diger';
    document.getElementById('director-slot').value = asset.slot || '';
    document.getElementById('director-service-id').value = asset.caption_en || asset.linked_service_id || '';
    document.getElementById('director-caption').value = asset.caption || '';

    // Automatically filter slots when modal opens
    window.filterDirectorSlots();

    document.getElementById('nv-asset-director-modal').classList.remove('hidden');
};

window.filterDirectorSlots = function () {
    const cat = document.getElementById('director-category').value;
    const select = document.getElementById('director-slot');

    Array.from(select.children).forEach(group => {
        if (group.tagName.toLowerCase() === 'optgroup') {
            // Check dynamic options inside the group
            let hasVisibleOptions = false;
            Array.from(group.children).forEach(opt => {
                if (!opt.value) { // This is the "Sadece Galeri" option, leave visible
                    opt.style.display = '';
                    hasVisibleOptions = true;
                } else if (opt.dataset.category) { // Dynamic option with db category
                    if (cat === 'diger' || opt.dataset.category === cat) {
                        opt.style.display = '';
                        hasVisibleOptions = true;
                    } else {
                        opt.style.display = 'none';
                    }
                } else { // Static options formatting checks
                    const label = group.label.toLowerCase();
                    const optVal = opt.value.toLowerCase();
                    let matches = false;

                    if (cat === 'hamam' && (label.includes('hamam') || optVal.includes('hamam'))) matches = true;
                    else if (cat === 'masaj' && (label.includes('masaj') || optVal.includes('therapy') || optVal.includes('masaj') || optVal.includes('sig-card'))) matches = true;
                    else if (cat === 'cilt' && (label.includes('cilt') || optVal.includes('cilt'))) matches = true;
                    else if (cat === 'diger') matches = true; // 'diger' context shows all general things or fallback
                    else if (label.includes('ana sayfa')) matches = true; // Homepage slots show universally for routing

                    if (matches) {
                        opt.style.display = '';
                        hasVisibleOptions = true;
                    } else {
                        opt.style.display = 'none';
                    }
                }
            });
            group.style.display = hasVisibleOptions ? '' : 'none';
        } else {
            // Direct options (e.g. standard "null" slots)
            group.style.display = '';
        }
    });

    // Safety fallback: if currently selected slot got hidden, reset to blank
    const selectedOpt = select.options[select.selectedIndex];
    if (selectedOpt && selectedOpt.style.display === 'none') {
        select.value = '';
    }
};

// Bind the event listener once
document.addEventListener('DOMContentLoaded', () => {
    const dirCat = document.getElementById('director-category');
    if (dirCat) dirCat.addEventListener('change', window.filterDirectorSlots);
});

window.closeAssetDirector = function () {
    document.getElementById('nv-asset-director-modal').classList.add('hidden');
};

window.saveAssetRouting = async function () {
    const assetId = document.getElementById('director-asset-id').value;
    const btn = document.querySelector('#nv-asset-director-modal button[onclick="saveAssetRouting()"]');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block mr-2">🔄</span> Enforcing...';

    const payload = {
        category: document.getElementById('director-category').value,
        slot: document.getElementById('director-slot').value,
        caption_en: document.getElementById('director-service-id').value, // Use caption_en to store URLs/arbitrary text safely
        caption_tr: document.getElementById('director-caption').value
    };

    if (!payload.slot) payload.slot = null;

    try {
        const res = await window.SantisCore.apiFetch(`/api/v1/media/assets/${assetId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            pushPulseSignal("ROUTING", `Asset routed to slot: [${payload.slot || 'UNBOUND'}]`, "text-santis-gold font-bold uppercase tracking-widest border-l-2 border-santis-gold pl-2");
            closeAssetDirector();
            fetchAssets();
        } else {
            pushPulseSignal("ERROR", "Asset routing failed.", "text-red-500");
            alert("Sistem Reddi: Veritabanı kilidi veya geçersiz veri.");
        }
    } catch (e) {
        console.error("Asset Director Error:", e);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

window.copyToClipboard = function (text) {
    if (!text) return;
    const fullUrl = text.startsWith('/') || text.startsWith('http') ? new URL(text, window.location.origin).href : text;
    navigator.clipboard.writeText(fullUrl).then(() => {
        pushPulseSignal("CLIPBOARD", `Asset URI copied.`, "text-santis-gold");
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        pushPulseSignal("ERROR", `Failed to copy URI to clipboard.`, "text-red-500");
    });
};

// ─── PHASE 26: SAS Intelligence Engine Frontend Trigger ───────────────────────
window.analyzeAsset = async function (assetId) {
    if (!assetId) return;

    pushPulseSignal("SAS ENGINE", `Analyzing asset ${assetId.substring(0, 8)}...`, "text-blue-400 animate-pulse");

    try {
        const res = await window.SantisCore.apiFetch(`/api/v1/media/assets/${assetId}/analyze`, {
            method: 'POST'
        });

        if (!res.ok) {
            pushPulseSignal("ERROR", `SAS Engine: Analysis failed (${res.status})`, "text-red-500");
            return;
        }

        const data = await res.json();

        const sasColor = data.sas_score >= 0.85 ? 'text-santis-gold font-bold' : data.sas_score >= 0.70 ? 'text-emerald-400' : 'text-gray-400';
        pushPulseSignal(
            "SAS ↑",
            `${data.mood} · ${data.persona} · SAS: ${data.sas_score} · Est. +€${data.est_revenue_lift}/mo`,
            sasColor
        );

        // Update the card DOM in place without full refresh
        const card = document.querySelector(`[data-asset-id="${assetId}"]`);
        if (card) {
            const sasBadge = card.querySelector('.sas-live-badge');
            if (sasBadge) {
                sasBadge.textContent = `SAS: ${data.sas_score}`;
                sasBadge.classList.add('animate-pulse');
                setTimeout(() => sasBadge.classList.remove('animate-pulse'), 2000);
            }
        }

        // Soft matrix refresh after 800ms to show updated scores
        setTimeout(() => fetchAssets(), 800);

    } catch (e) {
        console.error('SAS Analysis Error:', e);
        pushPulseSignal("ERROR", "SAS Engine connection failure.", "text-red-500");
    }
};

// ─── PHASE 30: SOVEREIGN COMMERCE ENGINE ───────────────────────────────────────
window.analyzeCommerce = async function (assetId, sasScore = 0.5) {
    if (!assetId) return;

    pushPulseSignal("COMMERCE", `Cross-referencing Inventory for ${assetId.substring(0, 8)}...`, "text-santis-gold animate-pulse");

    try {
        const res = await window.SantisCore.apiFetch(`/api/v1/analytics/product_match?agent_id=${assetId}&agent_sas=${sasScore}`);

        if (!res.ok) {
            pushPulseSignal("ERROR", `Commerce Engine Offline (${res.status})`, "text-red-500");
            return;
        }

        const data = await res.json();

        if (data.status === 'success' && data.match) {
            const match = data.match;

            // Push pulse for permanent log
            pushPulseSignal(
                "🛒 MATCH",
                `${match.product_name} · Conv. Probability: ${(match.conversion_score * 100).toFixed(1)}%`,
                "text-emerald-400 font-bold"
            );

            // Show SweetAlert/Modal Insight
            if (window.Swal) {
                Swal.fire({
                    title: 'Sovereign Commerce Insight',
                    html: `
                        <div class="text-left font-mono mt-4">
                            <p class="text-gray-400 text-xs uppercase tracking-widest mb-1">Target Asset</p>
                            <p class="text-white bg-gray-900 border border-gray-800 p-2 rounded mb-4">Ajan_${assetId.substring(0, 8)}</p>
                            
                            <p class="text-gray-400 text-xs uppercase tracking-widest mb-1">Optimal Physical Product</p>
                            <p class="text-santis-gold font-bold bg-santis-gold/10 border border-santis-gold/30 p-2 rounded mb-4 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                                🛍️ ${match.product_name}
                            </p>
                            
                            <p class="text-gray-400 text-xs uppercase tracking-widest mb-1">Sovereign Directives</p>
                            <p class="text-emerald-400 font-bold border-l-2 border-emerald-500 pl-3 py-1 bg-black/40 text-[11px] leading-relaxed">
                                "${match.insight}"<br/><br/>
                                Est. Conversion Scale: <span class="text-white">${(match.conversion_score * 100).toFixed(1)}%</span>
                            </p>
                        </div>
                    `,
                    background: '#0a0a0a',
                    color: '#fff',
                    confirmButtonColor: '#C9A96E',
                    confirmButtonText: '⚡ Mühürle & CTA Ekle',
                    showCancelButton: true,
                    cancelButtonColor: '#374151',
                    cancelButtonText: 'Kapat',
                    scrollbarPadding: false,
                    heightAuto: false,
                    customClass: {
                        popup: 'border border-gray-800 shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-xl'
                    }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        pushPulseSignal("CHECKOUT", `Generating Stripe Link for ${match.product_name}...`, "text-santis-gold animate-pulse");

                        try {
                            const checkoutRes = await window.SantisCore.apiFetch('/api/v1/commerce/generate_checkout', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    agent_id: assetId,
                                    product_id: match.product_id,
                                    product_name: match.product_name,
                                    price_eur: match.margin_eur
                                })
                            });

                            if (checkoutRes.ok) {
                                const checkoutData = await checkoutRes.json();
                                pushPulseSignal("STRIPE READY", `CTA Linked: ${checkoutData.checkout_url.substring(0, 30)}...`, "text-emerald-400 font-bold");

                                Swal.fire({
                                    title: 'İnfaz Tamamlandı',
                                    html: `
                                        <p class="text-emerald-400 font-mono mb-4 text-sm mt-3 border border-emerald-500/30 p-3 bg-black/40 rounded">
                                            Özel ödeme linki Matrix ajanına başarıyla dikildi.
                                        </p>
                                        <div class="text-[10px] text-gray-500 font-mono text-left break-all">
                                            URL: <a href="${checkoutData.checkout_url}" target="_blank" class="text-santis-gold hover:underline">${checkoutData.checkout_url}</a>
                                        </div>
                                    `,
                                    background: '#0a0a0a',
                                    color: '#fff',
                                    confirmButtonColor: '#C9A96E',
                                    confirmButtonText: 'Devam Et',
                                    scrollbarPadding: false,
                                    heightAuto: false,
                                    customClass: { popup: 'border border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)] rounded-xl' }
                                });
                            } else {
                                throw new Error(`Gateway returned: ${checkoutRes.status}`);
                            }
                        } catch (err) {
                            console.error("Checkout Error:", err);
                            pushPulseSignal("ERROR", "Stripe Gateway Failed", "text-red-500");
                        }
                    }
                });
            } else {
                alert(`COMMERCE INSIGHT:\n${match.insight}\nProduct: ${match.product_name}`);
            }
        }

    } catch (e) {
        console.error('Commerce Engine Error:', e);
        pushPulseSignal("ERROR", "Inventory Core unreachable.", "text-red-500");
    }
}

// ─── Download Asset to local disk ─────────────────────────────────────────────
window.downloadAsset = async function (url, filename) {
    if (!url) return;
    try {
        const fullUrl = url.startsWith('/') || url.startsWith('http') ? new URL(url, window.location.origin).href : url;
        const response = await fetch(fullUrl, { cache: 'no-cache' });
        const blob = await response.blob();
        if (blob.size === 0) throw new Error("Empty blob");
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = filename || 'santis-asset.webp';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
        pushPulseSignal("DOWNLOAD", `Asset extracted: ${filename || 'santis-asset.webp'}`, "text-emerald-400 font-bold");
    } catch (e) {
        console.error('Download failed: ', e);
        pushPulseSignal("ERROR", `Failed to extract asset blob.`, "text-red-500");
    }
};


// ─── PHASE 28: SLOT INTELLIGENCE MAP — Frontend Engine ─────────────────────────

let _draggedAssetId = null;

// Make Matrix cards draggable (called after renderMatrix)
function wireMatrixDragSource() {
    document.querySelectorAll('.matrix-card[data-asset-id]').forEach(card => {
        card.setAttribute('draggable', 'true');
        card.addEventListener('dragstart', (e) => {
            _draggedAssetId = card.dataset.assetId;
            card.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'link';
        });
        card.addEventListener('dragend', () => {
            card.style.opacity = '';
            _draggedAssetId = null;
        });
    });
}

let shadowSimulationTimer = null;
let currentSimulatedSlot = null;

function getShadowTooltip() {
    let tooltip = document.getElementById('shadow-matrix-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'shadow-matrix-tooltip';
        tooltip.className = 'fixed pointer-events-none z-50 bg-black/90 backdrop-blur-xl border border-santis-gold/50 rounded-lg p-3 shadow-[0_0_30px_rgba(201,169,110,0.3)] transition-opacity duration-300 opacity-0 transform -translate-y-2';
        document.body.appendChild(tooltip);
    }
    return tooltip;
}

window.loadSlotRadar = async function () {
    const list = document.getElementById('slot-radar-list');
    const counter = document.getElementById('slot-radar-count');
    if (!list) return;

    list.innerHTML = `<div class="text-center py-4 text-gray-600 font-mono text-[10px] animate-pulse">Scanning slot inventory...</div>`;

    try {
        const res = await window.SantisCore.apiFetch('/api/v1/media/slots/health');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (counter) {
            const critEl = data.critical_count > 0 ? `<span class="text-red-400 font-bold">${data.critical_count} !</span>` : '';
            const emptyEl = data.empty_count > 0 ? `<span class="text-gray-500">${data.empty_count} ∅</span>` : '';
            counter.innerHTML = `${data.total_slots} slots ${critEl}${emptyEl ? ' · ' + emptyEl : ''}`;
        }

        list.innerHTML = '';
        data.slots.forEach(slot => {
            const statusConfig = {
                optimal: { dot: 'bg-emerald-500', border: 'border-emerald-500/30', label: '✓', labelCol: 'text-emerald-400' },
                at_risk: { dot: 'bg-yellow-400', border: 'border-yellow-400/30', label: '!', labelCol: 'text-yellow-400' },
                critical: { dot: 'bg-red-500 animate-ping', border: 'border-red-500/50 critical-glow', label: '✕', labelCol: 'text-red-400' },
                empty: { dot: 'bg-gray-700', border: 'border-gray-700/30', label: '∅', labelCol: 'text-gray-500' }
            };
            const s = statusConfig[slot.status] || statusConfig.empty;
            const sasWidth = Math.round((slot.sas_score || 0) * 100);
            const sasText = slot.sas_score > 0 ? slot.sas_score.toFixed(2) : '—';

            const row = document.createElement('div');
            row.className = `group slot-radar-row flex items-center gap-2 p-2 rounded-lg border ${s.border} bg-black/30 hover:bg-gray-900/60 transition-all cursor-default`;
            row.dataset.slotKey = slot.slot;
            row.innerHTML = `
                <!-- Status dot -->
                <div class="w-2 h-2 rounded-full ${s.dot} shrink-0"></div>

                <!-- Slot info -->
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center">
                        <span class="text-[9px] font-mono text-white truncate" title="${slot.slot}">${slot.slot}</span>
                        <span class="${s.labelCol} text-[9px] font-bold ml-1">${s.label}</span>
                    </div>
                    <div class="flex items-center gap-1.5 mt-0.5">
                        <div class="flex-1 bg-gray-900 rounded-full h-0.5 overflow-hidden">
                            <div class="h-0.5 rounded-full ${slot.status === 'optimal' ? 'bg-emerald-500' : slot.status === 'at_risk' ? 'bg-yellow-400' : slot.status === 'critical' ? 'bg-red-500' : 'bg-gray-700'}"
                                 style="width: ${sasWidth}%"></div>
                        </div>
                        <span class="text-[8px] font-mono text-gray-500 shrink-0">${sasText}</span>
                    </div>
                    ${slot.filename ? `<div class="text-[8px] text-gray-600 truncate mt-0.5">${slot.filename}</div>` : '<div class="text-[8px] text-gray-700 mt-0.5">— no asset bound —</div>'}
                </div>

                <div class="slot-drop-indicator shrink-0 text-[8px] font-mono text-santis-gold opacity-0 group-hover:opacity-50 transition-opacity">↙</div>
            `;

            // Drag-over: highlight the slot as a drop target
            row.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'link';
                row.classList.add('drag-active');

                const tooltip = getShadowTooltip();
                const slotKey = row.dataset.slotKey;

                if (_draggedAssetId && currentSimulatedSlot !== slotKey) {
                    currentSimulatedSlot = slotKey;
                    clearTimeout(shadowSimulationTimer);

                    tooltip.style.opacity = '1';
                    tooltip.innerHTML = `
                        <div class="flex items-center gap-2 mb-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-santis-gold animate-pulse shadow-[0_0_8px_#d4af37]"></span>
                            <span class="text-[9px] font-mono text-santis-gold tracking-widest uppercase">Shadow Matrix</span>
                        </div>
                        <div class="text-[10px] text-gray-400 font-mono animate-pulse">Calculating MRR Impact...</div>
                    `;

                    shadowSimulationTimer = setTimeout(async () => {
                        try {
                            const surgeStatus = document.getElementById('multiplier-value')
                                ? parseFloat(document.getElementById('multiplier-value').textContent) || 1.0
                                : 1.0;

                            const res = await window.SantisCore.apiFetch(`/api/v1/analytics/simulate_move?asset_id=${_draggedAssetId}&slot=${slotKey}&surge=${surgeStatus}`);
                            if (res.ok) {
                                const data = await res.json();
                                if (data.status === 'ok') {
                                    const sim = data.simulation;
                                    const lift = sim.projected_mrr_lift;
                                    const liftSign = lift > 0 ? '+' : '';
                                    const liftColor = lift > 0 ? 'text-emerald-400' : 'text-red-400';

                                    tooltip.innerHTML = `
                                        <div class="flex items-center gap-2 mb-1.5 border-b border-gray-800 pb-1.5">
                                            <span class="w-1.5 h-1.5 rounded-full bg-santis-gold shadow-[0_0_8px_#d4af37]"></span>
                                            <span class="text-[9px] font-mono text-santis-gold tracking-widest uppercase">Sovereign Projection</span>
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <div class="flex justify-between gap-4">
                                                <span class="text-[10px] text-gray-500 font-mono">Matched Persona</span>
                                                <span class="text-[10px] text-blue-400 font-mono uppercase">${sim.target_persona}</span>
                                            </div>
                                            <div class="flex justify-between gap-4">
                                                <span class="text-[10px] text-gray-500 font-mono">Resonance Skoru</span>
                                                <span class="text-[10px] text-white font-mono uppercase">${sim.resonance} Φ</span>
                                            </div>
                                            <div class="flex justify-between items-center gap-4 mt-1 bg-gray-900/50 p-1.5 rounded border border-gray-800">
                                                <span class="text-[10px] text-santis-gold font-mono uppercase">MRR Impact</span>
                                                <span class="text-sm font-bold ${liftColor} font-mono tracking-tight">${liftSign}€${lift}</span>
                                            </div>
                                        </div>
                                    `;
                                }
                            }
                        } catch (err) {
                            console.error("Shadow Matrix API Error:", err);
                        }
                    }, 250);
                }

                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
            });

            row.addEventListener('dragleave', () => {
                row.classList.remove('drag-active');
                if (currentSimulatedSlot === row.dataset.slotKey) {
                    currentSimulatedSlot = null;
                    clearTimeout(shadowSimulationTimer);
                    getShadowTooltip().style.opacity = '0';
                }
            });

            // Drop: bind dragged asset to this slot
            row.addEventListener('drop', async (e) => {
                e.preventDefault();
                row.classList.remove('drag-active');
                currentSimulatedSlot = null;
                clearTimeout(shadowSimulationTimer);
                getShadowTooltip().style.opacity = '0';
                if (!_draggedAssetId) return;
                const slotKey = row.dataset.slotKey;
                pushPulseSignal('SLOT BIND', `Binding asset → ${slotKey}...`, 'text-santis-gold');

                try {
                    const res = await window.SantisCore.apiFetch(`/api/v1/media/assets/${_draggedAssetId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ slot: slotKey })
                    });
                    if (res.ok) {
                        const data = await res.json().catch(() => ({}));
                        const sas = data.sas_score ? ` · SAS: ${data.sas_score}` : '';
                        pushPulseSignal('SLOT BOUND ✓', `Masterpiece mühürlendi → ${slotKey}${sas}`, 'text-santis-gold font-bold');
                        // ── SHI Gauge + Matrix + Radar full refresh ──────────
                        setTimeout(() => {
                            fetchAssets();
                            loadSlotRadar();
                            if (typeof window.initGodMode === 'function') window.initGodMode(true);
                        }, 600);
                    } else {
                        pushPulseSignal('ERROR', `Slot bind failed (${res.status})`, 'text-red-500');
                    }
                } catch (err) {
                    pushPulseSignal('ERROR', 'Slot bind — network failure.', 'text-red-500');
                }
            });

            list.appendChild(row);
        });

        // Wire up drag sources on existing matrix cards
        wireMatrixDragSource();

    } catch (e) {
        // API not yet available — silent fallback
        console.warn('[Slot Radar] API offline, showing placeholder state.');
        list.innerHTML = `<div class="text-center py-4 text-gray-600 font-mono text-[10px]">📡 Slot API initializing...</div>`;
        // Render placeholder slots
        const placeholderSlots = ['hero_home', 'hero_hamam', 'card_hamam_1', 'card_masaj_1', 'card_cilt_1', 'highlight_home'];
        list.innerHTML = '';
        placeholderSlots.forEach(slot => {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-2 py-1.5 px-2 border border-gray-700/30 rounded animate-pulse';
            row.innerHTML = `<span class="w-2 h-2 rounded-full bg-gray-600"></span><span class="text-[10px] text-gray-600 font-mono">${slot}</span><span class="ml-auto text-[10px] text-gray-700">—</span>`;
            list.appendChild(row);
        });
    }
};

// Auto-load on page ready & re-wire after each matrix render
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof loadSlotRadar === 'function') loadSlotRadar();
    }, 1500);
});


// ─── PHASE 29: AUTONOMOUS MATRIX OPTIMIZER v2.0 ────────────────────────────────

window.closeSentienceModal = function () {
    const modal = document.getElementById('nv-sentience-modal');
    const box = document.getElementById('nv-sentience-box');
    if (!modal || !box) return;

    box.classList.remove('scale-100', 'opacity-100');
    box.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

let _pendingSentiencePayload = null;

window.engageOptimizer = async function () {
    const btn = document.getElementById('btn-auto-optimize');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="animate-spin inline-block">⚡</span> OPTIMIZING...`;
    }

    pushPulseSignal('OPTIMIZER', 'Sovereign Kesişimsel Tarama Başladı...', 'text-santis-gold animate-pulse');

    try {
        const res = await window.SantisCore.apiFetch('/api/v1/analytics/engage_sentience', {
            method: 'POST'
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (data.status === 'OPTIMIZED' || !data.recommendation) {
            pushPulseSignal('OPTIMIZER', 'Matrix Zirvede — Otonom Atamaya Gerek Yok ✓', 'text-emerald-400 font-bold');
            if (btn) btn.innerHTML = `<span class="inline-block">⚡</span> AUTO-OPTIMIZE`;
            return;
        }

        // Fırsat bulundu. Modal'ı göster ve verileri bağla.
        const rec = data.recommendation;
        _pendingSentiencePayload = rec;

        const modal = document.getElementById('nv-sentience-modal');
        const box = document.getElementById('nv-sentience-box');

        document.getElementById('sentience-msg').textContent = data.message;

        const liftColor = parseFloat(rec.projected_mrr_lift) > 0 ? 'text-emerald-400' : 'text-red-400';
        const sign = parseFloat(rec.projected_mrr_lift) > 0 ? '+' : '';

        document.getElementById('sentience-detail').innerHTML = `
            Otopilot, <span class="text-santis-gold font-bold">Ajan_${rec.agent_id.substring(0, 8)}</span> (SAS: ${rec.agent_sas}) kimliğini 
            <span class="text-white font-bold">${rec.target_slot}</span> yuvasına atamayı öneriyor.<br/><br/>
            Mevcut Rezonans: <span class="text-red-400">${rec.old_resonance}</span> → Hedeflenen: <span class="text-emerald-400 font-bold">${rec.new_resonance}</span>
        `;
        document.getElementById('sentience-mrr').textContent = `${sign}€${rec.projected_mrr_lift.toLocaleString()}`;
        document.getElementById('sentience-mrr').className = `text-4xl font-bold tracking-tight ${liftColor}`;

        modal.classList.remove('hidden');
        // Trigger reflow
        void modal.offsetWidth;
        box.classList.remove('scale-95', 'opacity-0');
        box.classList.add('scale-100', 'opacity-100');

    } catch (e) {
        console.error('Optimizer error:', e);
        pushPulseSignal('ERROR', 'Engage Sentience — ağ bağlantısı başarısız.', 'text-red-500');
    } finally {
        if (btn && !_pendingSentiencePayload) {
            btn.disabled = false;
            btn.innerHTML = `<span class="inline-block">⚡</span> AUTO-OPTIMIZE`;
        }
    }
};

window.executeSentience = async function () {
    if (!_pendingSentiencePayload) return;

    closeSentienceModal();
    const btn = document.getElementById('btn-auto-optimize');
    if (btn) btn.innerHTML = `<span class="animate-pulse">MÜHÜRLENİYOR...</span>`;

    const rec = _pendingSentiencePayload;
    pushPulseSignal('ENGAGING', `Sovereign Otopilot → ${rec.target_slot} ataması yapılıyor...`, 'text-santis-gold font-bold');

    try {
        const patchRes = await window.SantisCore.apiFetch(`/api/v1/media/assets/${rec.agent_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slot: rec.target_slot })
        });

        if (patchRes.ok) {
            pushPulseSignal('OPTIMIZED ⚡', `+€${rec.projected_mrr_lift} MRR Kapasitesi Matrix'e işlendi.`, 'text-emerald-400 font-bold');
            setTimeout(() => {
                fetchAssets();
                if (typeof loadSlotRadar === 'function') loadSlotRadar();
                if (typeof window.initGodMode === 'function') window.initGodMode(true);
            }, 600);
        } else {
            pushPulseSignal('ERROR', `Sentience API Reddi (${patchRes.status})`, 'text-red-500');
        }
    } catch (err) {
        pushPulseSignal('ERROR', 'Sentience Execute Error.', 'text-red-500');
    } finally {
        _pendingSentiencePayload = null;
        if (btn) {
            btn.disabled = false;
            setTimeout(() => btn.innerHTML = `<span class="inline-block">⚡</span> AUTO-OPTIMIZE`, 1000);
        }
    }
}


// ─── PHASE 30: GOD MODE SOVEREIGN HEALTH INDEX ────────────────────────────────

let _godModeInterval = null;

window.initGodMode = async function (forceRefresh = false) {
    const shiArc = document.getElementById('shi-arc');
    const shiValue = document.getElementById('shi-value');
    const shiBadge = document.getElementById('shi-status-badge');
    const shiOptimal = document.getElementById('shi-optimal-count');
    const shiRisk = document.getElementById('shi-risk-count');
    const shiCritical = document.getElementById('shi-critical-count');
    const shiLift = document.getElementById('shi-lift');
    const alertList = document.getElementById('master-alert-list');
    const godLed = document.getElementById('god-mode-led');
    if (!shiArc) return;

    try {
        const res = await window.SantisCore.apiFetch('/api/v1/analytics/god/health');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const shi = data.shi || 0;
        const status = data.shi_status; // sovereign | elevated | alert

        // ── Arc Gauge (circumference = 2π×18 ≈ 113) ──
        const circ = 113;
        const offset = circ - (shi / 100) * circ;
        if (shiArc) {
            shiArc.style.strokeDashoffset = offset.toFixed(1);
            shiArc.style.stroke = status === 'sovereign' ? '#10b981'
                : status === 'elevated' ? '#f59e0b' : '#ef4444';
        }
        if (shiValue) {
            shiValue.textContent = shi + '%';
            shiValue.className = `font-bold text-lg font-mono leading-none ${status === 'sovereign' ? 'text-emerald-400'
                : status === 'elevated' ? 'text-yellow-400' : 'text-red-400'
                }`;
        }

        // ── Status badge ──
        if (shiBadge) {
            const cfg = {
                sovereign: { text: 'SOVEREIGN', cls: 'border-emerald-500/30 text-emerald-400 bg-emerald-900/20' },
                elevated: { text: 'ELEVATED', cls: 'border-yellow-500/30 text-yellow-400 bg-yellow-900/20' },
                alert: { text: 'ALERT ⚠', cls: 'border-red-500/50 text-red-400 bg-red-900/30 animate-pulse' }
            }[status] || { text: '—', cls: '' };
            shiBadge.textContent = cfg.text;
            shiBadge.className = `text-[8px] font-mono font-bold px-2 py-0.5 rounded border ${cfg.cls}`;
            if (godLed) godLed.style.background = status === 'alert' ? '#ef4444' : status === 'elevated' ? '#f59e0b' : '#C9A96E';
        }

        // ── Slot breakdown ──
        const bd = data.slot_breakdown || {};
        if (shiOptimal) shiOptimal.textContent = bd.optimal ?? '—';
        if (shiRisk) shiRisk.textContent = bd.at_risk ?? '—';
        if (shiCritical) shiCritical.textContent = `${bd.critical ?? 0} / ${bd.empty ?? 0}`;
        if (shiLift) shiLift.textContent = data.est_portfolio_lift ? `+€${data.est_portfolio_lift.toLocaleString()}/mo` : '—';

        // ── Master Alerts ──
        if (alertList && data.alerts?.length) {
            alertList.innerHTML = '';
            const SEVERITY = {
                CRITICAL: 'text-red-400',
                WARNING: 'text-yellow-400',
                VACANCY: 'text-orange-400',
                OK: 'text-emerald-400'
            };
            data.alerts.forEach(a => {
                const li = document.createElement('li');
                li.className = 'flex gap-2 items-start p-1.5 rounded border border-gray-800 bg-black/30';
                const sCol = SEVERITY[a.severity] || 'text-gray-400';
                li.innerHTML = `
                    <span class="${sCol} font-bold shrink-0">[${a.severity}]</span>
                    <span class="text-gray-400 flex-1 leading-snug">${a.msg}</span>
                    <span class="text-gray-700 shrink-0">${a.ts}</span>
                `;
                alertList.appendChild(li);

                // Push critical alerts to Pulse Engine
                if (a.severity === 'CRITICAL' && forceRefresh) {
                    pushPulseSignal('⚠ ALERT', a.msg, 'text-red-400 font-bold');
                }
            });
        }

        if (forceRefresh) {
            pushPulseSignal('GOD MODE', `SHI: ${shi}% · Status: ${status.toUpperCase()} · Portfolio +€${(data.est_portfolio_lift || 0).toLocaleString()}/mo`, shi >= 85 ? 'text-emerald-400 font-bold' : shi >= 70 ? 'text-yellow-400 font-bold' : 'text-red-400 font-bold');
        }

    } catch (e) {
        // API not yet available — silent fallback (don't spam console.error)
        console.warn('[God Mode] API offline, showing placeholder state.');
        if (shiValue) { shiValue.textContent = '—'; shiValue.className = 'font-bold text-lg font-mono leading-none text-gray-600'; }
        if (shiArc) { shiArc.style.strokeDashoffset = '113'; shiArc.style.stroke = '#374151'; }
        if (shiBadge) { shiBadge.textContent = 'OFFLINE'; shiBadge.className = 'text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-500 uppercase tracking-wider'; }
    }
};

// Auto-poll SHI every 30 seconds
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof window.initGodMode === 'function') {
            window.initGodMode(false);
            _godModeInterval = setInterval(() => window.initGodMode(false), 30000);
        }
    }, 2500);
});


// ─── LIVE MIRROR FULLSCREEN ────────────────────────────────────────────────────

window.openMirrorFullscreen = function () {
    const modal = document.getElementById('mirror-fullscreen-modal');
    const fsIframe = document.getElementById('mirror-fs-iframe');
    const smallMirror = document.getElementById('live-mirror');
    if (!modal) return;

    // Sync src from small mirror
    if (smallMirror && fsIframe) {
        fsIframe.src = smallMirror.src || '/tr/index.html';
    }

    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    // Escape key closes it
    window._mirrorEscHandler = (e) => {
        if (e.key === 'Escape') window.closeMirrorFullscreen();
    };
    document.addEventListener('keydown', window._mirrorEscHandler);
};

window.closeMirrorFullscreen = function () {
    const modal = document.getElementById('mirror-fullscreen-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    if (window._mirrorEscHandler) {
        document.removeEventListener('keydown', window._mirrorEscHandler);
    }
};

// ─── PHASE 43: PANEL COLLAPSE / EXPAND LOGIC ─────────────────────────────────
window.togglePanel = function (side) {
    const leftPanel = document.getElementById('cc-panel-left');
    const rightPanel = document.getElementById('cc-panel-right');
    const restoreLeft = document.getElementById('restore-left-btn');
    const restoreRight = document.getElementById('restore-right-btn');

    if (side === 'left') {
        const isCollapsed = leftPanel.classList.toggle('collapsed');
        if (isCollapsed) {
            restoreLeft.classList.add('visible');
            pushPulseSignal("LAYOUT", "Visual Ingestion Panel Collapsed", "text-gray-500 font-mono");
        } else {
            restoreLeft.classList.remove('visible');
        }
    } else if (side === 'right') {
        const isCollapsed = rightPanel.classList.toggle('collapsed');
        if (isCollapsed) {
            restoreRight.classList.add('visible');
            pushPulseSignal("LAYOUT", "Pulse Stream Panel Collapsed", "text-gray-500 font-mono");
        } else {
            restoreRight.classList.remove('visible');
        }
    }
};

// ─── PHASE 33: ANTIGRAVITY PROTOCOL (KINETIC UI) ─────────────────────────────
document.addEventListener('drag', (e) => {
    // Master, görseli (Ajanı) hedefe sürüklerken Pulse Engine küçük kognitif dalgalanmalar yaşar
    if (window.SovereignCharts) {
        let simulatedDragLift = 4000 + (Math.random() * 500); // Shadow Simülasyonu
        window.SovereignCharts.triggerPulseSpike(simulatedDragLift);
    }
});
