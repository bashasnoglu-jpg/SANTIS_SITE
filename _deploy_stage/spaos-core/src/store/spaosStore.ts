import { atom } from 'nanostores';

export type RitualData = {
  id: string;
  slug: string;
  category: string;
  presentation: {
    title: string;
    badge: string;
    short_desc: string;
    pricing: {
      base_eur: number;
      duration_min: number;
      surge_eligible: boolean;
    };
    media: {
      card_cover: string;
    };
  };
  sensory_iot: {
    trigger_on_focus: boolean;
    ui_aura_color: string;
    hardware_payload: {
      light_hex: string;
      scent_profile: string;
      audio_freq: string;
      hvac_temp_c: number;
    };
  };
  commerce_brain: {
    sas_baseline: number;
    cross_sell_matrix: Array<{
      target_id: string;
      pitch_logic: string;
      bundle_discount_pct: number;
    }>;
  };
};

export const activeCategory = atom<string>('hamam');
export const focusedCardId = atom<string | null>(null);
export const lockedRitual = atom<RitualData | null>(null); // Spatial Dive (Committed selection)
export const activeAuraColor = atom<string>('rgba(212, 175, 55, 0.15)');
export const activeHardwarePayload = atom<any>(null);

// IoT Engine (Mocked hardware hook)
export function triggerHardwareIoT(payload: any) {
    if (!payload) return;
    activeHardwarePayload.set(payload);
    // Log to console to simulate sending a webhook to KNX/Crestron
    console.log(`[SpaOS Core] 🦅 Triggering Hardware IoT Webhook -> Light: ${payload.light_hex}, Scent: ${payload.scent_profile}, Temp: ${payload.hvac_temp_c}°C`);
}
