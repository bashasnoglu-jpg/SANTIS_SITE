from fastapi import FastAPI, Request

from app.api.v1.endpoints import (
    billing,
    aurelia_whisper,
    sovereign_memory,
    reception,
    telemetry,
)

app = FastAPI(title="Santis OS API Runtime")


@app.middleware("http")
async def restore_vercel_api_path(request: Request, call_next):
    forwarded_path = request.query_params.get("path")

    if request.scope.get("path") == "/api" and forwarded_path:
        restored_path = f"/api/{forwarded_path.lstrip('/')}"
        request.scope["path"] = restored_path
        request.scope["raw_path"] = restored_path.encode("utf-8")

    return await call_next(request)


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok"}


app.include_router(billing.router, prefix="/api/v1")
app.include_router(aurelia_whisper.router, prefix="/api/v1")
app.include_router(sovereign_memory.router, prefix="/api/v1")
app.include_router(reception.router, prefix="/api/v1")
app.include_router(telemetry.router, prefix="/api/v1/telemetry")
