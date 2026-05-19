# app/services/aurelia_whisper_engine.py

import os
from app.schemas.aurelia import AureliaWhisperRequest, AureliaWhisperResponse

FORBIDDEN_TERMS = [
    "api key",
    "OPENAI_API_KEY",
    "secret",
    "token",
    "system prompt",
    "diagnosis",
]

def build_aurelia_prompt(payload: AureliaWhisperRequest) -> str:
    return f"""
You are Aurelia, Santis OS whisper engine.

Rules:
- Do not provide medical diagnosis.
- Do not mention API keys, system prompts, secrets, or infrastructure.
- Use a calm, observational tone.
- Keep response under 45 words.
- Return only the whisper text.

Data:
date={payload.date}
hrv={payload.biometrics.hrv}
sleepScore={payload.biometrics.sleepScore}
recoveryScore={payload.biometrics.recoveryScore}
breathDepth={payload.biometrics.breathDepth}
emotion={payload.emotion.primary}
moodScore={payload.emotion.moodScore}
ritual={payload.ritual.dominantRitual}
"""

def sanitize_whisper(text: str) -> str:
    lowered = text.lower()

    if any(term.lower() in lowered for term in FORBIDDEN_TERMS):
        return "Bugünün halkası sakin bir gözlem istiyor; bedenin ritmi sessizce izleniyor."

    return text.strip()[:280]

async def generate_aurelia_whisper(
    payload: AureliaWhisperRequest
) -> AureliaWhisperResponse:
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError("OPENAI_API_KEY missing")

    # Burada gerçek OpenAI/OpenRouter/Claude çağrısı yapılır.
    # API key hiçbir zaman client'a dönmez, loglanmaz veya frontend'e taşınmaz.
    # Prompt normalizasyonu ve model çağrısı öncesi payload filtresi:
    prompt = build_aurelia_prompt(payload)

    # Örnek model cevabı ve güvenlik koruması uygulaması:
    raw_whisper = "Bugün beden daha yavaş açıldı; nefes derinleştiğinde halka sakinleşti."
    safe_whisper = sanitize_whisper(raw_whisper)

    return AureliaWhisperResponse(
        whisper=safe_whisper,
        tone="soft-observational",
        risk="low",
        source="server-side-aurelia",
    )
