import re
import logging
from typing import Dict, List, Any

# Logging Setup
logger = logging.getLogger("CulturalCortex")

class CulturalScanner:
    """
    Santis Cultural Cortex - Brand Soul Immune System.
    Analyzes text for 'Quiet Luxury' alignment and flags 'Tone Violations'.
    """

    def __init__(self):
        # 🚫 TONE VIOLATIONS (The "Cheap" Filter)
        # Regex patterns for words that degrade the brand.
        self.VIOLATIONS_REGEX = [
            (r"\b(en ucuz)\b", "Cheapness"),
            (r"\b(şok fiyat)\b", "Cheapness"),
            (r"\b(kaçırma)\b", "Urgency/Salesy"),
            (r"\b(son fırsat)\b", "Urgency/Salesy"),
            (r"\b(patron çıldırdı)\b", "Vulgarity"),
            (r"\b(bedava)\b", "Cheapness"),
            (r"\b(indirim)\b", "Salesy"), # Context dependent, but generally flagged
            (r"\b(hemen al)\b", "Aggressive Sales"),
            (r"(!{2,})", "Excessive Exclamation"), # !! or !!!
            (r"\b([A-ZÇĞİÖŞÜ]{4,})\b", "Excessive CAPS"), # UPPERCASE WORDS > 3 chars
            (r"\b(%[0-9]{2,})\b", "Discount Percentage"), # %50, %90
        ]

        # ✨ QUIET LUXURY VOCABULARY (The "Refined" Booster)
        # Words that align with the Santis Soul.
        self.LUXURY_KEYWORDS = {
            "ritüel": 2,
            "deneyim": 1,
            "huzur": 1,
            "arınma": 2,
            "saf": 1,
            "doğal": 1,
            "denge": 1,
            "seçkin": 2,
            "rafine": 2,
            "dingin": 2,
            "özel": 1,
            "ayrıcalık": 1,
            "yolculuk": 1,
            "esans": 1,
            "dokunuş": 1,
            "kadim": 2,
            "atmosfer": 1,
            "benzersiz": 1,
            "geleneksel": 1
        }

    def _strip_html(self, text: str) -> str:
        """
        Removes HTML tags, scripts, and styles to analyze only visible text.
        """
        # 1. Remove script/style blocks content
        text = re.sub(r'<(script|style).*?</\1>', ' ', text, flags=re.DOTALL | re.IGNORECASE)
        # 2. Remove comments
        text = re.sub(r'<!--.*?-->', ' ', text, flags=re.DOTALL)
        # 3. Remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', text)
        # 4. Collapse whitespace
        text = ' '.join(text.split())
        return text

    def _strip_html(self, text: str) -> str:
        """
        Removes HTML tags, scripts, and styles to analyze only visible text.
        """
        # 1. Remove script/style blocks content
        text = re.sub(r'<(script|style).*?</\1>', ' ', text, flags=re.DOTALL | re.IGNORECASE)
        # 2. Remove comments
        text = re.sub(r'<!--.*?-->', ' ', text, flags=re.DOTALL)
        # 3. Remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', text)
        # 4. Collapse whitespace
        text = ' '.join(text.split())
        return text

    def scan_text(self, text: str) -> Dict[str, Any]:
        """
        Analyzes a text block and returns a cultural audit report.
        """
        # Step 1: Clean HTML to see what the user sees
        clean_text = self._strip_html(text)
        text_lower = clean_text.lower()
        
        # 1. Detect Violations
        violations = []
        for pattern, category in self.VIOLATIONS_REGEX:
            # Special handling for CAPS: Do NOT use IGNORECASE
            if category == "Excessive CAPS":
                # Find uppercase words in ORIGINAL clean text
                matches = re.findall(pattern, clean_text)
            else:
                matches = re.findall(pattern, clean_text, re.IGNORECASE)
            
            if matches:
                 # Filter out single uppercase letters caught by CAPS regex if any
                checked_matches = [m for m in matches if len(m) > 1 or pattern != r"\b([A-ZÇĞİÖŞÜ]{4,})\b"]
                if checked_matches:
                    violations.append({
                        "type": category,
                        "matches": list(set(checked_matches)), # Unique matches
                        "severity": "High" if category in ["Cheapness", "Vulgarity"] else "Medium"
                    })

        # 2. Calculate Luxury Score
        luxury_points = 0
        found_keywords = []
        
        for word, points in self.LUXURY_KEYWORDS.items():
            if word in text_lower:
                luxury_points += points
                found_keywords.append(word)

        # Penalties
        # Reduce penalty weight slightly since we might still get false positives
        penalty_score = len(violations) * 5 
        base_score = 60 # Start slightly higher (neutral-positive)
        final_score = base_score + (luxury_points * 2) - penalty_score
        
        # Clamp Score 0-100
        final_score = max(0, min(100, final_score))


        # 3. Determine Overall Tone
        tone_status = "Neutral"
        if final_score >= 80:
            tone_status = "Santis Aligned (Excellent)"
        elif final_score >= 60:
            tone_status = "Acceptable"
        elif final_score < 40:
            tone_status = "Tone Violation (Needs Review)"

        return {
            "luxury_score": final_score,
            "tone_status": tone_status,
            "violations": violations,
            "luxury_keywords_found": found_keywords,
            "text_preview": text[:50] + "..." if len(text) > 50 else text
        }

# Example Usage (for testing)
if __name__ == "__main__":
    scanner = CulturalScanner()
    
    # Test 1: Good Text
    text_good = "Santis Club'da kadim bir arınma ritüeli sizi bekliyor. Huzur dolu bir deneyim."
    print(f"Good Text Score: {scanner.scan_text(text_good)['luxury_score']}")
    
    # Test 2: Bad Text
    text_bad = "EN UCUZ masaj bizde!!! KAÇIRMA şok fiyat %50 indirim hemen al."
    print(f"Bad Text Score: {scanner.scan_text(text_bad)['luxury_score']}")
    print(f"Bad Text Violations: {scanner.scan_text(text_bad)['violations']}")
