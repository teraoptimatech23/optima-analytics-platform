import { createSyntheticDataSourceAdapter } from './syntheticAdapter'
import type { DataSourceAdapter, DataSourceId, SyntheticSourceRecord } from './types'

export type {
  CampaignPerformanceFact, CanonicalDataSet, CanonicalDimensions, CanonicalFacts,
  ConnectionStatus, CustomerTouchpointFact, CustomerValueFact, DataSourceAdapter,
  DataSourceId, EngagementFact, IdentityStatus, LoopAggregate, OrderFact, OrderItemFact,
  ProfitFact, RetentionFact, SourceMetadata, SyntheticSourceRecord, TrafficFact,
  ValidationIssue, ValidationResult,
} from './types'
export { CANONICAL_CURRENCY, CANONICAL_TIMEZONE } from './types'
export { syntheticSourceFixtures } from './fixtures'
export { validateSyntheticRecords } from './validation'

export const dataSourceAdapters: Record<DataSourceId, DataSourceAdapter<SyntheticSourceRecord>> = {
  google: createSyntheticDataSourceAdapter('google', 'Google'),
  meta: createSyntheticDataSourceAdapter('meta', 'Meta'),
  tiktok: createSyntheticDataSourceAdapter('tiktok', 'TikTok'),
  shopee: createSyntheticDataSourceAdapter('shopee', 'Shopee'),
  tokopedia: createSyntheticDataSourceAdapter('tokopedia', 'Tokopedia'),
  store: createSyntheticDataSourceAdapter('store', 'Store'),
  crm: createSyntheticDataSourceAdapter('crm', 'CRM'),
}

export function getDataSourceAdapter(id: DataSourceId) {
  return dataSourceAdapters[id]
}
