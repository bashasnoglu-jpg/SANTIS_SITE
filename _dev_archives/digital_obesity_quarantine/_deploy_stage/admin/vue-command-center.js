/**
 * OMNI-CORE FAZ 11.6: Regional Performance Command Center
 * Vue 3 Headless Architecture (Phase C1)
 */

const { createApp, ref, onMounted, watch } = Vue;

const app = createApp({
    setup() {
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

                const res = await fetch('/api/v1/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString()
                });
                const data = await res.json();

                if (res.ok && data.access_token) {
                    localStorage.setItem('santis_token', data.access_token);
                    isAuthenticated.value = true;
                    fetchStatus();
                } else {
                    loginError.value = data.detail || 'Login failed.';
                }
            } catch (e) {
                loginError.value = 'Failed to connect to authentication server.';
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
            } catch (e) {
                console.error(e);
                globalStatus.value = "Core API Unreachable";
            }
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

        // --- LIFECYCLE ---
        onMounted(() => {
            console.log("⚡ [iCOS] Vue 3 Sentinel Booting...");
            if (isAuthenticated.value) {
                fetchStatus();
                fetchRegistrySlugs();
            }
        });

        return {
            globalStatus, activeRegion, activeView, dashboardStats, integrityReport,
            availableSlugs, studioSlug, studioLocale, studioJsonRaw, luxuryScore, jsonError, activeDraft,
            timelineSlug, timelineHistory, rollbackHash, rollbackOutput, rollbackOutputColor,
            activeBlob, targetBlob,
            changeRegion, fetchStatus, runIntegrityScan, loadSlugContent, debouncedScoreCheck, executePublish, saveDraft, loadDraftToEditor, approveDraft,
            fetchTimeline, selectHash, executeRollback,
            isAuthenticated, loginEmail, loginPassword, loginError, doLogin
        };
    }
});

app.mount('#app');
