"""Quick TR vs Other language issue counter."""
import os, re

root = r'c:\Users\tourg\Desktop\SANTIS_SITE'
skip = {'_legacy_archive','_legacy_content','_snapshots','backup','backups','node_modules','admin','a4','components','assets','venv','__pycache__','.git','.vscode','_dev_archives','print','public','static','templates','includes','reports','sr'}
tr_issues = []
other_issues = []
for dp, dn, fn in os.walk(root):
    dn[:] = [d for d in dn if d not in skip]
    for f in fn:
        if not f.endswith('.html'): continue
        fp = os.path.join(dp, f)
        rel = os.path.relpath(fp, root).replace('\\','/')
        with open(fp,'r',encoding='utf-8',errors='ignore') as fh: c = fh.read()
        h1s = re.findall(r'<h1[^>]*>.*?</h1>', c, re.I|re.DOTALL)
        clean = re.sub(r'<script[^>]*>.*?</script>','',c,flags=re.I|re.DOTALL)
        clean = re.sub(r'<style[^>]*>.*?</style>','',clean,flags=re.I|re.DOTALL)
        tx = re.sub(r'<[^>]+>',' ',clean)
        tx = re.sub(r'\s+',' ',tx).strip()
        wc = len(tx.split())
        lnk = len(re.findall(r'<a\s[^>]*href',c,re.I))
        issues = []
        if len(h1s)==0: issues.append('NO_H1')
        elif len(h1s)>1: issues.append('MULTI_H1')
        if wc<80: issues.append('SHORT')
        if lnk<3: issues.append('LOW_LINKS')
        if issues:
            is_tr = rel.startswith('tr/') or rel in ('index.html','booking.html','service-detail.html','showroom.html','404.html','kese-ve-kopuk-masaji.html')
            if is_tr:
                tr_issues.append((rel, issues))
            else:
                other_issues.append((rel, issues))

print(f'TR scope remaining: {len(tr_issues)} files')
for r, i in tr_issues:
    print(f'  {r}: {", ".join(i)}')
print(f'\nOther langs remaining: {len(other_issues)} files')
print('  (mostly SHORT content in DE/FR/RU)')
