import urllib.request
import urllib.error
import sys

def trace_redirects(url):
    print(f"Tracing: {url}")
    visited = set()
    current_url = url
    
    class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return None # Do not follow
            
    opener = urllib.request.build_opener(NoRedirectHandler())
    
    count = 0
    while count < 10:
        if current_url in visited:
            print(f"INFINITE LOOP DETECTED TO: {current_url}")
            break
        visited.add(current_url)
        
        try:
            req = urllib.request.Request(current_url, headers={'User-Agent': 'Mozilla/5.0'})
            response = opener.open(req)
            code = response.getcode()
            print(f"[{code}] {current_url}")
            break
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 303, 307, 308):
                location = e.headers.get('Location')
                print(f"[{e.code}] {current_url}\n  -> Redirects to: {location}")
                if location.startswith('/'):
                    current_url = 'https://santis-club.com' + location
                else:
                    current_url = location
                count += 1
            else:
                print(f"[{e.code}] {current_url}")
                break
        except Exception as e:
            print(f"Error: {e}")
            break

trace_redirects("https://santis-club.com/tr/hamam/kopuk-masaji.html")
print("-" * 40)
trace_redirects("https://santis-club.com/tr/masajlar/anti-stress.html")
print("-" * 40)
trace_redirects("https://santis-club.com/tr/masajlar/anti-stress-masaji.html")
