import re

with open('masaj.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace main carousel stages
pattern_1 = re.compile(r'<div class="santis-carousel-stage([^>]*?)"([^>]*?)>', re.DOTALL)
text = pattern_1.sub(r'<div class="santis-native-grid"\2>', text)

# Wipe out the strict height min-height inline styles that restrict the native grid
# We also wipe the 'custom-cover-flow' to fully detach from the JS
text = text.replace('custom-cover-flow" id="sov-3d-stage', ' id="sov-3d-stage')
text = re.sub(r'style="height: 60vh; min-height: 400px; width: 100%; position: relative;"', '', text)

with open('masaj.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("masaj.html updated to native grid architecture")
