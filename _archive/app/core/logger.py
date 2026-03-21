import sys
import uuid
from contextvars import ContextVar
from loguru import logger
import json

# Her request için benzersiz ID tutacak asenkron context değişkeni
request_id_var = ContextVar("request_id", default="SYSTEM")

def req_id_filter(record):
    """Loguru'ya her logda Request ID'yi basmasını söyler"""
    record["extra"]["request_id"] = request_id_var.get()
    return True

import logging

class InterceptHandler(logging.Handler):
    """Uvicorn ve FastAPI'nin ilkel loglarını yakalayıp Loguru'ya yönlendirir."""
    def emit(self, record):
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1
        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

def setup_global_logger():
    # 1. Eski loglayıcıları temizle ve JSON formatında yapılandır
    logger.remove()
    logger.add(
        sys.stdout, 
        format="{level: <8} | req_id:{extra[request_id]} | {name}:{function}:{line} - {message}", 
        filter=req_id_filter,
        serialize=True, # 🚨 KRİTİK: Logları JSON formatında basar (Kurumsal Observability)
        level="INFO",
        enqueue=True
    )
    
    # Uvicorn ve FastAPI loglarını InterceptHandler'a yönlendir
    logging.getLogger("uvicorn.access").handlers = [InterceptHandler()]
    logging.getLogger("uvicorn.error").handlers = [InterceptHandler()]
    logging.getLogger("fastapi").handlers = [InterceptHandler()]
    
    return logger

structured_logger = setup_global_logger()

def log_event(event: str, latency_ms: float = 0.0, user_role: str = "SYSTEM", hash: str = "", status: str = "info", **kwargs):
    structured_data = {
        "event": event,
        "latency_ms": round(latency_ms, 2),
        "user_role": user_role,
        "hash": hash,
        "status": status
    }
    structured_data.update(kwargs)
    
    # Context ID loguru loglarının filteri ile json'a zaten eklenecektir
    structured_logger.info(f"[{event}] processed", structured_data=structured_data)
