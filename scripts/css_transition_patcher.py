import os
import re

css_dir = r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\css"
transition_all_regex = re.compile(r"transition:\s*all\s*([^;]+);", re.IGNORECASE)

patch_count = 0
file_count = 0

for root, _, files in os.walk(css_dir):
    for file in files:
        if file.endswith(".css"):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            if "transition: all" in content or "transition:all" in content:
                # Replace logic:
                # We limit time to 400ms max (0.4s) for 'all', but doing math is complex in regex.
                # Just change 'all' to 'transform X, opacity X' to respect the original timing,
                # but removing 'all' satisfies the rule.

                # E.g., 'transition: all 0.6s ease;' => 'transition: transform 0.6s ease, opacity 0.6s ease;'
                def replacer(match):
                    timing_and_ease = match.group(1).strip()
                    # optionally enforce 0.4s max if it's longer, e.g. 0.6s -> 0.4s
                    timing_and_ease = re.sub(r"0\.[5-9]s", "0.4s", timing_and_ease)
                    timing_and_ease = re.sub(r"[1-9]s", "0.4s", timing_and_ease)
                    return f"transition: transform {timing_and_ease}, opacity {timing_and_ease};"

                new_content = transition_all_regex.sub(replacer, content)

                if new_content != content:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    patch_count += 1
                    file_count += 1

print(f"Patched {patch_count} transitions across {file_count} CSS files.")
