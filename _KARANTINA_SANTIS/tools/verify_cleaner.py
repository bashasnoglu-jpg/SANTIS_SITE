
from master_cleaner import MasterCleaner
import os

# Create a dummy HTML file with issues
test_file = "test_ghost.html"
with open(test_file, "w", encoding="utf-8") as f:
    f.write('<html><div style="z-index: 9999">Ghost</div><p>Ã¼</p></html>')

cleaner = MasterCleaner(".")
print("🔍 Scanning...")
ghosts = cleaner.scan_ghost_layers()
print("Ghosts found:", ghosts)

utf8 = cleaner.scan_utf8_issues()
print("UTF8 found:", utf8)

# Clean
print("🧹 Cleaning...")
cleaner.fix_ghost_layers()
cleaner.fix_utf8_issues()

# Verify
with open(test_file, "r", encoding="utf-8") as f:
    content = f.read()
    print("Final Content:", content)

# Cleanup
if os.path.exists(test_file):
    os.remove(test_file)
