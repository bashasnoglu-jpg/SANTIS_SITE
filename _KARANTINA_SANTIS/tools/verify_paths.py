import urllib.request

import urllib.error



urls = [

    "http://localhost:8000/assets/js/product-data.js",

    "http://localhost:8000/assets/js/settings-data.js",

    "http://localhost:8000/admin/index.html"

]



for url in urls:

    try:

        with urllib.request.urlopen(url) as response:

            print(f"✅ {url} - Status: {response.status}")

            # print(f"   Content Length: {len(response.read())}")

    except urllib.error.HTTPError as e:

        print(f"❌ {url} - Failed: {e.code} {e.reason}")

    except Exception as e:

        print(f"❌ {url} - Error: {e}")

