
path = r"C:\Users\tourg\Desktop\SANTIS_SITE\assets\js\santis-brain.js"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Remove lines 57-69 (0-indexed: 56-68) which are the stray code block.
# Lines to purge:
# 56:                     const raw = JSON.parse(event.data);
# 57:                     // Handle Echo Prevention
# 58:                     if (raw.source === 'self') return;
# 59: 
# 60:                     // 🧠 ADAPTIVE NORMALIZER
# 61:                     let data = raw;
# 62:                     if (!raw.payload) {
# 63:                         const { type, ...rest } = raw;
# 64:                         data = { type, payload: rest };
# 65:                     }
# 66: 
# 67:                     handleSignal(data, 'cloud');
# 68:

# Current file state:
# 57 (idx 56) starts content.

start_idx = 56
end_idx = 69 # 69 is exclusive, so up to 68

# Also need to re-insert "function init() {" at start_idx because it seems missing or implicit logic was broken.
# Wait, looking at lines 54-57 in file view (step 1841):
# 54: 
# 55: 
# 56: 
# 57:                     const raw = JSON.parse(event.data);

# The 'init' function declaration seems totally missing above this block.
# Let's clean up and insert init().

del lines[start_idx:end_idx]
lines.insert(start_idx, "    function init() {\n        console.log(\"🧠 [Brain] Initializing Hybrid System...\");\n")

with open(path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("Fixed santis-brain.js structure")
