type DecisionPair = {
  confidence: number;
  match: boolean;
};

export function computeCalibration(pairs: DecisionPair[]) {
  const total = pairs.length;
  if (total === 0) {
    return { matchRate: 0, avgConfidence: 0, calibrationError: 0 };
  }

  const matches = pairs.filter(p => p.match).length;

  const avgConfidence =
    pairs.reduce((sum, p) => sum + p.confidence, 0) / total;

  const matchRate = matches / total;

  // 🔥 EN KRİTİK FORMÜL
  const calibrationError = Math.abs(avgConfidence - matchRate);

  return {
    matchRate,
    avgConfidence,
    calibrationError
  };
}

export function segmentConfidence(pairs: DecisionPair[]) {
  return {
    highConfidence:
      pairs.filter(p => p.confidence > 0.8 && p.match).length,

    mediumConfidence:
      pairs.filter(p => p.confidence > 0.5 && p.confidence <= 0.8).length,

    lowConfidence:
      pairs.filter(p => p.confidence <= 0.5).length
  };
}
