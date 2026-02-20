import subprocess

try:
    print('Loading objects...')
    objects = subprocess.check_output(['git', 'rev-list', '--objects', '--all']).decode('utf-8', errors='ignore').splitlines()
    obj_to_path = {}
    for line in objects:
        parts = line.split(maxsplit=1)
        if len(parts) == 2:
            obj_to_path[parts[0]] = parts[1]
    
    print(f'Checking {len(obj_to_path)} objects...')
    input_data = '\n'.join(obj_to_path.keys()).encode('utf-8')
    batch_check = subprocess.run(['git', 'cat-file', '--batch-check'], input=input_data, capture_output=True).stdout.decode('utf-8')
    
    found = False
    for line in batch_check.splitlines():
        parts = line.split()
        if len(parts) >= 3 and parts[1] == 'blob':
            size = int(parts[2])
            if size > 50 * 1024 * 1024:
                h = parts[0]
                print(f"{size/(1024*1024):.2f} MB: {obj_to_path.get(h, 'Unknown')} ({h})")
                found = True
    if not found:
        print('No files larger than 50MB found.')
except Exception as e:
    print('Error:', e)
