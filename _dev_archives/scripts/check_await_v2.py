
import re

filepath = r"C:\Users\tourg\Desktop\SANTIS_SITE\admin\app-admin.js"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

current_function = None
is_async = False
brace_depth = 0
function_history = []

for i, line in enumerate(lines):
    line_num = i + 1
    stripped = line.strip()
    
    # Check for function start
    # async function foo()
    # function foo()
    # const foo = async () =>
    # const foo = () =>
    
    # 1. async function declaration
    if re.search(r"async\s+function", line):
        current_function = "async_decl_" + str(line_num)
        is_async = True
        brace_depth += line.count("{") - line.count("}")
        continue
        
    # 2. sync function declaration
    if re.search(r"\bfunction\s+\w+", line) and not re.search(r"async", line):
        current_function = "sync_decl_" + str(line_num)
        is_async = False
        brace_depth += line.count("{") - line.count("}")
        continue

    # Update braces
    brace_depth += line.count("{") - line.count("}")
    
    # Check await
    if "await " in line and not line.strip().startswith("//"):
        if not is_async:
            print(f"SUSPICIOUS AWAIT at Line {line_num}: {line.strip()} (In function {current_function})")

print("Analysis complete.")
