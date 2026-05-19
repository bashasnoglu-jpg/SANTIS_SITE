from typing import List
from app.schemas.memory import MemoryNode

_SEED_DATA = [
    {
        "date": "2026-03-04",
        "biometrics": {
            "hrv": 62,
            "sleepScore": 78,
            "recoveryScore": 71,
            "breathDepth": 64,
            "nervousSystemState": "regulated"
        },
        "emotion": {
            "primary": "calm",
            "secondary": "reflective",
            "moodScore": 74,
            "emotionalShift": "from_tension_to_softness"
        },
        "ritual": {
            "dominantRitual": "thermal-reset",
            "intensity": 0.68,
            "bodyFocus": ["psoas", "diaphragm", "ankle-chain"],
            "contraindications": []
        },
        "environment": {
            "location": "Podgorica",
            "weatherMood": "cool-evening",
            "lightTone": "low-gold",
            "scentProfile": "cedar-mineral"
        },
        "diarist": {
            "whisper": "Bugün beden daha yavaş açıldı; nefes derinleştiğinde halka sakinleşti.",
            "tone": "soft-observational"
        },
        "atmosphere": {
            "coherence": 0.72,
            "nervousSystemLoad": 0.45,
            "emotionalTemperature": "cool-still",
            "recoveryField": "ascending"
        }
    },
    {
        "date": "2026-03-05",
        "biometrics": {
            "hrv": 68,
            "sleepScore": 74,
            "recoveryScore": 76,
            "breathDepth": 68,
            "nervousSystemState": "regulated"
        },
        "emotion": {
            "primary": "centered",
            "secondary": "serene",
            "moodScore": 83,
            "emotionalShift": "from_softness_to_centeredness"
        },
        "ritual": {
            "dominantRitual": "mineral-infusion",
            "intensity": 0.72,
            "bodyFocus": ["spine", "shoulders"],
            "contraindications": []
        },
        "environment": {
            "location": "Podgorica",
            "weatherMood": "misty-morning",
            "lightTone": "diffused-silver",
            "scentProfile": "vetiver-moss"
        },
        "diarist": {
            "whisper": "HRV yükseldi, uyku hafif dalgalandı; buna rağmen sinir sistemi daha regüle görünüyor.",
            "tone": "soft-observational"
        },
        "atmosphere": {
            "coherence": 0.78,
            "nervousSystemLoad": 0.38,
            "emotionalTemperature": "warm-still",
            "recoveryField": "ascending"
        }
    },
    {
        "date": "2026-03-06",
        "biometrics": {
            "hrv": 64,
            "sleepScore": 86,
            "recoveryScore": 82,
            "breathDepth": 72,
            "nervousSystemState": "restored"
        },
        "emotion": {
            "primary": "rested",
            "secondary": "focused",
            "moodScore": 80,
            "emotionalShift": "deep_restoration_integration"
        },
        "ritual": {
            "dominantRitual": "sound-bath",
            "intensity": 0.60,
            "bodyFocus": ["amygdala", "spine-alignment"],
            "contraindications": []
        },
        "environment": {
            "location": "Budva",
            "weatherMood": "sunny-sea-breeze",
            "lightTone": "warm-amber",
            "scentProfile": "myrrh-sea-salt"
        },
        "diarist": {
            "whisper": "Derin uyku döngüleri toparlandı; beden dinginlik içinde entegre oluyor.",
            "tone": "peaceful-observational"
        },
        "atmosphere": {
            "coherence": 0.85,
            "nervousSystemLoad": 0.28,
            "emotionalTemperature": "deep-rest",
            "recoveryField": "stable"
        }
    },
    {
        "date": "2026-03-07",
        "biometrics": {
            "hrv": 72,
            "sleepScore": 82,
            "recoveryScore": 89,
            "breathDepth": 78,
            "nervousSystemState": "restored"
        },
        "emotion": {
            "primary": "vital",
            "secondary": "clear-minded",
            "moodScore": 89,
            "emotionalShift": "from_rest_to_activation"
        },
        "ritual": {
            "dominantRitual": "cryo-kinetic-reset",
            "intensity": 0.85,
            "bodyFocus": ["quadriceps", "thoracic-chain", "fascia"],
            "contraindications": []
        },
        "environment": {
            "location": "Budva",
            "weatherMood": "clear-afternoon",
            "lightTone": "piercing-gold",
            "scentProfile": "pine-ozonic"
        },
        "diarist": {
            "whisper": "Soğuk terapi sonrasında toparlanma tepe noktaya ulaştı; canlanma dalgası vücuda yayıldı.",
            "tone": "reinvigorated-precise"
        },
        "atmosphere": {
            "coherence": 0.94,
            "nervousSystemLoad": 0.18,
            "emotionalTemperature": "vibrant-glow",
            "recoveryField": "ascending"
        }
    }
]

class SovereignMemoryService:
    @classmethod
    def get_memory_nodes(cls) -> List[MemoryNode]:
        return [MemoryNode(**node) for node in _SEED_DATA]
    
    @classmethod
    def get_memory_node(cls, date: str) -> MemoryNode | None:
        nodes = cls.get_memory_nodes()
        for node in nodes:
            if node.date == date:
                return node
        return None
