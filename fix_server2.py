import re

with open('server.py', 'r', encoding='utf-8') as f:
    source = f.read()

source = source.replace('    auth,', '    auth,\n    session_auth,')

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(source)

print("Injected session_auth import")
