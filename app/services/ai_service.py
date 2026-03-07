import os
import asyncio
import logging
from typing import Optional, Dict, Any, List
import google.generativeai as genai
from dotenv import load_dotenv

logger = logging.getLogger("santis_ai_core")

class SovereignIntelligenceCore:
    def __init__(self):
        # Yalnızca bir kere başlat (Singleton)
        load_dotenv(override=True)
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            # Tüm sistem için standart, hızlı model
            self.model = genai.GenerativeModel("gemini-2.5-flash")
            logger.info("🧠 Sovereign Intelligence Core: ONLINE")
        else:
            logger.error("⚠️ GEMINI_API_KEY bulunamadı! AI modülleri kör uçuşta.")
            self.model = None

    async def generate_vip_persona(self, guest_name: str, visit_count: int, total_spent: float, services_str: str, vip_tier: str) -> str:
        """Phase G: Müşteri bilgisi üzerinden 'Quiet Luxury' tonunda VIP Persona özeti çıkarır."""
        if not self.model:
            return "Şık detayları arayan ve huzuru önceleyen seçkin konuk."
            
        prompt = f"""Sen Santis Master OS'un VIP Guest Intelligence motorusun.
        Aşağıdaki misafir verisine bakarak 2-3 cümlelik, "Quiet Luxury" tonunda, stratejik bir persona özeti yaz.
        İngilizce olsun. Asla selamlama veya blok açıklama ekleme. Direkt içgörüyle başla.
        Misafir: {guest_name} | Ziyaret: {visit_count} | Harcama: €{total_spent:,.0f} | Servisler: {services_str} | Tier: {vip_tier}
        """
        try:
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            return response.text.strip() if response and response.text else "Premium spa deneyiminde sadık misafir."
        except Exception as e:
            logger.error(f"VIP Persona Error: {e}")
            return "Premium spa deneyiminde sadık misafir."

    async def get_financial_directive(self, hotel_data: dict, today_revenue: float, active_count: int) -> str:
        """Phase 17/HQ: Dashboard için Sanal GM (Genel Müdür) Tavsiyesi"""
        if not self.model:
            return "Operasyon standartları korunuyor. Tesis içi (in-house) misafirlere yönelik up-sell potansiyelini değerlendirin."
            
        prompt = f"""
        Act as the 'Sovereign AI General Manager' for a luxury resort spa.
        Give me ONE short, extremely strategic, and actionable intelligence directive for today.
        Use a cold, analytical, high-end 'Quiet Luxury' corporate tone. No greetings, no fluff.
        Current stats: Today's Revenue so far is €{today_revenue:,.0f} across {active_count} active bookings.
        Hotel occupancies: {json.dumps(hotel_data)}
        Directive:
        """
        try:
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            return response.text.strip() if response and response.text else "Yield management parameters optimal. Emphasize personalized luxury standard."
        except Exception as e:
            logger.error(f"Financial Directive Error: {e}")
            return "Yield management parameters optimal."

    async def get_revenue_boost_advice(self, run_rate: float, remaining_hours: int, top_services: list) -> str:
        """Phase H: Otonom Gelir/Tahmin Modülü için Boost Önerisi"""
        if not self.model:
            return "Current velocity is steady. Focus on premium up-sells."
            
        services_str = ", ".join(top_services) if top_services else "Unknown"
        prompt = f"""
        Act as a super-intelligent revenue manager for Santis Spa.
        We have {remaining_hours} hours left today. Current revenue run rate is €{run_rate:,.0f}/hr.
        Top selling services today: {services_str}.
        Give me ONE short (1-2 sentences), highly actionable, premium-toned advice on how to maximize revenue in the final hours.
        Return ONLY the advice sentence. No intros.
        """
        try:
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            return response.text.strip() if response and response.text else "Focus entirely on cross-selling signature rituals to arriving guests."
        except Exception as e:
            logger.error(f"Revenue Boost Advice Error: {e}")
            return "Focus entirely on cross-selling signature rituals to arriving guests."
            
    async def process_custom_prompt(self, prompt: str, fallback: str = "Analysis unavailable.") -> str:
        """Genel amaçlı özel prompt isleyicisi (Örn: Accuracy/Banner Stats analizleri)"""
        if not self.model:
            return fallback
            
        try:
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            return response.text.strip() if response and response.text else fallback
        except Exception as e:
            logger.error(f"AI Core Custom Prompt Error: {e}")
            return fallback

    async def get_gemini_forecast(self, context: str) -> dict:
        """Phase 9.2: Gemini 48-hour spa forecast based on dynamic context."""
        import re, json as _json
        
        fallback = {"forecast_text": "Analysis unavailable", "peak_window": "N/A", "recommended_action": "HOLD", "source": "error"}
        if not self.model:
            fallback["forecast_text"] = "API key not configured"
            fallback["source"] = "config_error"
            return fallback
            
        prompt = (
            f"You are the Forecasting Oracle for Santis Luxury Spa Turkey. "
            f"Business context: {context} "
            "Generate a 48-hour forecast. Reply ONLY as JSON no markdown: "
            '{"forecast_text":"2-3 sentences luxury tone",'
            '"peak_window":"e.g. Saturday 14:00",'
            '"recommended_action":"SURGE or FLASH_OFFER or HOLD",'
            '"expected_revenue_lift_eur":0-500}'
        )
        
        try:
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            raw = response.text.strip() if response and response.text else ""
            m = re.search(r'\{.*\}', raw, re.DOTALL)
            if m:
                result = _json.loads(m.group())
                result["source"] = "gemini_live"
                return result
            return {"forecast_text": raw[:200], "peak_window": "N/A", "recommended_action": "HOLD", "source": "gemini_raw"}
        except Exception as e:
            logger.error(f"Gemini Forecast Error: {e}")
            fallback["forecast_text"] = str(e)[:200]
            return fallback

    async def get_gemini_strategy(self, occupancy: float) -> dict:
        """On-demand Gemini strategy call based on occupancy."""
        import re, json as _json

        fallback = {"action": "HOLD", "confidence": 0.0, "reasoning": "Analysis unavailable", "source": "error"}
        if not self.model:
            fallback["reasoning"] = "API key not configured"
            fallback["source"] = "config_error"
            return fallback

        prompt = (
            f"You are Revenue Intelligence AI for Santis Luxury Spa Turkey. "
            f"REAL-TIME OCCUPANCY: {round(occupancy * 100)}%. "
            'Recommend ONE action. Reply ONLY as JSON no markdown: '
            '{"action":"SURGE or FLASH_OFFER or HOLD","confidence":0.0-1.0,'
            '"price_suggestion":"e.g. +15%","reasoning":"one sentence"} '
            "Rules: SURGE if occupancy>70%, FLASH_OFFER if occupancy<40%, HOLD otherwise."
        )

        try:
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            raw = response.text.strip() if response and response.text else ""
            m = re.search(r'\{.*\}', raw, re.DOTALL)
            if m:
                result = _json.loads(m.group())
                result["source"] = "gemini_live"
                return result
            
            fallback["confidence"] = 0.7
            fallback["reasoning"] = raw[:120]
            fallback["source"] = "gemini_raw"
            return fallback
        except Exception as e:
            logger.error(f"Gemini Strategy Error: {e}")
            fallback["reasoning"] = str(e)[:150]
            return fallback

    async def get_guest_observation(self, guest_name: str, history: list, prefs: dict, ai_persona_summary: str) -> str:
        """Phase P - Gemini generates a real-time psychological observation from booking history."""
        import asyncio
        fallback = "Pattern analysis unavailable."
        
        if not self.model:
            return fallback

        prompt = f"""Sen Santis lüks spa'nın dijital konsiyer asistanısın. 
        Misafir: {guest_name}
        Geçmiş rezervasyonlar: {history}
        Bilinen tercihler: {prefs}
        Psikolojik profil notu (ai_persona_summary): {ai_persona_summary or 'Yok'}
        
        Bu misafir için kısa (1-2 cümle), operasyonel bir İngilizce gözlem yaz. 
        Ton: sessiz lüks (quiet luxury), profesyonel, içgörülü.
        Örnek: "Guest shows strong Recovery pattern. Likely to benefit from post-workout Deep Tissue. Prefers minimal interaction."
        """
        
        try:
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            return response.text.strip() if response and response.text else fallback
        except Exception as e:
            logger.error(f"Guest Observation Error: {e}")
            return fallback

    async def get_dna_persona(self, guest_name: str, dna_type: str, svc_names: list, total_spent: float, default_tagline: str) -> str:
        """Phase K - Guest DNA Clustering Engine. Generates 1 marketable sentence."""
        import asyncio
        if not self.model:
            return default_tagline

        prompt = (
            f"You are Santis Club's Guest DNA engine. Write EXACTLY 1 sentence in English, "
            f"'Quiet Luxury' tone, marketable persona description for this guest.\n"
            f"Guest: {guest_name} | DNA: {dna_type} | "
            f"Services used: {', '.join(svc_names[:6])} | "
            f"Total spend: €{float(total_spent or 0):,.0f}\n"
            f"Output ONLY the sentence, no quotes, no labels."
        )
        try:
            resp = await asyncio.to_thread(self.model.generate_content, prompt)
            return resp.text.strip().strip('"').strip("'") if resp and resp.text else default_tagline
        except Exception as e:
            logger.error(f"DNA Persona Error for {guest_name}: {e}")
            return default_tagline

    async def get_tenant_directive(self, tenant_name: str, city: str, country: str, today_revenue: float, active_count: int, current_hour: str) -> str:
        """Dashboard için Sanal GM (The Commander) Tenant Bazlı Tavsiyesi"""
        import asyncio
        fallback = "Operasyon standartları korunuyor. Rutin CRM kontrollerine devam ediniz."
        
        if not self.model:
            return fallback

        prompt = f"""Sen Santis Master OS isimli dünya standartlarında ultra-lüks bir otel ağının 'Sanal Genel Müdürü' ve 'Stratejisti'sin (The Commander). 
        Aşağıdaki anlık günlük durumu incele ve otel/spa resepsiyonundaki görevli ekibe 1-2 cümlelik çok sert, net ve aksiyon odaklı bir TAVSİYE veya EMİR (Directive) ver. 
        Tonlama: "Quiet Luxury" vizyonuna uygun, profesyonel ama acımasızca verimli.
        - Otel: {tenant_name} ({city}, {country})
        - Anlık Saat: {current_hour}
        - Bugünün Elde Edilen Geliri: €{today_revenue}
        - Bugünkü Aktif İşlemler: {active_count} adet.
        
        Eğer Saat sabah ise: "Günün enerjisini yükseltin, upsell yapın." minvalinde.
        Eğer Saat akşam ise: "Rahatlama seanslarını (Hamam/Relax) otel misafirlerine SMS ile atın." minvalinde.
        Ciro düşükse daha agresif satış, yüksekse kalite kontrol emri ver. Asla merhaba/teşekkür etme. Direkt komutu ver.
        """
        
        try:
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            return response.text.replace("*", "").replace("\n", " ").strip() if response and response.text else fallback
        except Exception as e:
            logger.error(f"Tenant Directive Error: {e}")
            return "Master OS bağlantı hatası: Sistemsel gecikme. (Tavsiye: Manuel CRM kontrollerinize devam ediniz.)"

# Global Singleton Instance
ai_core = SovereignIntelligenceCore()
