import re
from collections import Counter

class SemanticAuditEngine:
    """
    Santis Tone Guard (V1.0)
    Analyses text content for 'Quiet Luxury' compliance.
    """
    
    def __init__(self):
        # 🚫 BANNED WORDS (Cheap, Salesy, Aggressive)
        self.BANNED_WORDS = {
            "ucuz": "ekonomik",
            "bedava": "ücretsiz",
            "kampanya": "ayrıcalık",
            "fırsat": "davet",
            "indirim": "özel fiyat",
            "kaçırma": "keşfet",
            "hemen al": "incele",
            "süper": "üstün",
            "bomba": "etkileyici",
            "çılgın": "sıradışı",
            "patlat": "öne çıkar",
            "bedavaya": "hediye olarak",
            "ucuza": "uygun fiyatla"
        }

        # 💎 LUXURY WORDS (Quiet, Refined, Elite)
        self.LUXURY_WORDS = [
            "deneyim", "ritüel", "dinginlik", "huzur", "ayrıcalık",
            "seçkin", "özel", "saf", "doğal", "uzman", "terapi",
            "arınma", "yenilenme", "santis", "imza", "davet",
            "atmosfer", "duyusal", "ahenk", "zarafet", "stil"
        ]

    def analyze_text(self, text):
        """
        Analyzes the given text string and returns a score and suggestions.
        """
        if not text:
            return None

        text_lower = text.lower()
        words = re.findall(r'\b\w+\b', text_lower)
        word_count = len(words)
        
        if word_count < 10:
            return None # Too short to analyze

        issues = []
        luxury_hits = []
        
        # Check Banned Words
        for banned, suggestion in self.BANNED_WORDS.items():
            if banned in text_lower:
                count = text_lower.count(banned)
                issues.append({
                    "word": banned,
                    "suggestion": suggestion,
                    "count": count
                })

        # Check Luxury Words
        for luxury in self.LUXURY_WORDS:
            if luxury in text_lower:
                count = text_lower.count(luxury)
                luxury_hits.append({
                    "word": luxury,
                    "count": count
                })

        # Calculate Score
        # Base Score: 80
        # -10 per banned word type
        # +5 per luxury word type
        score = 80
        score -= (len(issues) * 10)
        score += (len(luxury_hits) * 5)
        
        # Clamp Score 0-100
        score = max(0, min(100, score))

        return {
            "score": score,
            "word_count": word_count,
            "issues": issues,
            "luxury_hits": luxury_hits,
            "tone": self._get_tone_label(score)
        }

    def _get_tone_label(self, score):
        if score >= 90: return "ELITE (Masterpiece)"
        if score >= 80: return "EXCELLENT (Quiet Luxury)"
        if score >= 60: return "GOOD (Standard)"
        if score >= 40: return "WEAK (Generic)"
        return "POOR (Cheap/Salesy)"
