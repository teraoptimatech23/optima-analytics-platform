export const recommendationScoringConfig = {
  scoreWeights: {
    urgency: 0.25,
    impact: 0.25,
    affectedShare: 0.2,
    confidence: 0.15,
    feasibility: 0.15,
  },
  confidenceWeights: {
    sampleSize: 0.25,
    sourceReliability: 0.25,
    evidenceConsistency: 0.2,
    evidenceCount: 0.15,
    recency: 0.15,
  },
  priorityThresholds: {
    critical: 82,
    high: 64,
    medium: 42,
  },
  confidenceThresholds: {
    high: 0.75,
    medium: 0.5,
  },
  effortScore: {
    low: 0.85,
    medium: 0.55,
    high: 0.25,
  },
}
