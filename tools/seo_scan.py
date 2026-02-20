"""SEO Diagnostic Scanner - Scans all HTML pages for H1, alt text, content length, and internal link issues."""
import os, re, json

root = r'c:\Users\tourg\Desktop\SANTIS_SITE'
skip_dirs = {'_legacy_archive','_legacy_content','_snapshots','backup','backups','node_modules','admin','a4','components','assets','venv','__pycache__','.git','.vscode','_dev_archives','print','public','static','templates','includes','sr'}

results = []
for dirpath, dirnames, filenames in os.walk(root):
    dirnames[:] = [d for d in dirnames if d not in skip_dirs]
    for f in filenames:
        if not f.endswith('.html'):
            continue
        fp = os.path.join(dirpath, f)
        rel = os.path.relpath(fp, root)
        try:
            with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
        except:
            continue
        
        # Count H1 tags
        h1s = re.findall(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
        h1_count = len(h1s)
        h1_texts = [re.sub(r'<[^>]+>', '', h).strip()[:50] for h in h1s]
        
        # Find imgs without alt or with empty alt
        imgs = re.findall(r'<img\s[^>]*?>', content, re.IGNORECASE | re.DOTALL)
        missing_alt = 0
        for img in imgs:
            if 'alt=' not in img.lower():
                missing_alt += 1
            elif re.search(r'alt\s*=\s*["\'][\s]*["\']', img):
                missing_alt += 1
        
        # Count internal links in <main> or body (exclude nav/footer patterns)
        internal_links = len(re.findall(r'<a\s[^>]*href\s*=\s*["\'][^"\']*["\']', content, re.IGNORECASE))
        
        # Content length (text only, no tags, no scripts)
        clean = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.IGNORECASE | re.DOTALL)
        clean = re.sub(r'<style[^>]*>.*?</style>', '', clean, flags=re.IGNORECASE | re.DOTALL)
        text_only = re.sub(r'<[^>]+>', ' ', clean)
        text_only = re.sub(r'\s+', ' ', text_only).strip()
        word_count = len(text_only.split())
        
        issues = []
        if h1_count == 0:
            issues.append('NO_H1')
        elif h1_count > 1:
            issues.append(f'MULTI_H1({h1_count})')
        if missing_alt > 0:
            issues.append(f'ALT_MISS({missing_alt})')
        if word_count < 80:
            issues.append(f'SHORT({word_count}w)')
        if internal_links < 3:
            issues.append(f'LOW_LINKS({internal_links})')
        
        if issues:
            results.append({
                'file': rel,
                'issues': issues,
                'h1_count': h1_count,
                'h1_texts': h1_texts,
                'missing_alt': missing_alt,
                'word_count': word_count,
                'internal_links': internal_links
            })

results.sort(key=lambda x: len(x['issues']), reverse=True)

print(f'=== TOTAL FILES WITH ISSUES: {len(results)} ===\n')
for r in results:
    h1_info = f' h1=[{", ".join(r["h1_texts"])}]' if r['h1_texts'] else ''
    print(f'  {r["file"]}')
    print(f'    Issues: {", ".join(r["issues"])}{h1_info}')
    print(f'    Words:{r["word_count"]} Links:{r["internal_links"]} AltMiss:{r["missing_alt"]}')
    print()
