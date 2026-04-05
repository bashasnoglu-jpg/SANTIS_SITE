import pathlib

file_path = pathlib.Path(r'c:\Users\tourg\Desktop\SANTIS_SITE\ritueller.html')
content = file_path.read_text(encoding='utf-8')
new_content = content.replace('santis_ritual.webp', 'santis_card_massage_v1.webp')

if new_content != content:
    file_path.write_text(new_content, encoding='utf-8')
    print("Replaced santis_ritual.webp in ritueller.html")
else:
    print("No changes needed in ritueller.html")
