# app/api/v1/endpoints/aurelia_whisper.py

from fastapi import APIRouter, HTTPException
from app.schemas.aurelia import AureliaWhisperRequest, AureliaWhisperResponse
from app.services.aurelia_whisper_engine import generate_aurelia_whisper

router = APIRouter(prefix="/aurelia", tags=["Aurelia Whisper"])

@router.post("/whisper", response_model=AureliaWhisperResponse)
async def create_whisper(payload: AureliaWhisperRequest):
    try:
        return await generate_aurelia_whisper(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
