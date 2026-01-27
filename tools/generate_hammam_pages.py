import os

# Base Template Path
template_path = r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\hammam\ottoman-hammam-tradition.html"
output_dir = r"c:\Users\tourg\Desktop\SANTIS_SITE\tr\hammam"

# Slugs to generate
slugs = [
    "peeling-foam-massage",
    "foam-massage",
    "sea-salt-peeling",
    "coffee-peeling",
    "honey-ritual",
    "chocolate-ritual",
    "algae-ritual"
]

def main():
    # Read Template
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Generate Files
    for slug in slugs:
        # Replace the Slug Variable
        new_content = content.replace('window.HAMMAM_SLUG = "ottoman-hammam-tradition";', f'window.HAMMAM_SLUG = "{slug}";')
        
        # Write
        file_path = os.path.join(output_dir, f"{slug}.html")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"Generated: {slug}.html")

if __name__ == "__main__":
    main()
