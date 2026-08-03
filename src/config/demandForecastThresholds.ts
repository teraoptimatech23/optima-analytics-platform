export const demandForecastThresholds = {
  /** Minimum daily observations before a series can use its own model. */
  minimumHistoryDays: 84,
  /** Minimum non-zero days before a granular series is treated as regular enough. */
  minimumNonZeroDays: 28,
  /** Default and supported daily forecast horizons. */
  defaultHorizonDays: 30,
  supportedHorizons: [7, 14, 30, 60, 90],
  /** Do not forecast more than this share of observed history. */
  maximumHorizonHistoryRatio: 0.25,
  /** Rolling-origin folds use this horizon, then shift backward. */
  backtestHorizonDays: 14,
  backtestFolds: 4,
  /** Moving average and exponential smoothing candidate parameters. */
  movingAverageWindowDays: 28,
  exponentialSmoothingAlpha: 0.35,
  /** Reliability is internal presentation scoring, not a probability. */
  lowReliabilityWape: 0.35,
  highReliabilityWape: 0.18,
  highBiasThreshold: 0.12,
  highUncertaintyWidthRatio: 0.55,
  /** Capacity is unavailable, so load risk uses historical p90 as a relative benchmark. */
  loadIndexHighThreshold: 1.15,
  loadIndexCriticalThreshold: 1.35,
  /** Planning quantity falls back to empirical upper prediction interval. */
  planningInterval: 'p95-upper',
} as const
