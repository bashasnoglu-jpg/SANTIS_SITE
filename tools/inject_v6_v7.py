import os
import stat
import re
from pathlib import Path

def inject_scripts():
    site_dir = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE")
    
    # Eklenecek scriptler bloğu (Root path)
    injection_root = (
        '<script src="/assets/js/santis-sentinel.js?v=9.1" async></script>\n'
        '<script defer="" src="/assets/js/santis-ghost.js?v=9.1"></script>\n'
        '<script defer="" src="/assets/js/santis-chameleon.js?v=9.1"></script>\n'
        '<script defer="" src="/assets/js/santis-persuader.js?v=9.1"></script>\n'
    )

    modified_count = 0
    
    # Root ve altındaki tüm html'ler (admin, node_modules, _dev_archives HARİÇ)
    for html_file in site_dir.rglob("*.html"):
        path_str = str(html_file).lower()
        if "_dev_archives" in path_str or "node_modules" in path_str or "admin" in path_str:
            continue
            
        try:
            # Fix readonly files
            os.chmod(html_file, stat.S_IWRITE)
            
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Zaten eklendiyse atla
            if "santis-persuader.js" in content:
                continue

            # app-core.js bulma (esnek regex)
            # app-core root veya relative olabilir
            pattern = re.compile(r'(<script[^>]*src=[\'"]([^\'"]*?)app-core\.js[^>]*>\s*</script>)', re.IGNORECASE)
            match = pattern.search(content)

            if match:
                full_tag = match.group(1)
                src_val = match.group(2) # e.g. "/assets/js/" or "../assets/js/"
                
                # Relatif durumu için injection ayarlama
                custom_injection = injection_root
                if src_val.startswith("../"):
                    # Level atlama. Eger ../../assets ise? /assets kısmından oncesini kullan
                    base = src_val.replace("assets/js/", "")
                    custom_injection = (
                        f'<script src="{base}assets/js/santis-sentinel.js?v=9.1" async></script>\n'
                        f'<script defer="" src="{base}assets/js/santis-ghost.js?v=9.1"></script>\n'
                        f'<script defer="" src="{base}assets/js/santis-chameleon.js?v=9.1"></script>\n'
                        f'<script defer="" src="{base}assets/js/santis-persuader.js?v=9.1"></script>\n'
                    )

                new_content = content.replace(full_tag, custom_injection + full_tag)
                
                with open(html_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                modified_count += 1

        except Exception as e:
            print(f"Error processing {html_file}: {e}")

    print(f"Injection complete. Modified {modified_count} HTML files.")

if __name__ == "__main__":
    inject_scripts()
