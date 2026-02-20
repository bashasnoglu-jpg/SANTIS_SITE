
import requests
import os

URL = "http://127.0.0.1:8000/admin/sentinel/download-report"
OUTPUT = "test_report.pdf"

print(f"Downloading report from {URL}...")
try:
    resp = requests.get(URL, timeout=10)
    if resp.status_code == 200:
        with open(OUTPUT, "wb") as f:
            f.write(resp.content)
        size = os.path.getsize(OUTPUT)
        print(f"✅ Report downloaded successfully. Size: {size} bytes")
        if size > 1000:
            print("✅ File size looks reasonable.")
        else:
            print("⚠️ File is suspiciously small.")
    else:
        print(f"❌ Failed: {resp.status_code} - {resp.text}")
except Exception as e:
    print(f"❌ Error: {e}")
