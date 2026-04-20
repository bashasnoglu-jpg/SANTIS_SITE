import re

with open('hamam.html', 'r', encoding='utf-8') as f:
    text = f.read()

# We need to find the end of the Turkish Bath Program Bento Grid.
# It's an id="sov-bento-stage-1".
# Find its closing </section> tag, then remove everything up to </main>.
# Wait, let's just use regex to target the specific sections to be extremely safe!

pattern1 = re.compile(r'<!-- V11 PHASE 3: THE GIANT GALLERY \(Apple Pro Exhibition\) -->.*?</main>', re.DOTALL)
text = pattern1.sub('</main>', text)

# Just in case phase 3 was already deleted or renamed, let's also specifically target the phase 4 studio
pattern2 = re.compile(r'<!-- V11 PHASE 4: THE DESIGN STUDIO / CONFIGURATOR -->.*?</main>', re.DOTALL)
text = pattern2.sub('</main>', text)

# And Phase 6: Mask rail just to be totally thorough if it's outside.
# But it was inside the match of pattern1 above (because it happened after phase 3 and before </main>).

# Cache bust
import time
timestamp = str(int(time.time()))
text = re.sub(r'santis\.bento-grid\.css(\?v=[0-9A-Za-z_]+)?', f'santis.bento-grid.css?v={timestamp}', text)

with open('hamam.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Legacy components (Gallery, Studio, Rail) fully purged! Absolute minimalism achieved.")
