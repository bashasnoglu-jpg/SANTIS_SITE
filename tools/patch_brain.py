
path = r"C:\Users\tourg\Desktop\SANTIS_SITE\assets\js\santis-brain.js"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Target lines 56-60 (0-indexed: 56..60) assuming file view lines matched
# View showed:
# 57:                     const data = JSON.parse(event.data);
# 58:                     // Handle Echo Prevention (Don't re-broadcast what I sent)
# 59:                     if (data.source === 'self') return;
# 60: 
# 61:                     handleSignal(data, 'cloud');

start_idx = 56 # line 57
end_idx = 61 # line 61 + 1 for slice? No, line 61 is index 60.

new_block = [
    "                    const raw = JSON.parse(event.data);\n",
    "                    // Handle Echo Prevention\n",
    "                    if (raw.source === 'self') return;\n",
    "\n",
    "                    // 🧠 ADAPTIVE NORMALIZER\n",
    "                    let data = raw;\n",
    "                    if (!raw.payload) {\n",
    "                        const { type, ...rest } = raw;\n",
    "                        data = { type, payload: rest };\n",
    "                    }\n",
    "\n",
    "                    handleSignal(data, 'cloud');\n"
]

# Replace lines 56 to 61 (inclusive of 60)
lines[start_idx:end_idx] = new_block

with open(path, "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Patched santis-brain.js")
