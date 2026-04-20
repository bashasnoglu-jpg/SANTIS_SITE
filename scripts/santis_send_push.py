import json
import argparse
from pathlib import Path
from pywebpush import webpush, WebPushException

def send_sovereign_whisper(subscription_json: str, message: str = "VIP Hamam odanız Sothys aromalarıyla hazırlandı."):
    root = Path(__file__).resolve().parents[1]
    vapid_path = root / "admin" / "vapid_keys.json"
    
    if not vapid_path.exists():
        print("❌ VAPID anahtarı bulunamadı! Lütfen önce santis_push_master.py çalıştırın.")
        return

    with open(vapid_path, "r") as f:
        vapid_keys = json.load(f)

    try:
        if subscription_json.startswith("{"):
            sub_data = json.loads(subscription_json)
        elif Path(subscription_json).exists():
            with open(subscription_json, "r") as f:
                sub_data = json.load(f)
        else:
            print("❌ Geçerli bir JSON stringi veya dosya yolu bulunamadı.")
            return
    except json.JSONDecodeError:
        print("❌ Hatali JSON girdisi veya dosyası. Lütfen JSON içeriğini kontrol edin.")
        return
    
    payload = json.dumps({
        "title": "SANTIS Concierge",
        "body": message,
        "icon": "/assets/img/icons/icon-192.png",
        "url": "/?source=push"
    })

    print("🦅 Sovereign Whisper Rüzgara Karıştı, İletiliyor...")
    try:
        webpush(
            subscription_info=sub_data,
            data=payload,
            vapid_private_key=vapid_keys["privateKey"],
            vapid_claims={
                "sub": "mailto:concierge@santisclub.com"
            }
        )
        print("🕊️ Fısıltı başarıyla kargolandı ve tarayıcıya ulaştı!")
    except WebPushException as ex:
        print("❌ İletim Başarısız:", repr(ex))
        if ex.response and ex.response.json():
            print("Detay:", ex.response.json())

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sovereign Push Gönderici")
    parser.add_argument("--sub", required=True, help="Abonelik JSON stringi veya abonelik.json gibi bir dosya yolu")
    parser.add_argument("--msg", default="VIP Hamam odanız Sothys aromalarıyla hazırlandı.", help="Gönderilecek özel mesaj")
    
    args = parser.parse_args()
    send_sovereign_whisper(args.sub, args.msg)
