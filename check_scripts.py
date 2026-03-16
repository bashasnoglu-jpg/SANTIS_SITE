import os, re
files = ['admin/boardroom.html', 'admin/command-center.html', 'admin/gods-eye-vision.html']
for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            c = file.read()
            print(f'--- {f} scripts ---')
            for s in re.findall(r'<script.*?src=[\'\"](.*?)[\'\"]', c, re.IGNORECASE):
                print(s)
    except Exception as e:
        print(f"Error {f}: {e}")
