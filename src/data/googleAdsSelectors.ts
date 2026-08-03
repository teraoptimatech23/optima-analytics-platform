import { GA, quarterLabel, quarterOf } from '@/data/cube'
import type { AppliedFilters, InsightCube } from '@/data/types'

type Status = 'excellent' | 'efficient' | 'monitor' | 'underperforming'
type Priority = 'high' | 'medium' | 'low'
type MetricKey = 'spend' | 'impressions' | 'clicks' | 'ctr' | 'conversions' | 'cpa' | 'conversionValue' | 'roas'
type Granularity = 'daily' | 'weekly' | 'monthly'

export interface GoogleAdsLocalFilters {
  campaignType: string
  device: string
  intent: string
  campaignId: string
  metric: MetricKey
  granularity: Granularity
}

export interface GoogleAdsSummary {
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  conversions: number
  conversionRate: number
  cpa: number
  conversionValue: number
  roas: number
  cac: number
}

export interface GoogleAdsCampaignPerformance extends GoogleAdsSummary {
  campaignId: string
  campaignName: string
  campaignType: string
  status: Status
  newCustomers: number
}

export interface GoogleAdsBreakdownRow extends GoogleAdsSummary {
  id: string
  label: string
  newCustomers: number
}

export interface GoogleAdsKeywordRow extends GoogleAdsSummary {
  id: string
  keyword: string
  matchType: string
  campaignId: string
  campaignName: string
  intent: string
}

export interface GoogleAdsTrendRow extends GoogleAdsSummary {
  period: string
}

export interface GoogleAdsFunnelStep {
  stage: string
  value: number
  rateFromPrevious?: number
}

export interface GoogleAdsRecommendation {
  campaignId?: string
  issue: string
  evidence: string
  action: string
  priority: Priority
  impact: string
}

export interface GoogleAdsInsights {
  periodLabel: string
  filterLabel: string
  summary: GoogleAdsSummary
  previousSummary: GoogleAdsSummary
  deltas: Partial<Record<keyof GoogleAdsSummary, number>>
  trends: GoogleAdsTrendRow[]
  campaigns: GoogleAdsCampaignPerformance[]
  campaignTypes: GoogleAdsBreakdownRow[]
  keywords: GoogleAdsKeywordRow[]
  devices: GoogleAdsBreakdownRow[]
  ageGroups: GoogleAdsBreakdownRow[]
  genders: GoogleAdsBreakdownRow[]
  locations: GoogleAdsBreakdownRow[]
  funnel: GoogleAdsFunnelStep[]
  insights: string[]
  recommendations: GoogleAdsRecommendation[]
  availableCampaignTypes: string[]
  availableCampaigns: { id: string; name: string }[]
  availableDevices: string[]
  availableIntents: string[]
}

interface MetricBucket {
  spend: number
  impressions: number
  clicks: number
  conversions: number
  conversionValue: number
}

interface ScopedRow {
  month: number
  monthKey: string
  campaign: number
  keyword: number
  matchType: number
  device: number
  location: number
  ageRange: number
  gender: number
  metrics: MetricBucket
}

const emptyBucket = (): MetricBucket => ({ spend: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0 })
export const safeDivide = (value: number, total: number) => (total ? value / total : 0)
export const calculateCtr = (clicks: number, impressions: number) => safeDivide(clicks, impressions)
export const calculateCpc = (spend: number, clicks: number) => safeDivide(spend, clicks)
export const calculateCpm = (spend: number, impressions: number) => safeDivide(spend * 1000, impressions)
export const calculateConversionRate = (conversions: number, clicks: number) => safeDivide(conversions, clicks)
export const calculateCpa = (spend: number, conversions: number) => safeDivide(spend, conversions)
export const calculateRoas = (value: number, spend: number) => safeDivide(value, spend)
export const calculateCac = (spend: number, newCustomers: number) => safeDivide(spend, newCustomers)

const add = (bucket: MetricBucket, patch: MetricBucket) => {
  bucket.spend += patch.spend
  bucket.impressions += patch.impressions
  bucket.clicks += patch.clicks
  bucket.conversions += patch.conversions
  bucket.conversionValue += patch.conversionValue
}

const summarize = (bucket: MetricBucket): GoogleAdsSummary => ({
  ...bucket,
  ctr: calculateCtr(bucket.clicks, bucket.impressions),
  cpc: calculateCpc(bucket.spend, bucket.clicks),
  cpm: calculateCpm(bucket.spend, bucket.impressions),
  conversionRate: calculateConversionRate(bucket.conversions, bucket.clicks),
  cpa: calculateCpa(bucket.spend, bucket.conversions),
  roas: calculateRoas(bucket.conversionValue, bucket.spend),
  cac: calculateCac(bucket.spend, bucket.conversions),
})

function percentile(values: number[], percentilePoint: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * percentilePoint)))
  return sorted[index] ?? 0
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
  if (filters.city) {
    const regions = cube.dims.outlets.filter((row) => row.city === filters.city).map((row) => normalizeRegion(row.region))
    return new Set(regions)
  }
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

function inferIntent(keyword: string, matchType: string) {
  const term = keyword.toLowerCase()
  if (matchType === 'Brand' || term.includes('kenangan')) return 'Branded'
  if (term.includes('promo') || term.includes('murah')) return 'Promotion Intent'
  if (term.includes('terdekat') || term.includes('jakarta')) return 'Location Intent'
  if (term.includes('delivery') || term.includes('app')) return 'Product Intent'
  if (matchType === 'Competitor') return 'Competitor Intent'
  return 'Generic Coffee Intent'
}

function rowsFromCube(cube: InsightCube, filters: AppliedFilters, local: GoogleAdsLocalFilters, months: Set<number>): ScopedRow[] {
  const locations = locationScope(cube, filters)
  return cube.googleAds.flatMap((row) => {
    const campaign = cube.dims.campaigns[row[GA.campaign]!]
    if (!months.has(row[GA.month]!)) return []
    if (!campaign || campaign.platform !== 'Google Ads') return []
    if (local.campaignId !== 'all' && campaign.id !== local.campaignId) return []
    if (local.campaignType !== 'all' && campaign.objective !== local.campaignType) return []
    const device = cube.dims.googleDevices[row[GA.device]!] ?? ''
    if (local.device !== 'all' && device !== local.device) return []
    const location = cube.dims.googleLocations[row[GA.location]!] ?? ''
    if (locations && !locations.has(location)) return []
    const gender = cube.dims.googleGenders[row[GA.gender]!] ?? ''
    if (filters.gender && gender !== filters.gender) return []
    const ageRange = cube.dims.googleAgeRanges[row[GA.ageRange]!] ?? ''
    if (!ageMatches(ageRange, filters.ageBand)) return []
    const keyword = cube.dims.googleKeywords[row[GA.keyword]!]?.term ?? ''
    const matchType = cube.dims.googleMatchTypes[row[GA.matchType]!] ?? ''
    if (local.intent !== 'all' && inferIntent(keyword, matchType) !== local.intent) return []
    return [{
      month: row[GA.month]!,
      monthKey: cube.dims.months[row[GA.month]!] ?? '',
      campaign: row[GA.campaign]!,
      keyword: row[GA.keyword]!,
      matchType: row[GA.matchType]!,
      device: row[GA.device]!,
      location: row[GA.location]!,
      ageRange: row[GA.ageRange]!,
      gender: row[GA.gender]!,
      metrics: {
        spend: row[GA.spend] ?? 0,
        impressions: row[GA.impressions] ?? 0,
        clicks: row[GA.clicks] ?? 0,
        conversions: row[GA.conversions] ?? 0,
        conversionValue: row[GA.value] ?? 0,
      },
    }]
  })
}

function aggregateBy<T>(rows: ScopedRow[], keyer: (row: ScopedRow) => T) {
  const map = new Map<T, MetricBucket>()
  rows.forEach((row) => {
    const key = keyer(row)
    const bucket = map.get(key) ?? emptyBucket()
    add(bucket, row.metrics)
    map.set(key, bucket)
  })
  return map
}

function statusFor(row: GoogleAdsSummary, roasMedian: number, cpaMedian: number, conversionsMedian: number): Status {
  if (row.roas >= roasMedian && row.cpa <= cpaMedian) return 'excellent'
  if (row.roas >= roasMedian && row.conversions < conversionsMedian) return 'efficient'
  if (row.roas < roasMedian && row.cpa > cpaMedian) return 'underperforming'
  return 'monitor'
}

function compactPeriod(month: string, granularity: Granularity) {
  if (granularity === 'monthly') return month
  if (granularity === 'weekly') {
    const index = Number(month.slice(5, 7))
    return `${month.slice(0, 4)} W${Math.ceil(index * 4.33)}`
  }
  return month
}

function delta(current: number, previous: number) {
  if (!previous) return current ? 1 : 0
  return (current - previous) / previous
}

function buildInsights(data: {
  campaigns: GoogleAdsCampaignPerformance[]
  devices: GoogleAdsBreakdownRow[]
  locations: GoogleAdsBreakdownRow[]
  ageGroups: GoogleAdsBreakdownRow[]
  keywords: GoogleAdsKeywordRow[]
  summary: GoogleAdsSummary
  deltas: Partial<Record<keyof GoogleAdsSummary, number>>
}) {
  const insights: string[] = []
  const topRoas = data.campaigns[0]
  const highSpendLowRoas = [...data.campaigns].sort((a, b) => b.spend - a.spend).find((row) => row.roas < data.summary.roas)
  const topDeviceVolume = [...data.devices].sort((a, b) => b.conversions - a.conversions)[0]
  const topDeviceEfficiency = [...data.devices].sort((a, b) => b.roas - a.roas)[0]
  const bestLocation = [...data.locations].sort((a, b) => a.cpa - b.cpa)[0]
  const bestKeyword = [...data.keywords].sort((a, b) => b.roas - a.roas)[0]
  const bestAge = [...data.ageGroups].sort((a, b) => b.roas - a.roas)[0]
  if (topRoas) insights.push(`${topRoas.campaignName} menghasilkan ROAS tertinggi sebesar ${topRoas.roas.toFixed(2).replace('.', ',')}x.`)
  if (highSpendLowRoas) insights.push(`${highSpendLowRoas.campaignName} memiliki spend besar, tetapi ROAS masih di bawah rata-rata aktif.`)
  if (topDeviceVolume && topDeviceEfficiency) insights.push(`${topDeviceVolume.label} menyumbang conversion terbesar, sementara ${topDeviceEfficiency.label} paling efisien dari sisi ROAS.`)
  if (bestLocation) insights.push(`${bestLocation.label} memiliki CPA terendah pada filter aktif.`)
  if (bestKeyword) insights.push(`Keyword "${bestKeyword.keyword}" menjadi keyword paling menguntungkan berdasarkan ROAS.`)
  if (bestAge) insights.push(`Audience ${bestAge.label} menunjukkan efisiensi terbaik dengan ROAS ${bestAge.roas.toFixed(2).replace('.', ',')}x.`)
  if (data.deltas.conversions) insights.push(`Conversion berubah ${(data.deltas.conversions * 100).toFixed(1).replace('.', ',')}% dibanding periode sebelumnya.`)
  return insights.slice(0, 6)
}

function buildRecommendations(campaigns: GoogleAdsCampaignPerformance[], summary: GoogleAdsSummary): GoogleAdsRecommendation[] {
  const recommendations: GoogleAdsRecommendation[] = []
  campaigns.slice(0, 8).forEach((campaign) => {
    if (campaign.status === 'excellent') {
      recommendations.push({
        campaignId: campaign.campaignId,
        issue: 'Campaign sangat efisien',
        evidence: `ROAS ${campaign.roas.toFixed(2).replace('.', ',')}x dan CPA di bawah median aktif.`,
        action: 'Scale budget bertahap sambil mempertahankan keyword dan creative terbaik.',
        priority: 'high',
        impact: 'Menaikkan volume conversion dengan efisiensi tetap terkontrol.',
      })
      return
    }
    if (campaign.status === 'underperforming') {
      recommendations.push({
        campaignId: campaign.campaignId,
        issue: 'Spend belum menghasilkan conversion efisien',
        evidence: `CPA ${Math.round(campaign.cpa).toLocaleString('id-ID')} dengan ROAS ${campaign.roas.toFixed(2).replace('.', ',')}x.`,
        action: 'Evaluasi keyword, bid, dan landing page; pause ad group yang paling boros bila perlu.',
        priority: 'high',
        impact: 'Menekan biaya akuisisi dan memperbaiki kualitas traffic.',
      })
      return
    }
    if (campaign.ctr < summary.ctr) {
      recommendations.push({
        campaignId: campaign.campaignId,
        issue: 'CTR di bawah rata-rata',
        evidence: `CTR campaign ${(campaign.ctr * 100).toFixed(1).replace('.', ',')}% vs rata-rata ${(summary.ctr * 100).toFixed(1).replace('.', ',')}%.`,
        action: 'Uji variasi headline, perbaiki relevansi keyword, dan tambah negative keyword.',
        priority: 'medium',
        impact: 'Meningkatkan click quality dan menurunkan CPC efektif.',
      })
    }
  })
  return recommendations.slice(0, 6)
}

export function queryGoogleAds(cube: InsightCube, filters: AppliedFilters, local: GoogleAdsLocalFilters): GoogleAdsInsights {
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
    impressions: delta(summary.impressions, previousSummary.impressions),
    clicks: delta(summary.clicks, previousSummary.clicks),
    ctr: delta(summary.ctr, previousSummary.ctr),
    cpc: delta(summary.cpc, previousSummary.cpc),
    conversions: delta(summary.conversions, previousSummary.conversions),
    cpa: delta(summary.cpa, previousSummary.cpa),
    conversionValue: delta(summary.conversionValue, previousSummary.conversionValue),
    roas: delta(summary.roas, previousSummary.roas),
  }

  const campaignBase = [...aggregateBy(rows, (row) => row.campaign).entries()].map(([index, bucket]) => {
    const campaign = cube.dims.campaigns[index]!
    return { ...summarize(bucket), campaignId: campaign.id, campaignName: campaign.name, campaignType: campaign.objective, newCustomers: bucket.conversions }
  })
  const roasMedian = percentile(campaignBase.map((row) => row.roas), 0.5)
  const cpaMedian = percentile(campaignBase.map((row) => row.cpa), 0.5)
  const conversionsMedian = percentile(campaignBase.map((row) => row.conversions), 0.5)
  const campaigns = campaignBase
    .map((row) => ({ ...row, status: statusFor(row, roasMedian, cpaMedian, conversionsMedian) }))
    .sort((a, b) => b.roas - a.roas)

  const makeBreakdowns = <T>(map: Map<T, MetricBucket>, labeler: (key: T) => string) =>
    [...map.entries()].map(([key, bucket]) => ({ id: String(key), label: labeler(key), ...summarize(bucket), newCustomers: bucket.conversions })).sort((a, b) => b.conversions - a.conversions)

  const campaignTypes = makeBreakdowns(aggregateBy(rows, (row) => cube.dims.campaigns[row.campaign]?.objective ?? 'Lainnya'), (key) => String(key))
  const devices = makeBreakdowns(aggregateBy(rows, (row) => row.device), (key) => cube.dims.googleDevices[Number(key)] ?? 'Lainnya')
  const locations = makeBreakdowns(aggregateBy(rows, (row) => row.location), (key) => cube.dims.googleLocations[Number(key)] ?? 'Lainnya')
  const ageGroups = makeBreakdowns(aggregateBy(rows, (row) => row.ageRange), (key) => cube.dims.googleAgeRanges[Number(key)] ?? 'Lainnya')
  const genders = makeBreakdowns(aggregateBy(rows, (row) => row.gender), (key) => cube.dims.googleGenders[Number(key)] ?? 'Lainnya')

  const keywords = [...aggregateBy(rows, (row) => `${row.keyword}|${row.matchType}|${row.campaign}`).entries()].map(([key, bucket]) => {
    const [keywordIndex = 0, matchIndex = 0, campaignIndex = 0] = key.split('|').map(Number)
    const campaign = cube.dims.campaigns[campaignIndex]!
    const keyword = cube.dims.googleKeywords[keywordIndex]?.term ?? 'Keyword'
    const matchType = cube.dims.googleMatchTypes[matchIndex] ?? 'Generic'
    return {
      id: key,
      keyword,
      matchType,
      campaignId: campaign.id,
      campaignName: campaign.name,
      intent: inferIntent(keyword, matchType),
      ...summarize(bucket),
    }
  }).sort((a, b) => b.conversionValue - a.conversionValue)

  const trends = makeBreakdowns(aggregateBy(rows, (row) => compactPeriod(row.monthKey, local.granularity)), (key) => String(key))
    .map((row) => ({
      period: row.id,
      spend: row.spend,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: row.ctr,
      cpc: row.cpc,
      cpm: row.cpm,
      conversions: row.conversions,
      conversionRate: row.conversionRate,
      cpa: row.cpa,
      conversionValue: row.conversionValue,
      roas: row.roas,
      cac: row.cac,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))

  const funnel: GoogleAdsFunnelStep[] = [
    { stage: 'Impressions', value: summary.impressions },
    { stage: 'Clicks', value: summary.clicks, rateFromPrevious: calculateCtr(summary.clicks, summary.impressions) },
    { stage: 'Conversions', value: summary.conversions, rateFromPrevious: calculateConversionRate(summary.conversions, summary.clicks) },
    { stage: 'Conversion Value', value: summary.conversionValue, rateFromPrevious: calculateRoas(summary.conversionValue, summary.spend) },
  ]

  return {
    periodLabel: filters.quarter ? quarterLabel(filters.quarter) : 'Semua Periode',
    filterLabel: [filters.region ?? 'Semua Wilayah', filters.city, filters.outlet, filters.gender, filters.ageBand ? `${filters.ageBand} tahun` : null].filter(Boolean).join(' · '),
    summary,
    previousSummary,
    deltas,
    trends,
    campaigns,
    campaignTypes,
    keywords,
    devices,
    ageGroups,
    genders,
    locations,
    funnel,
    insights: buildInsights({ campaigns, devices, locations, ageGroups, keywords, summary, deltas }),
    recommendations: buildRecommendations(campaigns, summary),
    availableCampaignTypes: [...new Set(cube.dims.campaigns.filter((row) => row.platform === 'Google Ads').map((row) => row.objective))],
    availableCampaigns: cube.dims.campaigns.filter((row) => row.platform === 'Google Ads').map((row) => ({ id: row.id, name: row.name })),
    availableDevices: cube.dims.googleDevices,
    availableIntents: ['Branded', 'Product Intent', 'Promotion Intent', 'Location Intent', 'Generic Coffee Intent', 'Competitor Intent'],
  }
}
