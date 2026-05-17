from fastapi import FastAPI
from app.api.v1.endpoints import booking_engine

app = FastAPI(title="Santis OS API")

app.include_router(booking_engine.router, prefix="/api/v1")
