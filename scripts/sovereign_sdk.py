# Path: scripts/sovereign_sdk.py
import json
import time
import uuid
import sys

class SovereignOutput:
    """
    SANTIS Sovereign OS - Python Diplomatic SDK
    Python betiklerinin Node.js PythonBridge ile 
    Anayasal uyum içinde konuşmasını sağlar.
    """
    
    @staticmethod
    def emit(subject, action, data, origin="PYTHON_INTELLIGENCE"):
        envelope = {
            "id": str(uuid.uuid4()),
            "type": "EVENT",
            "payload": {
                "timestamp": int(time.time() * 1000),
                "version": "1.0.0",
                "origin": origin,
                "subject": subject,
                "action": action,
                **data  # Dinamik veri yükü (payload)
            }
        }
        
        # Kritik: stdout temizlenir ve sadece JSON basılır.
        # Node.js tarafı bu satırı yakalayıp sanitize edecek.
        print(json.dumps(envelope))
        sys.exit(0) # Onurlu çıkış

    @staticmethod
    def emit_error(message, subject="SYSTEM_INTEGRITY"):
        """Kritik bir hata olduğunda yapılandırılmış hata döner."""
        error_data = {
            "status": "FAILURE",
            "error_msg": message
        }
        SovereignOutput.emit(subject, "ERROR_REPORTED", error_data)
        sys.exit(1)
