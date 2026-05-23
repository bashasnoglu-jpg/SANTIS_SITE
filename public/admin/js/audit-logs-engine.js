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

    // --- 3. Placeholder Auth Adapter (Fail closed) ---
    // In a real scenario, the token would be retrieved from localStorage/sessionStorage.
    function getAuthToken() {
        // Return a mock token for development purposes to pass JWT existence checks, 
        // or return null to trigger "Authentication required".
        // The user mentioned "If auth token is not available yet, use a safe placeholder auth adapter: fail closed".
        // Assuming the admin dashboard uses cookie-based auth or local storage.
        const token = localStorage.getItem('santis_admin_token');
        if (!token) {
            console.warn('[Audit Logs Engine] Authentication required. Token missing.');
        }
        return token;
    }

    // --- 4. Fetch & Render ---
    async function fetchLogs() {
        setUIState('loading');
        
        try {
            // Build query params
            const params = new URLSearchParams();
            params.append('limit', currentLimit);
            params.append('offset', currentOffset);
            
            const formData = new FormData(form);
            for (let [key, value] of formData.entries()) {
                if (value) {
                    if (key === 'startDate' || key === 'endDate') {
                        // datetime-local returns YYYY-MM-DDThh:mm, append Z to convert to UTC if needed
                        params.append(key, new Date(value).toISOString());
                    } else {
                        params.append(key, value);
                    }
                }
            }

            const token = getAuthToken();
            const headers = {
                'Accept': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

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
            // Expected { data: [...], meta: { total, limit, offset } }
            
            if (responseBody.meta) {
                currentData = responseBody.data || [];
                totalLogs = responseBody.meta.total || 0;
            } else if (Array.isArray(responseBody)) {
                // Fallback if backend hasn't implemented envelope yet
                currentData = responseBody;
                totalLogs = responseBody.length; // Approximate
            }

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
            
            const timeString = new Date(log.created_at).toLocaleString('tr-TR');
            const eventVal = log.event || 'UNKNOWN';
            const actorVal = log.actor_id || '-';
            const actorTypeVal = log.actor_type || '-';
            const sourceVal = log.source || '-';
            const ipVal = log.ip_address || '-';

            tr.innerHTML = `
                <td style="font-family: monospace; color: var(--santis-muted);">${timeString}</td>
                <td><span class="tag event">${eventVal}</span></td>
                <td style="font-family: monospace; font-size: 0.8rem;">${actorVal}</td>
                <td>${actorTypeVal}</td>
                <td>${sourceVal}</td>
                <td style="font-family: monospace; color: var(--santis-muted);">${ipVal}</td>
                <td><button class="btn-inspect" data-id="${log.id}">Inspect</button></td>
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
                    <span class="detail-value">${log.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tenant ID</span>
                    <span class="detail-value">${log.tenant_id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">User Agent</span>
                    <span class="detail-value" style="text-align: right; max-width: 60%; word-break: break-all;">${log.user_agent || '-'}</span>
                </div>
            </div>
            
            <span class="detail-label" style="display: block; margin-bottom: 0.5rem;">Payload</span>
            <pre>${payloadStr}</pre>
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
    fetchLogs();
});
