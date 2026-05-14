export type MemberTier = 'none' | 'silver' | 'gold' | 'black';
export type GuestSource = 'direct' | 'hotel' | 'concierge' | 'campaign';
export type CurrencyCode = 'EUR';

export type SnapshotRequestContext = {
  tenantId: string;
  sessionId?: string;
  locale: string;
  currency: CurrencyCode;
  date?: string;
  partySize: number;
  memberTier?: MemberTier;
  source?: GuestSource;
};

export type ConciergeServiceCategory =
  | 'massage'
  | 'hamam'
  | 'facial'
  | 'ritual'
  | 'body'
  | 'other';

export type ConciergeServiceCard = {
  id: string;
  title: string;
  category: ConciergeServiceCategory;
  durationMin: number;
  price: number | null;
  compareAtPrice: number | null;
  availabilityScore: number; // 0..1
  recommended: boolean;
  badges: string[];
};

export type SlotSuggestion = {
  serviceId: string;
  startIso: string;
  therapistId?: string;
  confidence: number; // 0..1
  rankScore: number; // 0..1
};

export type SnapshotWarningCode =
  | 'PRICING_UNAVAILABLE'
  | 'AVAILABILITY_UNAVAILABLE'
  | 'PARTIAL_DATA';

export type SnapshotWarning = {
  code: SnapshotWarningCode;
  severity: 'info' | 'warning' | 'critical';
  message: string;
};

export type ConciergeSnapshot = {
  requestId: string;
  generatedAt: string;
  tenantId: string;
  locale: string;
  currency: CurrencyCode;
  guestContext: {
    partySize: number;
    vipKnown: boolean;
    memberTier?: MemberTier;
    source?: GuestSource;
  };
  services: ConciergeServiceCard[];
  nextAvailableSlots: SlotSuggestion[];
  merchandising: {
    anchorPriceVisible: boolean;
    anchorPrice?: number;
    upsellEnabled: boolean;
    recommendedBundleIds: string[];
  };
  operational: {
    therapistLoadIndex: number;
    capacityHealth: 'healthy' | 'tight' | 'critical';
    pricingFreshnessSec: number;
    availabilityFreshnessSec: number;
  };
  policy: {
    bookingAllowed: boolean;
    quoteAllowed: boolean;
    directCheckoutAllowed: boolean;
    humanConciergePreferred: boolean;
  };
  warnings: SnapshotWarning[];
};
