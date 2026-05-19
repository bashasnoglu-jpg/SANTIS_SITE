# app/schemas/aurelia.py

from pydantic import BaseModel, Field
from typing import Literal, Optional

class Biometrics(BaseModel):
    hrv: int = Field(..., ge=0, le=200)
    sleepScore: int = Field(..., ge=0, le=100)
    recoveryScore: int = Field(..., ge=0, le=100)
    breathDepth: int = Field(..., ge=0, le=100)

class Emotion(BaseModel):
    primary: str
    moodScore: int = Field(..., ge=0, le=100)

class Ritual(BaseModel):
    dominantRitual: str

class AureliaWhisperRequest(BaseModel):
    date: str
    biometrics: Biometrics
    emotion: Emotion
    ritual: Ritual

class AureliaWhisperResponse(BaseModel):
    whisper: str
    tone: Literal["soft-observational", "clinical-calm", "ritual-poetic"]
    risk: Literal["low", "medium", "high"]
    source: Literal["server-side-aurelia"]
