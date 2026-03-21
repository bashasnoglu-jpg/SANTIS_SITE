import json
import hashlib

def generate_canonical_hash(payload: dict) -> str:
    """
    Generates a deterministic SHA256 hash for a dictionary.
    Keys are sorted, and no extra whitespace is added, guaranteeing
    the same byte-level output for the same logical content.
    """
    canonical_str = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

def generate_shard_path(hash_val: str) -> str:
    """
    Creates a static blob shard path.
    Example: a1b2c3d4... -> a1/b2/a1b2c3d4...
    """
    if not hash_val or len(hash_val) < 4:
        raise ValueError("Hash value too short to generate shards.")
    return f"{hash_val[:2]}/{hash_val[2:4]}/{hash_val}"
