import time
import json
import logging
import sys

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage()
        }
        
        # Merge any extra kwargs passed to logger (like event, latency_ms, etc.)
        if hasattr(record, "structured_data"):
            log_obj.update(record.structured_data)
            
        return json.dumps(log_obj)

def get_structured_logger(name="santis_os"):
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
    return logger

structured_logger = get_structured_logger()

def log_event(event: str, latency_ms: float = 0.0, user_role: str = "SYSTEM", hash: str = "", status: str = "info", **kwargs):
    structured_data = {
        "event": event,
        "latency_ms": round(latency_ms, 2),
        "user_role": user_role,
        "hash": hash,
        "status": status
    }
    structured_data.update(kwargs)
    
    # We pass the dict in 'extra' so the formatter can pick it up
    structured_logger.info(f"[{event}] processed", extra={"structured_data": structured_data})
