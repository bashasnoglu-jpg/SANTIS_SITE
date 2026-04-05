/**
 * ==========================================
 * 🌑 SOVEREIGN OS: BLACK ROOM CORE (V8)
 * ==========================================
 * Engine: Decision Logging | Authority Override | Kill Switch
 */
export function initBlackRoomCore(NeuralBus) {
    if (NeuralBus) window.NeuralDB = window.NeuralDB || NeuralBus;
    console.log("%c[BLACK ROOM] Otorite Katmanı Devrede. 🌑", "color: #ff0055; font-weight: bold;");

    const MODES = { HUMAN: "HUMAN", AUTONOMOUS: "AUTONOMOUS" };
    window.SovereignAuthority = { currentMode: MODES.AUTONOMOUS };
    window.BlackRoomLogs = [];

    // Yapay Zeka (Business Cortex) her karar aldığında buraya rapor vermek ZORUNDA.
    window.BlackRoom = {
        logDecision: (entry) => {
            const record = { time: new Date().toLocaleTimeString(), ...entry };
            window.BlackRoomLogs.unshift(record);
            if (window.BlackRoomLogs.length > 50) window.BlackRoomLogs.pop();
            
            // Eğer Black Room sayfasındaysak logu fiziksel terminale bas
            const logContainer = document.getElementById('blackroom-terminal');
            if (logContainer) {
                const div = document.createElement('div');
                div.style.marginBottom = "8px";
                div.innerHTML = `<span style="color:#666">[${record.time}]</span> <span style="color:${entry.type === 'CRITICAL' ? '#ff0055' : '#00FFCC'}; font-weight:bold;">${record.type}</span>: ${record.action}`;
                logContainer.prepend(div);
            }
        }
    };

    // 🔴 THE KILL SWITCH (CTRL + SHIFT + X)
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === "X" || e.key === "x")) {
            if (window.SovereignAuthority.currentMode === MODES.HUMAN) return;
            
            window.SovereignAuthority.currentMode = MODES.HUMAN;
            
            if (window.NeuralDB) {
                NeuralDB.state.system.status = 'MANUAL OVERRIDE';
                NeuralDB.state.system.defcon = 1; // Sistemi kırmızı alarma sokar
            }
            
            window.BlackRoom.logDecision({ type: 'CRITICAL', action: 'KILL SWITCH TETİKLENDİ. OTONOM ZEKÂ KAPATILDI.' });
            window.dispatchEvent(new Event('kill-switch-activated'));
        }
    });
}
