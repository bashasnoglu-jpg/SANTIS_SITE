
path = r"C:\Users\tourg\Desktop\SANTIS_SITE\assets\js\app.js"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Line to find:
# if (!document.querySelector('.home-editorial') && window.location.pathname !== '/' && !window.location.pathname.includes('index')) return;

target_snippet = "if (!document.querySelector('.home-editorial') && window.location.pathname !== '/' && !window.location.pathname.includes('index')) return;"

found = False
for i, line in enumerate(lines):
    if target_snippet in line:
        # Comment it out
        lines[i] = "  // " + line.strip() + " // DISABLED FOR GLOBAL FX\n"
        found = True
        break

if found:
    with open(path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("Enabled Global FX")
else:
    print("Target line not found for Global FX patch")
