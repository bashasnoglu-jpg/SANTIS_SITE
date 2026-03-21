import re

with open('c:\\Users\\tourg\\Desktop\\SANTIS_SITE\\assets\\css\\style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace Overlay
css = re.sub(r'\.santis-ghost-overlay \{[\s\S]*?\}',
""".santis-ghost-overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(5,5,5,0.4);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: var(--z-overlay, 9998);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
}""", css)

# Replace Ghost Card
css = re.sub(r'\.santis-ghost-card \{[\s\S]*?\}',
""".santis-ghost-card {
    position: fixed;
    z-index: var(--z-ghost, 9999);
    background-size: cover;
    background-position: center;
    box-shadow: 0 50px 100px rgba(0,0,0,0.8);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1),
                width 0.6s cubic-bezier(0.22, 1, 0.36, 1),
                height 0.6s cubic-bezier(0.22, 1, 0.36, 1),
                border-radius 0.6s ease;
    will-change: transform, width, height, border-radius;
    transform: translateZ(0);
    overflow: hidden;
    pointer-events: auto;
}""", css)

# Replace Ghost Card Active
css = re.sub(r'\.santis-ghost-card\.is-expanded \{[^\}]*\}',
""".santis-ghost-card.is-expanded {
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    border-radius: 0 !important;
    transform: translateZ(0);
}""", css)

# Add Expanded rules if missing, or update
css = re.sub(r'\.santis-ghost-card\.is-expanded \.santis-reveal-data \{[\s\S]*?text-align: center;\s*\}',
""".santis-ghost-card.is-expanded .santis-reveal-data {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 60px 40px;
    opacity: 0;
    transform: translateY(40px) translateZ(0);
    transition: opacity 0.6s ease, transform 0.6s ease;
    text-align: center;
}""", css)

css = re.sub(r'\.santis-ghost-card\.is-expanded\.reveal-content-active \.santis-reveal-data \{[\s\S]*?\}',
""".santis-ghost-card.is-expanded.reveal-content-active .santis-reveal-data {
    opacity: 1;
    transform: translateY(0);
    transition-delay: 0.3s;
}""", css)

# Add pointer-events to active body
css = css.replace('overflow: hidden !important;', 'overflow: hidden !important;\\n    pointer-events: none;')

with open('c:\\Users\\tourg\\Desktop\\SANTIS_SITE\\assets\\css\\style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Updated style.css successfully.")
