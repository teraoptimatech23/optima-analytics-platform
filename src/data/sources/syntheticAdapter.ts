import type {
  DataSourceAdapter,
  DataSourceId,
  NormalizedFactDomain,
  NormalizedFactSet,
  SyntheticSourceRecord,
} from './types'

const emptyFacts = (): NormalizedFactSet => ({
  marketing: [],
  customer: [],
  commerce: [],
  engagement: [],
  service: [],
})

export function createSyntheticDataSourceAdapter(
  id: DataSourceId,
  label: string,
  domains: readonly NormalizedFactDomain[],
): DataSourceAdapter<SyntheticSourceRecord> {
  return {
    id,
    label,
    integrationStatus: 'schema-ready',
    activeDataMode: 'synthetic',
    domains,
    normalize(records) {
      const facts = emptyFacts()

      records.forEach((record) => {
        const base = { source: id, occurredAt: record.occurredAt, externalId: record.id }

        if (domains.includes('marketing')) {
          facts.marketing.push({
            ...base,
            domain: 'marketing',
            channel: record.channel ?? label,
            campaign: record.campaign,
            impressions: record.impressions ?? 0,
            clicks: record.clicks ?? 0,
            spend: record.spend ?? 0,
            conversions: record.conversions ?? 0,
            revenue: record.revenue ?? 0,
          })
        }

        if (domains.includes('customer') && record.customerId) {
          facts.customer.push({
            ...base,
            domain: 'customer',
            customerId: record.customerId,
            segment: record.segment,
            lifecycle: record.lifecycle,
          })
        }

        if (domains.includes('commerce') && record.orderId) {
          facts.commerce.push({
            ...base,
            domain: 'commerce',
            customerId: record.customerId,
            orderId: record.orderId,
            grossValue: record.grossValue ?? 0,
            netValue: record.netValue ?? 0,
            itemCount: record.itemCount ?? 0,
          })
        }

        if (domains.includes('engagement')) {
          facts.engagement.push({
            ...base,
            domain: 'engagement',
            customerId: record.customerId,
            interactionType: record.interactionType ?? 'unknown',
            channel: record.channel ?? label,
            value: record.value ?? 1,
          })
        }

        if (domains.includes('service') && record.caseType) {
          facts.service.push({
            ...base,
            domain: 'service',
            customerId: record.customerId,
            caseType: record.caseType,
            status: record.status ?? 'unknown',
            satisfaction: record.satisfaction,
          })
        }
      })

      return facts
    },
  }
}
