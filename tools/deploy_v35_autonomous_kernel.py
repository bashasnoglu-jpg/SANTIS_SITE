import os
import re

SITE_ROOT = r"C:\Users\tourg\Desktop\SANTIS_SITE"

def deploy_v35_kernel():
    html_files = []
    
    # 1. Collect all HTML files
    for root, dirs, files in os.walk(SITE_ROOT):
        # Exclude dev archives or node_modules if any
        if "_dev_archives" in root or "node_modules" in root or ".git" in root:
            continue
        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))
                
    modified_count = 0
    
    # 2. Process each HTML file
    for filepath in html_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        
        # Remove legacy loader.js injects
        content = re.sub(r'<script[^>]*src=["\'][^"\']*loader\.js[^"\']*["\'][^>]*>.*?</script>\s*', '', content)
        # Remove legacy santis-nav.js injects
        content = re.sub(r'<script[^>]*src=["\'][^"\']*santis-nav\.js[^"\']*["\'][^>]*>.*?</script>\s*', '', content)
        
        # Check if bootloader exists
        if 'santis-bootloader.js' not in content:
            # Inject bootloader before </body>
            bootloader_tag = '\n<!-- SOVEREIGN OS BOOTLOADER (V35 KERNEL) -->\n<script type="module" src="/assets/js/boot/santis-bootloader.js?v=V35_OMEGA" defer></script>\n'
            if '</body>' in content:
                content = content.replace('</body>', f'{bootloader_tag}</body>')
            else:
                content += bootloader_tag
                
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            modified_count += 1
            print(f"✅ V35 Kernel Enforced: {os.path.relpath(filepath, SITE_ROOT)}")
            
    print(f"\n🚀 DEPLOYMENT COMPLETE: {modified_count} HTML files purged of legacy scripts and integrated with V35 Autonomous Kernel.")

if __name__ == "__main__":
    deploy_v35_kernel()
