from fastapi import FastAPI

from app.api.v1.endpoints import (
    billing,
    aurelia_whisper,
    sovereign_memory,
    reception,
    telemetry,
    payment_context,
)

app = FastAPI(title="Santis OS API Runtime")


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(billing.router, prefix="/api/v1")
app.include_router(aurelia_whisper.router, prefix="/api/v1")
app.include_router(sovereign_memory.router, prefix="/api/v1")
app.include_router(reception.router, prefix="/api/v1")
app.include_router(payment_context.router, prefix="/api/v1")
app.include_router(telemetry.router, prefix="/api/v1/telemetry")
