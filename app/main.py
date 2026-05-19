from fastapi import FastAPI
from app.api.v1.endpoints import booking_engine, billing

app = FastAPI(title="Santis OS API")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

app.include_router(booking_engine.router, prefix="/api/v1")
app.include_router(billing.router, prefix="/api/v1")
