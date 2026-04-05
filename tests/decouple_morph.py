import re

filepath = r'c:\Users\tourg\Desktop\SANTIS_SITE\assets\js\modules\interaction-engine.js'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

out_lines = []
skip = False

# We need to drop lines 567 to 616
# // SANTIS SOVEREIGN REVEAL ENGINE (V2.1 - STATE MACHINE & PREDICTIVE)
# down to 
# // 📐 Resize Guardian - Keep Ghost Fullscreen ... window.addEventListener('resize')
# We also need to drop lines 903 to 1206
# // 🧬 SOVEREIGN MORPH ENGINE v2.0 (GOD-TIER FLIP) ... down to 
# // Global Esc Key Listener ... document.addEventListener('keydown'

for i, line in enumerate(lines):
    # Phase 1: REVEAL_STATES and Event Listeners
    if "// SANTIS SOVEREIGN REVEAL ENGINE (V2.1 - STATE MACHINE & PREDICTIVE)" in line:
        skip = True
        
    if skip and "// ==========================================" in line and i > 600:
        # Just passing the block
        out_lines.append(line) # Keep the boundary marker
        skip = False
        continue
        
    # Phase 2: SovereignMorphEngine and Functions
    if "// 🧬 SOVEREIGN MORPH ENGINE v2.0 (GOD-TIER FLIP)" in line:
        skip = True
        
    if skip and "// ==========================================" in line and i > 1200:
        out_lines.append(line)
        skip = False
        continue
        
    if not skip:
        out_lines.append(line)

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(out_lines)

print("Decoupling complete!")
