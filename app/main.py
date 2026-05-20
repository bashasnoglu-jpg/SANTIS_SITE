from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.endpoints import booking_engine, billing, aurelia_whisper, sovereign_memory, telemetry

app = FastAPI(title="Santis OS API")

# Live Server ve harici portlardan gelen CORS isteklerini desteklemek için:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

app.include_router(booking_engine.router, prefix="/api/v1")
app.include_router(billing.router, prefix="/api/v1")
app.include_router(aurelia_whisper.router, prefix="/api/v1")
app.include_router(sovereign_memory.router, prefix="/api/v1")
app.include_router(telemetry.router, prefix="/api/v1/telemetry")

# Arayüzü tek bir port üzerinden (CORS sorunu olmaksızın) sunmak için statik dosyaları bağla:
app.mount("/", StaticFiles(directory=".", html=True), name="static")


