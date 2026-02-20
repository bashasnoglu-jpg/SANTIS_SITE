import os

root = r"C:\Users\tourg\Desktop\SANTIS_SITE"
context_path = "/tr/masajlar/index.html"
resource = "../../assets/js/santis-booking.js"

print(f"Root: {root}")
print(f"Exists Root: {os.path.exists(root)}")

# Simulate Server Logic
dir_context = os.path.dirname(context_path) # likely /tr/masajlar on linux-style string
print(f"Dir Context: {dir_context}")

full_path_raw = os.path.join(root, dir_context, resource)
print(f"Raw Join: {full_path_raw}")

norm_path = os.path.normpath(full_path_raw)
print(f"Norm Path: {norm_path}")
print(f"Exists Norm: {os.path.exists(norm_path)}")

# Fix Attempt: Strip leading slash from context
dir_context_stripped = dir_context.lstrip('/\\')
full_path_stripped = os.path.join(root, dir_context_stripped, resource)
print(f"Stripped Join: {full_path_stripped}")
norm_stripped = os.path.normpath(full_path_stripped)
print(f"Norm Stripped: {norm_stripped}")
print(f"Exists Stripped: {os.path.exists(norm_stripped)}")

# Specific file check
target = os.path.join(root, "assets", "js", "santis-booking.js")
print(f"Direct Check ({target}): {os.path.exists(target)}")
