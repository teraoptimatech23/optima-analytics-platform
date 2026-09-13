import { CANONICAL_CURRENCY, CANONICAL_TIMEZONE } from './types'
import type { CanonicalDataSet, DataSourceAdapter, DataSourceId, IdentityStatus, SyntheticSourceRecord } from './types'
import { validateSyntheticRecords } from './validation'

function emptyCanonicalDataSet(): CanonicalDataSet {
  return {
    dimensions: {
      dim_customer: [], dim_product: [], dim_channel: [], dim_campaign: [],
      dim_store: [], dim_region: [], dim_date: [], dim_source: [],
    },
    facts: {
      fact_traffic: [], fact_campaign_performance: [], fact_customer_touchpoint: [],
      fact_engagement: [], fact_order: [], fact_order_item: [], fact_retention: [],
      fact_customer_value: [], fact_cost: [], fact_profit: [],
    },
  }
}

const safeRatio = (numerator: number | undefined, denominator: number | undefined, multiplier = 1) =>
  numerator != null && denominator != null && denominator > 0 ? (numerator / denominator) * multiplier : null

export function createSyntheticDataSourceAdapter(source: DataSourceId, sourceName: string): DataSourceAdapter<SyntheticSourceRecord> {
  return {
    source,
    sourceName,
    connectionStatus: 'Synthetic',
    validate: (records) => validateSyntheticRecords(source, records),
    normalize(records) {
      const validation = validateSyntheticRecords(source, records)
      const accepted = records.filter((record) => validation.acceptedRecordIds.includes(record.id))
      const output = emptyCanonicalDataSet()
      const dimensionKeys = {
        customer: new Set<string>(), channel: new Set<string>(), campaign: new Set<string>(),
        store: new Set<string>(), product: new Set<string>(), date: new Set<string>(),
      }

      accepted.forEach((record) => {
        if (!record.occurredAt) return
        const date = record.occurredAt.slice(0, 10)
        const base = { recordId: record.id, source, date, timezone: CANONICAL_TIMEZONE, currency: CANONICAL_CURRENCY }
        const channel = record.channel ?? sourceName
        const identityStatus: IdentityStatus = record.canonicalCustomerId ? 'identified' : record.customerId ? 'unresolved' : 'anonymous'
        const canonicalCustomerId = record.canonicalCustomerId ?? null

        if (!dimensionKeys.date.has(date)) {
          output.dimensions.dim_date.push({ dateId: date, date, timezone: CANONICAL_TIMEZONE })
          dimensionKeys.date.add(date)
        }
        if (!dimensionKeys.channel.has(channel)) {
          output.dimensions.dim_channel.push({ channelId: `${source}:${channel}`, channelName: channel, source })
          dimensionKeys.channel.add(channel)
        }
        if (canonicalCustomerId && record.customerId && !dimensionKeys.customer.has(canonicalCustomerId)) {
          output.dimensions.dim_customer.push({ canonicalCustomerId, sourceCustomerId: record.customerId, source, identityStatus })
          dimensionKeys.customer.add(canonicalCustomerId)
        }
        if (record.campaignId && !dimensionKeys.campaign.has(record.campaignId)) {
          output.dimensions.dim_campaign.push({ campaignId: record.campaignId, campaignName: record.campaignName ?? null, source })
          dimensionKeys.campaign.add(record.campaignId)
        }
        if (record.storeId && !dimensionKeys.store.has(record.storeId)) {
          output.dimensions.dim_store.push({ storeId: record.storeId, storeName: null, regionId: null })
          dimensionKeys.store.add(record.storeId)
        }
        if (record.productId && !dimensionKeys.product.has(record.productId)) {
          output.dimensions.dim_product.push({ productId: record.productId, productName: null, category: null })
          dimensionKeys.product.add(record.productId)
        }

        const hasTraffic = [record.impressions, record.reach, record.clicks, record.spend, record.conversions].some((value) => value != null)
        if (hasTraffic) {
          output.facts.fact_traffic.push({
            ...base, channel, campaignId: record.campaignId ?? null, campaignName: record.campaignName ?? null,
            impressions: record.impressions ?? null, reach: record.reach ?? null, clicks: record.clicks ?? null,
            traffic: record.clicks ?? null, spend: record.spend ?? null,
            ctr: safeRatio(record.clicks, record.impressions, 100), cpc: safeRatio(record.spend, record.clicks),
            cpm: safeRatio(record.spend, record.impressions, 1000), conversions: record.conversions ?? null,
            conversionValue: record.revenue ?? null,
          })
          output.facts.fact_campaign_performance.push({
            ...base, campaignId: record.campaignId ?? null, channel, spend: record.spend ?? null,
            conversions: record.conversions ?? null, revenue: record.revenue ?? null, roas: safeRatio(record.revenue, record.spend),
          })
        }

        if (record.eventType) {
          output.facts.fact_customer_touchpoint.push({ ...base, canonicalCustomerId, identityStatus, channel, eventType: record.eventType, campaignId: record.campaignId ?? null })
          output.facts.fact_engagement.push({
            ...base, canonicalCustomerId, identityStatus, channel, eventType: record.eventType,
            eventTimestamp: record.occurredAt, campaignId: record.campaignId ?? null, contentId: null,
            interactionValue: record.interactionValue ?? null,
          })
        }

        if (record.orderId) {
          const grossRevenue = record.grossRevenue ?? record.revenue ?? 0
          const discount = record.discount ?? 0
          const netRevenue = record.netRevenue ?? grossRevenue - discount
          const grossProfit = record.cost == null ? null : netRevenue - record.cost
          output.facts.fact_order.push({
            ...base, orderId: record.orderId, canonicalCustomerId, identityStatus, channel,
            storeId: record.storeId ?? null, grossRevenue, discount, netRevenue, cost: record.cost ?? null,
            margin: grossProfit == null || netRevenue === 0 ? null : (grossProfit / netRevenue) * 100,
            voucher: null, campaignId: record.campaignId ?? null,
          })
          if (record.productId) output.facts.fact_order_item.push({
            ...base, orderId: record.orderId, productId: record.productId, quantity: record.quantity ?? 1,
            grossRevenue, netRevenue, cost: record.cost ?? null,
          })
          output.facts.fact_profit.push({
            ...base, period: date.slice(0, 7), channel, campaignId: record.campaignId ?? null,
            storeId: record.storeId ?? null, productId: record.productId ?? null, customerSegment: null,
            revenue: netRevenue, cogs: record.cost ?? null, marketingCost: null, discountCost: discount,
            operationalCost: null, grossProfit, netContribution: grossProfit, margin: grossProfit == null || netRevenue === 0 ? null : (grossProfit / netRevenue) * 100,
            metricScope: record.cost == null ? 'gross' : 'contribution',
          })
        }

        if (record.active != null || record.repeatPurchase != null) output.facts.fact_retention.push({
          ...base, canonicalCustomerId, identityStatus, period: date.slice(0, 7), active: record.active ?? false,
          repeatPurchase: record.repeatPurchase ?? false, recency: record.recency ?? null,
          frequency: record.frequency ?? null, retentionStatus: null, churnRisk: record.churnRisk ?? null, memberStatus: null,
        })

        if (record.historicalClv != null || record.predictedClv != null) output.facts.fact_customer_value.push({
          ...base, canonicalCustomerId, identityStatus, period: date.slice(0, 7),
          historicalClv: record.historicalClv ?? null, predictedClv: record.predictedClv ?? null,
        })
      })

      output.dimensions.dim_source.push({
        sourceId: source, sourceName, connectionStatus: 'Synthetic',
        lastUpdated: accepted.map((record) => record.occurredAt ?? '').sort().at(-1) || null,
        dataFreshness: 'Development fixture', recordsProcessed: accepted.length,
        recordsRejected: validation.rejectedRecordIds.length, validationStatus: validation.status,
      })
      return output
    },
  }
}
