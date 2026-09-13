export const CANONICAL_CURRENCY = 'IDR' as const
export const CANONICAL_TIMEZONE = 'Asia/Jakarta' as const

export type DataSourceId = 'google' | 'meta' | 'tiktok' | 'shopee' | 'tokopedia' | 'store' | 'crm'
export type ConnectionStatus = 'Synthetic' | 'Adapter Ready' | 'Connected' | 'Error' | 'Stale'
export type IdentityStatus = 'identified' | 'anonymous' | 'unresolved'
export type ValidationStatus = 'valid' | 'valid-with-warnings' | 'invalid'
export type CanonicalFactName =
  | 'fact_traffic' | 'fact_campaign_performance' | 'fact_customer_touchpoint'
  | 'fact_engagement' | 'fact_order' | 'fact_order_item' | 'fact_retention'
  | 'fact_customer_value' | 'fact_cost' | 'fact_profit'

export interface SourceMetadata {
  sourceId: DataSourceId
  sourceName: string
  connectionStatus: ConnectionStatus
  lastUpdated: string | null
  dataFreshness: string
  recordsProcessed: number
  recordsRejected: number
  validationStatus: ValidationStatus
}

export interface ValidationIssue {
  recordId: string
  field: string
  code: 'duplicate-id' | 'missing-date' | 'invalid-metric' | 'negative-value' | 'source-mapping' | 'currency' | 'timezone' | 'attribution-mapping' | 'customer-mapping'
  message: string
  severity: 'warning' | 'error'
}

export interface ValidationResult {
  status: ValidationStatus
  acceptedRecordIds: string[]
  rejectedRecordIds: string[]
  issues: ValidationIssue[]
}

export interface CanonicalDimensions {
  dim_customer: Array<{ canonicalCustomerId: string; sourceCustomerId: string; source: DataSourceId; identityStatus: IdentityStatus }>
  dim_product: Array<{ productId: string; productName: string | null; category: string | null }>
  dim_channel: Array<{ channelId: string; channelName: string; source: DataSourceId }>
  dim_campaign: Array<{ campaignId: string; campaignName: string | null; source: DataSourceId }>
  dim_store: Array<{ storeId: string; storeName: string | null; regionId: string | null }>
  dim_region: Array<{ regionId: string; regionName: string }>
  dim_date: Array<{ dateId: string; date: string; timezone: typeof CANONICAL_TIMEZONE }>
  dim_source: Array<SourceMetadata>
}

interface CanonicalFactBase {
  recordId: string
  source: DataSourceId
  date: string
  timezone: typeof CANONICAL_TIMEZONE
  currency: typeof CANONICAL_CURRENCY
}

export interface TrafficFact extends CanonicalFactBase {
  channel: string
  campaignId: string | null
  campaignName: string | null
  impressions: number | null
  reach: number | null
  clicks: number | null
  traffic: number | null
  spend: number | null
  ctr: number | null
  cpc: number | null
  cpm: number | null
  conversions: number | null
  conversionValue: number | null
}

export interface CampaignPerformanceFact extends CanonicalFactBase {
  campaignId: string | null
  channel: string
  spend: number | null
  conversions: number | null
  revenue: number | null
  roas: number | null
}

export interface CustomerTouchpointFact extends CanonicalFactBase {
  canonicalCustomerId: string | null
  identityStatus: IdentityStatus
  channel: string
  eventType: string
  campaignId: string | null
}

export interface EngagementFact extends CanonicalFactBase {
  canonicalCustomerId: string | null
  identityStatus: IdentityStatus
  channel: string
  eventType: 'view' | 'click' | 'message' | 'reply' | 'voucherUse' | 'memberActivity' | 'repeatVisit' | 'review' | 'share' | 'comment'
  eventTimestamp: string
  campaignId: string | null
  contentId: string | null
  interactionValue: number | null
}

export interface OrderFact extends CanonicalFactBase {
  orderId: string
  canonicalCustomerId: string | null
  identityStatus: IdentityStatus
  channel: string
  storeId: string | null
  grossRevenue: number
  discount: number
  netRevenue: number
  cost: number | null
  margin: number | null
  voucher: string | null
  campaignId: string | null
}

export interface OrderItemFact extends CanonicalFactBase {
  orderId: string
  productId: string
  quantity: number
  grossRevenue: number
  netRevenue: number
  cost: number | null
}

export interface RetentionFact extends CanonicalFactBase {
  canonicalCustomerId: string | null
  identityStatus: IdentityStatus
  period: string
  active: boolean
  repeatPurchase: boolean
  recency: number | null
  frequency: number | null
  retentionStatus: string | null
  churnRisk: number | null
  memberStatus: string | null
}

export interface CustomerValueFact extends CanonicalFactBase {
  canonicalCustomerId: string | null
  identityStatus: IdentityStatus
  period: string
  historicalClv: number | null
  predictedClv: number | null
}

export interface CostFact extends CanonicalFactBase {
  period: string
  channel: string | null
  campaignId: string | null
  storeId: string | null
  productId: string | null
  marketingCost: number | null
  discountCost: number | null
  operationalCost: number | null
}

export interface ProfitFact extends CanonicalFactBase {
  period: string
  channel: string | null
  campaignId: string | null
  storeId: string | null
  productId: string | null
  customerSegment: string | null
  revenue: number
  cogs: number | null
  marketingCost: number | null
  discountCost: number | null
  operationalCost: number | null
  grossProfit: number | null
  netContribution: number | null
  margin: number | null
  metricScope: 'gross' | 'contribution' | 'net'
}

export interface CanonicalFacts {
  fact_traffic: TrafficFact[]
  fact_campaign_performance: CampaignPerformanceFact[]
  fact_customer_touchpoint: CustomerTouchpointFact[]
  fact_engagement: EngagementFact[]
  fact_order: OrderFact[]
  fact_order_item: OrderItemFact[]
  fact_retention: RetentionFact[]
  fact_customer_value: CustomerValueFact[]
  fact_cost: CostFact[]
  fact_profit: ProfitFact[]
}

export interface CanonicalDataSet {
  dimensions: CanonicalDimensions
  facts: CanonicalFacts
}

export interface LoopAggregate {
  loop: 'customer-behavior' | 'traffic-acquisition' | 'conversion' | 'engagement' | 'retention' | 'analytics' | 'profit-optimization'
  sourceRecordCount: number
  metrics: Record<string, number | null>
  rejectedRecords: number
}

export interface SyntheticSourceRecord {
  id: string
  occurredAt?: string
  timezone?: string
  currency?: string
  customerId?: string
  canonicalCustomerId?: string
  channel?: string
  campaignId?: string
  campaignName?: string
  storeId?: string
  orderId?: string
  productId?: string
  eventType?: EngagementFact['eventType']
  impressions?: number
  reach?: number
  clicks?: number
  spend?: number
  conversions?: number
  revenue?: number
  grossRevenue?: number
  discount?: number
  netRevenue?: number
  cost?: number
  quantity?: number
  interactionValue?: number
  active?: boolean
  repeatPurchase?: boolean
  recency?: number
  frequency?: number
  churnRisk?: number
  historicalClv?: number
  predictedClv?: number
}

export interface DataSourceAdapter<TSource> {
  readonly source: DataSourceId
  readonly sourceName: string
  readonly connectionStatus: ConnectionStatus
  normalize(input: readonly TSource[]): CanonicalDataSet
  validate(input: readonly TSource[]): ValidationResult
}
