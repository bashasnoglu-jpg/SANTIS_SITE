import os
import codecs

EXTENSIONS = {'.html', '.css', '.js', '.json'}
ROOT_DIR = '.'

def fix_file_encoding(filepath):
    try:
        # Read as binary to check BOM and raw content
        with open(filepath, 'rb') as f:
            raw = f.read()

        content = None
        has_bom = False

        # Check BOM
        if raw.startswith(codecs.BOM_UTF8):
            content = raw.decode('utf-8-sig')
            has_bom = True
        else:
            # Try decoding as raw UTF-8
            try:
                content = raw.decode('utf-8')
            except UnicodeDecodeError:
                # Fallback to Windows-1254 (Turkish)
                try:
                    content = raw.decode('cp1254')
                    print(f"Converted from CP1254: {filepath}")
                except UnicodeDecodeError:
                    print(f"Skipping (unknown encoding): {filepath}")
                    return

        # Write back as strict UTF-8 with NO BOM
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
        if has_bom:
            print(f"Removed BOM: {filepath}")

    except Exception as e:
        print(f"Error processing {filepath}: {e}")

def main():
    print("Scanning for encoding issues...")
    for root, dirs, files in os.walk(ROOT_DIR):
        if 'node_modules' in root or '.git' in root:
            continue
            
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in EXTENSIONS:
                fix_file_encoding(os.path.join(root, file))
    print("Encoding fix complete.")

if __name__ == '__main__':
    main()
