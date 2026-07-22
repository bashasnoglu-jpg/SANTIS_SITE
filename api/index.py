from fastapi import FastAPI

from app.api.v1.endpoints import (
    booking_engine,
    billing,
    aurelia_whisper,
    sovereign_memory,
    scheduling,
    reception,
    reception_booking_create,
    telemetry,
)

app = FastAPI(title="Santis OS API Runtime")

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(booking_engine.router, prefix="/api/v1")
app.include_router(billing.router, prefix="/api/v1")
app.include_router(aurelia_whisper.router, prefix="/api/v1")
app.include_router(sovereign_memory.router, prefix="/api/v1")
app.include_router(scheduling.router, prefix="/api/v1")
app.include_router(reception.router, prefix="/api/v1")
app.include_router(reception_booking_create.router, prefix="/api/v1")
app.include_router(telemetry.router, prefix="/api/v1/telemetry")