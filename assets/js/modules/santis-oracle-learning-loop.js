/**
 * santis-oracle-learning-loop.js
 * Calibrates future Oracle confidence using human decision memory.
 */
import { SantisOracleActionMemory } from './santis-oracle-action-memory.js';
import { SantisOracleFeedbackWeighting } from './santis-oracle-feedback-weighting.js';

export class SantisOracleLearningLoop {
  constructor({
    memory = new SantisOracleActionMemory(),
    feedbackWeighting = new SantisOracleFeedbackWeighting(),
  } = {}) {
    this.memory = memory;
    this.feedbackWeighting = feedbackWeighting;
  }

  calibrate(actionId, candidate) {
    const memory = this.memory.readAll();
    const feedback = this.feedbackWeighting.calculate(actionId, candidate, memory);

    const calibratedConfidence = this.clamp(
      Number(candidate.confidenceScore || 0) + feedback.confidenceDelta,
      45,
      98
    );

    const calibratedRiskLevel = this.calibrateRisk(candidate.riskLevel, feedback.riskDelta);
    const learningSummary = this.buildLearningSummary(feedback);

    return {
      confidenceScore: calibratedConfidence,
      riskLevel: calibratedRiskLevel,
      learningSummary,
      learningFeedback: feedback,
    };
  }

  calibrateRisk(currentRiskLevel, riskDelta) {
    const levels = ['low', 'medium', 'high'];
    const currentIndex = Math.max(0, levels.indexOf(currentRiskLevel));
    const nextIndex = this.clamp(currentIndex + riskDelta, 0, levels.length - 1);

    return levels[nextIndex];
  }

  buildLearningSummary(feedback) {
    if (!feedback.rationale) return '';

    if (feedback.confidenceDelta > 0) {
      return `${feedback.rationale} Confidence calibrated upward.`;
    }

    if (feedback.confidenceDelta < 0) {
      return `${feedback.rationale} Confidence calibrated downward.`;
    }

    if (feedback.riskDelta > 0) {
      return `${feedback.rationale} Risk sensitivity increased.`;
    }

    return feedback.rationale;
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
}
