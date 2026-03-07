import sys
import uuid
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import HTTPException
import asyncio

# Setup path to import app modules
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.config import settings
from app.core.security import decode_token, create_access_token

def run_tests():
    print("--- STARTING STRICT JWT NEGATIVE TESTS ---")
    valid_token = create_access_token(subject="test@user.com", token_version=1)
    
    # Test 1: Valid Token
    try:
        decode_token(valid_token)
        print("✅ TEST 1 (Valid Token): Passed")
    except Exception as e:
        print(f"❌ TEST 1 (Valid Token): Failed - {e}")

    # Test 2: Expired Token
    try:
        expired = create_access_token("test@user.com", 1, expires_delta=timedelta(seconds=-10))
        decode_token(expired)
        print("❌ TEST 2 (Expired Token): Failed (Should have raised error)")
    except HTTPException as e:
        print("✅ TEST 2 (Expired Token): Passed (Blocked)")
    except Exception as e:
        print(f"⚠️ TEST 2 Raised different error: {e}")

    # Test 3: Missing 'exp' claim
    try:
        now = datetime.now(timezone.utc)
        bad_payload = {
            "jti": str(uuid.uuid4()), "iat": now, "nbf": now,
            "sub": "test", "role": "admin", "region": "tr"
        }
        bad_token = jwt.encode(bad_payload, settings.SECRET_KEY, algorithm="HS256")
        decode_token(bad_token)
        print("❌ TEST 3 (Missing exp): Failed (Should have blocked)")
    except HTTPException:
        print("✅ TEST 3 (Missing exp): Passed (Blocked)")

    # Test 4: Alg NONE Attack
    try:
        from cryptography.hazmat.primitives.asymmetric import rsa
        # Just create an untrusted JWT
        bad_token = jwt.encode({"sub": "test"}, key="wrong_secret", algorithm="HS256")
        # Tamper it bypassing signature (None alg attack simulation)
        header = '{"alg": "none", "typ": "JWT"}'
        import base64
        b64_header = base64.urlsafe_b64encode(header.encode()).decode().rstrip("=")
        b64_payload = base64.urlsafe_b64encode(b'{"sub": "test", "role": "admin", "exp": 9999999999}').decode().rstrip("=")
        none_token = f"{b64_header}.{b64_payload}."
        decode_token(none_token)
        print("❌ TEST 4 (Alg NONE): Failed (Should have blocked)")
    except HTTPException:
        print("✅ TEST 4 (Alg NONE): Passed (Blocked)")
    except Exception as e:
         print(f"✅ TEST 4 (Alg NONE): Passed ({e})")

    # Test 5: Invalid Role
    try:
        invalid_role_token = create_access_token("test", 1, role="guest")
        decode_token(invalid_role_token)
        print("❌ TEST 5 (Invalid Role): Failed (Should have blocked)")
    except HTTPException as e:
        if e.status_code == 403:
            print("✅ TEST 5 (Invalid Role): Passed (Blocked 403)")
        else:
            print(f"⚠️ TEST 5 Raised {e.status_code}")

    # Test 6: Future IAT
    try:
        future_token = create_access_token("test", 1)
        # Decode and modify IAT
        payload = jwt.decode(future_token, settings.SECRET_KEY, algorithms=["HS256"], options={"verify_signature": False})
        payload["iat"] = (datetime.now(timezone.utc) + timedelta(minutes=10)).timestamp()
        bad_future = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
        decode_token(bad_future)
        print("❌ TEST 6 (Future IAT): Failed")
    except HTTPException:
        print("✅ TEST 6 (Future IAT): Passed (Blocked)")

if __name__ == "__main__":
    run_tests()
