
path = r"C:\Users\tourg\Desktop\SANTIS_SITE\assets\js\santis-soul.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# The specific block to replace
target_block = """    injectLayers() {
        if (!document.querySelector('.soul-atmosphere')) {
            const div = document.createElement('div');
            div.className = 'soul-atmosphere';
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
            document.body.prepend(div);
        }
    }"""

# New Content
replacement = """    injectLayers() {
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

if target_block in content:
    new_content = content.replace(target_block, replacement)
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Patched santis-soul.js for Context-Aware Atmospheres")
else:
    print("Target block not found in santis-soul.js")
