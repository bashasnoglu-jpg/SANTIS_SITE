with open('cilt-bakimi.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Completely remove the interaction observer classes so there is no opacity: 0 lock
text = text.replace(' santis-reveal', '')

with open('cilt-bakimi.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Forced cards to visible by removing santis-reveal")
