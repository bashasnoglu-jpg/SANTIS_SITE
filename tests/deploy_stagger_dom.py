import os
from bs4 import BeautifulSoup
import bs4

def wrap_stagger_elements(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()
        
    soup = BeautifulSoup(html, 'html.parser')
    reveal_containers = soup.find_all(class_='santis-reveal-data')
    
    modified = False
    for container in reveal_containers:
        idx = 0
        
        # We need to collect the children first to avoid modifying the list while iterating
        children = [child for child in container.children if isinstance(child, bs4.Tag)]
        
        for child in children:
            # Check if it's already a mask
            if 'santis-stagger-mask' in child.get('class', []):
                continue
                
            # Create mask wrapper
            mask = soup.new_tag('div', **{'class': 'santis-stagger-mask', 'style': f'--stagger-idx: {idx};'})
            
            # ensure element has santis-stagger-item class
            classes = child.get('class', [])
            if 'santis-stagger-item' not in classes:
                classes.append('santis-stagger-item')
                child['class'] = classes
                
            # Insert mask before child, then move child inside mask
            child.insert_before(mask)
            mask.append(child.extract())
            
            idx += 1
            modified = True
            
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        print(f"Wrapped orphans in {file_path}")
    else:
        print(f"No orphans modified in {file_path}")

try:
    wrap_stagger_elements(r"c:\\Users\\tourg\\Desktop\\SANTIS_SITE\\tr\\index.html")
    wrap_stagger_elements(r"c:\\Users\\tourg\\Desktop\\SANTIS_SITE\\ritueller.html")
except Exception as e:
    print(f"Error: {e}")
