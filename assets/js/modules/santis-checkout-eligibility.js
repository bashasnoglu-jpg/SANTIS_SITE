export class SantisCheckoutEligibility {
  static checkEligibility(ritual) {
    const report = {
      eligible: true,
      reasons: []
    };

    if (!ritual) {
      report.eligible = false;
      report.reasons.push("NO_RITUAL_SELECTED");
      return report;
    }

    if (!ritual.title) {
      report.eligible = false;
      report.reasons.push("MISSING_RITUAL_TITLE");
    }

    if (!ritual.duration) {
      report.eligible = false;
      report.reasons.push("MISSING_RITUAL_DURATION");
    }

    return report;
  }
}
