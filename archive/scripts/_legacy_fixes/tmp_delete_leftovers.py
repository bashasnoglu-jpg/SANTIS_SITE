import re

with open("cilt-bakimi.html", "r", encoding="utf-8") as f:
    text = f.read()

# Delete from COVER FLOW CATEGORY CAROUSELS up to the start of the JS block
pattern = re.compile(r"<!-- COVER FLOW CATEGORY CAROUSELS -->.*?(?=<script>\n// Sovereign OS Module Sync)", re.DOTALL)
new_text = pattern.sub("", text)

with open("cilt-bakimi.html", "w", encoding="utf-8") as f:
    f.write(new_text)

print("Cleanup complete.")
