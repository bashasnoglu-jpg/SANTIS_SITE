/**
 * BOARDROOM ACTION RAIL v1.0
 * Provides active Command & Control (C2) interface for Santis OS.
 */
class BoardroomActionRail {
    constructor(engine) {
        this.engine = engine;
        this.containerId = 'boardroom-action-rail';
        this.actions = [
            { id: 'force_reduce_ui', label: 'Force Reduce UI', icon: '📉', class: 'warn', reason: 'high_hesitation' },
            { id: 'handoff_to_human', label: 'Human Handoff', icon: '👤', class: 'merchant', reason: 'vip_exception' },
            { id: 'lock_recommendation', label: 'Lock Pricing', icon: '🔒', class: 'critical', reason: 'pricing_risk' },
            { id: 'freeze_session', label: 'Freeze Session', icon: '❄️', class: 'static_luxury', reason: 'operator_intervention' }
        ];
    }

    render() {
        const section = document.createElement('section');
        section.id = this.containerId;
        section.className = 'mt-6 p-4 rounded-xl border border-white/10 glass-panel shadow-2xl';
        section.style.background = 'rgba(28, 28, 30, 0.4)';

        section.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <span style="font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#D4AF37;">Operational Overrides</span>
                <span class="text-[9px] text-white/40 font-mono tracking-tighter">C2-ACTIVE</span>
            </div>
            <div class="grid grid-cols-2 gap-3" id="action-rail-grid">
                ${this.actions.map(action => `
                    <button 
                        class="santis-ai-btn ${action.class} w-full py-3 flex flex-col items-center justify-center gap-1 group transition-all"
                        data-action="${action.id}"
                        data-reason="${action.reason}"
                        style="height: 64px; border-width: 1.5px;"
                    >
                        <span class="text-lg group-hover:scale-110 transition-transform">${action.icon}</span>
                        <span class="text-[9px] tracking-widest">${action.label}</span>
                    </button>
                `).join('')}
            </div>
            <div id="action-status-log" class="mt-4 p-2 rounded bg-black/40 border border-white/5 hidden">
                <p class="text-[8px] text-santis-emerald font-mono uppercase tracking-widest text-center" id="action-status-text">
                    Command Acknowledged
                </p>
            </div>
        `;

        return section;
    }

    mount(parent) {
        const el = this.render();
        parent.appendChild(el);
        this.bindEvents(el);
    }

    bindEvents(container) {
        container.querySelectorAll('.santis-ai-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const action = btn.dataset.action;
                const reason = btn.dataset.reason;
                
                // Visual feedback: Busy
                btn.style.opacity = '0.5';
                btn.style.pointerEvents = 'none';
                
                try {
                    await this.engine.dispatchOverride(action, reason);
                    // Actual ACK will come via SSE
                } catch (err) {
                    console.error('Command Dispatch Failed:', err);
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'all';
                    this.showStatus('ERROR: Dispatch Failed', 'critical');
                }
            });
        });

        // Listen for Global command_ack events (sent via SSE)
        window.addEventListener('santis:command-ack', (e) => {
            const { action, status } = e.detail;
            const btn = container.querySelector(`[data-action="${action}"]`);
            if (btn) {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'all';
                
                if (status === 'executed') {
                    this.pulseSuccess(btn);
                    this.showStatus(`COMMAND EXECUTED: ${action.replace(/_/g, ' ')}`, 'emerald');
                }
            }
        });
    }

    pulseSuccess(btn) {
        btn.classList.add('gold-flash');
        setTimeout(() => btn.classList.remove('gold-flash'), 1000);
    }

    showStatus(text, colorClass) {
        const log = document.getElementById('action-status-log');
        const txt = document.getElementById('action-status-text');
        
        log.classList.remove('hidden');
        txt.innerText = text;
        txt.style.color = colorClass === 'emerald' ? '#00FFC2' : '#FF3E3E';
        
        setTimeout(() => {
            log.classList.add('hidden');
        }, 3000);
    }
}

// Auto-injection into Boardroom Aside
document.addEventListener('DOMContentLoaded', () => {
    if (window.SantisCore && (document.body.classList.contains('nv-boardroom-pro') || window.location.pathname.includes('boardroom'))) {
        const aside = document.querySelector('.sovereign-aside');
        if (aside) {
            const rail = new BoardroomActionRail(window.SantisCore);
            // Inject before the "Pulse" feed
            const pulseFeed = document.getElementById('pulse-feed');
            if (pulseFeed) {
                aside.insertBefore(rail.render(), pulseFeed);
                rail.bindEvents(aside.querySelector('#boardroom-action-rail'));
            }
        }
    }
});
