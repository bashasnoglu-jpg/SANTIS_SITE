from pydantic import BaseModel
from typing import List

class BiometricsSnapshot(BaseModel):
    hrv: int
    sleepScore: int
    recoveryScore: int
    breathDepth: int
    nervousSystemState: str

class EmotionSnapshot(BaseModel):
    primary: str
    secondary: str
    moodScore: int
    emotionalShift: str

class RitualSnapshot(BaseModel):
    dominantRitual: str
    intensity: float
    bodyFocus: List[str]
    contraindications: List[str]

class EnvironmentSnapshot(BaseModel):
    location: str
    weatherMood: str
    lightTone: str
    scentProfile: str

class DiaristSnapshot(BaseModel):
    whisper: str
    tone: str

class AtmosphereSnapshot(BaseModel):
    coherence: float
    nervousSystemLoad: float
    emotionalTemperature: str
    recoveryField: str

class MemoryNode(BaseModel):
    date: str
    biometrics: BiometricsSnapshot
    emotion: EmotionSnapshot
    ritual: RitualSnapshot
    environment: EnvironmentSnapshot
    diarist: DiaristSnapshot
    atmosphere: AtmosphereSnapshot
