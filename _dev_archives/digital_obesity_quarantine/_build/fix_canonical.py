"""Fix missing canonical tags in identified pages."""
import re

FIXES = {
    r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\hediye-karti.html": "https://santis.club/tr/hediye-karti.html",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\iletisim.html": "https://santis.club/tr/iletisim.html",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\bilgelik\index.html": "https://santis.club/tr/bilgelik/index.html",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\magaza\atelier.html": "https://santis.club/tr/magaza/atelier.html",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\magaza\index.html": "https://santis.club/tr/magaza/index.html",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\magaza\kozmetik.html": "https://santis.club/tr/magaza/kozmetik.html",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\magaza\paketler.html": "https://santis.club/tr/magaza/paketler.html",
    r"c:\Users\tourg\Desktop\SANTIS_SITE\en\contact.html": "https://santis.club/en/contact.html",
}

for filepath, canonical_url in FIXES.items():
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if 'rel="canonical"' in content:
        print(f"  SKIP {filepath} (already has canonical)")
        continue
    
    # Insert canonical before </head>
    tag = f'<link href="{canonical_url}" rel="canonical"/>'
    content = content.replace("</head>", f"{tag}\n</head>")
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"  ✅ Fixed: {filepath}")

print("\nDone!")
