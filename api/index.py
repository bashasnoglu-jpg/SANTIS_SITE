from fastapi import FastAPI

from app.api.v1.endpoints import (
    booking_engine,
    billing,
    aurelia_whisper,
    sovereign_memory,
    scheduling,
)

app = FastAPI(title="Santis OS API Runtime")

@app.get("/health")
def health_check():
    return {"status": "ok"}

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Global Exception", "trace": traceback.format_exc()}
    )

app.include_router(booking_engine.router, prefix="/api/v1")
app.include_router(billing.router, prefix="/api/v1")
app.include_router(aurelia_whisper.router, prefix="/api/v1")
app.include_router(sovereign_memory.router, prefix="/api/v1")
app.include_router(scheduling.router, prefix="/api/v1")
