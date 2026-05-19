with open('cilt-bakimi.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the dynamic await class with the static global observer class
text = text.replace('santis-await-reveal', 'santis-reveal')

# Remove the dynamic orchestrator script as it's not needed for hardcoded cards
text = text.replace('<script src="/assets/js/core/bento-orchestrator.js" defer></script>\n', '')

with open('cilt-bakimi.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Fixed card classes to santis-reveal")
