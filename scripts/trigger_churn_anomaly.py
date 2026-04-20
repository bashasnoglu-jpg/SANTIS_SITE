import urllib.request
import json
import time
import random
import uuid

def send_post(path, data):
    url = f"http://localhost:8080{path}"
    headers = {'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error {path}: {e}")
        return None

print("--- SANTIS SOVEREIGN OS: SENTETİK MÜŞTERİ SIZINTISI (CHURN) BAŞLATILIYOR ---")

for i in range(50):
    trace_id = f"sim-trace-{uuid.uuid4().hex[:8]}"
    guest_id = f"sim-guest-{uuid.uuid4().hex[:5]}"
    
    # 1. Gönder: Decision
    decision_payload = {
        "traceId": trace_id,
        "guestId": guest_id,
        "decisionType": "ROUTING",
        "decision": "Route_To_Q2",
        "weights": { "q2_urgency": 1.0 },
        "context": { "source": "anomaly_sim" },
        "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    }
    send_post('/api/v1/telemetry/decision', decision_payload)
    
    # 2. Gönder: Outcome (Chur Oranı: %85)
    is_churn = random.random() < 0.85
    outcome_str = "CHURN_AT_Q2_FRICTION" if is_churn else "CONVERSION_SUCCESS"
    
    outcome_payload = {
        "traceId": trace_id,
        "outcome": outcome_str,
        "metrics": { "timeSpent": random.randint(5, 12) if is_churn else random.randint(45, 90) },
        "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    }
    send_post('/api/v1/telemetry/outcome', outcome_payload)
    
    if i % 10 == 0 and i > 0:
        print(f"[{i}/50] Paket enjekte edildi... (Mevcut Sentetik Sızıntı Basıncı: %85)")
    time.sleep(0.05)
    
print("✅ SIZINTI SİMÜLASYONU TAMAM. 50 Karar Döngüsü Çakıldı.")
print("👉 Boardroom Oracle Feed Ekranına geçiş yapın: 'CHURN_SIGNAL_DETECTED' Advisory Alert tetiklenecek.")
