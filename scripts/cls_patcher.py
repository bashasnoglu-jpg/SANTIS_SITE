import re

file_path = r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\index.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Her `.santis-stack-card` elementine `.cls-skeleton` ekleyelim
content = content.replace(
    'class="santis-stack-card"', 'class="santis-stack-card cls-skeleton"'
)


# 2. Her `<img ...>` tagine cls-skeleton blur-up onload logic'lerini ekleyelim
# We will seek <img> tags that don't have blur-up yet
def img_replacer(match):
    tag = match.group(0)

    # Eger hero ise atla (zaten regex veya onceden yaptik)
    if "hero-visual" in tag and "blur-up" in tag:
        return tag

    # Eger blur-up veya loaded varsa atla
    if "blur-up" in tag:
        return tag

    # class attributenu bul.
    # Eger class varsa icine blur-up ekle, yoksa class="blur-up" ekle
    if 'class="' in tag:
        tag = re.sub(r'class="([^"]*)"', r'class="\1 blur-up"', tag)
    else:
        tag = tag.replace("<img ", '<img class="blur-up" ')

    # onload eventi ekle
    if "onload=" not in tag:
        tag = tag.replace("<img ", "<img onload=\"this.classList.add('loaded')\" ")

    return tag


content = re.sub(r"<img [^>]+>", img_replacer, content)

# 3. Yanyana felsefe kutusuna skeleton
content = content.replace(
    'class="santis-philosophy-visual depth-1"',
    'class="santis-philosophy-visual depth-1 cls-skeleton" style="aspect-ratio: 3 / 4; overflow: hidden;"',
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("tr/index.html CLS & Blur-up patch completed.")
