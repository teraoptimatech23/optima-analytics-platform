import { createSyntheticDataSourceAdapter } from './syntheticAdapter'
import type { DataSourceAdapter, DataSourceId, SyntheticSourceRecord } from './types'

export type {
  DataSourceAdapter,
  DataSourceId,
  NormalizedCommerceFact,
  NormalizedCustomerFact,
  NormalizedEngagementFact,
  NormalizedFactDomain,
  NormalizedFactSet,
  NormalizedMarketingFact,
  NormalizedServiceFact,
  SyntheticSourceRecord,
} from './types'

export const dataSourceAdapters: Record<DataSourceId, DataSourceAdapter<SyntheticSourceRecord>> = {
  meta: createSyntheticDataSourceAdapter('meta', 'Meta', ['marketing', 'engagement']),
  google: createSyntheticDataSourceAdapter('google', 'Google', ['marketing']),
  tiktok: createSyntheticDataSourceAdapter('tiktok', 'TikTok', ['marketing', 'engagement']),
  shopee: createSyntheticDataSourceAdapter('shopee', 'Shopee', ['marketing', 'commerce', 'engagement']),
  tokopedia: createSyntheticDataSourceAdapter('tokopedia', 'Tokopedia', ['marketing', 'commerce', 'engagement']),
  'customer-service': createSyntheticDataSourceAdapter('customer-service', 'Customer Service', ['customer', 'engagement', 'service']),
  crm: createSyntheticDataSourceAdapter('crm', 'CRM', ['customer', 'engagement', 'service']),
}

export function getDataSourceAdapter(id: DataSourceId) {
  return dataSourceAdapters[id]
}
