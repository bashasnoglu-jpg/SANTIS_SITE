import requests

url = "http://localhost:8000/api/v1/media/upload"
files = {'file': ('test.jpg', b'dummy content', 'image/jpeg')}
data = {'category': 'hamam', 'slot': 'test_slot'}

response = requests.post(url, files=files, data=data)
print(f"Status Code: {response.status_code}")
print(response.text)
