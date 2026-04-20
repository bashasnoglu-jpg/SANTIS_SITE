import os
import json
import argparse
from pathlib import Path

try:
    from cryptography.hazmat.backends import default_backend
    from cryptography.hazmat.primitives.asymmetric import ec
    import base64
except ImportError:
    print("❌ Lütfen gerekli kütüphaneleri kurunuz: pip install cryptography pywebpush")
    exit(1)

def encode_base64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def generate_vapid_keys():
    print("🗝️ SANTIS Sovereign VAPID Mührü Oluşturuluyor...")
    
    # NIST P-256 (prime256v1) elliptic curve anahtar çifti
    private_key_obj = ec.generate_private_key(ec.SECP256R1(), default_backend())
    public_key_obj = private_key_obj.public_key()
    
    priv_bytes = private_key_obj.private_numbers().private_value.to_bytes(32, byteorder='big')
    
    pub_numbers = public_key_obj.public_numbers()
    pub_bytes = b'\x04' + pub_numbers.x.to_bytes(32, byteorder='big') + pub_numbers.y.to_bytes(32, byteorder='big')
    
    private_key_b64 = encode_base64url(priv_bytes)
    public_key_b64 = encode_base64url(pub_bytes)
    
    keys = {
        "publicKey": public_key_b64,
        "privateKey": private_key_b64
    }
    
    root = Path(__file__).resolve().parents[1]
    out_dir = root / "admin"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "vapid_keys.json"
    
    with open(out_path, "w") as f:
        json.dump(keys, f, indent=4)
        
    print(f"✅ VAPID Çifti Başarıyla Mühürlendi: {out_path.relative_to(root)}")
    print("\n--- Sovereign Public Key ---")
    print(public_key_b64)
    print("--------------------------\n")
    print("Yukarıdaki Açık Anahtarı (Public Key), frontend'deki PushManager abonelik sürecinde kullanacağız.\n")

if __name__ == "__main__":
    generate_vapid_keys()
