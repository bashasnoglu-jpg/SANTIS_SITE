import re

file_path = 'c:\\Users\\tourg\\Desktop\\SANTIS_SITE\\tr\\index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace <h3>
html = re.sub(
    r'<h3([\s>])',
    r'<h3 data-morph="title"\1',
    html
)
# Wait, replacing all <h3> in index.html is too broad! We only want to replace them inside santis-stack-card
# Let's do it safely by finding the 3D stage block and replacing there.

start_tag = '<div class="santis-carousel-stage custom-cover-flow" id="sov-3d-stage"'
end_tag = '<div style="text-align: center; margin-top: 4rem;">'
start_idx = html.find(start_tag)
end_idx = html.find(end_tag, start_idx)

if start_idx != -1 and end_idx != -1:
    block = html[start_idx:end_idx]
    
    # <h3> into <h3 data-morph="title">
    block = re.sub(r'<h3>', r'<h3 data-morph="title">', block)
    
    # <span class="santis-stack-meta"> into <span class="santis-stack-meta" data-morph="meta">
    block = re.sub(r'<span class="santis-stack-meta">', r'<span data-morph="meta" class="santis-stack-meta">', block)
    
    # <h2 style="font-family: 'Playfair Display', serif; font-size: 3.5rem; margin-bottom: 20px; color: #fff;"> 
    #   into <h2 data-morph="title" ...
    block = re.sub(r'<h2 style="font-family: \'Playfair Display\', serif(.*?)"', r'<h2 data-morph="title" style="font-family: \'Playfair Display\', serif\1"', block)
    
    # <p style="font-size: 1.2rem; color: rgba(255,255,255,0.9); line-height: 1.9; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">
    #   into <p data-morph="meta" ...
    block = re.sub(r'<p style="font-size: 1.2rem; color(.*?)"', r'<p data-morph="meta" style="font-size: 1.2rem; color\1"', block)

    html = html[:start_idx] + block + html[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated data-morph successfully in tr/index.html")
