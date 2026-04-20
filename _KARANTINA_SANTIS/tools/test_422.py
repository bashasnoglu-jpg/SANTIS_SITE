import requests
import json

url = "http://localhost:8000/api/v1/ai/proactive-closing"

data = {
    "intent_score": "98",  # JS'den string olarak geliyor
    "persona": "Sovereign Guest",
    "visited_pages": [],
    "duration_seconds": 0,
    "is_abandoning": True
}

response = requests.post(url, json=data)

print(f"Status Code: {response.status_code}")
print(f"Response Body: {response.text}")
