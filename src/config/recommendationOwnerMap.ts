export const recommendationOwnerMap = {
  'customer-retention': 'CRM',
  'customer-experience': 'Customer Experience',
  product: 'Product',
  'pricing-promotion': 'Marketing',
  loyalty: 'Loyalty',
  'marketing-efficiency': 'Performance Marketing',
  'campaign-optimization': 'Performance Marketing',
  'outlet-operations': 'Operations',
  'inventory-demand': 'Inventory Planning',
  'revenue-growth': 'Management',
  'digital-experience': 'Digital Product',
  'measurement-tracking': 'Data Team',
} as const

export const recommendationEffortMap = {
  tracking_governance: 'high',
  queue_staffing: 'medium',
  service_recovery: 'medium',
  product_quality: 'medium',
  price_value: 'medium',
  digital_friction: 'high',
  churn_winback: 'medium',
  campaign_scale: 'low',
  campaign_reduce: 'low',
  demand_capacity: 'medium',
  bundle_test: 'low',
  model_foundation: 'high',
} as const
