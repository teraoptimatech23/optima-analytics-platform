export type ChurnHorizon = 30 | 60 | 90
export type ChurnRiskBand = 'critical' | 'high' | 'medium' | 'low'
export type ChurnThresholdPolicy = 'balanced' | 'high-recall' | 'high-precision' | 'top-capacity'

export const churnPredictionConfig = {
  modelVersion: 'churn-logistic-v1',
  featureVersion: 'customer-pre-ref-v1',
  observationWindowDays: 180,
  supportedHorizons: [30, 60, 90] as ChurnHorizon[],
  defaultHorizon: 30 as ChurnHorizon,
  minimumHistoryDays: 30,
  minimumTransactions: 2,
  thresholdPolicies: {
    balanced: { label: 'Balanced', minRecall: 0.5, minPrecision: 0.2, capacityShare: null },
    'high-recall': { label: 'High Recall', minRecall: 0.7, minPrecision: 0.12, capacityShare: null },
    'high-precision': { label: 'High Precision', minRecall: 0.25, minPrecision: 0.35, capacityShare: null },
    'top-capacity': { label: 'Retention Capacity 20%', minRecall: 0, minPrecision: 0, capacityShare: 0.2 },
  } satisfies Record<ChurnThresholdPolicy, { label: string; minRecall: number; minPrecision: number; capacityShare: number | null }>,
  riskBands: [
    { id: 'critical', label: 'Critical Risk', min: 0.8 },
    { id: 'high', label: 'High Risk', min: 0.6 },
    { id: 'medium', label: 'Medium Risk', min: 0.35 },
    { id: 'low', label: 'Low Risk', min: 0 },
  ] satisfies Array<{ id: ChurnRiskBand; label: string; min: number }>,
} as const

export const churnFeatureLabels: Record<string, string> = {
  recencyDays: 'Recency days',
  transactionCount: 'Transaction count',
  purchaseFrequency: 'Purchase frequency',
  monetary: 'Monetary value',
  averageBasket: 'Average basket',
  activeMonths: 'Active months',
  voucherUsageRate: 'Voucher usage rate',
  campaignUsageRate: 'Campaign usage rate',
  satisfaction: 'Satisfaction',
  nps: 'NPS',
  member: 'Member status',
  tenureDays: 'Customer tenure',
  channelDiversity: 'Channel diversity',
  outletDiversity: 'Outlet diversity',
  frequencyChange: 'Frequency change',
  monetaryChange: 'Monetary change',
  daysSinceSecondLastPurchase: 'Days since second last purchase',
  itemsPerTransaction: 'Items per transaction',
}
