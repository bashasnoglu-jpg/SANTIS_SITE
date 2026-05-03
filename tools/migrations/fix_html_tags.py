import re
import sys

def fix_broken_a_tags(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace the broken closing tag for the 'HEMEN REZERVASYON' button
        # The pattern is: HEMEN REZERVASYON\n                  </div>
        
        fixed_content = re.sub(
            r"(HEMEN REZERVASYON\s*?)</div>", 
            r"\1</a>", 
            content
        )
        
        if fixed_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"✅ Fixed broken <a> tags in {filepath}")
        else:
            print(f"⚠️ No changes needed in {filepath}")
            
    except Exception as e:
        print(f"❌ Error processing {filepath}: {str(e)}")

fix_broken_a_tags('tr/index.html')
fix_broken_a_tags('ritueller.html')
