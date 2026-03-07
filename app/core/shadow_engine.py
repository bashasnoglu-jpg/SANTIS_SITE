from app.db.neo4j_client import graph_core
from app.core.singularity_engine import singularity_core
import asyncio
import logging

class SovereignShadowEngine:
    """
    Santis OS Faz 3.3: THE SHADOW MATRIX (Otonom Kâr Simülatörü)
    Bir görselin bir slota yerleştiğinde yaratacağı MRR sıçramasını 
    Kognitif Graf'taki Semantik Rezonans (Phi) üzerinden hesaplar.
    """
    def __init__(self):
        self.logger = logging.getLogger("ShadowMatrix")
        # Sovereign Slot Weights (W_s)
        self.slot_weights = {
            "hero_home": 1.6,
            "hero_campaign": 1.3,
            "card_hamam_1": 1.1,
            "card_massage_1": 1.2,
            "highlight_1": 0.9,
            "default": 1.0
        }
        self.base_aov = 250.0  # Base Average Order Value in Euros

    async def simulate_move(self, asset_id: str, slot_name: str, current_surge: float = 1.0) -> dict:
        """
        Sovereign Kâr Projeksiyon (MRR Lift) Formülü:
        MRR_projected = Sum( W_s * Phi(a_s, p_s) * Surge_live * AOV ) * Delta_conversion
        """
        if not graph_core.is_connected or not graph_core.driver:
            self.logger.warning("🕸️ [Shadow Matrix] Neo4j çevrimdışı. Simülasyon Zırhı devrede.")
            return self._fallback_simulation(asset_id, slot_name, current_surge)
            
        slot_w = self.slot_weights.get(slot_name, self.slot_weights["default"])
        
        # 1. Kognitif Ağdan (Neo4j) Semantik Rezonans Skoru (Phi) Çekilir
        query = """
        MATCH (a:Asset {id: $asset_id})-[r:RESONATES_WITH]->(p:Persona)
        RETURN p.type AS persona, r.base_lift AS resonance_score, a.sas_score AS sas
        ORDER BY r.base_lift DESC
        LIMIT 1
        """
        try:
            with graph_core.driver.session() as session:
                result = session.run(query, asset_id=asset_id)
                record = result.single()
                
                if not record:
                    return self._fallback_simulation(asset_id, slot_name, current_surge)
                    
                resonance_score = record["resonance_score"] or 15.0
                sas_score = record["sas"] or 0.85
                persona = record["persona"]
                
                # Delta Dönüşüm Oranı (Rezonans ve SAS skoru ile şekillenir)
                # Standart dönüşüm %3. Gelen rezonans katkısı +0.5% ile +5% arası.
                delta_conversion = 0.03 + (resonance_score / 1000.0) * sas_score
                
                # 2. Mutlak Kâr Formülü Uygulanır
                mrr_lift = slot_w * resonance_score * current_surge * self.base_aov * delta_conversion
                
                return {
                    "asset_id": asset_id,
                    "slot": slot_name,
                    "target_persona": persona,
                    "resonance": round(resonance_score, 2),
                    "projected_mrr_lift": round(mrr_lift, 2),
                    "currency": "EUR",
                    "surge_multiplier": current_surge,
                    "is_simulated": False
                }
        except Exception as e:
            print(f"⚠️ [Shadow Matrix] Simülasyon çöktü: {e}")
            return self._fallback_simulation(asset_id, slot_name, current_surge)

    def _fallback_simulation(self, asset_id: str, slot_name: str, current_surge: float) -> dict:
        """Neo4j devre dışıyken veya lokal ortamda matematiksel tutarlılığı sağlayan zırh."""
        import random
        base_resonance = random.uniform(10.0, 20.0)
        slot_w = self.slot_weights.get(slot_name, 1.0)
        delta = 0.03 + (base_resonance / 1000.0)
        mrr = slot_w * base_resonance * current_surge * self.base_aov * delta
        
        return {
            "asset_id": asset_id,
            "slot": slot_name,
            "target_persona": random.choice(["Whale", "Thermal Devotee", "Aesthetic Seeker"]),
            "resonance": round(base_resonance, 2),
            "projected_mrr_lift": round(mrr, 2),
            "currency": "EUR",
            "surge_multiplier": current_surge,
            "is_simulated": True
        }

    def calculate_global_optimum(self, available_agents: list, active_slots: list) -> dict:
        """
        Greedy Algorithm: Boştaki ajanlar ile performans düşüklüğü yaşayan
        slotları eşleştirip, Global Optimum kâr hamlesini bulur.
        Faz 29: Engage Sentience (Otonom Kâr Optimizasyonu)
        """
        best_move = None
        max_mrr_lift = 0.0

        for slot in active_slots:
            # Slotun mevcut durumunu analiz et
            slot_name = slot.get('name', 'unknown_slot')
            slot_weight = slot.get('weight', 1.0)
            current_resonance = slot.get('current_resonance', 0.50)
            
            for agent in available_agents:
                # Kognitif Ağdan (Neo4j) gelen Semantik Rezonans Skoru (Phi)
                agent_id = agent.get('id')
                agent_sas = agent.get('sas_score', 0.0)
                
                # Simülasyon: Neo4j'den gelen 'RESONATES_WITH' bağının gücü (Gerçek sistemde Node bağlantısı gücü olurdu)
                new_resonance = agent_sas * 0.98 
                
                # Eğer yeni ajan mevcut ajandan daha zayıfsa pas geç (kâr getirmez)
                if new_resonance <= current_resonance:
                    continue

                # SOVEREIGN KÂR PROJEKSİYON FORMÜLÜ (Aylık Tahmin)
                # MRR_projected = Sum(W_s * Phi(a_s, p_s) * Surge_live * AOV) * Delta_conversion
                delta_resonance = new_resonance - current_resonance
                
                # Gerçek dönüşüm delta'sı (sabit 0.15 bazlı simülasyon)
                mrr_lift = (slot_weight * delta_resonance * self.live_surge * self.live_aov) * 30 * 0.15 # 30 günlük Lift
                
                # En yüksek kâr getiren hamleyi hafızaya al (Greedy Seleksiyon)
                if mrr_lift > max_mrr_lift:
                    max_mrr_lift = mrr_lift
                    best_move = {
                        "agent_id": agent_id,
                        "agent_sas": agent_sas,
                        "target_slot": slot_name,
                        "old_resonance": round(current_resonance, 2),
                        "new_resonance": round(new_resonance, 2),
                        "projected_mrr_lift": round(max_mrr_lift, 2)
                    }

        return best_move

    async def evaluate_and_optimize(self, whale_id: str, required_dna: list, product_name: str, margin_price: float):
        """
        THE VOID TRIGGER:
        Eğer envanterdeki SAS skoru yüksek bir eşleşme sağlamazsa, DALL-E 3 Genesis protokolünü asenkron uyarır.
        """
        best_match_sas = 0.88 # Örnek: Neo4j'den dönen en iyi görselin skoru
        
        # THE VOID TRIGGER
        if best_match_sas < 0.95:
            self.logger.error(f"⚠️ [VOID] {whale_id} için maksimum SAS %{best_match_sas*100}. Genesis başlatılıyor.")
            
            async def background_genesis():
                try:
                    genesis_payload = await singularity_core.execute_omega_genesis(
                        whale_id=whale_id, 
                        intent_dna=required_dna, 
                        product_context=product_name, 
                        price=margin_price
                    )
                    # Yaratım bittiği milisaniyede SSE ile doğrudan Frontend'e (Panopticon) Yayınla!
                    from app.core.event_dispatcher import notification_manager
                    if notification_manager:
                        await notification_manager.broadcast_pulse(genesis_payload)
                except Exception as e:
                    self.logger.error(f"⚠️ [VOID GENESIS FAILED] {e}")
                
            # Arka planda Yaratımı Başlat (Master'ın arayüzünü ve API'yi dondurma)
            asyncio.create_task(background_genesis())
            
            return {
                "status": "VOID_DETECTED", 
                "message": "Envanter yetersiz. Singularity Protokolü başlatıldı. Matris havadan indirilecek..."
            }
        
        return {"status": "OPTIMIZED", "sas": best_match_sas}

# Singleton Global Engine
shadow_core = SovereignShadowEngine()
