
"""
SANTIS EMOTION ENGINE (CORTEX LAYER)
v1.0 - Initial Release
Date: 2026-02-09

Interprets raw behavioral data (scroll velocity, dwell time, click patterns)
into meaningful Emotional States (Moods) to adapt the digital experience.
"""

import time
from typing import Dict, Any

class EmotionEngine:
    
    # Emotional States
    MOOD_CALM = "CALM"          # Relaxed, browsing, soaking in atmosphere
    MOOD_DECISIVE = "DECISIVE"  # Goal-oriented, fast, looking for specific info
    MOOD_HESITANT = "HESITANT"  # Unsure, back-and-forth, needs reassurance
    MOOD_ESCAPE = "ESCAPE"      # Late night, dreamy, seeking immersion
    
    # Strategies
    STRATEGY_SOFT = "soft_influence"
    STRATEGY_CONFIDENT = "high_confidence"
    STRATEGY_REASSURE = "reassurance_pack"
    STRATEGY_IMMERSIVE = "deep_immersion"

    def __init__(self):
        self.session_data = {}
    
    def analyze_session(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes session telematics to determine user mood.
        
        Args:
            data: {
                'scroll_velocity': float (px/sec),
                'avg_dwell_time': float (seconds per page),
                'click_frequency': float (clicks per minute),
                'page_history_len': int,
                'time_of_day': int (0-23),
                'cart_abandoned': bool
            }
            
        Returns:
            {
                'mood': str,
                'confidence': float (0.0 - 1.0),
                'suggested_strategy': str,
                'atmosphere_tweak': dict
            }
        """
        
        # 1. Extract Signals
        scroll_speed = data.get('scroll_velocity', 0)
        dwell = data.get('avg_dwell_time', 0)
        clicks = data.get('click_frequency', 0)
        hour = data.get('time_of_day', 12)
        pages = data.get('page_history_len', 1)
        
        # 2. Heuristic Scoring
        scores = {
            self.MOOD_CALM: 0.0,
            self.MOOD_DECISIVE: 0.0,
            self.MOOD_HESITANT: 0.0,
            self.MOOD_ESCAPE: 0.0
        }
        
        # --- CALM LOGIC ---
        if scroll_speed < 100 and dwell > 30:
            scores[self.MOOD_CALM] += 0.8
        if clicks < 2:
            scores[self.MOOD_CALM] += 0.4
            
        # --- DECISIVE LOGIC ---
        if scroll_speed > 300:
            scores[self.MOOD_DECISIVE] += 0.6
        if clicks > 5:
            scores[self.MOOD_DECISIVE] += 0.5
        if 200 < scroll_speed < 600 and dwell < 15:
             scores[self.MOOD_DECISIVE] += 0.4

        # --- HESITANT LOGIC ---
        if pages > 5 and dwell < 10: # "Pogo-sticking"
            scores[self.MOOD_HESITANT] += 0.7
        if data.get('cart_abandoned'):
            scores[self.MOOD_HESITANT] += 0.9
            
        # --- ESCAPE LOGIC (Time based) ---
        if hour >= 23 or hour < 5:
            scores[self.MOOD_ESCAPE] += 0.9 # Night owl
            scores[self.MOOD_CALM] += 0.3
            
        # 3. Determine Winner
        primary_mood = max(scores, key=scores.get)
        confidence = min(scores[primary_mood], 1.0) # Cap at 1.0
        
        # 4. Select Strategy
        strategy = self.STRATEGY_SOFT
        atmos_tweak = {"speed": 1.0, "lighting": "normal"}
        
        if primary_mood == self.MOOD_DECISIVE:
            strategy = self.STRATEGY_CONFIDENT
            atmos_tweak = {"speed": 1.2, "lighting": "bright", "cta_contrast": "high"}
            
        elif primary_mood == self.MOOD_HESITANT:
            strategy = self.STRATEGY_REASSURE
            atmos_tweak = {"speed": 0.9, "lighting": "warm", "social_proof": "visible"}
            
        elif primary_mood == self.MOOD_ESCAPE:
            strategy = self.STRATEGY_IMMERSIVE
            atmos_tweak = {"speed": 0.5, "lighting": "midnight", "sound": "ambient_deep"}
        
        elif primary_mood == self.MOOD_CALM:
            strategy = self.STRATEGY_SOFT
            atmos_tweak = {"speed": 0.7, "lighting": "soft", "cursor": "heavy"}

        return {
            "mood": primary_mood,
            "confidence": round(confidence, 2),
            "suggested_strategy": strategy,
            "atmosphere_tweak": atmos_tweak
        }

# Example Usage (for testing)
if __name__ == "__main__":
    engine = EmotionEngine()
    
    # Test Case: Late night surfer
    test_data = {
        'scroll_velocity': 50,
        'avg_dwell_time': 45,
        'click_frequency': 1,
        'time_of_day': 23,
    }
    
    print(f"Input: {test_data}")
    print(f"Analysis: {engine.analyze_session(test_data)}")
