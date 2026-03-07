import json
from app.utils.hash_utils import generate_canonical_hash, generate_shard_path

def test_determinism():
    payload1 = {"name": "Test", "value": 123, "active": True}
    payload2 = {"value": 123, "active": True, "name": "Test"}
    payload3 = {"active": True, "name": "Test", "value": 123}

    hash1 = generate_canonical_hash(payload1)
    hash2 = generate_canonical_hash(payload2)
    hash3 = generate_canonical_hash(payload3)

    print(f"Hash 1: {hash1}")
    print(f"Hash 2: {hash2}")
    print(f"Hash 3: {hash3}")

    assert hash1 == hash2 == hash3, "Hashes are not deterministic!"
    print("\n✅ Determinism Check Passed: All 3 hashes match perfectly.")

    shard_path = generate_shard_path(hash1)
    print(f"Example Shard Path: {shard_path}")
    
    assert shard_path.startswith(f"{hash1[:2]}/{hash1[2:4]}/"), "Shard path generation failed!"
    print("✅ Shard Path Check Passed.")

if __name__ == "__main__":
    test_determinism()
