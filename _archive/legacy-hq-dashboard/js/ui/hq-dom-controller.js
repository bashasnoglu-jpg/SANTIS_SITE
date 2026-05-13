import { hqStore } from '../core/hq-store.js';

export function initDomController() {
    // Expose DOM methods for HTML onclick calls (until fully decoupled)
    window.openDeepDive = openDeepDive;
    window.closeDeepDive = closeDeepDive;
    window.openDeployModal = openDeployModal;
    window.closeDeployModal = closeDeployModal;
    window.dispatchLiveCommand = (id, cmd) => console.log(`[DOM] Execute Command ${cmd} on ${id}`);
    window.dispatchMidasProtocol = dispatchMidasProtocol;
    window.__HQ_DOM_CONTROLLER__ = { openOmniZoom, closeOmniZoom };

    document.getElementById('close-zoom-btn')?.addEventListener('click', closeOmniZoom);

    // Subscribe to Store updates to reflect data in HTML elements
    hqStore.subscribe(state => {
        updateDOMCounters(state);
        updateLiveFeed(state.feed);
        updateHeatmap(state.heatmap);
    });
}

function updateDOMCounters(state) {
    const formatEur = (num) => num >= 1000 ? '€' + (num/1000).toFixed(1) + 'K' : '€' + num;

    if (state.network) {
        setText('stat-total-tenants', state.network.total_tenants);
        setText('stat-total-hotels', `/ ${state.network.total_hotels}`);
    }
    if (state.performance) {
        setText('stat-global-revenue', formatEur(state.performance.today_revenue));
        setText('stat-ai-bookings', state.performance.today_bookings);
    }
    if (state.yieldStatus) {
        setText('stat-yield-multiplier', state.yieldStatus.multiplier.toFixed(2));
        setText('stat-yield-status', state.yieldStatus.action);
    }
    if (state.aiInsight) {
        setText('stat-ai-insight-panel', state.aiInsight.text);
        setText('ai-latency-ms', `${state.aiInsight.latency}ms`);
        const latCont = document.getElementById('ai-latency-container');
        if(latCont) latCont.style.display = 'flex';
        
        setText('ai-staffing-text', state.aiInsight.staffing);
        const staffCont = document.getElementById('ai-staffing-container');
        if(staffCont) staffCont.style.display = 'flex';
    }
}

function setText(id, val) {
    const el = document.getElementById(id);
    if(el) el.innerText = val;
}

function updateLiveFeed(feedData) {
    const body = document.getElementById('live-feed-body');
    if(!body || !feedData || feedData.length === 0) return;

    body.innerHTML = feedData.map((row, i) => `
        <tr class="hover:bg-slate-800/30 transition-colors group cursor-pointer ${row.status === 'CONFIRMED' && i === 0 ? 'animate-[fadeIn_0.5s_ease-out] bg-cyan-900/10 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]' : ''}" onclick="openDeepDive('${row.id}')">
            <td class="py-4 px-6 font-mono text-cyan-400">${row.booked_at}</td>
            <td class="py-4 px-6 font-medium border-l-2 border-transparent group-hover:border-cyan-500">${row.hotel_name || 'System Hub'}</td>
            <td class="py-4 px-6 text-slate-400"><span class="bg-cyan-900/40 border border-cyan-700/50 px-2 py-0.5 rounded text-xs text-cyan-200">NODE_TX</span></td>
            <td class="py-4 px-6 text-cyan-100">${row.service_name || 'Custom Deal'}</td>
            <td class="py-4 px-6">
                <span class="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-mono ${row.status === 'CONFIRMED' ? 'text-emerald-400 border-emerald-500/20' : 'text-amber-500 border-amber-500/20'} border">
                    <span class="w-1.5 h-1.5 rounded-full ${row.status === 'CONFIRMED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span> 
                    ${row.status || 'PENDING'}
                </span>
            </td>
            <td class="py-4 px-6 font-mono font-medium text-right ${row.status === 'CONFIRMED' ? 'text-emerald-400' : ''}">€${row.price_charged}</td>
        </tr>
    `).join('');
}

function updateHeatmap(heatmapData) {
    if(!heatmapData) return;
    const insightEl = document.getElementById('heatmap-insight');
    if(insightEl && heatmapData.insight) {
        insightEl.innerText = heatmapData.insight;
    }

    const tbody = document.getElementById('euro-heatmap-body');
    if(!tbody || !heatmapData.data) return;

    tbody.innerHTML = heatmapData.data.map(row => {
        const isHighRoller = row.aov >= 500;
        const isDomestic = row.country.includes('TR');
        return `
            <tr class="hover:bg-slate-800/30 transition-colors group cursor-default">
                <td class="py-4 px-4 font-medium border-l-2 border-transparent ${isHighRoller ? 'group-hover:border-indigo-500 text-slate-200' : 'group-hover:border-emerald-500 text-slate-300'}">${row.country}</td>
                <td class="py-4 px-4 font-mono text-right ${isHighRoller ? 'text-indigo-400 font-bold' : 'text-emerald-400'}">€${row.aov.toFixed(2)}</td>
                <td class="py-4 px-4 text-right text-slate-400">${row.conversion_rate}%</td>
                <td class="py-4 px-4 font-mono text-right ${row.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'} bg-slate-900/50 rounded-r-lg">${row.trend}</td>
                <td class="py-4 px-4 text-center">
                    <button class="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white px-3 py-1.5 rounded disabled:opacity-50" ${isDomestic ? 'disabled' : ''}>
                        ${isDomestic ? 'Domestic' : 'Deploy Global AI'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ── Modals & Dialogs ──
function openDeepDive(id) {
    const modal = document.getElementById('deep-dive-modal');
    const content = document.getElementById('deep-dive-content');
    if(!modal || !content) return;
    
    // Yüksek z-index'li modal katmanı
    modal.classList.add('hq-modal-layer');
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
        modal.classList.add('opacity-100');
    }, 10);
}
function closeDeepDive() {
    const modal = document.getElementById('deep-dive-modal');
    const content = document.getElementById('deep-dive-content');
    if(!modal) return;
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 500);
}

function openDeployModal() {
    const deployModal = document.getElementById('deploy-modal');
    const deployModalContent = document.getElementById('deploy-modal-content');
    if(!deployModal) return;
    deployModal.classList.add('hq-modal-layer');
    deployModal.classList.remove('hidden');
    deployModal.classList.add('flex');
    setTimeout(() => {
        deployModal.classList.remove('opacity-0');
        deployModalContent.classList.remove('scale-95');
    }, 10);
}
function closeDeployModal() {
    const deployModal = document.getElementById('deploy-modal');
    const deployModalContent = document.getElementById('deploy-modal-content');
    if(!deployModal) return;
    deployModal.classList.add('opacity-0');
    deployModalContent.classList.add('scale-95');
    setTimeout(() => {
        deployModal.classList.add('hidden');
        deployModal.classList.remove('flex');
    }, 300);
}

function openOmniZoom(nodeData) {
    const panel = document.getElementById('omni-zoom-panel');
    if(!panel) return;
    panel.classList.add('hq-omni-panel');
    panel.style.transform = 'translateY(0)';
}

function closeOmniZoom() {
    const panel = document.getElementById('omni-zoom-panel');
    if(!panel) return;
    panel.style.transform = 'translateY(100%)';
    const engine = window.__HQ_MAP_ENGINE__;
    if(engine) engine.resetViewport();
}

// ── OMEGA: Midas Protocol (Surge Pricing) ──
let midasTimer = null;
function dispatchMidasProtocol(btn) {
    const isActive = localStorage.getItem('santis_surge_pricing') === 'active';
    
    if (isActive) {
        // TURN OFF (Normalize)
        localStorage.removeItem('santis_surge_pricing');
        clearTimeout(midasTimer);
        btn.innerHTML = `<svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Midas Protokolü Devreye Al`;
        btn.classList.remove('bg-amber-500/20', 'border-amber-500', 'text-amber-400', 'shadow-[0_0_20px_rgba(245,158,11,0.5)]');
        btn.classList.add('bg-white/10', 'border-white/20', 'text-white', 'hover:shadow-cyan-500/30');
        console.log('[MIDAS] Nöral Ağ Üzerinden Surge Kapatıldı. Çarpan: 1.0x (Normal)');
        hqStore.setState({ aiInsight: { text: "Surge Penceresi Kapandı. Fiyatlar normalize edildi.", latency: 12, staffing: "Stabil" } });
    } else {
        // TURN ON (Surge +%18)
        localStorage.setItem('santis_surge_pricing', 'active');
        btn.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"></path></svg> Midas Devrede (Durdur)`;
        btn.classList.remove('bg-white/10', 'border-white/20', 'text-white', 'hover:shadow-cyan-500/30');
        btn.classList.add('bg-amber-500/20', 'border-amber-500', 'text-amber-400', 'shadow-[0_0_20px_rgba(245,158,11,0.5)]');
        console.log('[MIDAS] Nöral Ağ Üzerinden Surge Tetiği Çekildi! Çarpan: 1.18x');
        hqStore.setState({ aiInsight: { text: "YÜKSEK TALEP: Midas Protokolü Aktif! Fiyatlar +%18 artırıldı.", latency: 4, staffing: "Kritik" } });
        
        // 30 seconds quantum fading
        midasTimer = setTimeout(() => {
            const stillActive = localStorage.getItem('santis_surge_pricing') === 'active';
            if(stillActive) dispatchMidasProtocol(btn);
        }, 30000);
    }
}

