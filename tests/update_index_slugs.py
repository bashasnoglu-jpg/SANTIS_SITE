import re

file_path = 'c:\\Users\\tourg\\Desktop\\SANTIS_SITE\\tr\\index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

replacements = [
    (r'<div class="santis-stack-card" style="background-image: url\(\'/assets/img/cards/massage\.webp\'\); filter: hue-rotate\(40deg\);">', 
     r'<div class="santis-stack-card" data-reveal="aura-aromaterapi" style="background-image: url(\'/assets/img/cards/massage.webp\'); filter: hue-rotate(40deg);">'),
    
    (r'<div class="santis-stack-card" style="background-image: url\(\'/assets/img/cards/Santis-face-mask-4x5-1080x1350\.webp\'\); filter: grayscale\(50%\);">', 
     r'<div class="santis-stack-card" data-reveal="safir-isilti" style="background-image: url(\'/assets/img/cards/Santis-face-mask-4x5-1080x1350.webp\'); filter: grayscale(50%);">'),
     
    (r'<div class="santis-stack-card" style="background-image: url\(\'/assets/img/cards/Santis-spa-rest-graded-clean\.webp\'\); filter: sepia\(30%\);">', 
     r'<div class="santis-stack-card" data-reveal="ayurvedik-dokunus" style="background-image: url(\'/assets/img/cards/Santis-spa-rest-graded-clean.webp\'); filter: sepia(30%);">'),
     
    (r'<div class="santis-stack-card" style="background-image: url\(\'/assets/img/cards/skincare\.webp\'\); filter: contrast\(120%\);">', 
     r'<div class="santis-stack-card" data-reveal="sothys-paris" style="background-image: url(\'/assets/img/cards/skincare.webp\'); filter: contrast(120%);">'),
     
    (r'<div class="santis-stack-card" style="background-image: url\(\'/assets/img/cards/santis_card_massage_asian\.webp\'\); display:block; text-decoration:none;">', 
     r'<div class="santis-stack-card" data-reveal="wabi-sabi" style="background-image: url(\'/assets/img/cards/santis_card_massage_asian.webp\'); display:block; text-decoration:none;">')
]

for old, new in replacements:
    html = re.sub(old, new, html)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated tr/index.html with data-reveal targets.")
