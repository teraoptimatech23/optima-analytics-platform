export type DataSourceId =
  | 'meta'
  | 'google'
  | 'tiktok'
  | 'shopee'
  | 'tokopedia'
  | 'customer-service'
  | 'crm'

export type NormalizedFactDomain = 'marketing' | 'customer' | 'commerce' | 'engagement' | 'service'

export interface NormalizedFactBase {
  source: DataSourceId
  occurredAt: string
  externalId: string
}

export interface NormalizedMarketingFact extends NormalizedFactBase {
  domain: 'marketing'
  channel: string
  campaign?: string
  impressions: number
  clicks: number
  spend: number
  conversions: number
  revenue: number
}

export interface NormalizedCustomerFact extends NormalizedFactBase {
  domain: 'customer'
  customerId: string
  segment?: string
  lifecycle?: string
}

export interface NormalizedCommerceFact extends NormalizedFactBase {
  domain: 'commerce'
  customerId?: string
  orderId: string
  grossValue: number
  netValue: number
  itemCount: number
}

export interface NormalizedEngagementFact extends NormalizedFactBase {
  domain: 'engagement'
  customerId?: string
  interactionType: string
  channel: string
  value: number
}

export interface NormalizedServiceFact extends NormalizedFactBase {
  domain: 'service'
  customerId?: string
  caseType: string
  status: string
  satisfaction?: number
}

export interface NormalizedFactSet {
  marketing: NormalizedMarketingFact[]
  customer: NormalizedCustomerFact[]
  commerce: NormalizedCommerceFact[]
  engagement: NormalizedEngagementFact[]
  service: NormalizedServiceFact[]
}

export interface SyntheticSourceRecord {
  id: string
  occurredAt: string
  customerId?: string
  channel?: string
  campaign?: string
  segment?: string
  lifecycle?: string
  orderId?: string
  interactionType?: string
  caseType?: string
  status?: string
  impressions?: number
  clicks?: number
  spend?: number
  conversions?: number
  revenue?: number
  grossValue?: number
  netValue?: number
  itemCount?: number
  value?: number
  satisfaction?: number
}

export interface DataSourceAdapter<TRawRecord> {
  readonly id: DataSourceId
  readonly label: string
  readonly integrationStatus: 'schema-ready' | 'connected'
  readonly activeDataMode: 'synthetic' | 'live'
  readonly domains: readonly NormalizedFactDomain[]
  normalize(records: readonly TRawRecord[]): NormalizedFactSet
}
