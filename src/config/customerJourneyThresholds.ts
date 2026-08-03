export const customerJourneyThresholds = {
  /** A customer becomes repeat after completing at least this many transactions. */
  repeatPurchaseMinimumTransactions: 2,
  /** Active means the last purchase is within this many days from the period end. */
  activeRecencyDays: 45,
  /** At-risk starts after active recency but before dormant recency. */
  atRiskRecencyDays: 75,
  /** Dormant means no purchase for this many days from the period end. */
  dormantRecencyDays: 120,
  /** Churned means no purchase for this many days from the period end. */
  churnRecencyDays: 180,
  /** High value is computed from scoped customer CLV percentile, not a fixed rupiah value. */
  highValuePercentile: 0.8,
  /** Used to label insights and guard tiny cohort/transition denominators. */
  minimumSampleSize: 30,
  /** Drop-off is significant when stage-to-stage loss exceeds this rate. */
  significantDropOffThreshold: 0.2,
  /** Reactivation requires a dormant/churned prior state and purchase within this many days. */
  reactivationWindowDays: 90,
} as const

export type CustomerJourneyThresholds = typeof customerJourneyThresholds
