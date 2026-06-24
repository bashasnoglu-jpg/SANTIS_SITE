import os
import json
import urllib.request
import urllib.parse
import time

def get_env(key):
    if os.environ.get(key): return os.environ.get(key)
    try:
        with open(".env") as f:
            for line in f:
                if line.startswith(key + "="):
                    return line.strip().split("=", 1)[1]
    except FileNotFoundError: pass
    return None

PAT = get_env("AIRTABLE_PAT") or get_env("AIRTABLE_API_KEY")
BASE_ID = get_env("AIRTABLE_BASE_ID") or "app7VPfdgji5FzLHg"

def patch_record(table, record_id, new_environment):
    url = f"https://api.airtable.com/v0/{BASE_ID}/{urllib.parse.quote(table)}/{record_id}"
    payload = {
        "fields": {
            "Environment": new_environment
        }
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='PATCH')
    req.add_header('Authorization', f'Bearer {PAT}')
    req.add_header('Content-Type', 'application/json')
    try:
        urllib.request.urlopen(req)
        return True, ""
    except Exception as e:
        err_msg = str(e)
        if hasattr(e, 'read'):
            err_msg += " " + e.read().decode('utf-8')
        return False, err_msg

def main():
    print("Starting Phase 3: Cleanup/PATCH Airtable Environment...")
    with open('airtable_environment_reclassification_plan.json', 'r', encoding='utf-8') as f:
        plan = json.load(f)
        
    updates = [r for r in plan if r['current_environment'] != r['recommended_environment']]
    print(f"Total proposed updates to apply: {len(updates)}")
    
    success_count = 0
    fail_count = 0
    failed_rows = []
    
    for r in updates:
        time.sleep(0.2) # Avoid rate limits
        success, err = patch_record(r['table'], r['record_id'], r['recommended_environment'])
        if success:
            success_count += 1
            print(f"  [SUCCESS] {r['table']} / {r['record_id']} -> {r['recommended_environment']}")
        else:
            fail_count += 1
            err_str = f"[{r['table']}] {r['record_id']} - Error: {err}"
            failed_rows.append(err_str)
            print(f"  [FAILED] {err_str}")
            
    print(f"\nCleanup finished. Success: {success_count}, Failed: {fail_count}")
    
    if fail_count > 0:
        with open("airtable_patch_failures.json", "w", encoding="utf-8") as f:
            json.dump(failed_rows, f, indent=2)
        print("Failures written to airtable_patch_failures.json")

if __name__ == "__main__":
    main()
