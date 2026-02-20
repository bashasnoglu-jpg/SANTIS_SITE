import re

filepath = r"C:\Users\tourg\Desktop\SANTIS_SITE\admin\app-admin.js"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

function_stack = [] # (name, is_async)

for i, line in enumerate(lines):
    line_num = i + 1
    stripped = line.strip()

    # Detect async function definitions
    # Match: async function foo(), const foo = async () =>, (async () =>, async foo()
    
    # 1. async function declaration
    if re.search(r"async\s+function", stripped):
        function_stack.append({"name": "async_fn_" + str(line_num), "is_async": True, "indent": len(line) - len(line.lstrip())})
        # Note: This simple parser doesn't track braces perfectly but gives a heuristic.
    
    # 2. function declaration (sync)
    elif re.search(r"\bfunction\b", stripped) and not re.search(r"async", stripped) and not re.search(r"//", stripped):
        function_stack.append({"name": "sync_fn_" + str(line_num), "is_async": False, "indent": len(line) - len(line.lstrip())})

    # 3. Check for await usage
    if "await " in stripped and not stripped.startswith("//"):
        # We need to know if we are in an async function.
        # This requires robust brace counting which regex can't easily do.
        pass

print("This script is too simple for brace matching. I will just search for lines with 'await' that don't look like they are in async contexts.")

# Better approach: Read the file, search for 'await', and if found, scan backwards to find the enclosing function and check for 'async'.

content = "".join(lines)
awaits = [m.start() for m in re.finditer(r"\bawait\b", content)]

print(f"Found {len(awaits)} usages of 'await'.")

for pos in awaits:
    # Find the function enclosure
    # Scan backwards counting braces
    brace_balance = 0
    enclosure_start = -1
    
    # This is also complex.
    # Let's simple check: 
    # Does 'await' appear in a function defined as 'function name(' without async?
    pass

print("Manually check these lines:")
for i, line in enumerate(lines):
    if "await " in line.strip() and not line.strip().startswith("//"):
        print(f"Line {i+1}: {line.strip()}")
