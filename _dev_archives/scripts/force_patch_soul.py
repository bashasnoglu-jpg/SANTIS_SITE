
path = r"C:\Users\tourg\Desktop\SANTIS_SITE\assets\js\santis-soul.js"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Define the exact block to replace, using regex to handle potential whitespace variations
import re

target_pattern = r"""    injectLayers\(\) \{
        if \(!document\.querySelector\('\.soul-atmosphere'\)\) \{
            const div = document\.createElement\('div'\);
            div\.className = 'soul-atmosphere';
            div\.innerHTML = `
                <div class="soul-nebula"></div>
                <!-- Elemental Layers V2 -->
                <div class="soul-element element-rain"></div>
                <div class="soul-element element-mist"></div>
                <div class="soul-element element-dawn"></div>
                <div class="soul-element element-water"></div>
                <!-- Light & Texture -->
                <div class="soul-rays"></div>
                <div class="soul-light"></div>
            `;
            document\.body\.prepend\(div\);
        \}
    \}"""

replacement_block = """    injectLayers() {
        if (!document.querySelector('.soul-atmosphere')) {
            const div = document.createElement('div');
            div.className = 'soul-atmosphere';

            // Detect Context
            const isHome = document.querySelector('.home-editorial') || window.location.pathname === '/' || window.location.pathname.includes('index.html');

            if (isHome) {
                // 🌌 Full Cinematic (Homepage)
                div.innerHTML = `
                    <div class="soul-nebula"></div>
                    <!-- Elemental Layers V2 -->
                    <div class="soul-element element-rain"></div>
                    <div class="soul-element element-mist"></div>
                    <div class="soul-element element-dawn"></div>
                    <div class="soul-element element-water"></div>
                    <!-- Light & Texture -->
                    <div class="soul-rays"></div>
                    <div class="soul-light"></div>
                `;
            } else {
                // 🌫️ Lite Luxury Mode (Inner Pages)
                div.classList.add('soul-lite');
                div.innerHTML = `
                    <div class="soul-nebula" style="opacity:0.4;"></div>
                    <div class="soul-element element-mist" style="opacity:0.3;"></div>
                    <div class="soul-light" style="opacity:0.6;"></div>
                `;
            }

            document.body.prepend(div);
        }
    }"""

# Attempt flexible replacement
match = re.search(target_pattern, text, re.DOTALL)
if match:
    new_text = text[:match.start()] + replacement_block + text[match.end():]
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_text)
    print("SUCCESS: Patched santis-soul.js")
else:
    # If regex fails, try a direct string replace with normalized whitespace
    print("Regex failed, trying direct block search...")
    # (Fallback logic could go here, but let's see output first)
    print("FAIL: Could not find target block.")
