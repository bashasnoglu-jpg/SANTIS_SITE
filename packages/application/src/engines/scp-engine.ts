type SCPInput = {
  totalAmount: number;
  services: string[];
};

export function calculateSCP(input: SCPInput) {
  const { totalAmount, services } = input;

  // 🔹 heuristic cost model (v1)
  const serviceCost = totalAmount * 0.25;
  const therapistCost = totalAmount * 0.20;
  const facilityCost = totalAmount * 0.10;
  const overhead = totalAmount * 0.05;

  const netContribution =
    totalAmount - serviceCost - therapistCost - facilityCost - overhead;

  const margin = netContribution / totalAmount;

  // 🔹 score (luxury weighted)
  const score =
    Math.min(
      100,
      Math.round(
        margin * 70 +
        (totalAmount / 1000) * 20 +
        services.length * 2
      )
    );

  return {
    grossRevenue: totalAmount,
    serviceCost,
    therapistCost,
    facilityCost,
    overhead,
    netContribution,
    margin,
    score,
    currency: "EUR"
  };
}
