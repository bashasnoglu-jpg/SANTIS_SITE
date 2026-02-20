
path = r"C:\Users\tourg\Desktop\SANTIS_SITE\admin\style-admin.css"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Removing lines 448-455 (0-indexed: 447-454)
# Be careful with indices. 
# Line 448 is index 447.
# Line 455 is index 454.
# We want to remove lines[447:455] approximately.

# Let's verify the content to be safe.
start_idx = 447
end_idx = 455 # Python slice excludes end, so this covers 447..454, which is 8 lines.
# 448, 449, 450, 451, 452, 453, 454, 455 (8 lines)

segment = lines[start_idx:end_idx]
print("Removing lines:")
for l in segment:
    print(l.strip())

del lines[start_idx:end_idx]

with open(path, "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done.")
