import re

file_path = 'c:\\Users\\tourg\\Desktop\\SANTIS_SITE\\assets\\js\\modules\\interaction-engine.js'

with open(file_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace the DOMContentLoaded block
js = re.sub(
    r"window\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{[\s\S]*?\}\);",
    """// 🧭 History API - Initialize Deep Link (Runs on module load since DOM is likely ready)
(function initDeepLink() {
    const params = new URLSearchParams(location.search);
    const revealSlug = params.get('reveal');
    if (revealSlug) {
        // Find the card after Santis Core Boot sequence (Sovereign Engine delay)
        setTimeout(() => {
            const card = document.querySelector(`[data-reveal="${revealSlug}"]`) || document.querySelector(`[data-id="${revealSlug}"]`);
            if (card) window.triggerSovereignReveal(card, true);
        }, 1800); 
    }
})();""", 
    js
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("Updated init logic in interaction-engine.js")
