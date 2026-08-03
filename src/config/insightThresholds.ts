export const INSIGHT_THRESHOLDS = {
  relativeChangeThreshold: 0.05,
  minimumSampleSize: 120,
  minimumCampaignSpend: 25_000_000,
  minimumConfidence: 0.42,
  outlierZScore: 1.35,
  highEvidence: 0.75,
  mediumEvidence: 0.5,
  priority: {
    critical: 82,
    high: 64,
    medium: 42,
  },
} as const

export const INSIGHT_SCORING_NOTE =
  'Confidence adalah skor kekuatan bukti internal dari sample size, magnitude, konsistensi, dan jumlah evidence; bukan kepastian statistik atau klaim sebab-akibat.'
