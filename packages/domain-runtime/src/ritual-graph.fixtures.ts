import type { RitualGraphNode } from "@santis/domain-contracts";

export const ritualGraphFixtures: RitualGraphNode[] = [
  {
    id: "nv_signature_hamam_ritual",
    slug: "signature-hamam-ritual",
    name: "Signature Hamam Ritual",
    category: "signature",
    durationMinutes: 90,
    basePrice: 240,
    currency: "EUR",
    emotionalPromise: "Deep Zen and Inner Peace",
    bodyFocus: ["full_body", "skin_barrier"],
    idealFor: "Overwhelmed guests seeking deep relaxation and emotional grounding",
    contraindications: ["pregnancy", "heat", "cardiovascular"],
    recoveryGoals: ["relax", "detox", "stress_reset", "emotional_balance"],
    intensity: "medium",
    sequenceRole: "core",
    visualMood: {
      texture: "subtle rising steam, warm white marble",
      lighting: "soft cinematic diffused marble glow",
      motion: "slow-flowing water, gentle steam patterns",
      colorTemperature: "warm smoky gold"
    },
    resourceRequirements: {
      roomType: "Luxury Turkish Hamam Suite",
      therapistSkillTags: ["hamam_master", "kese_expert"],
      equipmentTags: ["kurna", "marble_slab", "silk_kese"],
      requiresWetArea: true,
      requiresQuietRoom: false
    },
    safetyGate: {
      requiresHostReview: false,
      suppressIfTags: ["cardiovascular", "pregnancy"],
      cautionIfTags: ["heat"],
      notes: "Ensure the guest is comfortable with high heat and humidity levels."
    }
  },
  {
    id: "nv_deep_recovery_massage",
    slug: "deep-recovery-massage",
    name: "Deep Recovery Massage",
    category: "massage",
    durationMinutes: 75,
    basePrice: 180,
    currency: "EUR",
    emotionalPromise: "Pain Relief and Physical Equilibrium",
    bodyFocus: ["back", "legs", "neck_shoulders"],
    idealFor: "Athletes or highly fatigued guests needing muscular recovery and pain relief",
    contraindications: ["post_surgery", "inflammation"],
    recoveryGoals: ["pain_relief", "mobility", "athletic_recovery"],
    intensity: "high",
    sequenceRole: "core",
    visualMood: {
      texture: "rich oil, brushed basalt stones",
      lighting: "low contrast amber spotlights",
      motion: "rhythmic deep kneading, steady breath sync",
      colorTemperature: "smoky low amber"
    },
    resourceRequirements: {
      roomType: "Premium Quiet Treatment Room",
      therapistSkillTags: ["deep_tissue_specialist", "sports_therapy"],
      equipmentTags: ["heated_basalt_stones", "organic_arnica_oil"],
      requiresWetArea: false,
      requiresQuietRoom: true
    },
    safetyGate: {
      requiresHostReview: true,
      suppressIfTags: ["post_surgery"],
      cautionIfTags: ["inflammation"],
      notes: "Verify with the guest if they have any acute muscular inflammation before applying deep pressure."
    }
  },
  {
    id: "nv_quiet_glow_skin_ritual",
    slug: "quiet-glow-skin-ritual",
    name: "Quiet Glow Skin Ritual",
    category: "skin",
    durationMinutes: 60,
    basePrice: 150,
    currency: "EUR",
    emotionalPromise: "Radiant Skin Barrier and Mental Balance",
    bodyFocus: ["face", "scalp"],
    idealFor: "Guests wanting radiant, deeply hydrated skin and nervous system calming",
    contraindications: ["skin_sensitivity", "allergy"],
    recoveryGoals: ["skin_glow", "detox", "stress_reset"],
    intensity: "low",
    sequenceRole: "closer",
    visualMood: {
      texture: "velvety cream, cool rose quartz",
      lighting: "soft neutral glow, candlelit vibes",
      motion: "gentle circular sweeps, light touch",
      colorTemperature: "neutral warm"
    },
    resourceRequirements: {
      roomType: "Quiet Aesthetic Room",
      therapistSkillTags: ["licensed_aesthetician", "lymphatic_massage"],
      equipmentTags: ["rose_quartz_rollers", "premium_hydrating_serums"],
      requiresWetArea: false,
      requiresQuietRoom: true
    },
    safetyGate: {
      requiresHostReview: false,
      suppressIfTags: ["allergy"],
      cautionIfTags: ["skin_sensitivity"],
      notes: "Check if the guest has any known allergies to organic active ingredients."
    }
  }
];
