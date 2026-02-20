import json
import os
from typing import Dict, List, Optional

class VIPEngine:
    def __init__(self, data_path="assets/data/campaigns.json"):
        self.data_path = data_path
        self.campaigns = self._load_campaigns()

    def _load_campaigns(self) -> List[Dict]:
        """Loads campaigns from JSON file."""
        if not os.path.exists(self.data_path):
            print(f"🟠 [VIP Engine] Campaign file not found: {self.data_path}")
            return []
        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"🔴 [VIP Engine] Error loading campaigns: {e}")
            return []

    def generate_promo_code(self, prefix="VIP", discount=10) -> str:
        """Generates a secure, readable promo code."""
        import random
        import string
        suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        return f"{prefix}-{discount}{suffix}"

    def check_offer(self, citizen_data: Dict) -> Optional[Dict]:
        """
        Evaluates citizen data against campaign rules and returns the best offer.
        Priority: High score wins.
        """
        if not self.campaigns:
            return None

        matched_campaigns = []
        
        # Citizen stats
        visits = citizen_data.get("stats", {}).get("total_visits", 0)
        interest = citizen_data.get("interest_profile", {}).get("top_interest", "unknown")
        # Determine segment (simplified logic, usually comes from Oracle)
        segment = "new_visitor"
        if visits > 2: segment = "returning"
        if visits > 9: segment = "loyal_citizen"

        # print(f"🔍 [VIP Check] Visits: {visits}, Interest: {interest}, Segment: {segment}")

        for campaign in self.campaigns:
            rules = campaign.get("rules", {})
            
            # Rule 1: Visits
            min_v = rules.get("min_visits", 0)
            max_v = rules.get("max_visits", 9999)
            if not (min_v <= visits <= max_v):
                continue
            
            # Rule 2: Interest (if specified)
            req_interest = rules.get("interest")
            if req_interest and req_interest != interest:
                continue

            # Rule 3: Segment (if specified)
            req_segment = rules.get("segment")
            # "new_visitor" rule matches only new visitors
            # "loyal_citizen" rule matches only loyal
            if req_segment and req_segment != segment:
                 # Special case: 'new_visitor' logic usually implies low visits, handled by min_max
                 # But if explicitly requested, we enforce it.
                 continue

            matched_campaigns.append(campaign)

        if not matched_campaigns:
            return None

        # Sort by priority (descending)
        matched_campaigns.sort(key=lambda x: x.get("priority", 0), reverse=True)
        
        # Return the best one
        best_offer = matched_campaigns[0]
        
        # Dynamic Code Generation (Phase 32)
        if best_offer.get("content", {}).get("type") == "discount":
             config = best_offer.get("promo_config", {})
             prefix = config.get("prefix", "SANTIS")
             amount = config.get("amount", 10)
             code = self.generate_promo_code(prefix, amount)
             # Inject code into content
             best_offer["content"]["promo_code"] = code
             best_offer["content"]["action"] = f"KODU KOPYALA: {code}"

        # print(f"🟢 [VIP Engine] Matched Offer: {best_offer['id']}")
        return best_offer

# Singleton Instance
vip_engine = VIPEngine()
