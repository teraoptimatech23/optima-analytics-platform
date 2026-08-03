import { META, quarterLabel, quarterOf } from '@/data/cube'
import type { AppliedFilters, InsightCube } from '@/data/types'

export type MetaMetricKey = 'spend' | 'reach' | 'impressions' | 'frequency' | 'linkClicks' | 'linkCtr' | 'engagement' | 'engagementRate' | 'conversions' | 'cpa' | 'videoViews'
export type MetaGranularity = 'daily' | 'weekly' | 'monthly'
export type MetaStatus = 'scale' | 'efficient' | 'monitor' | 'underperforming'
export type FatigueStatus = 'healthy' | 'watch' | 'fatigue-risk' | 'critical-fatigue'

export interface MetaAdsLocalFilters {
  objective: string
  campaignId: string
  audienceDimension: 'age' | 'gender' | 'location'
  metric: MetaMetricKey
  granularity: MetaGranularity
}

export interface MetaAdsSummary {
  spend: number
  reach: number
  impressions: number
  frequency: number
  linkClicks: number
  linkCtr: number
  cpc: number
  cpm: number
  engagement: number
  engagementRate: number
  costPerEngagement: number
  videoViews: number
  videoViewRate: number
  conversions: number
  conversionRate: number
  cpa: number
  cac: number
}

export interface MetaAdsCampaignPerformance extends MetaAdsSummary {
  campaignId: string
  campaignName: string
  objective: string
  status: MetaStatus
  fatigueScore: number
  fatigueStatus: FatigueStatus
}

export interface MetaAdsBreakdownRow extends MetaAdsSummary {
  id: string
  label: string
}

export interface MetaAdsTrendRow extends MetaAdsSummary {
  period: string
}

export interface MetaAdsFunnelStep {
  stage: string
  value: number
  rateFromPrevious?: number
}

export interface MetaAdsRecommendation {
  campaignId?: string
  issue: string
  evidence: string
  action: string
  priority: 'high' | 'medium' | 'low'
  impact: string
}

export interface MetaAdsInsights {
  periodLabel: string
  filterLabel: string
  summary: MetaAdsSummary
  previousSummary: MetaAdsSummary
  deltas: Partial<Record<keyof MetaAdsSummary, number>>
  trends: MetaAdsTrendRow[]
  campaigns: MetaAdsCampaignPerformance[]
  objectives: MetaAdsBreakdownRow[]
  ageGroups: MetaAdsBreakdownRow[]
  genders: MetaAdsBreakdownRow[]
  locations: MetaAdsBreakdownRow[]
  audienceRows: MetaAdsBreakdownRow[]
  funnel: MetaAdsFunnelStep[]
  insights: string[]
  recommendations: MetaAdsRecommendation[]
  availableObjectives: string[]
  availableCampaigns: { id: string; name: string }[]
  unavailableSections: string[]
}

interface Bucket {
  spend: number
  reach: number
  impressions: number
  linkClicks: number
  engagement: number
  videoViews: number
  conversions: number
}

interface ScopedRow {
  month: number
  monthKey: string
  campaign: number
  location: number
  ageRange: number
  gender: number
  metrics: Bucket
}

const emptyBucket = (): Bucket => ({ spend: 0, reach: 0, impressions: 0, linkClicks: 0, engagement: 0, videoViews: 0, conversions: 0 })
export const safeDivide = (value: number, total: number) => (total ? value / total : 0)
export const calculateFrequency = (impressions: number, reach: number) => safeDivide(impressions, reach)
export const calculateLinkCtr = (clicks: number, impressions: number) => safeDivide(clicks, impressions)
export const calculateCpc = (spend: number, clicks: number) => safeDivide(spend, clicks)
export const calculateCpm = (spend: number, impressions: number) => safeDivide(spend * 1000, impressions)
export const calculateEngagementRate = (engagement: number, impressions: number) => safeDivide(engagement, impressions)
export const calculateConversionRate = (conversions: number, clicks: number) => safeDivide(conversions, clicks)
export const calculateCpa = (spend: number, conversions: number) => safeDivide(spend, conversions)
export const calculateCac = (spend: number, newCustomers: number) => safeDivide(spend, newCustomers)
export const calculateVideoViewRate = (videoViews: number, impressions: number) => safeDivide(videoViews, impressions)

const add = (bucket: Bucket, patch: Bucket) => {
  bucket.spend += patch.spend
  bucket.reach += patch.reach
  bucket.impressions += patch.impressions
  bucket.linkClicks += patch.linkClicks
  bucket.engagement += patch.engagement
  bucket.videoViews += patch.videoViews
  bucket.conversions += patch.conversions
}

const summarize = (bucket: Bucket): MetaAdsSummary => ({
  ...bucket,
  frequency: calculateFrequency(bucket.impressions, bucket.reach),
  linkCtr: calculateLinkCtr(bucket.linkClicks, bucket.impressions),
  cpc: calculateCpc(bucket.spend, bucket.linkClicks),
  cpm: calculateCpm(bucket.spend, bucket.impressions),
  engagementRate: calculateEngagementRate(bucket.engagement, bucket.impressions),
  costPerEngagement: calculateCpc(bucket.spend, bucket.engagement),
  videoViewRate: calculateVideoViewRate(bucket.videoViews, bucket.impressions),
  conversionRate: calculateConversionRate(bucket.conversions, bucket.linkClicks),
  cpa: calculateCpa(bucket.spend, bucket.conversions),
  cac: calculateCac(bucket.spend, bucket.conversions),
})

function percentile(values: number[], point: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * point)))] ?? 0
}

const delta = (current: number, previous: number) => (previous ? (current - previous) / previous : current ? 1 : 0)

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
  if (filters.city) {
    return new Set(cube.dims.outlets.filter((row) => row.city === filters.city).map((row) => normalizeRegion(row.region)))
  }
  if (filters.region) return new Set([normalizeRegion(filters.region)])
  return null
}

function ageMatches(adAge: string, ageBand: string | null) {
  if (!ageBand) return true
  if (ageBand === '25-35') return adAge === '25-34' || adAge === '35-44'
  if (ageBand === '36-45') return adAge === '35-44' || adAge === '45-54'
  if (ageBand === '46+') return adAge === '45-54'
  return adAge === ageBand
}

function rowsFromCube(cube: InsightCube, filters: AppliedFilters, local: MetaAdsLocalFilters, months: Set<number>): ScopedRow[] {
  const locations = locationScope(cube, filters)
  return cube.metaAds.flatMap((row) => {
    const campaign = cube.dims.campaigns[row[META.campaign]!]
    if (!months.has(row[META.month]!)) return []
    if (!campaign || campaign.platform !== 'Meta Ads') return []
    if (local.campaignId !== 'all' && campaign.id !== local.campaignId) return []
    if (local.objective !== 'all' && campaign.objective !== local.objective) return []
    const location = cube.dims.metaLocations[row[META.location]!] ?? ''
    if (locations && !locations.has(location)) return []
    const gender = cube.dims.metaGenders[row[META.gender]!] ?? ''
    if (filters.gender && gender !== filters.gender) return []
    const ageRange = cube.dims.metaAgeRanges[row[META.ageRange]!] ?? ''
    if (!ageMatches(ageRange, filters.ageBand)) return []
    return [{
      month: row[META.month]!,
      monthKey: cube.dims.months[row[META.month]!] ?? '',
      campaign: row[META.campaign]!,
      location: row[META.location]!,
      ageRange: row[META.ageRange]!,
      gender: row[META.gender]!,
      metrics: {
        spend: row[META.spend] ?? 0,
        reach: row[META.reach] ?? 0,
        impressions: row[META.impressions] ?? 0,
        linkClicks: row[META.clicks] ?? 0,
        engagement: row[META.engagement] ?? 0,
        videoViews: row[META.videoViews] ?? 0,
        conversions: row[META.conversions] ?? 0,
      },
    }]
  })
}

function aggregateBy<T>(rows: ScopedRow[], keyer: (row: ScopedRow) => T) {
  const map = new Map<T, Bucket>()
  rows.forEach((row) => {
    const key = keyer(row)
    const bucket = map.get(key) ?? emptyBucket()
    add(bucket, row.metrics)
    map.set(key, bucket)
  })
  return map
}

function statusFor(row: MetaAdsSummary, cpaMedian: number, conversionMedian: number, engagementMedian: number): MetaStatus {
  if (row.cpa <= cpaMedian && row.conversions >= conversionMedian) return 'scale'
  if (row.cpa <= cpaMedian || row.engagementRate >= engagementMedian) return 'efficient'
  if (row.cpa > cpaMedian && row.conversions < conversionMedian) return 'underperforming'
  return 'monitor'
}

function fatigueScore(current: MetaAdsSummary, previous: MetaAdsSummary) {
  const frequencyIncrease = Math.max(0, delta(current.frequency, previous.frequency))
  const ctrDecline = Math.max(0, -delta(current.linkCtr, previous.linkCtr))
  const cpaIncrease = Math.max(0, delta(current.cpa, previous.cpa))
  return frequencyIncrease + ctrDecline + cpaIncrease
}

function fatigueStatus(score: number): FatigueStatus {
  if (score >= 0.85) return 'critical-fatigue'
  if (score >= 0.5) return 'fatigue-risk'
  if (score >= 0.22) return 'watch'
  return 'healthy'
}

function compactPeriod(month: string, granularity: MetaGranularity) {
  if (granularity === 'monthly') return month
  if (granularity === 'weekly') return `${month.slice(0, 4)} W${Math.ceil(Number(month.slice(5, 7)) * 4.33)}`
  return month
}

function buildInsights(data: {
  campaigns: MetaAdsCampaignPerformance[]
  objectives: MetaAdsBreakdownRow[]
  locations: MetaAdsBreakdownRow[]
  ageGroups: MetaAdsBreakdownRow[]
  summary: MetaAdsSummary
  deltas: Partial<Record<keyof MetaAdsSummary, number>>
}) {
  const insights: string[] = []
  const bestCpa = [...data.campaigns].sort((a, b) => a.cpa - b.cpa)[0]
  const bestEngagement = [...data.campaigns].sort((a, b) => b.engagementRate - a.engagementRate)[0]
  const fatigue = data.campaigns.find((row) => row.fatigueStatus === 'fatigue-risk' || row.fatigueStatus === 'critical-fatigue')
  const bestObjective = [...data.objectives].sort((a, b) => b.conversions - a.conversions)[0]
  const bestLocation = [...data.locations].sort((a, b) => a.cpa - b.cpa)[0]
  const bestAge = [...data.ageGroups].sort((a, b) => b.engagementRate - a.engagementRate)[0]
  if (bestCpa) insights.push(`${bestCpa.campaignName} mencatat CPA terendah sebesar Rp${Math.round(bestCpa.cpa).toLocaleString('id-ID')}.`)
  if (bestEngagement) insights.push(`${bestEngagement.campaignName} memiliki engagement rate tertinggi sebesar ${(bestEngagement.engagementRate * 100).toFixed(1).replace('.', ',')}%.`)
  if (bestObjective) insights.push(`Objective ${bestObjective.label} menyumbang conversion terbesar pada filter aktif.`)
  if (bestLocation) insights.push(`${bestLocation.label} menjadi lokasi paling efisien dari sisi CPA.`)
  if (bestAge) insights.push(`Audience ${bestAge.label} menunjukkan engagement rate paling kuat.`)
  if (fatigue) insights.push(`${fatigue.campaignName} menunjukkan indikasi creative fatigue karena kombinasi frequency, CTR, dan CPA memburuk dibanding periode sebelumnya.`)
  if (data.deltas.conversions) insights.push(`Conversions berubah ${(data.deltas.conversions * 100).toFixed(1).replace('.', ',')}% dibanding periode sebelumnya.`)
  return insights.slice(0, 6)
}

function buildRecommendations(campaigns: MetaAdsCampaignPerformance[], summary: MetaAdsSummary): MetaAdsRecommendation[] {
  const out: MetaAdsRecommendation[] = []
  campaigns.slice(0, 8).forEach((campaign) => {
    if (campaign.fatigueStatus === 'fatigue-risk' || campaign.fatigueStatus === 'critical-fatigue') {
      out.push({
        campaignId: campaign.campaignId,
        issue: 'Indikasi creative fatigue',
        evidence: `Frequency ${campaign.frequency.toFixed(2).replace('.', ',')}x dengan fatigue score ${campaign.fatigueScore.toFixed(2).replace('.', ',')}.`,
        action: 'Refresh creative, perluas audience, dan rotasi format iklan.',
        priority: 'high',
        impact: 'Menjaga CTR dan menekan kenaikan CPA.',
      })
      return
    }
    if (campaign.status === 'underperforming') {
      out.push({
        campaignId: campaign.campaignId,
        issue: 'CPA tinggi dan conversion rendah',
        evidence: `CPA Rp${Math.round(campaign.cpa).toLocaleString('id-ID')} dengan ${campaign.conversions.toLocaleString('id-ID')} conversions.`,
        action: 'Evaluasi targeting, placement source data, dan pause audience/campaign terburuk bila efisiensi tidak membaik.',
        priority: 'high',
        impact: 'Menurunkan biaya per conversion.',
      })
      return
    }
    if (campaign.linkCtr < summary.linkCtr) {
      out.push({
        campaignId: campaign.campaignId,
        issue: 'Link CTR di bawah rata-rata',
        evidence: `Link CTR ${(campaign.linkCtr * 100).toFixed(1).replace('.', ',')}% vs rata-rata ${(summary.linkCtr * 100).toFixed(1).replace('.', ',')}%.`,
        action: 'Perbaiki hook visual, CTA, dan message match untuk audience aktif.',
        priority: 'medium',
        impact: 'Menaikkan kualitas traffic dan menurunkan CPC.',
      })
    }
  })
  return out.slice(0, 6)
}

export function queryMetaAds(cube: InsightCube, filters: AppliedFilters, local: MetaAdsLocalFilters): MetaAdsInsights {
  const activeMonths = new Set<number>()
  cube.dims.months.forEach((month, index) => {
    if (filters.quarter && quarterOf(month) !== filters.quarter) return
    activeMonths.add(index)
  })
  const previousMonthSet = previousMonths(cube, activeMonths)
  const rows = rowsFromCube(cube, filters, local, activeMonths)
  const previousRows = rowsFromCube(cube, filters, local, previousMonthSet)
  const summary = summarize(rows.reduce((bucket, row) => { add(bucket, row.metrics); return bucket }, emptyBucket()))
  const previousSummary = summarize(previousRows.reduce((bucket, row) => { add(bucket, row.metrics); return bucket }, emptyBucket()))
  const deltas = {
    spend: delta(summary.spend, previousSummary.spend),
    reach: delta(summary.reach, previousSummary.reach),
    impressions: delta(summary.impressions, previousSummary.impressions),
    frequency: delta(summary.frequency, previousSummary.frequency),
    linkClicks: delta(summary.linkClicks, previousSummary.linkClicks),
    linkCtr: delta(summary.linkCtr, previousSummary.linkCtr),
    cpc: delta(summary.cpc, previousSummary.cpc),
    cpm: delta(summary.cpm, previousSummary.cpm),
    engagementRate: delta(summary.engagementRate, previousSummary.engagementRate),
    conversions: delta(summary.conversions, previousSummary.conversions),
    cpa: delta(summary.cpa, previousSummary.cpa),
  }

  const previousCampaigns = new Map([...aggregateBy(previousRows, (row) => row.campaign).entries()].map(([index, bucket]) => [index, summarize(bucket)]))
  const campaignBase = [...aggregateBy(rows, (row) => row.campaign).entries()].map(([index, bucket]) => {
    const campaign = cube.dims.campaigns[index]!
    const metrics = summarize(bucket)
    const fatigue = fatigueScore(metrics, previousCampaigns.get(index) ?? summarize(emptyBucket()))
    return { ...metrics, campaignId: campaign.id, campaignName: campaign.name, objective: campaign.objective, fatigueScore: fatigue, fatigueStatus: fatigueStatus(fatigue) }
  })
  const cpaMedian = percentile(campaignBase.map((row) => row.cpa), 0.5)
  const conversionMedian = percentile(campaignBase.map((row) => row.conversions), 0.5)
  const engagementMedian = percentile(campaignBase.map((row) => row.engagementRate), 0.5)
  const campaigns = campaignBase.map((row) => ({ ...row, status: statusFor(row, cpaMedian, conversionMedian, engagementMedian) })).sort((a, b) => b.conversions - a.conversions)

  const makeBreakdowns = <T>(map: Map<T, Bucket>, labeler: (key: T) => string) =>
    [...map.entries()].map(([key, bucket]) => ({ id: String(key), label: labeler(key), ...summarize(bucket) })).sort((a, b) => b.conversions - a.conversions)

  const objectives = makeBreakdowns(aggregateBy(rows, (row) => cube.dims.campaigns[row.campaign]?.objective ?? 'Lainnya'), (key) => String(key))
  const ageGroups = makeBreakdowns(aggregateBy(rows, (row) => row.ageRange), (key) => cube.dims.metaAgeRanges[Number(key)] ?? 'Lainnya')
  const genders = makeBreakdowns(aggregateBy(rows, (row) => row.gender), (key) => cube.dims.metaGenders[Number(key)] ?? 'Lainnya')
  const locations = makeBreakdowns(aggregateBy(rows, (row) => row.location), (key) => cube.dims.metaLocations[Number(key)] ?? 'Lainnya')
  const audienceRows = local.audienceDimension === 'gender' ? genders : local.audienceDimension === 'location' ? locations : ageGroups
  const trends = makeBreakdowns(aggregateBy(rows, (row) => compactPeriod(row.monthKey, local.granularity)), (key) => String(key))
    .map((row) => ({ period: row.id, ...row }))
    .sort((a, b) => a.period.localeCompare(b.period))
  const funnel: MetaAdsFunnelStep[] = [
    { stage: 'Reach', value: summary.reach },
    { stage: 'Impressions', value: summary.impressions, rateFromPrevious: safeDivide(summary.impressions, summary.reach) },
    { stage: 'Link Clicks', value: summary.linkClicks, rateFromPrevious: summary.linkCtr },
    { stage: 'Engagement', value: summary.engagement, rateFromPrevious: summary.engagementRate },
    { stage: 'Video Views', value: summary.videoViews, rateFromPrevious: summary.videoViewRate },
    { stage: 'Conversions', value: summary.conversions, rateFromPrevious: summary.conversionRate },
  ]

  return {
    periodLabel: filters.quarter ? quarterLabel(filters.quarter) : 'Semua Periode',
    filterLabel: [filters.region ?? 'Semua Wilayah', filters.city, filters.outlet, filters.gender, filters.ageBand ? `${filters.ageBand} tahun` : null].filter(Boolean).join(' · '),
    summary,
    previousSummary,
    deltas,
    trends,
    campaigns,
    objectives,
    ageGroups,
    genders,
    locations,
    audienceRows,
    funnel,
    insights: buildInsights({ campaigns, objectives, locations, ageGroups, summary, deltas }),
    recommendations: buildRecommendations(campaigns, summary),
    availableObjectives: [...new Set(cube.dims.campaigns.filter((row) => row.platform === 'Meta Ads').map((row) => row.objective))],
    availableCampaigns: cube.dims.campaigns.filter((row) => row.platform === 'Meta Ads').map((row) => ({ id: row.id, name: row.name })),
    unavailableSections: ['Platform performance', 'Placement performance', 'Creative/ad-level performance', 'Conversion value dan ROAS', 'Post-conversion customer quality'],
  }
}
