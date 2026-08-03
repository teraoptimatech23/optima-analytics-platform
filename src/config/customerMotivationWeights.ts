export const customerMotivationWeights = {
  minimumSampleSize: 30,
  highReliabilitySampleSize: 120,
  dimensions: [
    {
      id: 'product-quality',
      label: 'Product Quality',
      sourceType: 'Mixed Evidence',
      weights: { tasteImportance: 0.34, tastePerformance: 0.26, favoriteConsistency: 0.18, repeatSignal: 0.22 },
      description: 'Taste importance/performance, favorite category consistency, and repeat behaviour.',
    },
    {
      id: 'price-value',
      label: 'Price & Value',
      sourceType: 'Mixed Evidence',
      weights: { priceImportance: 0.34, pricePerformance: 0.2, voucherRate: 0.2, basketAffordability: 0.16, discountRate: 0.1 },
      description: 'Price importance/performance, voucher behaviour, basket affordability, and discount use.',
    },
    {
      id: 'promotion-rewards',
      label: 'Promotion & Rewards',
      sourceType: 'Mixed Evidence',
      weights: { promoImportance: 0.28, promoPerformance: 0.18, voucherRate: 0.28, memberSignal: 0.14, campaignSignal: 0.12 },
      description: 'Promo survey signals, voucher use, membership, and campaign-attributed transactions.',
    },
    {
      id: 'convenience',
      label: 'Convenience',
      sourceType: 'Mixed Evidence',
      weights: { orderingScore: 0.24, appScore: 0.2, locationScore: 0.2, deliveryShare: 0.2, waitSignal: 0.16 },
      description: 'Ordering/app/location survey scores, delivery share, and wait-time proxy.',
    },
    {
      id: 'brand-trust',
      label: 'Brand & Trust',
      sourceType: 'Behavioural Proxy',
      weights: { npsSignal: 0.3, satisfaction: 0.25, retentionSignal: 0.2, memberSignal: 0.15, repeatSignal: 0.1 },
      description: 'NPS, satisfaction, retention, membership, and repeat consistency.',
    },
    {
      id: 'experience',
      label: 'Experience',
      sourceType: 'Mixed Evidence',
      weights: { ambienceScore: 0.26, serviceScore: 0.25, orderingScore: 0.17, satisfaction: 0.2, npsSignal: 0.12 },
      description: 'Ambience, service, ordering, satisfaction, and recommendation tendency.',
    },
    {
      id: 'habit-routine',
      label: 'Habit & Routine',
      sourceType: 'Behavioural Proxy',
      weights: { frequencySignal: 0.32, recencySignal: 0.18, repeatSignal: 0.2, daypartConsistency: 0.18, favoriteConsistency: 0.12 },
      description: 'Frequency, recency, repeat behaviour, daypart stability, and product preference consistency.',
    },
    {
      id: 'functional-need',
      label: 'Functional Need',
      sourceType: 'Behavioural Proxy',
      weights: { coffeeShare: 0.3, morningShare: 0.24, snackShare: 0.16, repeatSignal: 0.15, frequencySignal: 0.15 },
      description: 'Coffee/snack preference, morning purchase pattern, repeat, and frequency.',
    },
  ],
} as const

export type CustomerMotivationDimensionId = typeof customerMotivationWeights.dimensions[number]['id']
