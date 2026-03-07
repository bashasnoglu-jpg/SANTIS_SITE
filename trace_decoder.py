import json

try:
    with open('err.json', 'r', encoding='utf-16le', errors='ignore') as f:
        txt = f.read()

    # Find the start of the JSON object
    idx = txt.find('{')
    if idx != -1:
        txt = txt[idx:]
        data = json.loads(txt)
        err_str = data.get("error", "")
        # The stack trace is extremely long, let's print the last 1500 chars 
        # which contain the immediate frames before the ConnectionError
        print(err_str[-1500:])
    else:
        print("Couldn't find JSON payload in err.json")
except Exception as e:
    print(f"Extraction failed: {e}")
