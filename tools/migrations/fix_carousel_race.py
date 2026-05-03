import re

with open('tr/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove any existing inline script for awaitSovereignInteraction
content = re.sub(r'<script>\s*\(function awaitSovereignInteraction\(\).*?</script>\s*', '', content, flags=re.DOTALL)

# Create the script block to be injected at the very bottom
script_block = """
<script>
(function awaitSovereignInteraction() {
    if (typeof window.initCoverFlowCarousel === 'function') {
        window.initCoverFlowCarousel();
        console.log("🎡 Sovereign B2B Cover Flow Carousels Inited globally on Homepage.");
    } else {
        setTimeout(awaitSovereignInteraction, 100);
    }
})();
</script>
"""

# Append just before closing main tag
content = content.replace('</main>', script_block + '\n</main>')

with open('tr/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("DOM Race Condition fixed successfully!")
