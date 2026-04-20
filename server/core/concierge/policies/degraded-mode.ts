export type DegradedCapabilities = {
  canShowServices: boolean;
  canShowLivePrices: boolean;
  canShowLiveAvailability: boolean;
  canBookDirectly: boolean;
  mustEscalateToHuman: boolean;
};

export function deriveDegradedCapabilities(input: {
  pricingOk: boolean;
  availabilityOk: boolean;
}): DegradedCapabilities {
  if (input.pricingOk && input.availabilityOk) {
    return {
      canShowServices: true,
      canShowLivePrices: true,
      canShowLiveAvailability: true,
      canBookDirectly: true,
      mustEscalateToHuman: false,
    };
  }

  if (!input.pricingOk && input.availabilityOk) {
    return {
      canShowServices: true,
      canShowLivePrices: false,
      canShowLiveAvailability: true,
      canBookDirectly: false,
      mustEscalateToHuman: false,
    };
  }

  if (input.pricingOk && !input.availabilityOk) {
    return {
      canShowServices: true,
      canShowLivePrices: true,
      canShowLiveAvailability: false,
      canBookDirectly: false,
      mustEscalateToHuman: true,
    };
  }

  return {
    canShowServices: true,
    canShowLivePrices: false,
    canShowLiveAvailability: false,
    canBookDirectly: false,
    mustEscalateToHuman: true,
  };
}
