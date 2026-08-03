export type RFMScore = 1 | 2 | 3 | 4 | 5

export type RFMScoringMethod = 'quantile' | 'business'

export type RFMSegmentId =
  | 'champions'
  | 'loyal-customers'
  | 'potential-loyalists'
  | 'new-customers'
  | 'promising'
  | 'need-attention'
  | 'about-to-sleep'
  | 'at-risk'
  | 'cannot-lose-them'
  | 'hibernating'
  | 'lost-customers'
  | 'unclassified'

export interface RFMSegmentDefinition {
  id: RFMSegmentId
  label: string
  description: string
  priority: 'grow' | 'retain' | 'activate' | 'recover' | 'monitor'
}

export const rfmConfig = {
  scoreScale: 5,
  defaultObservationWindow: '180d',
  minimumTransactions: 1,
  minimumSampleSize: 30,
  highValueMinimumScore: 12,
  monetaryField: 'netAmount',
  scoringMethod: 'quantile' as RFMScoringMethod,
  observationWindows: [
    { id: 'filter-period', label: 'Filter Period', days: null },
    { id: '90d', label: 'Rolling 90 Days', days: 90 },
    { id: '180d', label: 'Rolling 180 Days', days: 180 },
    { id: '365d', label: 'Rolling 365 Days', days: 365 },
    { id: 'lifetime', label: 'Lifetime sampai Analysis Date', days: null },
  ],
  businessThresholds: {
    recency: [
      { max: 14, score: 5 },
      { max: 30, score: 4 },
      { max: 60, score: 3 },
      { max: 120, score: 2 },
      { max: Number.POSITIVE_INFINITY, score: 1 },
    ],
    frequency: [
      { min: 16, score: 5 },
      { min: 9, score: 4 },
      { min: 5, score: 3 },
      { min: 2, score: 2 },
      { min: 1, score: 1 },
    ],
    monetary: [
      { min: 1_200_000, score: 5 },
      { min: 700_000, score: 4 },
      { min: 350_000, score: 3 },
      { min: 120_000, score: 2 },
      { min: 0, score: 1 },
    ],
  },
} as const

export const rfmSegments: RFMSegmentDefinition[] = [
  { id: 'champions', label: 'Champions', priority: 'grow', description: 'R tinggi, F tinggi, dan M tinggi.' },
  { id: 'loyal-customers', label: 'Loyal Customers', priority: 'retain', description: 'Frequency tinggi dengan recency masih sehat.' },
  { id: 'potential-loyalists', label: 'Potential Loyalists', priority: 'grow', description: 'Baru/aktif kembali dengan frequency menengah.' },
  { id: 'new-customers', label: 'New Customers', priority: 'activate', description: 'Recency sangat baru, frequency masih rendah.' },
  { id: 'promising', label: 'Promising', priority: 'activate', description: 'Recency baik dan punya potensi repeat.' },
  { id: 'need-attention', label: 'Need Attention', priority: 'monitor', description: 'Nilai/frequency cukup, tetapi recency mulai melebar.' },
  { id: 'about-to-sleep', label: 'About to Sleep', priority: 'recover', description: 'Recency rendah-menengah dengan frequency rendah.' },
  { id: 'at-risk', label: 'At Risk', priority: 'recover', description: 'Recency rendah, namun memiliki histori nilai atau frequency.' },
  { id: 'cannot-lose-them', label: 'Cannot Lose Them', priority: 'recover', description: 'Recency sangat rendah, F dan M historis tinggi.' },
  { id: 'hibernating', label: 'Hibernating', priority: 'monitor', description: 'Recency rendah dengan engagement transaksi terbatas.' },
  { id: 'lost-customers', label: 'Lost Customers', priority: 'recover', description: 'Recency sangat rendah, F dan M rendah.' },
  { id: 'unclassified', label: 'Unclassified', priority: 'monitor', description: 'Data tidak cukup atau nilai invalid.' },
]

export const rfmSegmentMap = Object.fromEntries(rfmSegments.map((segment) => [segment.id, segment])) as Record<RFMSegmentId, RFMSegmentDefinition>
