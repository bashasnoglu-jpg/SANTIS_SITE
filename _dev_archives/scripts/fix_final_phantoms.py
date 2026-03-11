import os

files_to_fix = [
    ('tr/blog/index.html', '/assets/img/blog/${post.img}', 'https://placehold.co/600x800/1a1a1a/444444?text=Santis+Journal'),
    ('tr/masajlar/index.html', '//cdn.santis.com', 'https://santisclub.com'),
    ('tr/rituals/sovereign-purification/index.html', '<link href="/assets/css/ritual-atmosphere.css" rel="stylesheet"/>', '')
]

for file_path, broken, fixed in files_to_fix:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        if broken in content:
            if fixed == '':
                lines = content.split('\n')
                new_lines = [line for line in lines if broken not in line]
                content = '\n'.join(new_lines)
            else:
                content = content.replace(broken, fixed)

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'🩸 [PURGED] {broken} in {file_path}')
