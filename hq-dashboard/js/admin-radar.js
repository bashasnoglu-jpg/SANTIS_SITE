/**
 * SANTIS SOVEREIGN OS - ADMIN RADAR CONTROLLER (V13)
 * Görev: SSE Canlı Akış (Primary) + Zaman Yolculuğu (Phase 80)
 * Status: Phase 80 - Sovereign Intelligence Ops Sealed
 */

class RadarEngine {
    constructor() {
        this.state = {
            revenue: 0,
            conversion: 0,
            capacity: 85,
            activeSessions: 0,
            isFirstLoad: true,
            connectionStatus: 'disconnected',
            
            // --- TIME TRAVEL STATE (Phase 80) ---
            mode: 'live', // 'live' | 'historical'
            historicalTime: null,
            liveBuffer: [], 
            snapshots: []
        };

        this.chart = null;
        this.syncInterval = null;
        this.sseSource = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.initDOM();
        this.initChart();
        this.bindEvents();
        this.bindTimeTravelEvents();
        
        // 🚀 Sovereign Akışını Başlat
        this.initLiveFeed();
    }

    initDOM() {
        setTimeout(() => {
            const elements = ['ui-header', 'ui-vitals', 'ui-core'];
            elements.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('opacity-0', 'translate-y-4');
            });
        }, 100);
    }

    initChart() {
        const chartEl = document.getElementById('revenueChart');
        if (!chartEl) return;

        const ctx = chartEl.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)'); 
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

        Chart.defaults.color = 'rgba(148, 163, 184, 0.95)';
        Chart.defaults.font.family = "'Inter', sans-serif";

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', 'Şimdi'],
                datasets: [{
                    label: 'Ciro (€)',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#10b981', backgroundColor: gradient,
                    borderWidth: 2, tension: 0.4, fill: true,
                    pointBackgroundColor: '#050505', pointBorderColor: '#10b981', pointBorderWidth: 2, pointRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true } } }
        });
    }

    bindEvents() {
        const trigger = document.getElementById('reset-trigger');
        if (trigger) {
            trigger.addEventListener('dblclick', () => {
                localStorage.clear();
                location.reload();
            });
        }
    }

    bindTimeTravelEvents() {
        const slider = document.getElementById('time-slider');
        const resetBtn = document.getElementById('reset-time');

        if (slider) {
            slider.addEventListener('input', (e) => {
                const value = Number(e.target.value);
                if (value === 100) {
                    this.exitHistoricalMode();
                    return;
                }
                const now = Date.now();
                const offsetMs = (100 - value) * 18000;
                const targetTs = now - offsetMs;
                this.setTimeCursor(targetTs);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (slider) slider.value = 100;
                this.exitHistoricalMode();
            });
        }
    }

    // --- SSE LIVE FEED ---
    initLiveFeed() {
        if (this.sseSource) this.sseSource.close();
        this.sseSource = new EventSource('/api/v1/core-state/stream');

        this.sseSource.onopen = () => {
            this.state.connectionStatus = 'connected';
            this.reconnectAttempts = 0;
            this.syncWithBackend();
            this.stopSyncLoop();
        };

        this.sseSource.addEventListener('strategy_update', (e) => {
            try {
                this.handleStreamPatch(JSON.parse(e.data));
            } catch (err) { console.error('SSE Error:', err); }
        });

        this.sseSource.addEventListener('action_rail_update', (e) => {
            try {
                const payload = JSON.parse(e.data);
                this.addToLiveFeed(payload.data?.patch);
            } catch (err) { console.error('Action Rail Error:', err); }
        });

        // 🔥 Phase 81: Cognitive Insights Listener
        this.sseSource.addEventListener('action_rail', (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload.data?.type === 'cognitive_insights_update') {
                    this.renderCognitiveInsights(payload.data.insights);
                } else {
                    this.addToLiveFeed(payload.data);
                }
            } catch (err) { console.error('Cognitive Insights Error:', err); }
        });

        this.sseSource.onerror = () => {
            this.state.connectionStatus = 'fallback';
            this.sseSource.close();
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                this.startSyncLoop();
                setTimeout(() => this.initLiveFeed(), 10000);
            }
        };
    }

    // --- TIME TRAVEL ENGINE ---
    async setTimeCursor(timestamp) {
        if (!timestamp) return;
        this.state.mode = 'historical';
        this.state.historicalTime = Number(timestamp);
        this.updateBadge('HISTORY');

        try {
            const response = await fetch(`/api/v1/boardroom/reconstruct?at=${new Date(Number(timestamp)).toISOString()}`);
            const result = await response.json();
            if (result.success && result.state) {
                this.applyHistoricalState(result.state);
            }
        } catch (err) { console.error('Reconstruction Error:', err); }
    }

    applyHistoricalState(historicalState) {
        this.state.revenue = historicalState.revenue;
        this.state.activeSessions = historicalState.activeSessionsCount;
        this.renderState(true);
    }

    exitHistoricalMode() {
        this.state.mode = 'live';
        this.state.historicalTime = null;
        this.updateBadge('LIVE');
        this.syncWithBackend();
        this.state.liveBuffer = [];
    }

    updateBadge(text) {
        const badge = document.getElementById('status-badge');
        if (!badge) return;
        badge.innerText = text;
        if (text === 'LIVE') {
            badge.classList.replace('text-santisGold', 'text-santisEmerald');
            badge.classList.replace('border-santisGold/30', 'border-santisEmerald/20');
        } else {
            badge.classList.replace('text-santisEmerald', 'text-santisGold');
            badge.classList.replace('border-santisEmerald/20', 'border-santisGold/30');
        }
    }

    handleStreamPatch(payload) {
        if (!payload.data || !payload.data.patch) return;
        if (this.state.mode === 'historical') {
            this.state.liveBuffer.push(payload);
            return;
        }

        const patch = payload.data.patch;
        if (patch.value !== undefined) {
            if (payload.data.scope === 'revenue') {
                this.state.revenue = Number(patch.value);
            }
        }
        this.renderState(true);
    }

    // --- UTILS & RENDERING ---
    async syncWithBackend() {
        try {
            const response = await fetch('/api/v1/core-state');
            const data = await response.json();
            this.updateState(data);
        } catch (error) { console.error('Sync Error:', error); }
    }

    startSyncLoop() {
        if (!this.syncInterval) {
            this.syncInterval = setInterval(() => this.syncWithBackend(), 5000);
        }
    }

    stopSyncLoop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    updateState(backendData) {
        this.state.revenue = Number(backendData.revenue?.today || 0);
        this.state.activeSessions = Number(backendData.sessions?.active || 0);
        const hesitation = Number(backendData.sessions?.hesitationIndex || 0);
        this.state.conversion = Math.round(100 - (hesitation * 100));
        this.renderState(this.state.isFirstLoad);
    }

    renderState(animate) {
        const revEl = document.getElementById('vital-revenue');
        const convEl = document.getElementById('vital-conversion');
        const capEl = document.getElementById('vital-capacity');
        const capBar = document.getElementById('capacity-bar');

        if (revEl) {
            const newText = this.state.revenue.toLocaleString('en-US');
            if (revEl.innerText !== newText) {
                revEl.innerText = newText;
                if (animate && !this.state.isFirstLoad) {
                    revEl.classList.add('text-santisGold', 'scale-110');
                    setTimeout(() => revEl.classList.remove('text-santisGold', 'scale-110'), 600);
                }
            }
        }

        if (convEl) convEl.innerText = this.state.conversion;
        const capValue = Math.min(100, 70 + (this.state.activeSessions * 5));
        if (capEl) capEl.innerText = capValue;
        if (capBar) capBar.style.width = `${capValue}%`;

        if (this.chart) {
            this.chart.data.datasets[0].data[6] = this.state.revenue;
            this.chart.update('none');
        }
        this.state.isFirstLoad = false;
    }

    // --- COGNITIVE GOVERNOR UI (Phase 81) ---
    renderCognitiveInsights(insights) {
        const container = document.getElementById('live-feed-list');
        if (!container || !insights) return;

        // Önce eski insight'ları temizle (isteğe bağlı, ama karmaşayı önler)
        document.querySelectorAll('.cognitive-insight-card').forEach(el => el.remove());

        insights.forEach(insight => {
            const card = document.createElement('div');
            card.className = 'cognitive-insight-card p-4 rounded-xl border border-santisGold/40 bg-santisGold/10 mb-4 animate-pulse-subtle shadow-[0_0_20px_rgba(180,150,90,0.1)]';
            
            card.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">🧠</span>
                        <span class="text-[10px] text-santisGold font-bold uppercase tracking-widest">Sovereign Insight</span>
                    </div>
                    <span class="text-[9px] px-2 py-0.5 bg-santisGold/20 text-santisGold rounded-full font-mono font-bold">${Math.round(insight.confidence * 100)}% Confidence</span>
                </div>
                <div class="text-[12px] text-white/90 font-medium mb-2 leading-relaxed">${insight.message}</div>
                <div class="p-2 bg-black/20 rounded border border-white/5 mb-3">
                    <div class="text-[9px] text-cyber-muted uppercase mb-1 tracking-tighter">Evidence Chain</div>
                    <div class="text-[10px] text-white/50 italic">"${insight.evidence.previousOutcome}" at ${new Date(insight.evidence.timestamp).toLocaleTimeString()}</div>
                </div>
                <button onclick="this.closest('.cognitive-insight-card').remove()" 
                        class="w-full py-1 text-[9px] text-white/30 hover:text-santisGold uppercase font-bold tracking-tighter transition-colors">
                    Dismiss Insight
                </button>
            `;
            
            container.prepend(card);
        });
    }

    // --- COMMANDS (Phase 78/79) ---
    async approveAction(id, btn) {
        this.setLoadingState(btn, true);
        try {
            const response = await fetch(`/api/v1/boardroom/actions/${id}/approve`, { method: 'POST' });
            const result = await response.json();
            if (result.success) btn.closest('.action-card')?.classList.add('opacity-50', 'pointer-events-none');
        } catch (err) { console.error('Approve Error:', err); }
        this.setLoadingState(btn, false);
    }

    async rejectAction(id, btn) {
        this.setLoadingState(btn, true);
        try {
            const response = await fetch(`/api/v1/boardroom/actions/${id}/reject`, { method: 'POST' });
            const result = await response.json();
            if (result.success) btn.closest('.action-card')?.classList.add('opacity-50', 'pointer-events-none');
        } catch (err) { console.error('Reject Error:', err); }
        this.setLoadingState(btn, false);
    }

    setLoadingState(btn, isLoading) {
        if (isLoading) {
            btn.dataset.originalText = btn.innerText;
            btn.innerHTML = '<span class="animate-spin inline-block mr-1">⌛</span>...';
            btn.disabled = true;
        } else {
            btn.innerText = btn.dataset.originalText || 'Action';
            btn.disabled = false;
        }
    }

    addToLiveFeed(patch) {
        const feedContainer = document.getElementById('live-feed-list');
        const auditContainer = document.getElementById('audit-log-list');
        if (!patch) return;

        if (patch.type === 'action_resolved' && patch.resolvedActionId) {
            const card = document.querySelector(`.action-card[data-id="${patch.resolvedActionId}"]`);
            if (card) {
                card.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => card.remove(), 400);
            }
        }

        if (patch.auditLog && auditContainer) {
            auditContainer.innerHTML = '';
            patch.auditLog.forEach(entry => this.renderAuditEntry(entry, auditContainer));
        }

        if (patch.type === 'new_recommendation' && patch.action && feedContainer) {
            this.renderActionCard(patch.action, feedContainer);
        }
    }

    renderAuditEntry(entry, container) {
        const logItem = document.createElement('div');
        logItem.className = 'flex items-start gap-3 p-2 mb-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group';
        const isApproved = entry.type === 'action.approved';
        const icon = isApproved ? '✅' : '❌';
        const statusClass = isApproved ? 'text-santisEmerald' : 'text-red-400';
        const time = new Date(entry.occurredAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        logItem.innerHTML = `
            <div class="text-sm mt-0.5">${icon}</div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center mb-0.5">
                    <span class="text-[10px] font-bold ${statusClass} uppercase tracking-wider">${entry.type.split('.')[1]}</span>
                    <span class="text-[9px] text-cyber-muted font-mono">${time}</span>
                </div>
                <div class="text-[11px] text-white/70 truncate">Action: ${entry.actionId.substring(0,8)}</div>
            </div>
        `;
        container.appendChild(logItem);
    }

    renderActionCard(action, container) {
        if (document.querySelector(`.action-card[data-id="${action.id}"]`)) return;
        const card = document.createElement('div');
        card.className = 'action-card p-4 rounded-xl border border-santisGold/30 bg-santisGold/5 mb-3 transition-all duration-500 transform translate-x-0';
        card.dataset.id = action.id;
        const priorityColor = action.priority === 'high' ? 'text-red-400' : 'text-santisGold';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] ${priorityColor} uppercase tracking-tighter font-bold border border-${priorityColor}/20 px-1.5 rounded">${action.priority} PRIORITY</span>
                <span class="text-[10px] text-cyber-muted font-mono">ID: ${action.id.substring(0,6)}</span>
            </div>
            <div class="text-sm font-bold text-white mb-1">${action.title}</div>
            <div class="text-xs text-cyber-muted mb-4 font-serif italic">${action.description}</div>
            <div class="flex gap-2">
                <button onclick="window.RadarEngine.approveAction('${action.id}', this)" class="flex-1 py-1.5 bg-santisEmerald/20 hover:bg-santisEmerald text-santisEmerald hover:text-white text-[10px] font-bold uppercase tracking-wider rounded transition-all">Approve</button>
                <button onclick="window.RadarEngine.rejectAction('${action.id}', this)" class="flex-1 py-1.5 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded transition-all">Reject</button>
            </div>
        `;
        container.prepend(card);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.RadarEngine = new RadarEngine();
});
