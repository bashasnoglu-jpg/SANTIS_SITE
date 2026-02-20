
path = r"C:\Users\tourg\Desktop\SANTIS_SITE\admin\style-admin.css"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# We want to keep lines up to index 886 (line 887).
# Line 887 is where the duplication/corruption starts with blank lines and then the orphaned vars.
# Let's verify line 886 is "}"
print(f"Line 886: {lines[885].strip()}")

# If it's "}", then we cut everything after.
new_lines = lines[:886]

with open(path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print(f"Truncated to {len(new_lines)} lines.")
