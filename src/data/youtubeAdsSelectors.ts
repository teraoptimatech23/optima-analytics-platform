import { YT, quarterLabel, quarterOf } from '@/data/cube'
import type { AppliedFilters, InsightCube } from '@/data/types'

export type YouTubeMetricKey =
  | 'spend'
  | 'impressions'
  | 'views'
  | 'viewRate'
  | 'averageWatchTime'
  | 'completionRate'
  | 'websiteClicks'
  | 'ctr'
  | 'conversions'
  | 'cpa'
  | 'cpv'
  | 'cpm'
  | 'videoQualityScore'

export type YouTubeStatus = 'scale' | 'strong-attention' | 'efficient-conversion' | 'monitor' | 'underperforming'
export type YouTubeFatigueStatus = 'healthy' | 'monitor' | 'fatigue-risk' | 'insufficient-history'

export interface YouTubeAdsLocalFilters {
  campaignId: string
  objective: string
  location: string
  ageRange: string
  gender: string
  metric: YouTubeMetricKey
  status: string
  fatigueStatus: string
}

export interface YouTubeAdsSummary {
  spend: number
  impressions: number
  views: number
  viewRate: number
  completedViews: number
  completionRate: number
  watchTimeSeconds: number
  averageWatchTime: number
  websiteClicks: number
  ctr: number
  conversions: number
  conversionRate: number
  cpv: number
  cpm: number
  cpc: number
  cpa: number
}

export interface YouTubeCampaignPerformance extends YouTubeAdsSummary {
  campaignId: string
  campaignName: string
  objective: string
  campaignType: string
  status: YouTubeStatus
  fatigueScore: number
  fatigueStatus: YouTubeFatigueStatus
  videoQualityScore: number
  trendStatus: 'improving' | 'stable' | 'declining' | 'volatile'
}

export interface YouTubeDimensionMetric extends YouTubeAdsSummary {
  id: string
  label: string
  videoQualityScore: number
}

export interface YouTubeTrendRow extends YouTubeAdsSummary {
  period: string
  videoQualityScore: number
}

export interface YouTubeFunnelStep {
  stage: string
  value: number
  rateFromPrevious?: number
  cumulativeRate?: number
  costPerStage?: number
}

export interface YouTubeRecommendation {
  campaignId?: string
  issue: string
  evidence: string
  action: string
  priority: 'high' | 'medium' | 'low'
  objectiveContext: string
  expectedDirection: string
  limitationNote: string
}

export interface YouTubeAdsInsights {
  periodLabel: string
  filterLabel: string
  summary: YouTubeAdsSummary
  previousSummary: YouTubeAdsSummary
  deltas: Partial<Record<keyof YouTubeAdsSummary | 'videoQualityScore', number>>
  trends: YouTubeTrendRow[]
  campaigns: YouTubeCampaignPerformance[]
  objectives: YouTubeDimensionMetric[]
  audiences: YouTubeDimensionMetric[]
  ageGroups: YouTubeDimensionMetric[]
  genders: YouTubeDimensionMetric[]
  locations: YouTubeDimensionMetric[]
  funnel: YouTubeFunnelStep[]
  qualityMatrix: YouTubeCampaignPerformance[]
  attentionConversion: YouTubeCampaignPerformance[]
  spendReturn: YouTubeCampaignPerformance[]
  insights: string[]
  recommendations: YouTubeRecommendation[]
  availableCampaigns: { id: string; name: string }[]
  availableObjectives: string[]
  availableLocations: string[]
  availableAgeRanges: string[]
  availableGenders: string[]
  unavailableSections: string[]
  metricDefinitions: {
    view: string
    viewRate: string
    completionRate: string
    cpv: string
    ctr: string
    cpa: string
    roas: string
    videoQualityScore: string
    fatigueScore: string
  }
}

interface Bucket {
  spend: number
  impressions: number
  views: number
  watchTimeSeconds: number
  completedViews: number
  websiteClicks: number
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

const emptyBucket = (): Bucket => ({
  spend: 0,
  impressions: 0,
  views: 0,
  watchTimeSeconds: 0,
  completedViews: 0,
  websiteClicks: 0,
  conversions: 0,
})

export const safeDivide = (value: number, total: number) => (total ? value / total : 0)
export const calculateViewRate = (views: number, impressions: number) => safeDivide(views, impressions)
export const calculateCompletionRate = (completedViews: number, views: number) => safeDivide(completedViews, views)
export const calculateAverageWatchTime = (watchTimeSeconds: number, views: number) => safeDivide(watchTimeSeconds, views)
export const calculateCtr = (websiteClicks: number, impressions: number) => safeDivide(websiteClicks, impressions)
export const calculateConversionRate = (conversions: number, websiteClicks: number) => safeDivide(conversions, websiteClicks)
export const calculateCpv = (spend: number, views: number) => safeDivide(spend, views)
export const calculateCpm = (spend: number, impressions: number) => safeDivide(spend * 1000, impressions)
export const calculateCpc = (spend: number, websiteClicks: number) => safeDivide(spend, websiteClicks)
export const calculateCpa = (spend: number, conversions: number) => safeDivide(spend, conversions)

function add(bucket: Bucket, patch: Bucket) {
  bucket.spend += patch.spend
  bucket.impressions += patch.impressions
  bucket.views += patch.views
  bucket.watchTimeSeconds += patch.watchTimeSeconds
  bucket.completedViews += patch.completedViews
  bucket.websiteClicks += patch.websiteClicks
  bucket.conversions += patch.conversions
}

function summarize(bucket: Bucket): YouTubeAdsSummary {
  return {
    ...bucket,
    viewRate: calculateViewRate(bucket.views, bucket.impressions),
    completionRate: calculateCompletionRate(bucket.completedViews, bucket.views),
    averageWatchTime: calculateAverageWatchTime(bucket.watchTimeSeconds, bucket.views),
    ctr: calculateCtr(bucket.websiteClicks, bucket.impressions),
    conversionRate: calculateConversionRate(bucket.conversions, bucket.websiteClicks),
    cpv: calculateCpv(bucket.spend, bucket.views),
    cpm: calculateCpm(bucket.spend, bucket.impressions),
    cpc: calculateCpc(bucket.spend, bucket.websiteClicks),
    cpa: calculateCpa(bucket.spend, bucket.conversions),
  }
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

function locationScope(filters: AppliedFilters) {
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

function rowsFromCube(cube: InsightCube, filters: AppliedFilters, local: YouTubeAdsLocalFilters, months: Set<number>): ScopedRow[] {
  const locations = locationScope(filters)
  return cube.youtubeAds.flatMap((row) => {
    const campaign = cube.dims.campaigns[row[YT.campaign]!]
    if (!months.has(row[YT.month]!)) return []
    if (!campaign || campaign.platform !== 'YouTube Ads') return []
    if (local.campaignId !== 'all' && campaign.id !== local.campaignId) return []
    if (local.objective !== 'all' && campaign.objective !== local.objective) return []
    const location = cube.dims.youtubeLocations[row[YT.location]!] ?? ''
    if (locations && !locations.has(location)) return []
    if (local.location !== 'all' && location !== local.location) return []
    const gender = cube.dims.youtubeGenders[row[YT.gender]!] ?? ''
    if (filters.gender && gender !== filters.gender) return []
    if (local.gender !== 'all' && gender !== local.gender) return []
    const ageRange = cube.dims.youtubeAgeRanges[row[YT.ageRange]!] ?? ''
    if (!ageMatches(ageRange, filters.ageBand)) return []
    if (local.ageRange !== 'all' && ageRange !== local.ageRange) return []
    return [{
      month: row[YT.month]!,
      monthKey: cube.dims.months[row[YT.month]!] ?? '',
      campaign: row[YT.campaign]!,
      location: row[YT.location]!,
      ageRange: row[YT.ageRange]!,
      gender: row[YT.gender]!,
      metrics: {
        spend: row[YT.spend] ?? 0,
        impressions: row[YT.impressions] ?? 0,
        views: row[YT.views] ?? 0,
        watchTimeSeconds: row[YT.watchTimeSeconds] ?? 0,
        completedViews: row[YT.completedViews] ?? 0,
        websiteClicks: row[YT.clicks] ?? 0,
        conversions: row[YT.conversions] ?? 0,
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

function percentile(values: number[], point: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * point)))] ?? 0
}

function normalize(value: number, values: number[], inverse = false) {
  if (!values.length) return 0
  const min = Math.min(...values)
  const max = Math.max(...values)
  const score = max === min ? 0.5 : (value - min) / (max - min)
  return inverse ? 1 - score : score
}

function videoQualityScore(row: YouTubeAdsSummary, norms: { viewRate: number[]; completionRate: number[]; averageWatchTime: number[] }) {
  return 100 * (
    0.4 * normalize(row.viewRate, norms.viewRate) +
    0.35 * normalize(row.completionRate, norms.completionRate) +
    0.25 * normalize(row.averageWatchTime, norms.averageWatchTime)
  )
}

function delta(current: number, previous: number) {
  if (!previous) return current ? 1 : 0
  return (current - previous) / previous
}

function fatigueScore(current: YouTubeAdsSummary, previous: YouTubeAdsSummary) {
  if (!previous.impressions || !previous.views) return 0
  const viewRateDecline = Math.max(0, -delta(current.viewRate, previous.viewRate))
  const completionDecline = Math.max(0, -delta(current.completionRate, previous.completionRate))
  const ctrDecline = Math.max(0, -delta(current.ctr, previous.ctr))
  const cpvIncrease = Math.max(0, delta(current.cpv, previous.cpv))
  return 0.3 * viewRateDecline + 0.3 * completionDecline + 0.2 * ctrDecline + 0.2 * cpvIncrease
}

function fatigueStatus(score: number, previous: YouTubeAdsSummary): YouTubeFatigueStatus {
  if (!previous.impressions || !previous.views) return 'insufficient-history'
  if (score >= 0.45) return 'fatigue-risk'
  if (score >= 0.18) return 'monitor'
  return 'healthy'
}

function trendStatus(current: YouTubeAdsSummary, previous: YouTubeAdsSummary, objective: string): YouTubeCampaignPerformance['trendStatus'] {
  const awareness = ['Video Reach', 'Video Views', 'Awareness'].includes(objective)
  const primary = awareness
    ? [delta(current.viewRate, previous.viewRate), delta(current.completionRate, previous.completionRate), -delta(current.cpv, previous.cpv)]
    : [delta(current.conversions, previous.conversions), -delta(current.cpa, previous.cpa), delta(current.conversionRate, previous.conversionRate)]
  const volatility = Math.max(...primary.map((value) => Math.abs(value)))
  const average = primary.reduce((sum, value) => sum + value, 0) / Math.max(1, primary.length)
  if (volatility > 0.75) return 'volatile'
  if (average > 0.08) return 'improving'
  if (average < -0.08) return 'declining'
  return 'stable'
}

function statusFor(row: YouTubeAdsSummary, objective: string, benchmark: { cpvMedian: number; cpaMedian: number; qualityMedian: number; conversionMedian: number }, qualityScore: number): YouTubeStatus {
  const awareness = ['Video Reach', 'Video Views', 'Awareness'].includes(objective)
  if (awareness) {
    if (qualityScore >= benchmark.qualityMedian && row.cpv <= benchmark.cpvMedian) return 'scale'
    if (qualityScore >= benchmark.qualityMedian) return 'strong-attention'
    if (row.cpv > benchmark.cpvMedian && qualityScore < benchmark.qualityMedian) return 'underperforming'
    return 'monitor'
  }
  if (row.conversions >= benchmark.conversionMedian && row.cpa <= benchmark.cpaMedian) return 'efficient-conversion'
  if (qualityScore >= benchmark.qualityMedian && row.conversions < benchmark.conversionMedian) return 'strong-attention'
  if (row.cpa > benchmark.cpaMedian && row.conversions < benchmark.conversionMedian) return 'underperforming'
  return 'monitor'
}

function compactPeriod(month: string) {
  return month
}

function withQuality<T extends YouTubeAdsSummary>(row: T, norms: { viewRate: number[]; completionRate: number[]; averageWatchTime: number[] }) {
  return { ...row, videoQualityScore: videoQualityScore(row, norms) }
}

function buildInsights(data: {
  campaigns: YouTubeCampaignPerformance[]
  locations: YouTubeDimensionMetric[]
  ageGroups: YouTubeDimensionMetric[]
  genders: YouTubeDimensionMetric[]
  summary: YouTubeAdsSummary
  deltas: Partial<Record<keyof YouTubeAdsSummary | 'videoQualityScore', number>>
}) {
  const insights: string[] = []
  const topViewRate = [...data.campaigns].sort((a, b) => b.viewRate - a.viewRate)[0]
  const topCompletion = [...data.campaigns].sort((a, b) => b.completionRate - a.completionRate)[0]
  const topWatch = [...data.campaigns].sort((a, b) => b.averageWatchTime - a.averageWatchTime)[0]
  const lowCpvAudience = [...data.ageGroups].sort((a, b) => a.cpv - b.cpv)[0]
  const topLocation = [...data.locations].sort((a, b) => b.videoQualityScore - a.videoQualityScore)[0]
  const topGender = [...data.genders].sort((a, b) => b.conversionRate - a.conversionRate)[0]
  const fatigue = data.campaigns.find((row) => row.fatigueStatus === 'fatigue-risk')
  if (topViewRate) insights.push(`${topViewRate.campaignName} memiliki view rate tertinggi sebesar ${(topViewRate.viewRate * 100).toFixed(1).replace('.', ',')}% pada filter aktif.`)
  if (topCompletion) insights.push(`${topCompletion.campaignName} mencatat completion rate tertinggi sebesar ${(topCompletion.completionRate * 100).toFixed(1).replace('.', ',')}%, dihitung dari completed views terhadap total views.`)
  if (topWatch) insights.push(`${topWatch.campaignName} menghasilkan average watch time terpanjang sebesar ${topWatch.averageWatchTime.toFixed(1).replace('.', ',')} detik.`)
  if (lowCpvAudience) insights.push(`Audience usia ${lowCpvAudience.label} memiliki CPV terendah pada filter aktif.`)
  if (topLocation) insights.push(`${topLocation.label} menunjukkan video quality score internal tertinggi berdasarkan view rate, completion, dan watch time.`)
  if (topGender) insights.push(`${topGender.label} menunjukkan conversion rate klik-ke-conversion paling tinggi, bukan berarti view menyebabkan conversion.`)
  if (fatigue) insights.push(`${fatigue.campaignName} menunjukkan indikasi creative fatigue, bukan kepastian, karena attention metrics melemah dibanding periode sebelumnya.`)
  if (data.deltas.views) insights.push(`Video views berubah ${(data.deltas.views * 100).toFixed(1).replace('.', ',')}% dibanding periode sebelumnya.`)
  return insights.slice(0, 7)
}

function buildRecommendations(campaigns: YouTubeCampaignPerformance[], summary: YouTubeAdsSummary): YouTubeRecommendation[] {
  const out: YouTubeRecommendation[] = []
  campaigns.slice(0, 8).forEach((campaign) => {
    if (campaign.fatigueStatus === 'fatigue-risk') {
      out.push({
        campaignId: campaign.campaignId,
        issue: 'Indikasi creative fatigue',
        evidence: `View rate ${(campaign.viewRate * 100).toFixed(1).replace('.', ',')}%, completion ${(campaign.completionRate * 100).toFixed(1).replace('.', ',')}%, fatigue score ${campaign.fatigueScore.toFixed(2).replace('.', ',')}.`,
        action: 'Rotasi creative, uji opening hook baru, dan perluas audience secara bertahap.',
        priority: 'high',
        objectiveContext: campaign.objective,
        expectedDirection: 'Menjaga view rate dan completion rate, serta menekan CPV/CPA.',
        limitationNote: 'Fatigue adalah indikasi berbasis trend aggregate; dataset belum memiliki frequency/reach YouTube.',
      })
      return
    }
    if (campaign.status === 'scale') {
      out.push({
        campaignId: campaign.campaignId,
        issue: 'Attention efisien untuk objective video',
        evidence: `Video quality score ${Math.round(campaign.videoQualityScore)}/100 dan CPV Rp${Math.round(campaign.cpv).toLocaleString('id-ID')}.`,
        action: 'Scale budget bertahap sambil menjaga audience dan creative yang sama.',
        priority: 'medium',
        objectiveContext: campaign.objective,
        expectedDirection: 'Menaikkan volume views dengan efisiensi biaya tetap terkontrol.',
        limitationNote: 'Tidak ada klaim uplift pasti; validasi tetap perlu monitoring periode berikutnya.',
      })
      return
    }
    if (campaign.viewRate < summary.viewRate && ['Video Reach', 'Video Views'].includes(campaign.objective)) {
      out.push({
        campaignId: campaign.campaignId,
        issue: 'View rate di bawah rata-rata aktif',
        evidence: `View rate ${(campaign.viewRate * 100).toFixed(1).replace('.', ',')}% vs rata-rata ${(summary.viewRate * 100).toFixed(1).replace('.', ',')}%.`,
        action: 'Evaluasi opening hook, thumbnail/title untuk format in-feed, dan kecocokan audience.',
        priority: 'medium',
        objectiveContext: campaign.objective,
        expectedDirection: 'Meningkatkan proporsi impressions yang berubah menjadi views.',
        limitationNote: 'Dataset tidak memiliki placement atau video-level creative, sehingga rekomendasi berada pada level campaign.',
      })
      return
    }
    if (campaign.completionRate < summary.completionRate) {
      out.push({
        campaignId: campaign.campaignId,
        issue: 'Completion rate di bawah rata-rata aktif',
        evidence: `Completion ${(campaign.completionRate * 100).toFixed(1).replace('.', ',')}% vs rata-rata ${(summary.completionRate * 100).toFixed(1).replace('.', ',')}%.`,
        action: 'Pindahkan pesan utama lebih awal dan sederhanakan pacing narasi.',
        priority: 'medium',
        objectiveContext: campaign.objective,
        expectedDirection: 'Meningkatkan completed views dan watch quality.',
        limitationNote: 'Quartile 25/50/75 tidak tersedia, jadi analisis completion hanya memakai completed views.',
      })
      return
    }
    if (campaign.websiteClicks < summary.websiteClicks && campaign.views > summary.views * 0.15) {
      out.push({
        campaignId: campaign.campaignId,
        issue: 'Views besar belum diikuti website clicks proporsional',
        evidence: `${campaign.views.toLocaleString('id-ID')} views dengan CTR ${(campaign.ctr * 100).toFixed(2).replace('.', ',')}%.`,
        action: 'Perjelas CTA dan evaluasi message match landing page.',
        priority: 'low',
        objectiveContext: campaign.objective,
        expectedDirection: 'Meningkatkan traffic dari views yang sudah terbentuk.',
        limitationNote: 'Views, clicks, dan conversions adalah metrik berbeda; relasi ini bukan causal attribution.',
      })
    }
  })
  return out.slice(0, 7)
}

export function queryYouTubeAds(cube: InsightCube, filters: AppliedFilters, local: YouTubeAdsLocalFilters): YouTubeAdsInsights {
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

  const campaignBase = [...aggregateBy(rows, (row) => row.campaign).entries()].map(([index, bucket]) => {
    const campaign = cube.dims.campaigns[index]!
    return { ...summarize(bucket), campaignId: campaign.id, campaignName: campaign.name, objective: campaign.objective, campaignType: campaign.objective }
  })
  const norms = {
    viewRate: campaignBase.map((row) => row.viewRate),
    completionRate: campaignBase.map((row) => row.completionRate),
    averageWatchTime: campaignBase.map((row) => row.averageWatchTime),
  }
  const previousCampaigns = new Map([...aggregateBy(previousRows, (row) => row.campaign).entries()].map(([index, bucket]) => [index, summarize(bucket)]))
  const campaignWithQuality = campaignBase.map((row) => withQuality(row, norms))
  const benchmark = {
    cpvMedian: percentile(campaignWithQuality.map((row) => row.cpv), 0.5),
    cpaMedian: percentile(campaignWithQuality.map((row) => row.cpa), 0.5),
    qualityMedian: percentile(campaignWithQuality.map((row) => row.videoQualityScore), 0.5),
    conversionMedian: percentile(campaignWithQuality.map((row) => row.conversions), 0.5),
  }

  let campaigns = campaignWithQuality.map((row) => {
    const previous = previousCampaigns.get(cube.dims.campaigns.findIndex((campaign) => campaign.id === row.campaignId)) ?? summarize(emptyBucket())
    const fatigue = fatigueScore(row, previous)
    return {
      ...row,
      fatigueScore: fatigue,
      fatigueStatus: fatigueStatus(fatigue, previous),
      status: statusFor(row, row.objective, benchmark, row.videoQualityScore),
      trendStatus: trendStatus(row, previous, row.objective),
    }
  })
  campaigns = campaigns
    .filter((row) => local.status === 'all' || row.status === local.status)
    .filter((row) => local.fatigueStatus === 'all' || row.fatigueStatus === local.fatigueStatus)
    .sort((a, b) => b.videoQualityScore - a.videoQualityScore)

  const makeBreakdowns = <T>(map: Map<T, Bucket>, labeler: (key: T) => string) => {
    const baseRows = [...map.entries()].map(([key, bucket]) => ({ id: String(key), label: labeler(key), ...summarize(bucket) }))
    const localNorms = {
      viewRate: baseRows.map((row) => row.viewRate),
      completionRate: baseRows.map((row) => row.completionRate),
      averageWatchTime: baseRows.map((row) => row.averageWatchTime),
    }
    return baseRows.map((row) => withQuality(row, localNorms)).sort((a, b) => b.videoQualityScore - a.videoQualityScore)
  }

  const objectives = makeBreakdowns(aggregateBy(rows, (row) => cube.dims.campaigns[row.campaign]?.objective ?? 'Lainnya'), (key) => String(key))
  const ageGroups = makeBreakdowns(aggregateBy(rows, (row) => row.ageRange), (key) => cube.dims.youtubeAgeRanges[Number(key)] ?? 'Lainnya')
  const genders = makeBreakdowns(aggregateBy(rows, (row) => row.gender), (key) => cube.dims.youtubeGenders[Number(key)] ?? 'Lainnya')
  const locations = makeBreakdowns(aggregateBy(rows, (row) => row.location), (key) => cube.dims.youtubeLocations[Number(key)] ?? 'Lainnya')
  const audiences = makeBreakdowns(aggregateBy(rows, (row) => `${row.ageRange}|${row.gender}`), (key) => {
    const [age = 0, gender = 0] = String(key).split('|').map(Number)
    return `${cube.dims.youtubeAgeRanges[age] ?? 'Age'} - ${cube.dims.youtubeGenders[gender] ?? 'Gender'}`
  })

  const trends = makeBreakdowns(aggregateBy(rows, (row) => compactPeriod(row.monthKey)), (key) => String(key))
    .map((row) => ({ period: row.id, ...row }))
    .sort((a, b) => a.period.localeCompare(b.period))

  const summaryQuality = videoQualityScore(summary, norms)
  const previousQuality = videoQualityScore(previousSummary, norms)
  const deltas = {
    spend: delta(summary.spend, previousSummary.spend),
    impressions: delta(summary.impressions, previousSummary.impressions),
    views: delta(summary.views, previousSummary.views),
    viewRate: delta(summary.viewRate, previousSummary.viewRate),
    averageWatchTime: delta(summary.averageWatchTime, previousSummary.averageWatchTime),
    completionRate: delta(summary.completionRate, previousSummary.completionRate),
    websiteClicks: delta(summary.websiteClicks, previousSummary.websiteClicks),
    ctr: delta(summary.ctr, previousSummary.ctr),
    conversions: delta(summary.conversions, previousSummary.conversions),
    cpa: delta(summary.cpa, previousSummary.cpa),
    cpv: delta(summary.cpv, previousSummary.cpv),
    cpm: delta(summary.cpm, previousSummary.cpm),
    videoQualityScore: delta(summaryQuality, previousQuality),
  }

  const funnel: YouTubeFunnelStep[] = [
    { stage: 'Impressions', value: summary.impressions, cumulativeRate: 1, costPerStage: calculateCpm(summary.spend, summary.impressions) },
    { stage: 'Video Views', value: summary.views, rateFromPrevious: summary.viewRate, cumulativeRate: summary.viewRate, costPerStage: summary.cpv },
    { stage: 'Completed Views', value: summary.completedViews, rateFromPrevious: summary.completionRate, cumulativeRate: safeDivide(summary.completedViews, summary.impressions), costPerStage: calculateCpv(summary.spend, summary.completedViews) },
    { stage: 'Website Clicks', value: summary.websiteClicks, rateFromPrevious: safeDivide(summary.websiteClicks, summary.views), cumulativeRate: summary.ctr, costPerStage: summary.cpc },
    { stage: 'Conversions', value: summary.conversions, rateFromPrevious: summary.conversionRate, cumulativeRate: safeDivide(summary.conversions, summary.impressions), costPerStage: summary.cpa },
  ]

  return {
    periodLabel: filters.quarter ? quarterLabel(filters.quarter) : 'Semua Periode',
    filterLabel: [
      filters.region ?? 'Semua Wilayah',
      filters.city ? `City filter tidak diterapkan ke media grain: ${filters.city}` : null,
      filters.outlet ? 'Outlet filter tidak diterapkan ke media grain' : null,
      filters.gender,
      filters.ageBand ? `${filters.ageBand} tahun` : null,
      local.campaignId !== 'all' ? 'Campaign aktif' : 'Semua Campaign',
      local.location !== 'all' ? local.location : 'Semua Audience',
    ].filter(Boolean).join(' - '),
    summary,
    previousSummary,
    deltas,
    trends,
    campaigns,
    objectives,
    audiences,
    ageGroups,
    genders,
    locations,
    funnel,
    qualityMatrix: campaigns,
    attentionConversion: campaigns,
    spendReturn: campaigns,
    insights: buildInsights({ campaigns, locations, ageGroups, genders, summary, deltas }),
    recommendations: buildRecommendations(campaigns, summary),
    availableCampaigns: cube.dims.campaigns.filter((row) => row.platform === 'YouTube Ads').map((row) => ({ id: row.id, name: row.name })),
    availableObjectives: [...new Set(cube.dims.campaigns.filter((row) => row.platform === 'YouTube Ads').map((row) => row.objective))],
    availableLocations: cube.dims.youtubeLocations,
    availableAgeRanges: cube.dims.youtubeAgeRanges,
    availableGenders: cube.dims.youtubeGenders,
    unavailableSections: [
      'Video-level performance: videoId/videoTitle tidak tersedia di aggregate YouTube saat ini.',
      'Quartile 25/50/75: dataset hanya menyediakan completion rate akhir, bukan quartile completion.',
      'Device dan placement performance: field device/placement tidak tersedia.',
      'View-through conversion dan click-through conversion: field attribution type tidak tersedia.',
      'Customer quality dan customer attribution: relasi campaign-customer tidak tersedia.',
      'ROAS: conversion value/revenue granular tidak tersedia untuk YouTube Ads.',
    ],
    metricDefinitions: {
      view: 'View adalah jumlah Views dari youtube_ads_performance.csv; tidak disamakan dengan impressions, clicks, atau conversions.',
      viewRate: 'View Rate = total views / total impressions.',
      completionRate: 'Completion Rate = total completed views / total views; completed views dihitung dari Views x CompletionRatePct pada pipeline aggregate, lalu diblended.',
      cpv: 'CPV = total spend / total views.',
      ctr: 'CTR = total website clicks / total impressions.',
      cpa: 'CPA = total spend / total conversions.',
      roas: 'ROAS tidak dihitung karena conversion value/revenue YouTube tidak tersedia di dataset.',
      videoQualityScore: 'Internal Decision-Support Score = 40% normalized view rate + 35% normalized completion rate + 25% normalized average watch time.',
      fatigueScore: 'Fatigue indication = 30% view-rate decline + 30% completion decline + 20% CTR decline + 20% CPV increase dibanding periode sebelumnya; bukan kepastian fatigue.',
    },
  }
}
