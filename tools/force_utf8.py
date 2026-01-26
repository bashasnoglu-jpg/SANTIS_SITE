import os

def force_utf8(file_path):
    try:
        # Read with potentially loose encoding fallback
        content = ""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            # Fallback to latin-1 or cp1254 (Turkish) if utf-8 fails
            try:
                with open(file_path, 'r', encoding='cp1254') as f:
                    content = f.read()
            except:
                 with open(file_path, 'r', encoding='latin-1') as f:
                    content = f.read()
        
        # Write back strictly as UTF-8
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Verified/Converted to UTF-8: {file_path}")
        
    except Exception as e:
        print(f"Failed to process {file_path}: {e}")

files_to_check = [
    r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\js\shop.js",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\css\style.css",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\products.html",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\service-detail.html",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\data\services_spa.json",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\js\db.js"
]

for fp in files_to_check:
    if os.path.exists(fp):
        force_utf8(fp)
    else:
        print(f"File not found: {fp}")
