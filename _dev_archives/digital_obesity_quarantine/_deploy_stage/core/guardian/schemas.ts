import { z } from "zod";
import { SYSTEM_CONSTANTS } from "../../system/system.constants.js";

// --- REGEX PATTERNS ---
const SLUG_REGEX = /^[a-z0-9-]{1,60}$/;
const SERVICE_ID_REGEX = /^SRV_[A-Z0-9_]+$/; // e.g., SRV_HAMMAM_KESE_01
const LOCATION_ID_REGEX = /^LOC_[A-Z0-9_]+$/; // e.g., LOC_ALBA_ROYAL_ANTALYA

// --- SHARED SCHEMAS ---
const LocalizedString = z.object({
    title: z.string().min(1),
    desc: z.string().optional(),
});

// --- CORE SCHEMAS ---

export const ServiceSchema = z.object({
    id: z.string().regex(SERVICE_ID_REGEX, "Invalid Service ID format (SRV_...)"),
    slug: z.string().regex(SLUG_REGEX, "Invalid Slug format (lowercase, a-z0-9-)"),
    category: z.enum(SYSTEM_CONSTANTS.CATEGORIES),
    type: z.enum(["physical_service", "product", "add_on"]).default("physical_service"),
    defaultDuration: z.number().int().positive(),

    i18n: z.object({
        tr: LocalizedString,
        en: LocalizedString.optional(),
        de: LocalizedString.optional(),
        fr: LocalizedString.optional(),
        ru: LocalizedString.optional(),
    }),

    config: z.object({
        hasWetArea: z.boolean().default(false),
        requiresTherapist: z.boolean().default(true),
    }).optional(),

    meta: z.object({
        version: z.number().int().min(1),
        createdAt: z.string().datetime().optional(),
        updatedAt: z.string().datetime().optional(),
    }),
}).strict();

export const LocationSchema = z.object({
    id: z.string().regex(LOCATION_ID_REGEX, "Invalid Location ID format (LOC_...)"),
    slug: z.string().regex(SLUG_REGEX),
    name: z.string().min(1),
    tier: z.enum(SYSTEM_CONSTANTS.TIERS),
    currency: z.enum(SYSTEM_CONSTANTS.CURRENCIES),
    isActive: z.boolean().default(true),
}).strict();

export const PricingSchema = z.object({
    season: z.enum(SYSTEM_CONSTANTS.SEASONS),
    amount: z.number().positive(),
    currency: z.enum(SYSTEM_CONSTANTS.CURRENCIES),
});

export const LocationServiceSchema = z.object({
    locationId: z.string().regex(LOCATION_ID_REGEX),
    serviceId: z.string().regex(SERVICE_ID_REGEX),
    isActive: z.boolean().default(true),
    pricing: z.array(PricingSchema).min(1),
    override: z.object({
        media: z.string().optional(), // URL
        desc: z.string().optional(),
    }).optional(),
}).strict();

// --- EXPORT TYPES ---
export type Service = z.infer<typeof ServiceSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type LocationService = z.infer<typeof LocationServiceSchema>;
