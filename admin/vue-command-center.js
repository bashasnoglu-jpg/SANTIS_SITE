/**
 * OMNI-CORE FAZ 11.6: Regional Performance Command Center
 * Vue 3 Headless Architecture (Phase C1)
 */

const { createApp, ref, onMounted, watch, computed } = Vue;

const app = createApp({
    setup() {
        // --- WAR ROOM RADAR (V16) ---
        const radarFeed = ref([]);
        const activeSessions = ref([]);
        const aureliaTriggers = ref(0);
        const sovereignAlert = ref(false);
        const lastAlertSession = ref("");
        const totalSurgeRevenue = ref(0);
        const shadowLogFeed = ref([]); // PHASE 19.5: VUE SHADOW LOG 
        const neuralFeed = ref([]); // PROTOCOL 24: COGNITIVE NAVIGATION

        const reversedFeed = computed(() => {
            return [...radarFeed.value].reverse().slice(0, 50); // Son 50 olay
        });

        const averageScore = computed(() => {
            if (radarFeed.value.length === 0) return 0;
            const sum = radarFeed.value.reduce((acc, curr) => acc + curr.score, 0);
            return Math.round(sum / radarFeed.value.length);
        });

        const getTierClass = (tier) => {
            if (tier === 'SURGE') return 'tier-surge';
            if (tier === 'RESCUE') return 'tier-rescue';
            return 'tier-observe';
        };

        const triggerSovereignAlert = (sessionId) => {
            sovereignAlert.value = true;
            lastAlertSession.value = sessionId.substring(0, 8);
            setTimeout(() => { sovereignAlert.value = false; }, 4000);
        };

        // --- GLOBAL STATE ---
        const globalStatus = ref("Core Active");
        const activeRegion = ref(localStorage.getItem('icos_region') || 'tr');
        const activeView = ref('dashboard');

        // --- AUTH STATE ---
        const isAuthenticated = ref(!!localStorage.getItem('santis_token'));
        const loginEmail = ref('');
        const loginPassword = ref('');
        const loginError = ref('');

        // --- DASHBOARD (Mission Control) ---
        const dashboardStats = ref(null);
        const integrityReport = ref(null);
        const yieldStatus = ref(null);
        const revenueForecast = ref(null);
        let revenueChartInstance = null;

        // --- STUDIO (Headless Editor) ---
        const availableSlugs = ref([]);
        const studioSlug = ref('');
        const studioLocale = ref('tr');
        const studioJsonRaw = ref(`{
  "title": "",
  "description": ""
}`);
        const luxuryScore = ref(90);
        const jsonError = ref('');
        const activeDraft = ref(null);

        // --- TIMELINE & ROLLBACK ---
        const timelineSlug = ref('');
        const timelineHistory = ref([]);
        const rollbackHash = ref('');
        const rollbackOutput = ref('');
        const rollbackOutputColor = ref('');
        const activeBlob = ref('Loading active version...');
        const targetBlob = ref('Select a version to view diff...');

        // --- GLOBAL AUDIT EXPLORER ---
        const auditLogs = ref([]);

        const getHeaders = () => {
            const opId = 'op-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
            const token = localStorage.getItem('santis_token');
            const headers = {
                "X-Operation-ID": opId
            };
            // Do not force "Content-Type" here for standard requests if it breaks FormData,
            // but we add it manually later. We will just default it here.
            headers["Content-Type"] = "application/json";
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
            return headers;
        };

        const doLogin = async () => {
            loginError.value = '';
            if (!loginEmail.value || !loginPassword.value) {
                loginError.value = 'Email and password required.';
                return;
            }
            try {
                // OAuth2 form data
                const formData = new URLSearchParams();
                formData.append('username', loginEmail.value);
                formData.append('password', loginPassword.value);

                // MOCK LOGIN FOR LOCAL SERVER (Offline Mode)
                console.warn("[Vue Auth] MOCK_MODE: Bypassing POST /api/v1/auth/login");
                setTimeout(() => {
                    localStorage.setItem('santis_token', 'mock_vue_token_888');
                    isAuthenticated.value = true;
                    fetchStatus();
                }, 400);
            } catch (e) {
                loginError.value = 'Mock Login failed: ' + e.message;
            }
        };

        const changeRegion = () => {
            localStorage.setItem('icos_region', activeRegion.value);
            window.location.reload();
        };

        // --- METHODS: DASHBOARD ---
        const fetchStatus = async () => {
            try {
                const res = await fetch("/api/admin/content/status", { headers: getHeaders() });
                if (!res.ok) throw new Error("Status API Failed");
                dashboardStats.value = await res.json();
                globalStatus.value = "Core Active";

                // Fetch intelligence data concurrently via separate logic
                fetchIntelligence();
            } catch (e) {
                console.error(e);
                globalStatus.value = "Core API Unreachable";
            }
        };

        const fetchIntelligence = async () => {
            try {
                // Fetch Yield Status
                const yRes = await fetch("/api/v1/admin/yield-status", { headers: getHeaders() });
                if (yRes.ok) {
                    yieldStatus.value = await yRes.json();
                }

                // Fetch Revenue Forecast
                const rRes = await fetch("/api/v1/revenue/forecast", { headers: getHeaders() });
                if (rRes.ok) {
                    revenueForecast.value = await rRes.json();
                    Vue.nextTick(() => renderRevenueChart(revenueForecast.value));
                }
            } catch (e) {
                console.error("Intelligence fetch failed: ", e);
            }
        };

        const renderRevenueChart = (data) => {
            if (!document.querySelector('#revenueChart')) return;
            if (revenueChartInstance) {
                revenueChartInstance.destroy();
            }

            const options = {
                chart: {
                    type: 'area',
                    height: 250,
                    fontFamily: 'Inter, sans-serif',
                    toolbar: { show: false },
                    background: 'transparent',
                    animations: { enabled: true, easing: 'easeinout', speed: 800 }
                },
                theme: { mode: 'dark' },
                series: [{
                    name: 'Revenue Actual',
                    data: data.historical.data
                }, {
                    name: 'AI Forecast',
                    data: [...Array(30).fill(null), ...data.forecast.data]
                }],
                colors: ['#c6a15b', '#00ff88'],
                fill: {
                    type: 'gradient',
                    gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.3,
                        opacityTo: 0.05,
                        stops: [0, 90, 100]
                    }
                },
                dataLabels: { enabled: false },
                stroke: { curve: 'smooth', width: 2 },
                xaxis: {
                    categories: [...data.historical.labels, ...data.forecast.labels],
                    labels: { style: { colors: '#888' } },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    labels: {
                        style: { colors: '#888' },
                        formatter: (val) => { return '€' + (val / 1000).toFixed(1) + 'k' }
                    }
                },
                grid: { borderColor: '#2a2a2c', strokeDashArray: 4 },
                legend: { position: 'top', horizontalAlign: 'right' },
                tooltip: { theme: 'dark' }
            };

            revenueChartInstance = new ApexCharts(document.querySelector("#revenueChart"), options);
            revenueChartInstance.render();
        };

        const runIntegrityScan = async () => {
            if (!confirm("Running a full Integrity Scan may impact I/O performance. Proceed?")) return;
            integrityReport.value = null; // reset
            try {
                const res = await fetch("/api/admin/content/integrity-scan", { headers: getHeaders() });
                if (!res.ok) throw new Error("Integrity Scan Failed.");
                integrityReport.value = await res.json();
            } catch (e) {
                alert("Integrity Scanner Error: " + e.message);
            }
        };

        // --- METHODS: STUDIO ---
        const fetchRegistrySlugs = async () => {
            try {
                const res = await fetch("/api/v1/content/registry", { headers: getHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    availableSlugs.value = data.slugs || [];
                }
            } catch (e) {
                console.log("Registry fetch failed.", e);
            }
        };

        const loadSlugContent = async () => {
            if (!studioSlug.value) return;
            try {
                const res = await fetch(`/api/v1/content/resolve/${studioSlug.value}?region=${activeRegion.value}&locale=${studioLocale.value}`);
                if (res.status === 200 || res.status === 304) {
                    const data = await res.json();
                    studioJsonRaw.value = JSON.stringify(data, null, 2);
                    jsonError.value = '';
                    debouncedScoreCheck();
                } else if (res.status === 404) {
                    // Start fresh
                    studioJsonRaw.value = `{\n  "id": "${studioSlug.value}",\n  "title": "New Protocol"\n}`;
                    jsonError.value = '';
                }

                // Check for revisions
                activeDraft.value = null;
                try {
                    const draftRes = await fetch(`/api/v1/content/revisions/${studioSlug.value}?region=${activeRegion.value}&locale=${studioLocale.value}`);
                    if (draftRes.ok) {
                        const drData = await draftRes.json();
                        if (drData.draft) {
                            activeDraft.value = drData.draft;
                        }
                    }
                } catch (e) { }

            } catch (e) {
                console.error("Failed to load slug data:", e);
            }
        };

        let scoreTimer;
        const debouncedScoreCheck = () => {
            clearTimeout(scoreTimer);
            scoreTimer = setTimeout(() => {
                try {
                    const parsed = JSON.parse(studioJsonRaw.value);
                    jsonError.value = ''; // Valid JSON

                    // Simple sentinel logic
                    const text = JSON.stringify(parsed).toLowerCase();
                    let tempScore = 90;
                    if (text.includes("ucuz") || text.includes("kampanya") || text.includes("bedava")) tempScore -= 15;
                    if (text.includes("premium") || text.includes("exclusive") || text.includes("signature")) tempScore += 5;
                    if (text.includes("imza") || text.includes("lüks")) tempScore += 3;

                    luxuryScore.value = Math.min(100, Math.max(0, tempScore));
                } catch (e) {
                    jsonError.value = e.message;
                }
            }, 300);
        };

        const executePublish = async (isForce = false) => {
            if (!studioSlug.value || !studioJsonRaw.value) {
                alert("Slug and JSON content are required."); return;
            }
            if (jsonError.value) {
                alert("Please fix JSON Syntax Errors before publishing."); return;
            }

            let contentObj = JSON.parse(studioJsonRaw.value);

            try {
                const res = await fetch("/api/admin/content/publish", {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        slug: studioSlug.value,
                        region_id: activeRegion.value,
                        locale: studioLocale.value,
                        content: contentObj
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Publish Failed");

                alert(`Atomized Publish Success! ⚛️\nHash: ${data.version_hash}\nWarnings: ${data.warnings?.join(", ") || 'None'}`);

                // If timeline is open for this slug, refresh it
                if (timelineSlug.value === studioSlug.value) {
                    fetchTimeline();
                }

            } catch (e) {
                alert(e.message);
            }
        };

        const saveDraft = async () => {
            if (!studioSlug.value || !studioJsonRaw.value) {
                alert("Slug and JSON content are required."); return;
            }
            if (jsonError.value) {
                alert("Please fix JSON Syntax Errors before saving draft."); return;
            }

            let contentObj = JSON.parse(studioJsonRaw.value);

            try {
                const res = await fetch("/api/v1/content/draft", {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        slug: studioSlug.value,
                        region: activeRegion.value,
                        locale: studioLocale.value,
                        payload: contentObj
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Draft Save Failed");

                alert(`Draft Saved Successfully! 📝\nHash: ${data.draft_hash}`);

                // Refresh draft status
                loadSlugContent();

            } catch (e) {
                alert(e.message);
            }
        };

        const loadDraftToEditor = async () => {
            if (activeDraft.value && activeDraft.value.hash) {
                try {
                    // Normally we'd fetch the blob right from Edge resolver via hash /storage/...
                    // For MVP, we can fetch via direct route. But since Edge doesn't expose raw hash DL yet,
                    // We will alert that the draft system is engaged but load needs backend blob path resolution.
                    alert(`Draft hash ${activeDraft.value.hash} detected. Loading from storage. (Backend blob resolver pending Phase C2.5)`);
                } catch (e) { }
            }
        };

        const approveDraft = async () => {
            if (!studioSlug.value) return;
            if (!confirm(`Are you sure you want to approve and publish the draft for ${studioSlug.value}?`)) return;

            try {
                const res = await fetch("/api/v1/content/draft/approve", {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        slug: studioSlug.value,
                        region: activeRegion.value,
                        locale: studioLocale.value
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Draft Approval Failed");

                alert(`Draft Approved & Published! 🚀\nActive Hash: ${data.active_hash}`);

                // Refresh everything
                loadSlugContent();
                if (timelineSlug.value === studioSlug.value) {
                    fetchTimeline();
                }
            } catch (e) {
                alert(e.message);
            }
        };

        // --- TIMELINE ---
        const fetchTimeline = async () => {
            if (!timelineSlug.value) return;
            try {
                const res = await fetch(`/api/admin/content/${activeRegion.value}/${timelineSlug.value}/timeline`, { headers: getHeaders() });
                if (!res.ok) throw new Error("Timeline fetch failed");

                const data = await res.json();
                timelineHistory.value = data.history || [];
            } catch (e) {
                alert("Error: " + e.message);
            }
        };

        const selectHash = async (hash) => {
            rollbackHash.value = hash;
            rollbackOutput.value = '';

            // Phase C3: Diff Viewer - Fetch Blobs
            targetBlob.value = "Fetching ...";
            try {
                // Fetch Target Hash Blob
                const tRes = await fetch(`/api/admin/content/${activeRegion.value}/${timelineSlug.value}/blob/${hash}`);
                if (tRes.ok) {
                    const data = await tRes.json();
                    targetBlob.value = JSON.stringify(data, null, 2);
                } else {
                    targetBlob.value = "Error fetching target blob.";
                }

                // Optimization: Fetch Active Blob only if empty, or we could fetch latest timeline
                // We'll get active blob from the top of timeline history or just via the resolve edge router
                const aRes = await fetch(`/api/v1/content/resolve/${timelineSlug.value}?region=${activeRegion.value}`);
                if (aRes.ok) {
                    const data = await aRes.json();
                    activeBlob.value = JSON.stringify(data, null, 2);
                } else {
                    activeBlob.value = "No active blob. This might be a deleted reference.";
                }

            } catch (e) {
                targetBlob.value = "Network error fetching Diff blobs.";
            }
        };

        const executeRollback = async (isDryRun) => {
            if (!timelineSlug.value || !rollbackHash.value) {
                rollbackOutputColor.value = "var(--accent-red)";
                rollbackOutput.value = "ERR: Please select a valid slug and hash from the timeline.";
                return;
            }

            rollbackOutput.value = "Executing Request...";
            rollbackOutputColor.value = "var(--text-dim)";

            try {
                const res = await fetch(`/api/admin/content/${activeRegion.value}/${timelineSlug.value}/rollback`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        target_version_hash: rollbackHash.value,
                        dry_run: isDryRun
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Rollback Request Failed");

                rollbackOutputColor.value = isDryRun ? "var(--accent-blue)" : "var(--accent-green)";
                rollbackOutput.value = JSON.stringify(data, null, 2);

                if (!isDryRun) fetchTimeline();

            } catch (e) {
                rollbackOutputColor.value = "var(--accent-red)";
                rollbackOutput.value = "FATAL: " + e.message;
            }
        };

        // --- GLOBAL AUDIT EXPLORER METHODS ---
        const fetchAuditLogs = async () => {
            try {
                const res = await fetch("/api/activity-log?limit=100", { headers: getHeaders() });
                if (res.ok) {
                    auditLogs.value = await res.json();
                } else {
                    console.error("Failed to fetch audit logs");
                    auditLogs.value = [];
                }
            } catch (e) {
                console.error("Audit log network error:", e);
                auditLogs.value = [];
            }
        };

        // Otomatik veriyi çekmek için 'aktiveView'ı dinle (watch)
        watch(activeView, (newView) => {
            if (newView === 'audit') {
                fetchAuditLogs();
            }
        });

        // --- NEURAL BRIDGE WEBSOCKET (PHASE V8 SOVEREIGN PULSE) ---
        const initNeuralBridge = (retryCount = 0) => {
            const ws = new WebSocket("ws://localhost:8000/api/v1/admin/ws/sovereign-pulse");
            ws.onopen = () => {
                retryCount = 0; // Başarılı bağlantıda spami resetle
                if (window.SantisLog) window.SantisLog.info("⚡ [Sovereign Watchtower] Pulse Connection Established.");
                const statusLed = document.getElementById("telemetry-status");
                if (statusLed) {
                    statusLed.innerHTML = `<span class="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span> BEACON SYNC`;
                    statusLed.classList.remove('text-red-500');
                    statusLed.classList.add('text-gray-500');
                }
            };

            let totalConversions = 0;
            let totalRescueAttempts = 0;

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // 1. ZİYARETÇİ KALP ATIŞI (TELEMETRY BEACON)
                    if (data.type === 'TELEMETRY_BEACON') {
                        // VUE ONAYLI RADAR YAZMA
                        const incomingTier = data.tier || (data.current_score >= 95 ? 'SURGE' : (data.current_score >= 70 ? 'RESCUE' : 'OBSERVE'));

                        radarFeed.value.push({
                            id: Date.now() + Math.random(),
                            time: new Date().toLocaleTimeString(),
                            session: data.session_id,
                            score: data.current_score,
                            tier: incomingTier,
                            persona: data.persona || 'Guest'
                        });

                        // Aktif oturum takibi
                        if (!activeSessions.value.includes(data.session_id)) {
                            activeSessions.value.push(data.session_id);
                        }

                        // Aurelia Rescue Check (Threshold 70. 85+ ile ekstra şaşalı)
                        if (data.current_score >= 85) {
                            if (!window.WarRoomAlertedSessions) window.WarRoomAlertedSessions = new Set();
                            if (!window.WarRoomAlertedSessions.has(data.session_id)) {
                                aureliaTriggers.value++;
                                triggerSovereignAlert(data.session_id);
                                window.WarRoomAlertedSessions.add(data.session_id);
                            }
                        }

                        // Eski Vanilla Ghost Score UI Geriye Dönük Destek
                        const svScore = document.getElementById('tel-ghost-score');
                        const svBar = document.getElementById('tel-score-bar');
                        if (svScore && svBar) {
                            svScore.innerHTML = `${data.current_score} <span class="text-[8px] text-emerald-500">↑</span>`;
                            svBar.style.width = Math.min(100, data.current_score) + '%';
                            if (data.current_score >= 95) svBar.className = "bg-gradient-to-r from-red-500/50 to-red-500 h-full shadow-[0_0_8px_#EF4444]";
                            else svBar.className = "bg-gradient-to-r from-santis-gold/50 to-santis-gold h-full shadow-[0_0_8px_#C9A96E]";
                        }
                    }
                    // 2. YERALTI ODA (BLACK ROOM EXECUTION) PAKET İNFAZI
                    else if (data.type === 'BLACK_ROOM_EXECUTION') {
                        totalSurgeRevenue.value += parseInt(data.offer.price || data.offer.dynamic_price || 0);

                        // Vue Reactive Intelligence Log (SHADOW MODE)
                        shadowLogFeed.value.unshift({
                            id: data.timestamp + '_' + Math.random(),
                            timestamp: data.timestamp,
                            score: data.score,
                            identity: data.session_id.split('_').pop(),
                            sku: data.offer.sku || data.offer.virtual_sku || 'UNKNOWN',
                            price: data.offer.price || data.offer.dynamic_price || 0
                        });

                        if (shadowLogFeed.value.length > 30) shadowLogFeed.value.pop();
                    }
                    // 3. PROTOCOL 24: COGNITIVE NAVIGATION RADAR (PRE-COGNITION)
                    else if (data.type === 'NEURAL_PREDICTION_PULSE') {
                        // Basitleştirilmiş URL
                        let friendlyUrl = data.target_url || '';
                        if (friendlyUrl.includes(window.location.host)) {
                            friendlyUrl = friendlyUrl.split(window.location.host)[1];
                        }

                        neuralFeed.value.unshift({
                            id: Date.now() + Math.random(),
                            time: data.timestamp,
                            session: data.session_id.substring(0, 8), // Anonimleştirme
                            target: friendlyUrl,
                            confidence: data.confidence
                        });

                        // Performans: Maksimum 20 öğe tut (Vue Reaktif DOM Throttling)
                        if (neuralFeed.value.length > 20) neuralFeed.value.pop();
                    }
                } catch (err) {
                    if (window.SantisLog) window.SantisLog.error("Neural Bridge parsing error: " + (err.message || err));
                }
            };

            ws.onclose = () => {
                const delay = Math.min(30000, 1000 * 2 ** retryCount);
                if (window.SantisLog) window.SantisLog.warn(`[Sovereign Watchtower] Bağlantı koptu. Gizlice yeniden deneniyor... (Deneme: ${retryCount + 1})`);
                const statusLed = document.getElementById("telemetry-status");
                if (statusLed) {
                    statusLed.innerHTML = `<span class="w-1 h-1 rounded-full bg-red-500 animate-pulse"></span> OFFLINE`;
                    statusLed.classList.add('text-red-500');
                    statusLed.classList.remove('text-gray-500');
                }
                setTimeout(() => initNeuralBridge(retryCount + 1), delay);
            };
        };

        // PHASE 19.5: Lisen for Sentinel Vanilla Events and merge into Vue Reactivity
        const handleShadowLogEvent = (e) => {
            if (e.detail && shadowLogFeed.value) {
                if (shadowLogFeed.value.length > 30) {
                    shadowLogFeed.value.pop();
                }
                shadowLogFeed.value.unshift(e.detail);
            }
        };

        // --- LIFECYCLE ---
        onMounted(() => {
            window.addEventListener('santis:shadow-log', handleShadowLogEvent);

            if (window.SantisLog) window.SantisLog.info("⚡ [iCOS] Vue 3 Sentinel Booting...");
            if (isAuthenticated.value) {
                fetchStatus();
                fetchRegistrySlugs();
                initNeuralBridge();
            }
        });

        return {
            globalStatus, activeRegion, activeView, dashboardStats, integrityReport, yieldStatus, revenueForecast,
            availableSlugs, studioSlug, studioLocale, studioJsonRaw, luxuryScore, jsonError, activeDraft,
            timelineSlug, timelineHistory, rollbackHash, rollbackOutput, rollbackOutputColor,
            activeBlob, targetBlob, auditLogs,
            changeRegion, fetchStatus, runIntegrityScan, loadSlugContent, debouncedScoreCheck, executePublish, saveDraft, loadDraftToEditor, approveDraft,
            fetchTimeline, selectHash, executeRollback, fetchAuditLogs,
            isAuthenticated, loginEmail, loginPassword, loginError, doLogin,
            reversedFeed, averageScore, activeSessions, aureliaTriggers, sovereignAlert, lastAlertSession, getTierClass, totalSurgeRevenue, shadowLogFeed, neuralFeed
        };
    }
});

// Sovereign Pulse Logic integrated into main app above.
