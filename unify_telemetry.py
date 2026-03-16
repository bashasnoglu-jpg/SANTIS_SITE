import os
import re

def neutralize_intervals(filepath):
    if not os.path.exists(filepath):
        print(f"{filepath} not found.")
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to comment out lines that contain setInterval broadly, but safely.
    # It's safer to just comment them out using regex
    # Match any line containing setInterval
    
    lines = content.split('\n')
    modified_lines = []
    changes = 0
    for line in lines:
        if 'setInterval' in line and not line.strip().startswith('//'):
            modified_lines.append('// [Sovereign Purge] ' + line)
            changes += 1
        else:
            modified_lines.append(line)
            
    if changes > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(modified_lines))
        print(f"Neutralized {changes} intervals in {filepath}")
    else:
        print(f"No active intervals found to neutralize in {filepath}")

# Neutralize in targeted files
neutralize_intervals('admin/integrated_hub.js')
neutralize_intervals('admin/dashboard-logic.js')
neutralize_intervals('admin/dashboard.js')

# Generate santis-telemetry-engine.js
engine_js = """/**
 * SANTIS MASTER OS - Sovereign Telemetry Engine (V24)
 * Consolidated Global Polling Architecture
 * Extinguishes UI overlap & network congestion. 
 */
window.SantisTelemetryEngine = (function() {
    let _pollingTimer = null;
    let _pollInterval = 5000; // 5 seconds global pulse
    let _isActive = false;

    function globalPulse() {
        if (!_isActive) return;
        
        // --- 1. Integrated Hub Endpoints (command-center) ---
        if (typeof updateAIBrain === 'function') updateAIBrain();
        if (typeof updateShadowLog === 'function') updateShadowLog();
        if (typeof updateSovereignTelemetry === 'function') updateSovereignTelemetry();
        if (typeof updateSovereignPulse === 'function') updateSovereignPulse();
        
        // Specific longer intervals can be rate-limited, but for now we unify them into the pulse
        // as the original intervals were 3000ms or 4000ms anyway.
        
        // --- 2. Dashboard Logic Endpoints ---
        // (If still attached to DOM)
        if (typeof renderTrafficSimulation === 'function') renderTrafficSimulation();
        if (typeof fetchDashboardMetrics === 'function') fetchDashboardMetrics();

        // Optional God Mode Sync once every 6 pulses (30s)
        if (typeof window.initGodMode === 'function' && Math.random() < 0.2) {
            window.initGodMode(false);
        }

        // Fire Global Event for Vue.js & external components
        window.dispatchEvent(new CustomEvent('santis:pulse', {
            detail: { timestamp: Date.now(), status: 'SYNCED' }
        }));
    }

    return {
        ignite: function(intervalMs = 5000) {
            if (_isActive) return;
            _isActive = true;
            _pollInterval = intervalMs;
            
            // Initial burst
            setTimeout(globalPulse, 1000);
            
            // Unified Loop
            _pollingTimer = setInterval(globalPulse, _pollInterval);
            console.log(`%c[Omni-Core] ⚡ Sovereign Telemetry Engine Ignited (${_pollInterval}ms pulse)`, "color: #D4AF37; font-weight: bold; font-family: monospace;");
        },
        halt: function() {
            _isActive = false;
            clearInterval(_pollingTimer);
            console.log("%c[Omni-Core] 🛑 Sovereign Telemetry Halted", "color: #ef4444; font-family: monospace;");
        }
    };
})();

// Auto-boot if not deferred
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SantisTelemetryEngine.ignite());
} else {
    window.SantisTelemetryEngine.ignite();
}
"""

with open('admin/santis-telemetry-engine.js', 'w', encoding='utf-8') as f:
    f.write(engine_js)
print("Generated admin/santis-telemetry-engine.js")

# Now inject santis-telemetry-engine.js into command-center.html and boardroom.html
def inject_engine(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'santis-telemetry-engine.js' in content:
        print(f"Engine already injected in {filepath}")
        return
        
    # Inject after santis-core.js or just before </body>
    if '<script src="santis-core.js">' in content:
        modified = content.replace('<script src="santis-core.js"></script>', '<script src="santis-core.js"></script>\\n<script src="santis-telemetry-engine.js"></script>')
    else:
        modified = content.replace('</body>', '<script src="santis-telemetry-engine.js"></script>\\n</body>')
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(modified)
    print(f"Injected telemetry engine into {filepath}")

inject_engine('admin/command-center.html')
inject_engine('admin/boardroom.html')
