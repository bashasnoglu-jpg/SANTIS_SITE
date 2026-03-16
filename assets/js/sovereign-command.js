/**
 * ═══════════════════════════════════════════════════════════════════
 * 🦅 SANTIS SOVEREIGN COMMAND V1.0 — Enterprise Realtime Controller
 * ═══════════════════════════════════════════════════════════════════
 *
 * Dual-Mode Command Bus:
 *   • BroadcastChannel — local development (tab-to-tab, same-origin)
 *   • WebSocket (SovereignBus) — production (server-routed)
 *
 * Command Registry:
 *   layout_switch    → Grid/Rail/Giant-Rail düzen değişimi
 *   apex_lock        → Darwinian kazanan varyantını kilitle
 *   apex_unlock      → Otonom evrime geri dön
 *   mood_inject      → Mood Engine'i uzaktan tetikle
 *   mood_reset       → Mood filtresini sıfırla
 *   promo_bundle     → Anlık promosyon banner'ı enjekte et
 *   seal_system      → Acil durum mühürlemesi
 *   unseal_system    → Mühürü kaldır
 *
 * Architecture:
 *   Admin (gods-eye-command.html) → BroadcastChannel → Frontend tabs
 *   Admin (gods-eye-command.html) → SovereignBus WS → Server → Clients
 */

(function SovereignCommand() {
    'use strict';

    if (window.SovereignCommand) return;

    // ═══════════════════════════════════════════════════════
    // ADMIN PAGE GUARD — Admin sayfaları sadece GÖNDERİCİ'dir,
    // komut ALICI değildir. Bu script admin'de çalışmamalı.
    // ═══════════════════════════════════════════════════════
    if (window.location.pathname.includes('/admin/')) {
        console.log('⚡ [Sovereign Command] Admin page detected — receiver disabled (admin is sender-only).');
        return;
    }

    const CHANNEL_NAME = 'santis-command';
    const LOG = '⚡ [Sovereign Command]';
    let channel = null;
    let commandLog = [];

    // ═══════════════════════════════════════════════════════
    // COMMAND HANDLER REGISTRY
    // ═══════════════════════════════════════════════════════

    const CommandHandlers = {

        /**
         * 🎛️ LAYOUT SWITCH
         * Kart grid düzenini anında değiştirir
         * payload: { layout: 'grid' | 'rail' | 'giant-rail' }
         */
        layout_switch(data) {
            const containers = document.querySelectorAll('.santis-matrix-container, #santis-data-matrix-grid');
            if (containers.length === 0) return logCmd('layout_switch', false, 'No matrix container found');

            containers.forEach(c => {
                c.setAttribute('data-layout', data.layout || 'grid');

                // Rail düzen ayarları
                if (data.layout === 'rail') {
                    c.style.display = 'flex';
                    c.style.gap = '20px';
                    c.style.overflowX = 'auto';
                    c.style.overflowY = 'hidden';
                    c.style.scrollSnapType = 'x mandatory';
                    c.style.scrollbarWidth = 'none';
                    c.style.flexWrap = 'nowrap';
                } else {
                    c.style.display = '';
                    c.style.gap = '';
                    c.style.overflowX = '';
                    c.style.overflowY = '';
                    c.style.scrollSnapType = '';
                    c.style.flexWrap = '';
                }
            });

            // Kartları yeniden düzenle
            const cards = document.querySelectorAll('.matrix-service-card, .nv-matrix-card');
            cards.forEach(card => {
                if (data.layout === 'rail') {
                    card.style.minWidth = '340px';
                    card.style.flex = '0 0 auto';
                    card.style.aspectRatio = '3/5';
                } else {
                    card.style.minWidth = '';
                    card.style.flex = '';
                    card.style.aspectRatio = '';
                }
            });

            logCmd('layout_switch', true, `Layout → ${data.layout} (${containers.length} container, ${cards.length} card)`);
        },

        /**
         * 👑 APEX LOCK
         * Darwinian kazanan varyantını tüm kartlara zorlar
         * payload: { variantHash: 'brightness(0.7)...' }
         */
        apex_lock(data) {
            const hash = data.variantHash;
            if (!hash) return logCmd('apex_lock', false, 'No variantHash provided');

            document.querySelectorAll('[data-variant-hash]').forEach(card => {
                const img = card.querySelector('img');
                if (img) img.style.filter = hash;
                card.setAttribute('data-variant-hash', hash);
            });
            window._apexLocked = hash;

            logCmd('apex_lock', true, `Variant locked: ${hash.substring(0, 40)}...`);
        },

        /**
         * 🔓 APEX UNLOCK
         * Otonom evrime geri dön
         */
        apex_unlock() {
            window._apexLocked = null;
            logCmd('apex_unlock', true, 'Autonomous evolution restored');
        },

        /**
         * 🧠 MOOD INJECT
         * Mood Engine'i uzaktan tetikle
         * payload: { moodId: 'purification' | 'energy' | 'compassion' | 'luxury' }
         */
        mood_inject(data) {
            if (window.SantisMoodEngine && window.SantisMoodEngine.activateMood) {
                window.SantisMoodEngine.activateMood(data.moodId);
                logCmd('mood_inject', true, `Mood activated: ${data.moodId}`);
            } else {
                logCmd('mood_inject', false, 'SantisMoodEngine not available on this page');
            }
        },

        /**
         * 🔄 MOOD RESET
         * Mood filtresini sıfırla
         */
        mood_reset() {
            if (window.SantisMoodEngine && window.SantisMoodEngine.reset) {
                window.SantisMoodEngine.reset();
                logCmd('mood_reset', true, 'Mood filter reset');
            } else {
                logCmd('mood_reset', false, 'SantisMoodEngine not available');
            }
        },

        /**
         * 📦 PROMO BUNDLE
         * Anlık promosyon banner'ı enjekte et
         * payload: { title, message, discount, cta, color, url }
         */
        promo_bundle(data) {
            // Eski promo varsa kaldır
            const existing = document.getElementById('sovereign-promo-overlay');
            if (existing) existing.remove();

            const color = data.color || '#d4af37';
            const overlay = document.createElement('div');
            overlay.id = 'sovereign-promo-overlay';
            overlay.style.cssText = `
                position: fixed; bottom: 24px; right: 24px; z-index: 99990;
                max-width: 380px; padding: 0; border-radius: 16px;
                background: rgba(10,10,9,0.96); border: 1px solid ${color}33;
                backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${color}15;
                opacity: 0; transform: translateY(20px) scale(0.95);
                transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                font-family: 'Inter', sans-serif; overflow: hidden;
            `;

            overlay.innerHTML = `
                <div style="padding: 24px 24px 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <span style="font-size: 0.6rem; font-weight: 700; letter-spacing: 2.5px;
                            text-transform: uppercase; color: ${color}; background: ${color}15;
                            padding: 4px 12px; border-radius: 20px;">
                            ✨ Özel Teklif
                        </span>
                        <button id="promo-close-btn" style="background: none; border: none;
                            color: rgba(255,255,255,0.3); cursor: pointer; font-size: 1.2rem;
                            padding: 0; line-height: 1; transition: color 0.2s;">✕</button>
                    </div>
                    <h3 style="font-family: 'Playfair Display', serif; font-size: 1.3rem;
                        font-weight: 400; color: #fff; margin: 0 0 8px 0; line-height: 1.3;">
                        ${data.title || 'Santis Exclusive'}
                    </h3>
                    <p style="font-size: 0.8rem; color: rgba(255,255,255,0.5); margin: 0 0 16px 0;
                        line-height: 1.6;">
                        ${data.message || 'Size özel bir deneyim sunuyoruz.'}
                    </p>
                    ${data.discount ? `
                    <div style="background: ${color}0A; border: 1px solid ${color}22;
                        border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;
                        display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 1.6rem; font-weight: 300; color: ${color};
                            font-family: 'Playfair Display', serif;">${data.discount}</span>
                        <span style="font-size: 0.7rem; color: rgba(255,255,255,0.4);
                            text-transform: uppercase; letter-spacing: 1px;">İndirim</span>
                    </div>` : ''}
                    <a href="${data.url || '#nv-reservation-modal'}" style="display: block;
                        text-align: center; padding: 12px 24px; border-radius: 50px;
                        background: linear-gradient(135deg, ${color}dd, ${color});
                        color: #000; font-weight: 600; font-size: 0.8rem;
                        text-decoration: none; letter-spacing: 0.5px;
                        transition: transform 0.2s, box-shadow 0.2s;
                        box-shadow: 0 4px 16px ${color}33;">
                        ${data.cta || 'Keşfet →'}
                    </a>
                </div>
            `;

            document.body.appendChild(overlay);

            // Close handler
            overlay.querySelector('#promo-close-btn').addEventListener('click', () => {
                overlay.style.opacity = '0';
                overlay.style.transform = 'translateY(20px) scale(0.95)';
                setTimeout(() => overlay.remove(), 400);
            });

            // Auto-dismiss after 15s
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.style.opacity = '0';
                    overlay.style.transform = 'translateY(20px) scale(0.95)';
                    setTimeout(() => overlay.remove(), 400);
                }
            }, 15000);

            // Animate in
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    overlay.style.opacity = '1';
                    overlay.style.transform = 'translateY(0) scale(1)';
                });
            });

            logCmd('promo_bundle', true, `Promo injected: "${data.title}"`);
        },

        /**
         * 🔒 SEAL SYSTEM
         * Acil durum mühürlemesi — ekranı kapatır
         * payload: { message }
         */
        seal_system(data) {
            let seal = document.getElementById('sovereign-seal-overlay');
            if (!seal) {
                seal = document.createElement('div');
                seal.id = 'sovereign-seal-overlay';
                document.body.appendChild(seal);
            }

            seal.style.cssText = `
                position: fixed; inset: 0; z-index: 999999;
                background: rgba(5,5,5,0.98);
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                opacity: 0; transition: opacity 0.8s ease;
            `;

            seal.innerHTML = `
                <div style="text-align: center; max-width: 500px; padding: 40px;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 24px;
                        border: 2px solid #d4af37; border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        animation: pulse 2s infinite;">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                            stroke="#d4af37" stroke-width="1.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    </div>
                    <h2 style="font-family: 'Playfair Display', serif; font-size: 2rem;
                        color: #d4af37; margin: 0 0 12px 0; font-weight: 400;">
                        Sovereign Seal
                    </h2>
                    <p style="font-family: 'Inter', sans-serif; font-size: 0.9rem;
                        color: rgba(255,255,255,0.5); line-height: 1.6; margin: 0;">
                        ${data.message || 'Bu deneyim şu anda bakım altındadır. Kısa süre sonra hizmetinizde olacağız.'}
                    </p>
                </div>
                <style>
                    @keyframes pulse {
                        0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.3); }
                        50% { box-shadow: 0 0 0 20px rgba(212,175,55,0); }
                    }
                </style>
            `;

            requestAnimationFrame(() => { seal.style.opacity = '1'; });
            logCmd('seal_system', true, 'System sealed');
        },

        /**
         * 🔓 UNSEAL SYSTEM
         * Mühürü kaldır
         */
        unseal_system() {
            const seal = document.getElementById('sovereign-seal-overlay');
            if (seal) {
                seal.style.opacity = '0';
                setTimeout(() => seal.remove(), 800);
            }
            logCmd('unseal_system', true, 'System unsealed');
        }
    };

    // ═══════════════════════════════════════════════════════
    // COMMAND DISPATCHER
    // ═══════════════════════════════════════════════════════

    function executeCommand(data) {
        if (!data || !data.type) return;

        // Command Validation
        if (!CommandHandlers[data.type]) {
            console.warn(`${LOG} Unknown command: ${data.type}`);
            return;
        }

        console.log(`${LOG} 🎯 Executing: ${data.type}`, data);
        CommandHandlers[data.type](data);
    }

    // ═══════════════════════════════════════════════════════
    // BROADCASTCHANNEL BRIDGE (Local Dev)
    // ═══════════════════════════════════════════════════════

    function initBroadcastChannel() {
        if (!('BroadcastChannel' in window)) {
            console.warn(`${LOG} BroadcastChannel not supported — falling back to WebSocket only.`);
            return;
        }

        channel = new BroadcastChannel(CHANNEL_NAME);

        channel.onmessage = (event) => {
            const data = event.data;

            // ACK isteklerine cevap ver (admin paneli canlılık kontrolü)
            if (data.type === 'ping') {
                channel.postMessage({
                    type: 'pong',
                    page: window.location.pathname,
                    timestamp: Date.now()
                });
                return;
            }

            // Komutu çalıştır
            if (data.channel === 'command' || data.source === 'gods-eye') {
                executeCommand(data);
            }
        };

        console.log(`${LOG} BroadcastChannel "${CHANNEL_NAME}" dinleniyor.`);
    }

    // ═══════════════════════════════════════════════════════
    // SOVEREIGNBUS BRIDGE (Production)
    // ═══════════════════════════════════════════════════════

    function initSovereignBusBridge() {
        if (!window.SovereignBus) return;

        // Tüm komut tiplerini dinle
        Object.keys(CommandHandlers).forEach(cmdType => {
            window.SovereignBus.subscribe(cmdType.toUpperCase(), (data) => {
                executeCommand({ ...data, type: cmdType });
            });
        });

        console.log(`${LOG} SovereignBus bridge active — ${Object.keys(CommandHandlers).length} commands registered.`);
    }

    // ═══════════════════════════════════════════════════════
    // COMMAND SEND (Admin tarafı için)
    // ═══════════════════════════════════════════════════════

    function sendCommand(type, payload = {}) {
        const cmd = {
            channel: 'command',
            source: 'gods-eye',
            type: type,
            timestamp: Date.now(),
            ...payload
        };

        // BroadcastChannel ile gönder (local dev)
        if (channel) {
            channel.postMessage(cmd);
        }

        // SovereignBus ile gönder (production)
        if (window.SovereignBus && window.SovereignBus.connected) {
            window.SovereignBus.send(cmd);
        }

        logCmd(type, true, `Sent via ${channel ? 'BroadcastChannel' : 'SovereignBus'}`);
    }

    // ═══════════════════════════════════════════════════════
    // COMMAND LOG
    // ═══════════════════════════════════════════════════════

    function logCmd(type, success, detail) {
        const entry = {
            type,
            success,
            detail,
            timestamp: Date.now(),
            page: window.location.pathname
        };

        commandLog.push(entry);
        if (commandLog.length > 100) commandLog.shift();

        const icon = success ? '✅' : '❌';
        console.log(`${LOG} ${icon} ${type}: ${detail}`);

        // Olayı yayınla (admin paneli dinleyebilir)
        document.dispatchEvent(new CustomEvent('sovereign:command-log', { detail: entry }));
    }

    // ═══════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════

    window.SovereignCommand = {
        send: sendCommand,
        execute: executeCommand,
        getLog: () => [...commandLog],
        getCommands: () => Object.keys(CommandHandlers),
        handlers: CommandHandlers
    };

    // ═══════════════════════════════════════════════════════
    // BOOT
    // ═══════════════════════════════════════════════════════

    function boot() {
        console.log(`${LOG} 🦅 Sovereign Command V1.0 — ${Object.keys(CommandHandlers).length} commands registered.`);
        initBroadcastChannel();
        initSovereignBusBridge();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
