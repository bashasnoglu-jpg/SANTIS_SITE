import os

root_dir = os.getcwd()
resource_path = "/tr/galeri/index.html"
context_path = "index.html" # Assuming link is on home page

print(f"Root: {root_dir}")
print(f"Resource: {resource_path}")

# 1. Strip Query Strings & Hashes
clean_path = resource_path.split('?')[0].split('#')[0]
print(f"Clean: {clean_path}")

# Try relative to file
dir_context = os.path.dirname(context_path)
path_a = os.path.join(root_dir, dir_context, clean_path)
print(f"Path A: {path_a} | Exists: {os.path.exists(path_a)}")

# Try relative to root (fix for Windows absolute path behavior)
path_b = os.path.join(root_dir, clean_path.lstrip('/\\'))
print(f"Path B (joined): {path_b}")

path_b_replaced = path_b.replace('\\', '/').replace('//', '/')
print(f"Path B (replaced): {path_b_replaced} | Exists: {os.path.exists(path_b_replaced)}")

# Check original path_b without replace
print(f"Path B (plain): {path_b} | Exists: {os.path.exists(path_b)}")

# Special Case: ../
try:
     norm_path = os.path.normpath(os.path.join(root_dir, dir_context, clean_path))
     print(f"Norm Path: {norm_path} | Exists: {os.path.exists(norm_path)}")
except Exception as e:
    print(f"Norm Path Error: {e}")
