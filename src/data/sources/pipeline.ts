import { dataSourceAdapters } from './index'
import { syntheticSourceFixtures } from './fixtures'
import type { CanonicalDataSet, CanonicalFacts, DataSourceId, LoopAggregate, ValidationIssue } from './types'

const factNames: Array<keyof CanonicalFacts> = [
  'fact_traffic', 'fact_campaign_performance', 'fact_customer_touchpoint', 'fact_engagement',
  'fact_order', 'fact_order_item', 'fact_retention', 'fact_customer_value', 'fact_cost', 'fact_profit',
]

export interface SyntheticPipelineResult {
  canonical: CanonicalDataSet
  loopAggregates: LoopAggregate[]
  validationIssues: ValidationIssue[]
}

export function runSyntheticValueLoopPipeline(sources: readonly DataSourceId[] = Object.keys(dataSourceAdapters) as DataSourceId[]): SyntheticPipelineResult {
  const datasets = sources.map((source) => dataSourceAdapters[source].normalize(syntheticSourceFixtures[source]))
  const validations = sources.map((source) => dataSourceAdapters[source].validate(syntheticSourceFixtures[source]))
  const canonical: CanonicalDataSet = {
    dimensions: {
      dim_customer: datasets.flatMap((dataset) => dataset.dimensions.dim_customer),
      dim_product: datasets.flatMap((dataset) => dataset.dimensions.dim_product),
      dim_channel: datasets.flatMap((dataset) => dataset.dimensions.dim_channel),
      dim_campaign: datasets.flatMap((dataset) => dataset.dimensions.dim_campaign),
      dim_store: datasets.flatMap((dataset) => dataset.dimensions.dim_store),
      dim_region: datasets.flatMap((dataset) => dataset.dimensions.dim_region),
      dim_date: datasets.flatMap((dataset) => dataset.dimensions.dim_date),
      dim_source: datasets.flatMap((dataset) => dataset.dimensions.dim_source),
    },
    facts: {
      fact_traffic: datasets.flatMap((dataset) => dataset.facts.fact_traffic),
      fact_campaign_performance: datasets.flatMap((dataset) => dataset.facts.fact_campaign_performance),
      fact_customer_touchpoint: datasets.flatMap((dataset) => dataset.facts.fact_customer_touchpoint),
      fact_engagement: datasets.flatMap((dataset) => dataset.facts.fact_engagement),
      fact_order: datasets.flatMap((dataset) => dataset.facts.fact_order),
      fact_order_item: datasets.flatMap((dataset) => dataset.facts.fact_order_item),
      fact_retention: datasets.flatMap((dataset) => dataset.facts.fact_retention),
      fact_customer_value: datasets.flatMap((dataset) => dataset.facts.fact_customer_value),
      fact_cost: datasets.flatMap((dataset) => dataset.facts.fact_cost),
      fact_profit: datasets.flatMap((dataset) => dataset.facts.fact_profit),
    } satisfies CanonicalFacts,
  }
  const rejectedRecords = validations.reduce((sum, result) => sum + result.rejectedRecordIds.length, 0)
  const traffic = canonical.facts.fact_traffic
  const orders = canonical.facts.fact_order
  const engagement = canonical.facts.fact_engagement
  const retention = canonical.facts.fact_retention
  const profits = canonical.facts.fact_profit
  const metrics = {
    customer: canonical.dimensions.dim_customer.length,
    impressions: traffic.reduce((sum, row) => sum + (row.impressions ?? 0), 0),
    conversions: traffic.reduce((sum, row) => sum + (row.conversions ?? 0), 0),
    orders: orders.length,
    engagement: engagement.length,
    retained: retention.filter((row) => row.repeatPurchase).length,
    revenue: profits.reduce((sum, row) => sum + row.revenue, 0),
    contribution: profits.reduce((sum, row) => sum + (row.netContribution ?? 0), 0),
  }
  const loopAggregates: LoopAggregate[] = [
    { loop: 'customer-behavior', sourceRecordCount: canonical.dimensions.dim_customer.length, metrics: { identifiedCustomers: metrics.customer }, rejectedRecords },
    { loop: 'traffic-acquisition', sourceRecordCount: traffic.length, metrics: { impressions: metrics.impressions, conversions: metrics.conversions }, rejectedRecords },
    { loop: 'conversion', sourceRecordCount: orders.length + traffic.length, metrics: { orders: metrics.orders, attributedConversions: metrics.conversions }, rejectedRecords },
    { loop: 'engagement', sourceRecordCount: engagement.length, metrics: { interactions: metrics.engagement }, rejectedRecords },
    { loop: 'retention', sourceRecordCount: retention.length, metrics: { repeatCustomers: metrics.retained }, rejectedRecords },
    { loop: 'analytics', sourceRecordCount: factNames.reduce((sum, name) => sum + canonical.facts[name].length, 0), metrics: { validationIssues: validations.flatMap((result) => result.issues).length }, rejectedRecords },
    { loop: 'profit-optimization', sourceRecordCount: profits.length, metrics: { revenue: metrics.revenue, netContribution: metrics.contribution }, rejectedRecords },
  ]
  return { canonical, loopAggregates, validationIssues: validations.flatMap((result) => result.issues) }
}

export { validateSyntheticRecords } from './validation'
