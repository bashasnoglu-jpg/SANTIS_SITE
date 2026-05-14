import re
import sys

def convert_and_inject(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Step 1: Replace <a class="santis-stack-card" href="..." ...> with <div class="santis-stack-card" ...>
        # We need to capture everything else in the tag except href
        def a_to_div(match):
            tag_content = match.group(1)
            # Remove href attribute completely
            tag_content = re.sub(r'\s*href="[^"]+"', '', tag_content)
            return f'<div {tag_content}>'

        content = re.sub(r'<a\s+([^>]*?class=["\'][^"\']*santis-stack-card[^"\']*["\'][^>]*?)>', a_to_div, content)

        # Step 2: Replace closing </a> that belong to santis-stack-card.
        # This is tricky without a full parser, but let's assume if we replaced the opening <a, we should replace the closing </a>.
        # Actually, since we know these were cards, we can just replace all </a> that come after the opening tag before the next card.
        # But wait, we can just do a regex replace if we capture the whole block.
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    # Rather than a complex regex for balancing, let's just use Python's html.parser or simple string matching.
    # Since we know the exact line, we can just replace `<a class="santis-stack-card"` with `<div class="santis-stack-card"`
    # and we know exactly where they are.
    with open('tr/index.html', 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace opening tags
    content = re.sub(r'<a class="santis-stack-card" href="[^"]+"(.*?)(>)', r'<div class="santis-stack-card"\1\2', content)
    
    # Replace closing tags. In our previous run, `inject_reveal.py` failed to find these because it was looking for `</div>`.
    # Let's run a generic replacement: if a card block starts with `<div class="santis-stack-card"` but ends with `</a>`, change it to `</div>`.
    
    def fix_closing(match):
        return match.group(1) + '</div>'
        
    content = re.sub(r'(<div class="santis-stack-card".*?)(</a>)', fix_closing, content, flags=re.DOTALL)
    
    with open('tr/index.html', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Fixed A tags.")
