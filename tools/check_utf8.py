#!/usr/bin/env python3
import subprocess, sys, os

TEXT_EXT = {".html", ".css", ".js", ".json", ".md", ".txt", ".svg"}

def git_files():
    # Use explicit encoding for subprocess to avoid issues on Windows
    try:
        out = subprocess.check_output(["git", "ls-files"], text=True, encoding="utf-8", errors="replace")
    except subprocess.CalledProcessError:
        # Fallback if git command fails, scan directory manually (less ideal but works)
        files = []
        for root, _, filenames in os.walk("."):
            if ".git" in root or "node_modules" in root:
                continue
            for f in filenames:
                files.append(os.path.join(root, f))
        return files
        
    return [line.strip() for line in out.splitlines() if line.strip()]

def is_text(path: str) -> bool:
    _, ext = os.path.splitext(path.lower())
    return ext in TEXT_EXT

def check_file(path: str) -> str | None:
    if not os.path.exists(path):
        return None
        
    try:
        data = open(path, "rb").read()
    except Exception as e:
        return f"READ_FAIL: {path} ({e})"

    # Accept UTF-8 and UTF-8 with BOM
    for enc in ("utf-8", "utf-8-sig"):
        try:
            data.decode(enc)
            return None
        except UnicodeDecodeError:
            pass
    return f"NON_UTF8: {path}"

def main():
    print("Running UTF-8 Check...")
    bad = []
    files = git_files()
    
    count = 0
    for f in files:
        if not is_text(f):
            continue
        count += 1
        err = check_file(f)
        if err:
            bad.append(err)

    print(f"Scanned {count} text files.")

    if bad:
        print("❌ UTF-8 CHECK FAILED")
        for x in bad:
            print(" -", x)
        sys.exit(1)

    print("✅ UTF-8 CHECK PASSED")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(130)
