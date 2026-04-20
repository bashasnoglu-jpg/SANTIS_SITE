import re

with open('hamam.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Hamam.html currently has a duplicated body after the first </footer>
# We will split at the first </footer> and only keep the top half.
parts = html.split('</footer>')
top_half = parts[0] + '</footer>\n'

# The top half contains the toxic id="sov-3d-stage" which triggers the legacy Cover Flow algorithm.
# We change it to a non-hooked ID.
clean_html = top_half.replace('id="sov-3d-stage"', 'id="sov-bento-stage-1"')

# Also remove the Vitals/Speculation block that was accidentally duplicated
clean_html = re.sub(r'<script src="/assets/js/santis-vitals\.js".*?</script>', '', clean_html, flags=re.DOTALL)
clean_html = re.sub(r'<script type="speculationrules">.*?</script>', '', clean_html, flags=re.DOTALL)
clean_html = re.sub(r'<meta name="theme-color" content="#000000">', '', clean_html)
clean_html = re.sub(r'<link rel="manifest" href="/manifest\.json">', '', clean_html)

# Add the proper scripts that should be at the bottom of the body.
closing_scripts = """
<!-- CORE SCRIPTS -->
<script src="/assets/js/santis-vitals.js" async></script>
<script src="/assets/js/santis-data-bridge.js" defer></script>
<script type="module" src="/assets/js/core/santis-core.js" defer></script>
<script src="/assets/js/app.js" defer></script>

<!-- SOVEREIGN OS BOOTLOADER (V35 KERNEL) -->
<script type="module" src="/assets/js/boot/santis-bootloader.js?v=V35_OMEGA" defer></script>

<!-- Phase 6: Fluid Space Engine (Speculation Rules API) -->
<script type="speculationrules">
{
  "prerender": [
    {
      "source": "document",
      "where": {
        "and": [
          { "href_matches": "/*" },
          { "not": { "selector_matches": ".no-prerender, [target='_blank'], [href^='mailto:'], [href^='tel:']" } }
        ]
      },
      "eagerness": "moderate" 
    }
  ]
}
</script>
</body>
</html>
"""

final = clean_html + closing_scripts

# Before writing, let's also fix the <head> section which might lack the Speculation rules now
# Wait, no. We removed them from everywhere. Let's make sure the first <head> has the theme color and manifest
head_inserts = """<meta name="theme-color" content="#000000">
<link rel="manifest" href="/manifest.json">
</head>"""
final = final.replace('</head>', head_inserts)

with open('hamam.html', 'w', encoding='utf-8') as f:
    f.write(final)

print("Hamam clean of duplicates and decoupled from legacy JS overlaps!")
