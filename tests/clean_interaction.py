import re

filepath = r'c:\Users\tourg\Desktop\SANTIS_SITE\assets\js\modules\interaction-engine.js'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

out_lines = []
skip = False

for line in lines:
    if "class SovereignMorphEngine {" in line:
        skip = True
        
    if skip and "// Global Esc Key Listener" in line:
        skip = False # We will stop skipping here, but we also want to skip the Esc listener manually
        continue
        
    if skip:
        continue
        
    out_lines.append(line)

# Now we also want to remove the global esc key listener safely
final_lines = []
skip_esc = False
for line in out_lines:
    if "// Global Esc Key Listener" in line:
        skip_esc = True
        
    if skip_esc and "});" in line:
        skip_esc = False
        continue # skip the closing });
        
    if skip_esc:
        continue
        
    final_lines.append(line)

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("Morph Engine completely cleaned out!")
