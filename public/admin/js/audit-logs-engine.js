/**
 * public/admin/js/audit-logs-engine.js
 * Sovereign Boardroom Audit Logs Engine
 */
document.addEventListener("DOMContentLoaded", () => {

    // --- 1. State ---
    const ENDPOINT = '/api/v1/boardroom/audit-log';
    let currentLimit = 50;
    let currentOffset = 0;
    let totalLogs = 0;
    let currentData = [];

    // --- 2. DOM Elements ---
    const form = document.getElementById('filter-form');
    const tbody = document.getElementById('logs-tbody');
    const stateLoading = document.getElementById('state-loading');
    const stateEmpty = document.getElementById('state-empty');
    const stateError = document.getElementById('state-error');
    const tableWrapper = document.getElementById('table-wrapper');
    const paginationContainer = document.getElementById('pagination-container');
    const paginationInfo = document.getElementById('pagination-info');
    const pageIndicator = document.getElementById('page-indicator');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnReset = document.getElementById('btn-reset');

    // Drawer elements
    const drawerOverlay = document.getElementById('drawer-overlay');
    const drawer = document.getElementById('payload-drawer');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    const drawerContent = document.getElementById('drawer-content');

    // --- Helper: HTML Escaping ---
    function escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '-';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- 3. Placeholder Auth Adapter (Fail closed) ---
    function getAuthToken() {
        const token = localStorage.getItem('santis_admin_token');
        return token || null;
    }

    // --- 4. Fetch & Render ---
    async function fetchLogs() {
        setUIState('loading');

        const token = getAuthToken();
        if (!token) {
            setUIState('error', 'AUTHENTICATION REQUIRED. TOKEN MISSING.');
            return;
        }

        try {
            // Build query params
            const params = new URLSearchParams();
            params.append('limit', currentLimit);
            params.append('offset', currentOffset);

            const formData = new FormData(form);
            for (let [key, value] of formData.entries()) {
                if (value) {
                    if (key === 'startDate' || key === 'endDate') {
                        params.append(key, new Date(value).toISOString());
                    } else {
                        params.append(key, value);
                    }
                }
            }

            const headers = {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
                method: 'GET',
                headers: headers
            });

            if (res.status === 401 || res.status === 403) {
                setUIState('error', 'AUTHENTICATION REQUIRED OR FORBIDDEN.');
                return;
            }
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('[Audit Logs Engine] API Error:', errorData);
                setUIState('error', errorData.message?.toUpperCase() || 'ERROR FETCHING AUDIT LOGS.');
                return;
            }

            const responseBody = await res.json();

            // Defensive response validation
            if (!responseBody.meta || !Array.isArray(responseBody.data)) {
                console.error('[Audit Logs Engine] Invalid Response Contract:', responseBody);
                setUIState('error', 'INVALID RESPONSE CONTRACT FROM SERVER.');
                return;
            }

            currentData = responseBody.data;
            totalLogs = responseBody.meta.total || 0;

            if (currentData.length === 0) {
                setUIState('empty');
            } else {
                renderTable(currentData);
                updatePaginationControls();
                setUIState('ready');
            }

        } catch (error) {
            console.error('[Audit Logs Engine] Fetch Error:', error);
            setUIState('error', 'NETWORK ERROR.');
        }
    }

    function renderTable(data) {
        tbody.innerHTML = '';
        data.forEach(log => {
            const tr = document.createElement('tr');

            const timeString = new Date(log.createdAt).toLocaleString('tr-TR');
            const eventVal = escapeHtml(log.event || 'UNKNOWN');
            const actorVal = escapeHtml(log.actorId);
            const actorTypeVal = escapeHtml(log.actorType);
            const sourceVal = escapeHtml(log.source);
            const ipVal = escapeHtml(log.ipAddress);

            tr.innerHTML = `
                <td style="font-family: monospace; color: var(--santis-muted);">${timeString}</td>
                <td><span class="tag event">${eventVal}</span></td>
                <td style="font-family: monospace; font-size: 0.8rem;">${actorVal}</td>
                <td>${actorTypeVal}</td>
                <td>${sourceVal}</td>
                <td style="font-family: monospace; color: var(--santis-muted);">${ipVal}</td>
                <td><button class="btn-inspect" data-id="${escapeHtml(log.id)}">Inspect</button></td>
            `;
            tbody.appendChild(tr);
        });

        // Attach listeners for inspect
        document.querySelectorAll('.btn-inspect').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const logId = e.target.getAttribute('data-id');
                const log = currentData.find(l => l.id === logId);
                if (log) openDrawer(log);
            });
        });
    }

    function updatePaginationControls() {
        const currentPage = Math.floor(currentOffset / currentLimit) + 1;
        const totalPages = Math.ceil(totalLogs / currentLimit) || 1;

        pageIndicator.innerText = `Page ${currentPage} of ${totalPages}`;
        paginationInfo.innerText = `Showing ${currentOffset + 1} to ${Math.min(currentOffset + currentLimit, totalLogs)} of ${totalLogs}`;

        btnPrev.disabled = currentOffset === 0;
        btnNext.disabled = (currentOffset + currentLimit) >= totalLogs;
    }

    // --- 5. UI State Management ---
    function setUIState(state, errorMsg = '') {
        stateLoading.classList.add('hidden');
        stateEmpty.classList.add('hidden');
        stateError.classList.add('hidden');
        tableWrapper.classList.add('hidden');
        paginationContainer.classList.add('hidden');

        if (state === 'loading') {
            stateLoading.classList.remove('hidden');
        } else if (state === 'empty') {
            stateEmpty.classList.remove('hidden');
        } else if (state === 'error') {
            stateError.innerText = errorMsg;
            stateError.classList.remove('hidden');
        } else if (state === 'ready') {
            tableWrapper.classList.remove('hidden');
            paginationContainer.classList.remove('hidden');
        }
    }

    // --- 6. Drawer Management ---
    function openDrawer(log) {
        let payloadStr = "{}";
        try {
            payloadStr = JSON.stringify(log.payload || {}, null, 2);
        } catch (e) {
            payloadStr = String(log.payload);
        }

        drawerContent.innerHTML = `
            <div style="margin-bottom: 2rem;">
                <div class="detail-row">
                    <span class="detail-label">ID</span>
                    <span class="detail-value">${escapeHtml(log.id)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tenant ID</span>
                    <span class="detail-value">${escapeHtml(log.tenantId)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">User Agent</span>
                    <span class="detail-value" style="text-align: right; max-width: 60%; word-break: break-all;">${escapeHtml(log.userAgent)}</span>
                </div>
            </div>

            <span class="detail-label" style="display: block; margin-bottom: 0.5rem;">Payload</span>
            <pre>${escapeHtml(payloadStr)}</pre>
        `;
        drawerOverlay.classList.add('active');
        drawer.classList.add('active');
    }

    function closeDrawer() {
        drawerOverlay.classList.remove('active');
        drawer.classList.remove('active');
    }

    drawerOverlay.addEventListener('click', closeDrawer);
    btnCloseDrawer.addEventListener('click', closeDrawer);

    // --- 7. Event Listeners ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        currentOffset = 0; // Reset pagination on new search
        fetchLogs();
    });

    btnReset.addEventListener('click', () => {
        form.reset();
        currentOffset = 0;
        fetchLogs();
    });

    btnPrev.addEventListener('click', () => {
        if (currentOffset > 0) {
            currentOffset -= currentLimit;
            fetchLogs();
        }
    });

    btnNext.addEventListener('click', () => {
        if ((currentOffset + currentLimit) < totalLogs) {
            currentOffset += currentLimit;
            fetchLogs();
        }
    });

    // --- 8. Init ---
    // Do not auto-fetch if token is missing
    const token = getAuthToken();
    if (!token) {
        setUIState('error', 'AUTHENTICATION REQUIRED. TOKEN MISSING.');
    } else {
        fetchLogs();
    }
});
