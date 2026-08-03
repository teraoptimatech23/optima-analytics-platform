export const customerPerceptionDimensions = [
  'brand',
  'product',
  'price-value',
  'service',
  'outlet-experience',
  'digital-experience',
  'delivery',
  'loyalty',
] as const

export type PerceptionDimensionId = (typeof customerPerceptionDimensions)[number]

export type PerceptionSourceType = 'direct-survey' | 'behavioural-proxy' | 'mixed'

export interface PerceptionAttributeConfig {
  id: string
  label: string
  dimensionId: PerceptionDimensionId
  sourceType: PerceptionSourceType
  weight: number
  description: string
}

export const customerPerceptionAttributes: PerceptionAttributeConfig[] = [
  { id: 'brand_recommendation', label: 'Recommendation & Trust Signal', dimensionId: 'brand', sourceType: 'mixed', weight: 1, description: 'Structured NPS, WouldRecommend, and overall satisfaction; not open-text sentiment.' },
  { id: 'taste', label: 'Taste Quality', dimensionId: 'product', sourceType: 'direct-survey', weight: 1.15, description: 'Score_taste from structured survey.' },
  { id: 'variety', label: 'Menu Variety', dimensionId: 'product', sourceType: 'direct-survey', weight: 0.85, description: 'Score_variety from structured survey.' },
  { id: 'price', label: 'Price Fairness', dimensionId: 'price-value', sourceType: 'direct-survey', weight: 1.1, description: 'Score_price from structured survey.' },
  { id: 'promo', label: 'Promotion Attractiveness', dimensionId: 'price-value', sourceType: 'direct-survey', weight: 0.9, description: 'Score_promo from structured survey.' },
  { id: 'service', label: 'Service Quality', dimensionId: 'service', sourceType: 'direct-survey', weight: 1, description: 'Score_service from structured survey.' },
  { id: 'ordering', label: 'Ordering Ease', dimensionId: 'service', sourceType: 'direct-survey', weight: 0.7, description: 'Score_ordering from structured survey.' },
  { id: 'ambience', label: 'Outlet Ambience', dimensionId: 'outlet-experience', sourceType: 'direct-survey', weight: 0.9, description: 'Score_ambience from structured survey.' },
  { id: 'location', label: 'Location Accessibility', dimensionId: 'outlet-experience', sourceType: 'direct-survey', weight: 0.75, description: 'Score_location from structured survey.' },
  { id: 'parking', label: 'Parking Convenience', dimensionId: 'outlet-experience', sourceType: 'direct-survey', weight: 0.55, description: 'Score_parking from structured survey.' },
  { id: 'app', label: 'App Experience', dimensionId: 'digital-experience', sourceType: 'direct-survey', weight: 1, description: 'Score_app from structured survey.' },
  { id: 'delivery_proxy', label: 'Delivery Experience Proxy', dimensionId: 'delivery', sourceType: 'behavioural-proxy', weight: 0.65, description: 'Derived from delivery-channel share, transaction satisfaction, and wait minutes.' },
  { id: 'loyalty_proxy', label: 'Loyalty Value Proxy', dimensionId: 'loyalty', sourceType: 'behavioural-proxy', weight: 0.65, description: 'Derived from member status, voucher usage, repeat activity, and CLV.' },
]

export const customerPerceptionDimensionWeights: Record<PerceptionDimensionId, number> = {
  brand: 1,
  product: 1.15,
  'price-value': 1.05,
  service: 1,
  'outlet-experience': 0.9,
  'digital-experience': 0.85,
  delivery: 0.55,
  loyalty: 0.55,
}

export const customerPerceptionDimensionLabels: Record<PerceptionDimensionId, string> = {
  brand: 'Brand Perception',
  product: 'Product Perception',
  'price-value': 'Price & Value',
  service: 'Service Perception',
  'outlet-experience': 'Outlet Experience',
  'digital-experience': 'Digital Experience',
  delivery: 'Delivery Experience',
  loyalty: 'Loyalty Perception',
}
