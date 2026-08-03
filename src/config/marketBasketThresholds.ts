export const MARKET_BASKET_THRESHOLDS = {
  minimumSupport: 0.0008,
  minimumConfidence: 0.02,
  minimumLift: 0.7,
  minimumPairTransactions: 50,
  strongSupport: 0.012,
  strongConfidence: 0.24,
  strongLift: 1.25,
} as const

export const MARKET_BASKET_FORMULAS = {
  support: 'Support(A ∩ B) = transaksi berisi A dan B / eligible transactions',
  confidence: 'Confidence(A → B) = Support(A ∩ B) / Support(A)',
  lift: 'Lift(A → B) = Confidence(A → B) / Support(B)',
  opportunityScore: '25% normalizedSupport + 25% normalizedConfidence + 20% normalizedLift + 15% normalizedPairRevenue + 15% normalizedSampleSize',
} as const
