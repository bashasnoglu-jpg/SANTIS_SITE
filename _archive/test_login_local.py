
import asyncio
import httpx

async def test_login():
    print("Testing Login...")
    async with httpx.AsyncClient() as client:
        try:
            # Login typically expects form-data for OAuth2PasswordRequestForm
            payload = {
                "username": "admin@santis.com",
                "password": "santis_admin"
            }
            # Note: FastAPI OAuth2PasswordRequestForm expects form data, not JSON
            response = await client.post("http://localhost:8000/api/v1/auth/login", data=payload)
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                print("✅ Login Successful!")
                token = response.json().get("access_token")
                print(f"Token: {token[:20]}...")
            else:
                print("❌ Login Failed.")

        except Exception as e:
            print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_login())
