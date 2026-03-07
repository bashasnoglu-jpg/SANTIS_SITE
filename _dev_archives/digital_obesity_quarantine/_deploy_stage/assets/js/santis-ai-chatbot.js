/**
 * SANTIS DIGITAL CONCIERGE (AI BOT V1.0)
 * -------------------------------------------------------------------
 * Medya Üssü (social.json) verilerini izleyip, "Aktif" ise sitenin 
 * sağ altına "Quiet Luxury" tasarımında akıllı bir asistan yerleştirir.
 */

(function () {
    'use strict';

    // State Variables
    let isWidgetOpen = false;
    let config = { active: false, title: "Santis Asistan", welcome: "Size nasıl yardımcı olabilirim?" };

    // --- HTML INJECTOR ---
    function injectChatUI() {
        if (!config.active) return; // Medya Üssünden kapatılmışsa gösterme.

        // Inline CSS for the widget (Self-Contained for easy injection)
        const style = document.createElement('style');
        style.textContent = `
            #santis-concierge-trigger {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #111, #222);
                border: 1px solid rgba(212, 175, 55, 0.5);
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                color: #d4af37;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                cursor: pointer;
                z-index: 2147483647; /* MAX Z-INDEX */
                pointer-events: auto; /* ENFORCE CLICKABILITY */
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
            }
            #santis-concierge-trigger:hover {
                transform: scale(1.1);
                box-shadow: 0 15px 35px rgba(212, 175, 55, 0.2);
            }
            
            #santis-concierge-window {
                position: fixed;
                bottom: 100px;
                right: 30px;
                width: 350px;
                height: 500px;
                background: rgba(10, 10, 10, 0.95);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.8);
                z-index: 2147483646;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transform: translateY(20px);
                opacity: 0;
                pointer-events: none;
                transition: transform 0.4s ease, opacity 0.4s ease;
            }
            #santis-concierge-window.active {
                transform: translateY(0);
                opacity: 1;
                pointer-events: auto; /* ENFORCE CLICKABILITY */
            }
            
            #sc-header {
                padding: 20px;
                background: linear-gradient(90deg, #111, #1a1a1a);
                border-bottom: 1px solid rgba(255,255,255,0.05);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #sc-header h3 {
                margin: 0;
                font-size: 14px;
                font-weight: 500;
                color: #d4af37;
                letter-spacing: 2px;
                text-transform: uppercase;
            }
            #sc-close {
                background: none;
                border: none;
                color: #888;
                font-size: 18px;
                cursor: pointer;
                pointer-events: auto;
            }
            #sc-close:hover { color: #fff; }
            
            #sc-body {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 15px;
                pointer-events: auto;
            }
            #sc-body::-webkit-scrollbar { width: 4px; }
            #sc-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            
            .sc-msg {
                max-width: 85%;
                padding: 12px 16px;
                font-size: 13px;
                line-height: 1.5;
                font-family: inherit;
            }
            .sc-msg.bot {
                background: rgba(255,255,255,0.05);
                color: #ddd;
                border-radius: 0 12px 12px 12px;
                align-self: flex-start;
                border: 1px solid rgba(255,255,255,0.02);
            }
            .sc-msg.user {
                background: #1a1a1a;
                color: #fff;
                border-radius: 12px 0 12px 12px;
                align-self: flex-end;
                border: 1px solid rgba(212, 175, 55, 0.2);
            }
            
            #sc-footer {
                padding: 15px;
                border-top: 1px solid rgba(255,255,255,0.05);
                display: flex;
                gap: 10px;
                background: #0a0a0a;
                pointer-events: auto;
            }
            #sc-input {
                flex: 1;
                background: #111;
                border: 1px solid rgba(255,255,255,0.1);
                color: #fff;
                border-radius: 20px;
                padding: 10px 15px;
                font-size: 13px;
                outline: none;
                pointer-events: auto;
            }
            #sc-input:focus { border-color: rgba(212, 175, 55, 0.5); }
            #sc-send {
                background: #d4af37;
                color: #000;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                pointer-events: auto;
            }
            
            /* Typist Animation */
            .typing-indicator span {
                display: inline-block;
                width: 4px;
                height: 4px;
                background-color: #888;
                border-radius: 50%;
                margin: 0 2px;
                animation: typist 1.4s infinite ease-in-out both;
            }
            .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
            .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
            @keyframes typist { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
            
            @media (max-width: 480px) {
                #santis-concierge-window {
                    bottom: 0; right: 0; width: 100%; height: 100%; border-radius: 0; transform: translateY(100%);
                }
            }
        `;
        document.head.appendChild(style);

        // UI Container
        const wrapper = document.createElement('div');
        wrapper.id = 'santis-concierge-sys';
        // Remove pointer-events restrictions from the wrapper, handle it directly on children
        wrapper.style.cssText = 'position:fixed; z-index:2147483647; bottom:0; right:0; width:0; height:0; overflow:visible; pointer-events:none;';

        wrapper.innerHTML = `
            <div id="santis-concierge-trigger" title="Digital Concierge" style="pointer-events: auto;">🤖</div>
            <div id="santis-concierge-window" style="pointer-events: none;">
                <div id="sc-header">
                    <h3>${config.title || "Santis Asistan"}</h3>
                    <button id="sc-close">✕</button>
                </div>
                <div id="sc-body">
                    <div class="sc-msg bot">${config.welcome || "Merhaba, size nasıl yardımcı olabilirim?"}</div>
                </div>
                <div id="sc-footer">
                    <input type="text" id="sc-input" placeholder="Mesajınızı yazın..." autocomplete="off">
                    <button id="sc-send">➤</button>
                </div>
            </div>
        `;
        // Inject into the root of the document to avoid stacking context traps
        document.documentElement.appendChild(wrapper);

        // Bind Events
        const trigger = document.getElementById('santis-concierge-trigger');
        const win = document.getElementById('santis-concierge-window');
        const closeBtn = document.getElementById('sc-close');
        const sendBtn = document.getElementById('sc-send');
        const inputEl = document.getElementById('sc-input');

        // Capture phase to intercept early
        trigger.addEventListener('click', (e) => {
            console.log("🤖 Chatbot Trigger Clicked!");
            e.preventDefault();
            e.stopPropagation();
            isWidgetOpen = !isWidgetOpen;
            if (isWidgetOpen) {
                win.classList.add('active');
                win.style.pointerEvents = 'auto'; // ensure clickability when open
                trigger.style.transform = 'scale(0)';
                trigger.style.pointerEvents = 'none'; // disable trigger while open
                inputEl.focus();
            }
        }, true);

        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isWidgetOpen = false;
            win.classList.remove('active');
            win.style.pointerEvents = 'none';
            trigger.style.transform = 'scale(1)';
            trigger.style.pointerEvents = 'auto';
        }, true);

        sendBtn.addEventListener('click', handleUserMessage);
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleUserMessage();
        });
    }

    // --- CHAT LOGIC ---
    async function handleUserMessage() {
        const inputEl = document.getElementById('sc-input');
        const bodyEl = document.getElementById('sc-body');
        const text = inputEl.value.trim();

        if (!text) return;

        // Add User Message
        const uMsg = document.createElement('div');
        uMsg.className = 'sc-msg user';
        uMsg.textContent = text;
        bodyEl.appendChild(uMsg);
        inputEl.value = '';
        bodyEl.scrollTop = bodyEl.scrollHeight;

        // Show Typing Indicator
        const tMsg = document.createElement('div');
        tMsg.className = 'sc-msg bot typing-indicator';
        tMsg.innerHTML = '<span></span><span></span><span></span>';
        bodyEl.appendChild(tMsg);
        bodyEl.scrollTop = bodyEl.scrollHeight;

        // Fetch AI Response (Python Backend)
        try {
            // Updated to Absolute URL for Port 8000
            const res = await fetch('http://127.0.0.1:8000/api/concierge/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: [] }) // Simple context
            });

            const data = await res.json();
            bodyEl.removeChild(tMsg);

            const bMsg = document.createElement('div');
            bMsg.className = 'sc-msg bot';

            if (data.reply) {
                bMsg.innerHTML = data.reply; // allows <a> tags for whatsapp routing
            } else {
                bMsg.textContent = "Bağlantıda bir sorun var, lütfen WhatsApp üzerinden iletişime geçin.";
            }

            bodyEl.appendChild(bMsg);
            bodyEl.scrollTop = bodyEl.scrollHeight;

        } catch (error) {
            bodyEl.removeChild(tMsg);
            const err = document.createElement('div');
            err.className = 'sc-msg bot';
            err.innerHTML = "Sistem şu an meşgul. İletişim için: <a href='/contact.html' style='color:#d4af37'>Tıklayın</a>";
            bodyEl.appendChild(err);
            bodyEl.scrollTop = bodyEl.scrollHeight;
        }
    }

    // --- INIT SEQUENCE ---
    async function init() {
        try {
            // Use absolute path for proper resolution across deeply nested routes (e.g. /en/skincare/)
            const res = await fetch('/assets/data/social.json', { cache: 'no-cache' });

            if (res.ok) {
                const data = await res.json();
                if (data.concierge) {
                    config = data.concierge;
                }
            }
            injectChatUI();
        } catch (e) {
            console.warn("Concierge Init Error:", e);
        }
    }

    // Load After Standard Content
    window.addEventListener('load', init);

})();
