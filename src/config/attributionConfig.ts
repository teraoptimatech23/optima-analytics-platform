export const attributionModels = ['first-touch', 'last-touch', 'linear', 'position-based', 'time-decay'] as const
export type AttributionModel = (typeof attributionModels)[number]

export const attributionWindows = [1, 7, 14, 30] as const
export type AttributionWindow = (typeof attributionWindows)[number]

export const attributionConfig = {
  defaultModel: 'position-based' as AttributionModel,
  defaultWindow: 7 as AttributionWindow,
  positionWeights: {
    first: 0.4,
    middle: 0.2,
    last: 0.4,
  },
  timeDecayHalfLifeDays: 7,
  minimumPathCount: 5,
  revenueField: 'NetAmount',
  attributionScope: 'CustomerID + CampaignID linked purchase touchpoints',
}

export const attributionModelLabels: Record<AttributionModel, string> = {
  'first-touch': 'First-Touch',
  'last-touch': 'Last-Touch',
  linear: 'Linear',
  'position-based': 'Position-Based',
  'time-decay': 'Time-Decay',
}
