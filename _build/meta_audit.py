"""Meta tag audit for all HTML pages."""
import os

root = r"c:\Users\tourg\Desktop\SANTIS_SITE"
langs = ["tr","en","de","fr","ru","sr"]
issues = []
total = 0

for lang in langs:
    d = os.path.join(root, lang)
    if not os.path.isdir(d):
        continue
    for dp, dn, fn in os.walk(d):
        for f in fn:
            if not f.endswith(".html"):
                continue
            total += 1
            fp = os.path.join(dp, f)
            with open(fp, "r", encoding="utf-8", errors="ignore") as fh:
                c = fh.read()
            rel = os.path.relpath(fp, root).replace("\\", "/")
            probs = []
            if "<title>" not in c:
                probs.append("NO_TITLE")
            if 'name="description"' not in c:
                probs.append("NO_DESC")
            if 'rel="canonical"' not in c:
                probs.append("NO_CANONICAL")
            if probs:
                issues.append(f"  {rel} : {', '.join(probs)}")

print(f"Scanned: {total} pages")
print(f"Issues: {len(issues)}")
for i in issues:
    print(i)
if not issues:
    print("  ALL CLEAR!")
