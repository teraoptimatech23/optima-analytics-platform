import { GA, M, META, quarterLabel, quarterOf } from '@/data/cube'
import type { AppliedFilters, InsightCube } from '@/data/types'

export type CampaignMetricKey = 'spend' | 'impressions' | 'clicks' | 'ctr' | 'conversions' | 'cpa' | 'conversionValue' | 'roas' | 'newCustomers' | 'cac'
export type CampaignGranularity = 'daily' | 'weekly' | 'monthly'
export type CampaignStatus = 'excellent' | 'strong' | 'monitor' | 'underperforming'
export type TrendStatus = 'improving' | 'stable' | 'declining' | 'volatile'

export interface CampaignPerformanceLocalFilters {
  channel: string
  objective: string
  status: string
  trendStatus: string
  metric: CampaignMetricKey
  granularity: CampaignGranularity
  rankingMetric: CampaignMetricKey | 'campaignScore'
}

export interface CampaignPerformanceSummary {
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  conversionRate: number
  cpa: number
  conversionValue: number
  roas: number
  newCustomers: number
  cac: number
}

export interface UnifiedCampaignPerformance extends CampaignPerformanceSummary {
  campaignId: string
  campaignName: string
  channel: string
  objective: string
  campaignScore: number
  status: CampaignStatus
  trendStatus: TrendStatus
}

export interface ChannelPerformance extends CampaignPerformanceSummary {
  id: string
  label: string
  spendShare: number
  conversionShare: number
  returnShare: number
  efficiencyGap: number
}

export interface CampaignTrendRow extends CampaignPerformanceSummary {
  period: string
  channel: string
}

export interface ObjectivePerformanceRow {
  objective: string
  spend: number
  primaryMetric: string
  primaryValue: number
  secondaryMetrics: Record<string, number>
  performanceScore: number
}

export interface FunnelStep {
  channel: string
  stage: string
  value: number
  rateFromPrevious?: number
}

export interface CampaignRecommendation {
  campaignId?: string
  channel?: string
  issue: string
  evidence: string
  action: string
  priority: 'high' | 'medium' | 'low'
  impact: string
}

export interface CampaignPerformanceInsights {
  periodLabel: string
  filterLabel: string
  summary: CampaignPerformanceSummary
  previousSummary: CampaignPerformanceSummary
  deltas: Partial<Record<keyof CampaignPerformanceSummary, number>>
  channels: ChannelPerformance[]
  campaigns: UnifiedCampaignPerformance[]
  trends: CampaignTrendRow[]
  objectives: ObjectivePerformanceRow[]
  funnel: FunnelStep[]
  winners: UnifiedCampaignPerformance[]
  needsAttention: UnifiedCampaignPerformance[]
  insights: string[]
  recommendations: CampaignRecommendation[]
  availableChannels: string[]
  availableObjectives: string[]
  attributionNote: string
}

interface Bucket {
  spend: number
  impressions: number
  clicks: number
  conversions: number
  conversionValue: number
  newCustomers: number
}

interface UnifiedRow {
  month: number
  monthKey: string
  campaign: number
  campaignId: string
  campaignName: string
  channel: string
  objective: string
  metrics: Bucket
}

const emptyBucket = (): Bucket => ({ spend: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0, newCustomers: 0 })
export const safeDivide = (value: number, total: number) => (total ? value / total : 0)
export const blendedCtr = (clicks: number, impressions: number) => safeDivide(clicks, impressions)
export const blendedCpc = (spend: number, clicks: number) => safeDivide(spend, clicks)
export const blendedCpa = (spend: number, conversions: number) => safeDivide(spend, conversions)
export const blendedRoas = (value: number, spend: number) => safeDivide(value, spend)
export const blendedCac = (spend: number, newCustomers: number) => safeDivide(spend, newCustomers)
export const efficiencyGap = (returnShare: number, spendShare: number) => returnShare - spendShare

function add(bucket: Bucket, patch: Bucket) {
  bucket.spend += patch.spend
  bucket.impressions += patch.impressions
  bucket.clicks += patch.clicks
  bucket.conversions += patch.conversions
  bucket.conversionValue += patch.conversionValue
  bucket.newCustomers += patch.newCustomers
}

function summarize(bucket: Bucket): CampaignPerformanceSummary {
  return {
    ...bucket,
    ctr: blendedCtr(bucket.clicks, bucket.impressions),
    cpc: blendedCpc(bucket.spend, bucket.clicks),
    conversionRate: safeDivide(bucket.conversions, bucket.clicks),
    cpa: blendedCpa(bucket.spend, bucket.conversions),
    roas: blendedRoas(bucket.conversionValue, bucket.spend),
    cac: blendedCac(bucket.spend, bucket.newCustomers),
  }
}

const delta = (current: number, previous: number) => (previous ? (current - previous) / previous : current ? 1 : 0)

function normalize(value: number, values: number[], inverse = false) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const score = max === min ? 0.5 : (value - min) / (max - min)
  return inverse ? 1 - score : score
}

function previousMonths(cube: InsightCube, activeMonths: Set<number>) {
  const sorted = [...activeMonths].sort((a, b) => a - b)
  if (!sorted.length) return new Set<number>()
  const length = sorted.length
  const start = sorted[0] ?? 0
  return new Set(Array.from({ length }, (_, index) => start - length + index).filter((index) => index >= 0 && index < cube.dims.months.length))
}

function normalizeRegion(region: string) {
  const map: Record<string, string> = {
    Jabodetabek: 'DKI Jakarta',
    'Jawa Barat': 'Jawa Barat',
    'Jawa Tengah & DIY': 'Jawa Tengah & DIY',
    'Jawa Timur': 'Jawa Timur',
    Sumatera: 'Sumatera Utara',
    'Bali & Nusa Tenggara': 'Bali',
    Sulawesi: 'Sulawesi Selatan',
    Kalimantan: 'Kalimantan Timur',
  }
  return map[region] ?? region
}

function locationScope(cube: InsightCube, filters: AppliedFilters) {
  if (filters.outlet) {
    const outlet = cube.dims.outlets.find((row) => row.id === filters.outlet)
    return outlet ? new Set([normalizeRegion(outlet.region)]) : new Set<string>()
  }
  if (filters.city) return new Set(cube.dims.outlets.filter((row) => row.city === filters.city).map((row) => normalizeRegion(row.region)))
  if (filters.region) return new Set([normalizeRegion(filters.region)])
  return null
}

function ageMatches(adAge: string, ageBand: string | null) {
  if (!ageBand) return true
  if (ageBand === '25-35') return adAge === '25-34' || adAge === '35-44'
  if (ageBand === '36-45') return adAge === '35-44' || adAge === '45-54'
  if (ageBand === '46+') return adAge === '45-54' || adAge === '55+'
  return adAge === ageBand
}

function compactPeriod(month: string, granularity: CampaignGranularity) {
  if (granularity === 'monthly') return month
  if (granularity === 'weekly') return `${month.slice(0, 4)} W${Math.ceil(Number(month.slice(5, 7)) * 4.33)}`
  return month
}

function acquiredCustomersByChannel(cube: InsightCube, filters: AppliedFilters, months: Set<number>) {
  const locations = locationScope(cube, filters)
  const map = new Map<string, number>()
  const acquisitionLabels = cube.dims.acquisitions
  cube.customers.forEach((row) => {
    const outlet = cube.dims.outlets[row[0]!]
    if (!outlet) return
    if (locations && !locations.has(normalizeRegion(outlet.region))) return
    if (filters.gender && cube.dims.genders[row[1]!] !== filters.gender) return
    if (filters.ageBand && cube.dims.ageBands[row[2]!] !== filters.ageBand) return
    const source = acquisitionLabels[row[13]!] ?? 'Organic'
    if (!['Google Ads', 'Meta Ads', 'YouTube Ads'].includes(source)) return
    // Customer rows only have source, not acquisition month; distribute over selected months by source.
    map.set(source, (map.get(source) ?? 0) + safeDivide(1, Math.max(1, months.size)))
  })
  return map
}

function normalizeRows(cube: InsightCube, filters: AppliedFilters, local: CampaignPerformanceLocalFilters, months: Set<number>): UnifiedRow[] {
  const locations = locationScope(cube, filters)
  const customers = acquiredCustomersByChannel(cube, filters, months)
  const rows: UnifiedRow[] = []
  const pushRow = (row: UnifiedRow) => {
    if (local.channel !== 'all' && row.channel !== local.channel) return
    if (local.objective !== 'all' && row.objective !== local.objective) return
    rows.push(row)
  }

  cube.googleAds.forEach((row) => {
    if (!months.has(row[GA.month]!)) return
    const campaign = cube.dims.campaigns[row[GA.campaign]!]
    if (!campaign || campaign.platform !== 'Google Ads') return
    const location = cube.dims.googleLocations[row[GA.location]!] ?? ''
    if (locations && !locations.has(location)) return
    if (filters.gender && cube.dims.googleGenders[row[GA.gender]!] !== filters.gender) return
    if (!ageMatches(cube.dims.googleAgeRanges[row[GA.ageRange]!] ?? '', filters.ageBand)) return
    pushRow({
      month: row[GA.month]!,
      monthKey: cube.dims.months[row[GA.month]!] ?? '',
      campaign: row[GA.campaign]!,
      campaignId: campaign.id,
      campaignName: campaign.name,
      channel: 'Google Ads',
      objective: campaign.objective,
      metrics: { spend: row[GA.spend] ?? 0, impressions: row[GA.impressions] ?? 0, clicks: row[GA.clicks] ?? 0, conversions: row[GA.conversions] ?? 0, conversionValue: row[GA.value] ?? 0, newCustomers: 0 },
    })
  })

  cube.metaAds.forEach((row) => {
    if (!months.has(row[META.month]!)) return
    const campaign = cube.dims.campaigns[row[META.campaign]!]
    if (!campaign || campaign.platform !== 'Meta Ads') return
    const location = cube.dims.metaLocations[row[META.location]!] ?? ''
    if (locations && !locations.has(location)) return
    if (filters.gender && cube.dims.metaGenders[row[META.gender]!] !== filters.gender) return
    if (!ageMatches(cube.dims.metaAgeRanges[row[META.ageRange]!] ?? '', filters.ageBand)) return
    pushRow({
      month: row[META.month]!,
      monthKey: cube.dims.months[row[META.month]!] ?? '',
      campaign: row[META.campaign]!,
      campaignId: campaign.id,
      campaignName: campaign.name,
      channel: 'Meta Ads',
      objective: campaign.objective,
      metrics: { spend: row[META.spend] ?? 0, impressions: row[META.impressions] ?? 0, clicks: row[META.clicks] ?? 0, conversions: row[META.conversions] ?? 0, conversionValue: 0, newCustomers: 0 },
    })
  })

  cube.media.forEach((row) => {
    if (!months.has(row[M.month]!)) return
    const campaign = cube.dims.campaigns[row[M.campaign]!]
    if (!campaign || campaign.platform !== 'YouTube Ads') return
    // YouTube aggregate has no geo or demographic keys, so those filters cannot be applied safely.
    if (locations || filters.gender || filters.ageBand) return
    pushRow({
      month: row[M.month]!,
      monthKey: cube.dims.months[row[M.month]!] ?? '',
      campaign: row[M.campaign]!,
      campaignId: campaign.id,
      campaignName: campaign.name,
      channel: 'YouTube Ads',
      objective: campaign.objective,
      metrics: { spend: row[M.spend] ?? 0, impressions: row[M.impressions] ?? 0, clicks: row[M.clicks] ?? 0, conversions: row[M.conversions] ?? 0, conversionValue: 0, newCustomers: 0 },
    })
  })

  const channelBuckets = aggregateRows(rows, (row) => row.channel)
  channelBuckets.forEach((bucket, channel) => {
    const acquired = customers.get(channel) ?? 0
    if (!bucket.conversions) return
    rows.filter((row) => row.channel === channel).forEach((row) => {
      row.metrics.newCustomers = acquired * safeDivide(row.metrics.conversions, bucket.conversions)
    })
  })

  return rows
}

function aggregateRows<T>(rows: UnifiedRow[], keyer: (row: UnifiedRow) => T) {
  const map = new Map<T, Bucket>()
  rows.forEach((row) => {
    const key = keyer(row)
    const bucket = map.get(key) ?? emptyBucket()
    add(bucket, row.metrics)
    map.set(key, bucket)
  })
  return map
}

interface ScoreNorms {
  impressions: number[]
  cpc: number[]
  ctr: number[]
  conversions: number[]
  roas: number[]
  conversionRate: number[]
  cpa: number[]
  newCustomers: number[]
}

function scoreCampaign(row: CampaignPerformanceSummary, objective: string, norms: ScoreNorms) {
  const awareness = ['Awareness', 'Video Reach', 'Video Views'].includes(objective)
  if (awareness) {
    return 100 * (
      0.35 * normalize(row.impressions, norms.impressions) +
      0.25 * normalize(row.cpc, norms.cpc, true) +
      0.2 * normalize(row.ctr, norms.ctr) +
      0.2 * normalize(row.conversions, norms.conversions)
    )
  }
  return 100 * (
    0.3 * normalize(row.roas, norms.roas) +
    0.2 * normalize(row.conversionRate, norms.conversionRate) +
    0.2 * normalize(row.cpa, norms.cpa, true) +
    0.15 * normalize(row.newCustomers, norms.newCustomers) +
    0.15 * normalize(row.conversions, norms.conversions)
  )
}

function statusFor(score: number): CampaignStatus {
  if (score >= 78) return 'excellent'
  if (score >= 58) return 'strong'
  if (score >= 38) return 'monitor'
  return 'underperforming'
}

function trendFor(current: CampaignPerformanceSummary, previous: CampaignPerformanceSummary): TrendStatus {
  const roasDelta = delta(current.roas, previous.roas)
  const cpaDelta = delta(current.cpa, previous.cpa)
  const convDelta = delta(current.conversions, previous.conversions)
  const volatility = Math.max(Math.abs(roasDelta), Math.abs(cpaDelta), Math.abs(convDelta))
  if (volatility > 0.75) return 'volatile'
  if (roasDelta > 0.08 && cpaDelta < -0.05 && convDelta > 0.05) return 'improving'
  if (roasDelta < -0.08 && cpaDelta > 0.05 && convDelta < -0.05) return 'declining'
  return 'stable'
}

function buildInsights(data: { channels: ChannelPerformance[]; campaigns: UnifiedCampaignPerformance[]; summary: CampaignPerformanceSummary }) {
  const insights: string[] = []
  const bestRoas = [...data.channels].sort((a, b) => b.roas - a.roas)[0]
  const biggestVolume = [...data.channels].sort((a, b) => b.conversions - a.conversions)[0]
  const topCampaign = data.campaigns[0]
  const spendHeavy = data.campaigns.find((row) => row.spend > data.summary.spend * 0.12 && row.roas < data.summary.roas)
  const gap = [...data.channels].sort((a, b) => a.efficiencyGap - b.efficiencyGap)[0]
  if (bestRoas) insights.push(`${bestRoas.label} memiliki blended ROAS tertinggi sebesar ${bestRoas.roas.toFixed(2).replace('.', ',')}x berdasarkan conversion value yang tersedia.`)
  if (biggestVolume) insights.push(`${biggestVolume.label} menyumbang volume conversion terbesar dengan ${Math.round(biggestVolume.conversions).toLocaleString('id-ID')} conversions.`)
  if (topCampaign) insights.push(`${topCampaign.campaignName} menjadi campaign score tertinggi lintas channel.`)
  if (spendHeavy) insights.push(`${spendHeavy.campaignName} memakai spend besar tetapi ROAS masih di bawah blended average.`)
  if (gap) insights.push(`${gap.label} memiliki efficiency gap ${(gap.efficiencyGap * 100).toFixed(1).replace('.', ',')} poin antara spend share dan return share.`)
  return insights.slice(0, 7)
}

function buildRecommendations(channels: ChannelPerformance[], campaigns: UnifiedCampaignPerformance[]): CampaignRecommendation[] {
  const out: CampaignRecommendation[] = []
  channels.filter((row) => row.efficiencyGap < -0.08).forEach((channel) => out.push({
    channel: channel.label,
    issue: 'Spend share lebih tinggi dari return share',
    evidence: `${channel.label}: spend share ${(channel.spendShare * 100).toFixed(1).replace('.', ',')}%, return share ${(channel.returnShare * 100).toFixed(1).replace('.', ',')}%.`,
    action: 'Audit alokasi channel dan evaluasi campaign paling lemah secara bertahap.',
    priority: 'high',
    impact: 'Memperbaiki keseimbangan budget terhadap hasil.',
  }))
  campaigns.filter((row) => row.status === 'excellent').slice(0, 2).forEach((campaign) => out.push({
    campaignId: campaign.campaignId,
    channel: campaign.channel,
    issue: 'Campaign siap di-scale',
    evidence: `Score ${Math.round(campaign.campaignScore)} dengan CPA Rp${Math.round(campaign.cpa).toLocaleString('id-ID')}.`,
    action: 'Scale budget bertahap dan pertahankan targeting, keyword, atau creative terbaik.',
    priority: 'medium',
    impact: 'Menaikkan volume dengan kontrol efisiensi.',
  }))
  campaigns.filter((row) => row.status === 'underperforming').slice(0, 2).forEach((campaign) => out.push({
    campaignId: campaign.campaignId,
    channel: campaign.channel,
    issue: 'Campaign perlu optimasi',
    evidence: `Score ${Math.round(campaign.campaignScore)} dan trend ${campaign.trendStatus}.`,
    action: 'Review creative, bid, objective fit, dan landing page; pause campaign terburuk bila tidak membaik.',
    priority: 'high',
    impact: 'Menekan CPA dan mengurangi spend tidak produktif.',
  }))
  return out.slice(0, 6)
}

export function queryCampaignPerformance(cube: InsightCube, filters: AppliedFilters, local: CampaignPerformanceLocalFilters): CampaignPerformanceInsights {
  const activeMonths = new Set<number>()
  cube.dims.months.forEach((month, index) => {
    if (filters.quarter && quarterOf(month) !== filters.quarter) return
    activeMonths.add(index)
  })
  const previousSet = previousMonths(cube, activeMonths)
  const rows = normalizeRows(cube, filters, local, activeMonths)
  const previousRows = normalizeRows(cube, filters, local, previousSet)
  const summary = summarize(rows.reduce((bucket, row) => { add(bucket, row.metrics); return bucket }, emptyBucket()))
  const previousSummary = summarize(previousRows.reduce((bucket, row) => { add(bucket, row.metrics); return bucket }, emptyBucket()))
  const previousCampaigns = new Map([...aggregateRows(previousRows, (row) => row.campaignId).entries()].map(([id, bucket]) => [id, summarize(bucket)]))

  const campaignBase = [...aggregateRows(rows, (row) => row.campaignId).entries()].map(([id, bucket]) => {
    const source = rows.find((row) => row.campaignId === id)!
    return { ...summarize(bucket), campaignId: source.campaignId, campaignName: source.campaignName, channel: source.channel, objective: source.objective }
  })
  const norms = {
    impressions: campaignBase.map((row) => row.impressions),
    cpc: campaignBase.map((row) => row.cpc),
    ctr: campaignBase.map((row) => row.ctr),
    conversions: campaignBase.map((row) => row.conversions),
    roas: campaignBase.map((row) => row.roas),
    conversionRate: campaignBase.map((row) => row.conversionRate),
    cpa: campaignBase.map((row) => row.cpa),
    newCustomers: campaignBase.map((row) => row.newCustomers),
  }
  let campaigns = campaignBase.map((row) => {
    const campaignScore = scoreCampaign(row, row.objective, norms)
    return { ...row, campaignScore, status: statusFor(campaignScore), trendStatus: trendFor(row, previousCampaigns.get(row.campaignId) ?? summarize(emptyBucket())) }
  })
  campaigns = campaigns
    .filter((row) => local.status === 'all' || row.status === local.status)
    .filter((row) => local.trendStatus === 'all' || row.trendStatus === local.trendStatus)
    .sort((a, b) => b[local.rankingMetric] - a[local.rankingMetric])

  const total = summarize(rows.reduce((bucket, row) => { add(bucket, row.metrics); return bucket }, emptyBucket()))
  const channels = [...aggregateRows(rows, (row) => row.channel).entries()].map(([channel, bucket]) => {
    const base = summarize(bucket)
    const spendShare = safeDivide(base.spend, total.spend)
    const conversionShare = safeDivide(base.conversions, total.conversions)
    const returnShare = safeDivide(base.conversionValue, total.conversionValue)
    return { ...base, id: channel, label: channel, spendShare, conversionShare, returnShare, efficiencyGap: efficiencyGap(returnShare, spendShare) }
  }).sort((a, b) => b.spend - a.spend)

  const trends = [...aggregateRows(rows, (row) => `${compactPeriod(row.monthKey, local.granularity)}|${row.channel}`).entries()].map(([key, bucket]) => {
    const [period = '', channel = ''] = key.split('|')
    return { period, channel, ...summarize(bucket) }
  }).sort((a, b) => `${a.period}-${a.channel}`.localeCompare(`${b.period}-${b.channel}`))

  const objectives = [...aggregateRows(rows, (row) => row.objective).entries()].map(([objective, bucket]) => {
    const base = summarize(bucket)
    const awareness = ['Awareness', 'Video Reach', 'Video Views'].includes(objective)
    const secondaryMetrics: Record<string, number> = awareness
      ? { cpm: safeDivide(base.spend * 1000, base.impressions), ctr: base.ctr }
      : { cpa: base.cpa, roas: base.roas }
    return {
      objective,
      spend: base.spend,
      primaryMetric: awareness ? 'Impressions' : 'Conversions',
      primaryValue: awareness ? base.impressions : base.conversions,
      secondaryMetrics,
      performanceScore: scoreCampaign(base, objective, norms),
    }
  }).sort((a, b) => b.performanceScore - a.performanceScore)

  const funnel = channels.flatMap((channel) => [
    { channel: channel.label, stage: 'Impressions', value: channel.impressions },
    { channel: channel.label, stage: 'Clicks', value: channel.clicks, rateFromPrevious: channel.ctr },
    { channel: channel.label, stage: 'Conversions', value: channel.conversions, rateFromPrevious: channel.conversionRate },
    { channel: channel.label, stage: 'Conversion Value', value: channel.conversionValue, rateFromPrevious: channel.roas },
  ])

  return {
    periodLabel: filters.quarter ? quarterLabel(filters.quarter) : 'Semua Periode',
    filterLabel: [filters.region ?? 'Semua Wilayah', filters.city, filters.outlet, filters.gender, filters.ageBand ? `${filters.ageBand} tahun` : null].filter(Boolean).join(' · '),
    summary,
    previousSummary,
    deltas: {
      spend: delta(summary.spend, previousSummary.spend),
      impressions: delta(summary.impressions, previousSummary.impressions),
      clicks: delta(summary.clicks, previousSummary.clicks),
      ctr: delta(summary.ctr, previousSummary.ctr),
      conversions: delta(summary.conversions, previousSummary.conversions),
      cpa: delta(summary.cpa, previousSummary.cpa),
      conversionValue: delta(summary.conversionValue, previousSummary.conversionValue),
      roas: delta(summary.roas, previousSummary.roas),
      newCustomers: delta(summary.newCustomers, previousSummary.newCustomers),
      cac: delta(summary.cac, previousSummary.cac),
    },
    channels,
    campaigns,
    trends,
    objectives,
    funnel,
    winners: campaigns.slice(0, 4),
    needsAttention: [...campaigns].sort((a, b) => a.campaignScore - b.campaignScore).slice(0, 4),
    insights: buildInsights({ channels, campaigns, summary }),
    recommendations: buildRecommendations(channels, campaigns),
    availableChannels: ['Google Ads', 'Meta Ads', 'YouTube Ads'],
    availableObjectives: [...new Set(cube.dims.campaigns.map((row) => row.objective))],
    attributionNote: 'Conversions adalah platform-reported synthetic conversions. Dataset belum menyediakan deduplicated cross-platform conversions; conversion value tersedia dari Google Ads aggregate, sementara Meta Ads dan YouTube Ads tidak memiliki conversion value granular.',
  }
}
