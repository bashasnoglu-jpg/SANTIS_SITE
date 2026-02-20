import requests
import sys
import os

# Default to Docker service name if running inside container network, or localhost if undefined
# But for simplicity, we mock it or let user define it.
# If running from host: http://localhost:8000/api/v1
# If running from another container: http://santis-web:8000/api/v1

BASE_URL = os.getenv("API_URL", "http://localhost:8000/api/v1")

def test_register():
    print(f"Testing Registration at {BASE_URL}...")
    email = "test_auth@example.com"
    password = "securepassword123"
    
    payload = {"email": email, "password": password}
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Is the server running?")
        sys.exit(1)
    
    if response.status_code == 200:
        print("✅ Registration Successful")
        return response.json()
    elif response.status_code == 400 and "already registered" in response.text:
        print("⚠️ User already registered, proceeding...")
        return {"email": email}
    else:
        print(f"❌ Registration Failed: {response.status_code} {response.text}")
        sys.exit(1)

def test_login():
    print("Testing Login...")
    payload = {"username": "test_auth@example.com", "password": "securepassword123"}
    response = requests.post(f"{BASE_URL}/auth/login", data=payload) # OAuth2 form request
    
    if response.status_code == 200:
        print("✅ Login Successful")
        return response.json()
    else:
        print(f"❌ Login Failed: {response.status_code} {response.text}")
        sys.exit(1)

def test_protected(token):
    print("Testing Protected Route (/users/me)...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/users/me", headers=headers)
    
    if response.status_code == 200:
        print(f"✅ Protected Route Access Successful. User: {response.json()['email']}")
    else:
        print(f"❌ Protected Route Failed: {response.status_code} {response.text}")
        sys.exit(1)

if __name__ == "__main__":
    try:
        user = test_register()
        tokens = test_login()
        test_protected(tokens['access_token'])
        print("\n🎉 ALL AUTH TESTS PASSED!")
    except Exception as e:
        print(f"\n❌ Test Script Error: {e}")
        sys.exit(1)
