import { attributionConfig, attributionModelLabels, attributionModels, attributionWindows } from '@/config/attributionConfig'
import type { AttributionModel, AttributionWindow } from '@/config/attributionConfig'
import { quarterLabel, quarterOf } from '@/data/cube'
import type { AppliedFilters } from '@/data/types'

export type AttributionPathLength = 'all' | 'single' | 'multi' | 'unattributed'
export type AttributionCustomerType = 'all' | 'new' | 'repeat'
export type AttributionComparisonMetric = 'revenue' | 'conversions' | 'roas' | 'cpa'

export interface AttributionLocalFilters {
  model: AttributionModel
  window: AttributionWindow
  channel: string
  campaign: string
  firstTouch: string
  lastTouch: string
  pathLength: AttributionPathLength
  customerType: AttributionCustomerType
  comparisonMetric: AttributionComparisonMetric
  minPathCount: number
}

export interface AttributionJson {
  meta: {
    generatedAt: string
    defaultModel: AttributionModel
    defaultWindow: AttributionWindow
    attributionWindows: number[]
    attributionModels: AttributionModel[]
    touchpointDefinition: string
    conversionDefinition: string
    limitation: string
    validation: {
      checkedConversions: number
      attributedConversions: number
      unattributedConversions: number
      multiTouchConversions: number
      creditSumErrors: number
      revenueSumErrors: number
      nonFiniteCredit: number
    }
  }
  dims: {
    months: string[]
    outlets: { id: string; name: string; city: string; region: string; type: string }[]
    genders: string[]
    ageBands: string[]
    segments: string[]
    acquisitions: string[]
    channels: string[]
    campaigns: { id: string; name: string; platform: string; objective: string; monthlyBudget: number }[]
    paths: string[]
    models: AttributionModel[]
    positions: string[]
  }
  summaryFacts: number[][]
  creditFacts: number[][]
  pathFacts: number[][]
  positionFacts: number[][]
  pairFacts: number[][]
  mediaFacts: number[][]
}

export interface AttributionSummary {
  conversions: number
  revenue: number
  attributedConversions: number
  attributedRevenue: number
  unattributedConversions: number
  attributionRate: number
  unattributedRate: number
  multiTouchConversions: number
  assistedConversions: number
  averageTouchpoints: number
  averageTimeToConversionHours: number
  newConversions: number
  attributedNewConversions: number
  spend: number
  impressions: number
  clicks: number
  roas: number
  cpa: number
}

export interface AttributionKpi {
  id: string
  label: string
  value: number
  detail: string
  display: 'number' | 'currency' | 'percent' | 'ratio' | 'hours'
  tone: 'blue' | 'purple' | 'cyan' | 'orange'
}

export interface AttributionChannelRow {
  id: string
  label: string
  attributedConversions: number
  attributedRevenue: number
  creditShare: number
  revenueShare: number
  spend: number
  clicks: number
  impressions: number
  roas: number
  cpa: number
  firstConversions: number
  lastConversions: number
  assistedConversions: number
  averagePosition: number
  averageLagHours: number
}

export interface AttributionCampaignRow extends AttributionChannelRow {
  campaignId: string
  campaignName: string
  channel: string
  objective: string
}

export interface AttributionPathRow {
  path: string
  count: number
  revenue: number
  share: number
  averageTouchpoints: number
  averageLagHours: number
  newShare: number
}

export interface AttributionPairRow {
  source: string
  target: string
  count: number
  revenue: number
  averageLagHours: number
  newShare: number
}

export interface AttributionModelComparisonRow {
  model: AttributionModel
  label: string
  attributedConversions: number
  attributedRevenue: number
  topChannel: string
  topCampaign: string
  roas: number
  cpa: number
}

export interface AttributionInsight {
  title: string
  evidence: string
  action: string
  priority: 'high' | 'medium' | 'low'
}

export interface AttributionResult {
  periodLabel: string
  filterLabel: string
  localFilters: AttributionLocalFilters
  summary: AttributionSummary
  kpis: AttributionKpi[]
  channels: AttributionChannelRow[]
  campaigns: AttributionCampaignRow[]
  topPaths: AttributionPathRow[]
  pathLength: { label: string; count: number; share: number }[]
  timeBuckets: { label: string; count: number; share: number }[]
  positionRows: { channel: string; first: number; middle: number; last: number }[]
  pairs: AttributionPairRow[]
  modelComparison: AttributionModelComparisonRow[]
  insights: AttributionInsight[]
  availableChannels: string[]
  availableCampaigns: { id: string; name: string; channel: string }[]
  availablePaths: string[]
  validationNote: string
  methodologyNotes: string[]
}

const S = { window: 0, month: 1, outlet: 2, gender: 3, age: 4, segment: 5, acquisition: 6, customerType: 7, pathType: 8, firstTouch: 9, lastTouch: 10, conversions: 11, revenue: 12, attributedConversions: 13, attributedRevenue: 14, unattributedConversions: 15, multiTouchConversions: 16, assistedConversions: 17, touchpoints: 18, timeHours: 19, newConversions: 20, attributedNewConversions: 21 } as const
const CF = { window: 0, model: 1, month: 2, outlet: 3, gender: 4, age: 5, segment: 6, acquisition: 7, customerType: 8, pathType: 9, firstTouch: 10, lastTouch: 11, channel: 12, campaign: 13, credit: 14, revenue: 15, newCredit: 16, firstConversions: 17, lastConversions: 18, assistedConversions: 19, positionCredit: 20, timeHoursCredit: 21 } as const
const P = { window: 0, month: 1, outlet: 2, gender: 3, age: 4, segment: 5, acquisition: 6, customerType: 7, pathType: 8, firstTouch: 9, lastTouch: 10, path: 11, count: 12, revenue: 13, touchpoints: 14, timeHours: 15, newConversions: 16 } as const
const POS = { window: 0, month: 1, channel: 2, position: 3, credit: 4, revenue: 5 } as const
const PAIR = { window: 0, month: 1, source: 2, target: 3, count: 4, revenue: 5, timeHours: 6, newConversions: 7 } as const
const MF = { month: 0, campaign: 1, spend: 2, impressions: 3, clicks: 4, platformConversions: 5 } as const

export const defaultAttributionLocalFilters: AttributionLocalFilters = {
  model: attributionConfig.defaultModel,
  window: attributionConfig.defaultWindow,
  channel: 'all',
  campaign: 'all',
  firstTouch: 'all',
  lastTouch: 'all',
  pathLength: 'all',
  customerType: 'all',
  comparisonMetric: 'revenue',
  minPathCount: attributionConfig.minimumPathCount,
}

const safeDivide = (value: number, total: number) => (total ? value / total : 0)

function matchesCommon(payload: AttributionJson, filters: AppliedFilters, month: number, outlet: number, gender: number, age: number) {
  const monthKey = payload.dims.months[month]
  if (!monthKey) return false
  if (filters.quarter && quarterOf(monthKey) !== filters.quarter) return false
  const outletRow = payload.dims.outlets[outlet]
  if (!outletRow) return false
  if (filters.outlet && outletRow.id !== filters.outlet) return false
  if (filters.city && outletRow.city !== filters.city) return false
  if (filters.region && outletRow.region !== filters.region) return false
  if (filters.gender && payload.dims.genders[gender] !== filters.gender) return false
  if (filters.ageBand && payload.dims.ageBands[age] !== filters.ageBand) return false
  return true
}

function matchesCustomerType(local: AttributionLocalFilters, customerType: number) {
  if (local.customerType === 'all') return true
  if (local.customerType === 'new') return customerType === 1
  return customerType === 0
}

function scopeMatches(payload: AttributionJson, local: AttributionLocalFilters, pathType: number, firstTouch: number, lastTouch: number) {
  if (local.pathLength === 'single' && pathType !== 1) return false
  if (local.pathLength === 'multi' && pathType !== 2) return false
  if (local.pathLength === 'unattributed' && pathType !== 0) return false
  if (local.firstTouch !== 'all' && payload.dims.channels[firstTouch] !== local.firstTouch) return false
  if (local.lastTouch !== 'all' && payload.dims.channels[lastTouch] !== local.lastTouch) return false
  return true
}

function pathMatches(payload: AttributionJson, local: AttributionLocalFilters, row: number[]) {
  const path = payload.dims.paths[row[P.path]!] ?? ''
  return Boolean(path) && scopeMatches(payload, local, row[P.pathType]!, row[P.firstTouch]!, row[P.lastTouch]!)
}

function addSummary(summary: AttributionSummary, row: number[]) {
  summary.conversions += row[S.conversions] ?? 0
  summary.revenue += row[S.revenue] ?? 0
  summary.attributedConversions += row[S.attributedConversions] ?? 0
  summary.attributedRevenue += row[S.attributedRevenue] ?? 0
  summary.unattributedConversions += row[S.unattributedConversions] ?? 0
  summary.multiTouchConversions += row[S.multiTouchConversions] ?? 0
  summary.assistedConversions += row[S.assistedConversions] ?? 0
  summary.averageTouchpoints += row[S.touchpoints] ?? 0
  summary.averageTimeToConversionHours += row[S.timeHours] ?? 0
  summary.newConversions += row[S.newConversions] ?? 0
  summary.attributedNewConversions += row[S.attributedNewConversions] ?? 0
}

function emptySummary(): AttributionSummary {
  return {
    conversions: 0,
    revenue: 0,
    attributedConversions: 0,
    attributedRevenue: 0,
    unattributedConversions: 0,
    attributionRate: 0,
    unattributedRate: 0,
    multiTouchConversions: 0,
    assistedConversions: 0,
    averageTouchpoints: 0,
    averageTimeToConversionHours: 0,
    newConversions: 0,
    attributedNewConversions: 0,
    spend: 0,
    impressions: 0,
    clicks: 0,
    roas: 0,
    cpa: 0,
  }
}

function finalizeSummary(summary: AttributionSummary) {
  summary.attributionRate = safeDivide(summary.attributedConversions, summary.conversions)
  summary.unattributedRate = safeDivide(summary.unattributedConversions, summary.conversions)
  summary.averageTouchpoints = safeDivide(summary.averageTouchpoints, summary.conversions)
  summary.averageTimeToConversionHours = safeDivide(summary.averageTimeToConversionHours, summary.attributedConversions)
  summary.roas = safeDivide(summary.attributedRevenue, summary.spend)
  summary.cpa = safeDivide(summary.spend, summary.attributedConversions)
}

function periods(payload: AttributionJson, filters: AppliedFilters) {
  const months = payload.dims.months.filter((month) => !filters.quarter || quarterOf(month) === filters.quarter)
  return filters.quarter ? quarterLabel(filters.quarter) : `${months[0] ?? '-'} - ${months[months.length - 1] ?? '-'}`
}

function filterLabel(filters: AppliedFilters) {
  return [filters.region ?? 'Semua Wilayah', filters.city, filters.outlet, filters.gender, filters.ageBand ? `${filters.ageBand} tahun` : null].filter(Boolean).join(' · ')
}

function buildInsights(result: Omit<AttributionResult, 'insights'>): AttributionInsight[] {
  const insights: AttributionInsight[] = []
  const topChannel = result.channels[0]
  const weakRoas = result.channels.find((row) => row.spend > 0 && row.roas < result.summary.roas * 0.75)
  const unattributedHigh = result.summary.unattributedRate > 0.5
  const noMulti = result.summary.multiTouchConversions === 0
  if (topChannel) insights.push({
    title: `${topChannel.label} memimpin attributed revenue`,
    evidence: `${Math.round(topChannel.revenueShare * 100).toLocaleString('id-ID')}% attributed revenue berasal dari channel ini pada model ${attributionModelLabels[result.localFilters.model]}.`,
    action: 'Gunakan sebagai referensi alokasi, tetapi validasi dengan lift test sebelum menyebutnya incremental.',
    priority: 'medium',
  })
  if (weakRoas) insights.push({
    title: `${weakRoas.label} perlu audit efisiensi`,
    evidence: `ROAS attribution ${weakRoas.roas.toFixed(2).replace('.', ',')}x berada di bawah blended average.`,
    action: 'Review campaign dengan spend tinggi dan attributed revenue rendah sebelum scaling.',
    priority: 'high',
  })
  if (unattributedHigh) insights.push({
    title: 'Coverage touchpoint masih terbatas',
    evidence: `${Math.round(result.summary.unattributedRate * 100).toLocaleString('id-ID')}% conversion tidak memiliki touchpoint CampaignID dalam attribution window.`,
    action: 'Lengkapi event tracking customer-level sebelum memakai attribution untuk keputusan budget besar.',
    priority: 'high',
  })
  if (noMulti) insights.push({
    title: 'Multi-touch belum tersedia dari data saat ini',
    evidence: 'Path eligible hanya satu touchpoint, sehingga model first, last, linear, dan position-based menghasilkan credit yang sama.',
    action: 'Tambahkan impression/click/session touchpoint dengan identity resolution sebelum mengaktifkan analisis fractional journey.',
    priority: 'medium',
  })
  return insights.slice(0, 6)
}

export function queryAttribution(payload: AttributionJson, filters: AppliedFilters, local: AttributionLocalFilters): AttributionResult {
  const modelIndex = payload.dims.models.indexOf(local.model)
  const summary = emptySummary()
  const mediaCampaigns = new Set<number>()

  payload.summaryFacts.forEach((row) => {
    if (row[S.window] !== local.window) return
    if (!matchesCommon(payload, filters, row[S.month]!, row[S.outlet]!, row[S.gender]!, row[S.age]!)) return
    if (!matchesCustomerType(local, row[S.customerType]!)) return
    if (!scopeMatches(payload, local, row[S.pathType]!, row[S.firstTouch]!, row[S.lastTouch]!)) return
    addSummary(summary, row)
  })

  const channelMap = new Map<string, AttributionChannelRow>()
  const campaignMap = new Map<string, AttributionCampaignRow>()
  const modelSpendCampaigns = new Set<number>()

  payload.creditFacts.forEach((row) => {
    if (row[CF.window] !== local.window || row[CF.model] !== modelIndex) return
    if (!matchesCommon(payload, filters, row[CF.month]!, row[CF.outlet]!, row[CF.gender]!, row[CF.age]!)) return
    if (!matchesCustomerType(local, row[CF.customerType]!)) return
    if (!scopeMatches(payload, local, row[CF.pathType]!, row[CF.firstTouch]!, row[CF.lastTouch]!)) return
    const channel = payload.dims.channels[row[CF.channel]!] ?? 'Unknown'
    const campaign = payload.dims.campaigns[row[CF.campaign]!]
    if (local.channel !== 'all' && channel !== local.channel) return
    if (local.campaign !== 'all' && campaign?.id !== local.campaign) return
    mediaCampaigns.add(row[CF.campaign]!)
    modelSpendCampaigns.add(row[CF.campaign]!)

    const channelRow = channelMap.get(channel) ?? {
      id: channel,
      label: channel,
      attributedConversions: 0,
      attributedRevenue: 0,
      creditShare: 0,
      revenueShare: 0,
      spend: 0,
      clicks: 0,
      impressions: 0,
      roas: 0,
      cpa: 0,
      firstConversions: 0,
      lastConversions: 0,
      assistedConversions: 0,
      averagePosition: 0,
      averageLagHours: 0,
    }
    channelRow.attributedConversions += row[CF.credit] ?? 0
    channelRow.attributedRevenue += row[CF.revenue] ?? 0
    channelRow.firstConversions += row[CF.firstConversions] ?? 0
    channelRow.lastConversions += row[CF.lastConversions] ?? 0
    channelRow.assistedConversions += row[CF.assistedConversions] ?? 0
    channelRow.averagePosition += row[CF.positionCredit] ?? 0
    channelRow.averageLagHours += row[CF.timeHoursCredit] ?? 0
    channelMap.set(channel, channelRow)

    if (!campaign) return
    const campaignRow = campaignMap.get(campaign.id) ?? {
      ...channelRow,
      id: campaign.id,
      campaignId: campaign.id,
      campaignName: campaign.name,
      channel,
      objective: campaign.objective,
      label: campaign.name,
      attributedConversions: 0,
      attributedRevenue: 0,
      firstConversions: 0,
      lastConversions: 0,
      assistedConversions: 0,
      averagePosition: 0,
      averageLagHours: 0,
      spend: 0,
      impressions: 0,
      clicks: 0,
      roas: 0,
      cpa: 0,
      creditShare: 0,
      revenueShare: 0,
    }
    campaignRow.attributedConversions += row[CF.credit] ?? 0
    campaignRow.attributedRevenue += row[CF.revenue] ?? 0
    campaignRow.firstConversions += row[CF.firstConversions] ?? 0
    campaignRow.lastConversions += row[CF.lastConversions] ?? 0
    campaignRow.assistedConversions += row[CF.assistedConversions] ?? 0
    campaignRow.averagePosition += row[CF.positionCredit] ?? 0
    campaignRow.averageLagHours += row[CF.timeHoursCredit] ?? 0
    campaignMap.set(campaign.id, campaignRow)
  })

  payload.mediaFacts.forEach((row) => {
    const monthKey = payload.dims.months[row[MF.month]!]
    if (!monthKey || (filters.quarter && quarterOf(monthKey) !== filters.quarter)) return
    if (!mediaCampaigns.has(row[MF.campaign]!)) return
    const campaign = payload.dims.campaigns[row[MF.campaign]!]
    if (!campaign) return
    const channelRow = channelMap.get(campaign.platform)
    const campaignRow = campaignMap.get(campaign.id)
    const patch = { spend: row[MF.spend] ?? 0, impressions: row[MF.impressions] ?? 0, clicks: row[MF.clicks] ?? 0 }
    if (channelRow) Object.assign(channelRow, { spend: channelRow.spend + patch.spend, impressions: channelRow.impressions + patch.impressions, clicks: channelRow.clicks + patch.clicks })
    if (campaignRow) Object.assign(campaignRow, { spend: campaignRow.spend + patch.spend, impressions: campaignRow.impressions + patch.impressions, clicks: campaignRow.clicks + patch.clicks })
    if (modelSpendCampaigns.has(row[MF.campaign]!)) {
      summary.spend += patch.spend
      summary.impressions += patch.impressions
      summary.clicks += patch.clicks
    }
  })

  finalizeSummary(summary)
  const channels = [...channelMap.values()].map((row) => ({
    ...row,
    creditShare: safeDivide(row.attributedConversions, summary.attributedConversions),
    revenueShare: safeDivide(row.attributedRevenue, summary.attributedRevenue),
    roas: safeDivide(row.attributedRevenue, row.spend),
    cpa: safeDivide(row.spend, row.attributedConversions),
    averagePosition: safeDivide(row.averagePosition, row.attributedConversions),
    averageLagHours: safeDivide(row.averageLagHours, row.attributedConversions),
  })).sort((a, b) => b.attributedRevenue - a.attributedRevenue)

  const campaigns = [...campaignMap.values()].map((row) => ({
    ...row,
    creditShare: safeDivide(row.attributedConversions, summary.attributedConversions),
    revenueShare: safeDivide(row.attributedRevenue, summary.attributedRevenue),
    roas: safeDivide(row.attributedRevenue, row.spend),
    cpa: safeDivide(row.spend, row.attributedConversions),
    averagePosition: safeDivide(row.averagePosition, row.attributedConversions),
    averageLagHours: safeDivide(row.averageLagHours, row.attributedConversions),
  })).sort((a, b) => b.attributedRevenue - a.attributedRevenue)

  const pathTotal = payload.pathFacts.reduce((sum, row) => {
    if (row[P.window] !== local.window) return sum
    if (!matchesCommon(payload, filters, row[P.month]!, row[P.outlet]!, row[P.gender]!, row[P.age]!)) return sum
    if (!matchesCustomerType(local, row[P.customerType]!)) return sum
    if (!pathMatches(payload, local, row)) return sum
    return sum + (row[P.count] ?? 0)
  }, 0)

  const pathMap = new Map<string, AttributionPathRow>()
  payload.pathFacts.forEach((row) => {
    if (row[P.window] !== local.window) return
    if (!matchesCommon(payload, filters, row[P.month]!, row[P.outlet]!, row[P.gender]!, row[P.age]!)) return
    if (!matchesCustomerType(local, row[P.customerType]!)) return
    if (!pathMatches(payload, local, row)) return
    const label = payload.dims.paths[row[P.path]!] ?? 'Unknown'
    const item = pathMap.get(label) ?? { path: label, count: 0, revenue: 0, share: 0, averageTouchpoints: 0, averageLagHours: 0, newShare: 0 }
    item.count += row[P.count] ?? 0
    item.revenue += row[P.revenue] ?? 0
    item.averageTouchpoints += row[P.touchpoints] ?? 0
    item.averageLagHours += row[P.timeHours] ?? 0
    item.newShare += row[P.newConversions] ?? 0
    pathMap.set(label, item)
  })
  const topPaths = [...pathMap.values()]
    .filter((row) => row.count >= local.minPathCount)
    .map((row) => ({ ...row, share: safeDivide(row.count, pathTotal), averageTouchpoints: safeDivide(row.averageTouchpoints, row.count), averageLagHours: safeDivide(row.averageLagHours, row.count), newShare: safeDivide(row.newShare, row.count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  const positionMap = new Map<string, { channel: string; first: number; middle: number; last: number }>()
  payload.positionFacts.forEach((row) => {
    if (row[POS.window] !== local.window) return
    const monthKey = payload.dims.months[row[POS.month]!]
    if (!monthKey || (filters.quarter && quarterOf(monthKey) !== filters.quarter)) return
    const channel = payload.dims.channels[row[POS.channel]!] ?? 'Unknown'
    if (local.channel !== 'all' && channel !== local.channel) return
    const item = positionMap.get(channel) ?? { channel, first: 0, middle: 0, last: 0 }
    const position = payload.dims.positions[row[POS.position]!] as 'first' | 'middle' | 'last'
    item[position] += row[POS.credit] ?? 0
    positionMap.set(channel, item)
  })

  const pairs = payload.pairFacts
    .filter((row) => row[PAIR.window] === local.window)
    .filter((row) => !filters.quarter || quarterOf(payload.dims.months[row[PAIR.month]!] ?? '') === filters.quarter)
    .map((row) => ({
      source: payload.dims.channels[row[PAIR.source]!] ?? 'Unknown',
      target: payload.dims.channels[row[PAIR.target]!] ?? 'Unknown',
      count: row[PAIR.count] ?? 0,
      revenue: row[PAIR.revenue] ?? 0,
      averageLagHours: safeDivide(row[PAIR.timeHours] ?? 0, row[PAIR.count] ?? 0),
      newShare: safeDivide(row[PAIR.newConversions] ?? 0, row[PAIR.count] ?? 0),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const modelComparison = attributionModels.map((model) => {
    const modelResult = queryModelSummary(payload, filters, local, model)
    return {
      model,
      label: attributionModelLabels[model],
      attributedConversions: modelResult.attributedConversions,
      attributedRevenue: modelResult.attributedRevenue,
      topChannel: modelResult.topChannel,
      topCampaign: modelResult.topCampaign,
      roas: modelResult.roas,
      cpa: modelResult.cpa,
    }
  }).sort((a, b) => {
    if (local.comparisonMetric === 'conversions') return b.attributedConversions - a.attributedConversions
    if (local.comparisonMetric === 'roas') return b.roas - a.roas
    if (local.comparisonMetric === 'cpa') return a.cpa - b.cpa
    return b.attributedRevenue - a.attributedRevenue
  })

  const pathLengths = [
    { label: 'Unattributed', count: topPaths.filter((row) => row.path === 'Unattributed').reduce((sum, row) => sum + row.count, 0), share: 0 },
    { label: 'Single-touch', count: topPaths.filter((row) => row.path !== 'Unattributed' && !row.path.includes(' > ')).reduce((sum, row) => sum + row.count, 0), share: 0 },
    { label: 'Multi-touch', count: topPaths.filter((row) => row.path.includes(' > ')).reduce((sum, row) => sum + row.count, 0), share: 0 },
  ].map((row) => ({ ...row, share: safeDivide(row.count, pathTotal) }))

  const timeBuckets = [
    { label: '< 1 jam', count: topPaths.filter((row) => row.averageLagHours < 1).reduce((sum, row) => sum + row.count, 0), share: 0 },
    { label: '1-24 jam', count: topPaths.filter((row) => row.averageLagHours >= 1 && row.averageLagHours <= 24).reduce((sum, row) => sum + row.count, 0), share: 0 },
    { label: '> 24 jam', count: topPaths.filter((row) => row.averageLagHours > 24).reduce((sum, row) => sum + row.count, 0), share: 0 },
  ].map((row) => ({ ...row, share: safeDivide(row.count, pathTotal) }))

  const resultWithoutInsights = {
    periodLabel: periods(payload, filters),
    filterLabel: filterLabel(filters),
    localFilters: local,
    summary,
    kpis: [
      { id: 'attributed-revenue', label: 'Attributed Revenue', value: summary.attributedRevenue, detail: `${attributionModelLabels[local.model]} · ${local.window} hari`, display: 'currency', tone: 'blue' },
      { id: 'attribution-rate', label: 'Attribution Coverage', value: summary.attributionRate, detail: `${Math.round(summary.unattributedConversions).toLocaleString('id-ID')} conversion unattributed`, display: 'percent', tone: 'purple' },
      { id: 'attributed-conversions', label: 'Attributed Conversions', value: summary.attributedConversions, detail: 'Credit total lintas campaign = conversion count', display: 'number', tone: 'cyan' },
      { id: 'rule-roas', label: 'Rule-Based ROAS', value: summary.roas, detail: 'Bukan causal incrementality', display: 'ratio', tone: 'orange' },
    ] satisfies AttributionKpi[],
    channels,
    campaigns,
    topPaths,
    pathLength: pathLengths,
    timeBuckets,
    positionRows: [...positionMap.values()],
    pairs,
    modelComparison,
    availableChannels: payload.dims.channels,
    availableCampaigns: payload.dims.campaigns.map((campaign) => ({ id: campaign.id, name: campaign.name, channel: campaign.platform })),
    availablePaths: payload.dims.paths,
    validationNote: `${payload.meta.validation.checkedConversions.toLocaleString('id-ID')} attributed conversion sudah divalidasi. Credit per conversion = 1 dan attributed revenue per conversion = conversion revenue.`,
    methodologyNotes: [
      payload.meta.conversionDefinition,
      payload.meta.touchpointDefinition,
      payload.meta.limitation,
      summary.multiTouchConversions === 0 ? 'Dataset aktif belum memiliki eligible multi-touch conversion; model multi-touch akan sama dengan single-touch sampai touchpoint history tersedia.' : 'Conversion dengan lebih dari satu touchpoint menghasilkan fractional credit sesuai model aktif.',
    ],
  }

  return { ...resultWithoutInsights, insights: buildInsights(resultWithoutInsights) }
}

function queryModelSummary(payload: AttributionJson, filters: AppliedFilters, local: AttributionLocalFilters, model: AttributionModel) {
  const modelIndex = payload.dims.models.indexOf(model)
  const channels = new Map<string, number>()
  const campaigns = new Map<string, number>()
  let attributedConversions = 0
  let attributedRevenue = 0
  let spend = 0
  const touchedCampaigns = new Set<number>()
  payload.creditFacts.forEach((row) => {
    if (row[CF.window] !== local.window || row[CF.model] !== modelIndex) return
    if (!matchesCommon(payload, filters, row[CF.month]!, row[CF.outlet]!, row[CF.gender]!, row[CF.age]!)) return
    if (!matchesCustomerType(local, row[CF.customerType]!)) return
    if (!scopeMatches(payload, local, row[CF.pathType]!, row[CF.firstTouch]!, row[CF.lastTouch]!)) return
    const channel = payload.dims.channels[row[CF.channel]!] ?? 'Unknown'
    const campaign = payload.dims.campaigns[row[CF.campaign]!]
    if (local.channel !== 'all' && channel !== local.channel) return
    if (local.campaign !== 'all' && campaign?.id !== local.campaign) return
    attributedConversions += row[CF.credit] ?? 0
    attributedRevenue += row[CF.revenue] ?? 0
    channels.set(channel, (channels.get(channel) ?? 0) + (row[CF.revenue] ?? 0))
    if (campaign) campaigns.set(campaign.name, (campaigns.get(campaign.name) ?? 0) + (row[CF.revenue] ?? 0))
    touchedCampaigns.add(row[CF.campaign]!)
  })
  payload.mediaFacts.forEach((row) => {
    const monthKey = payload.dims.months[row[MF.month]!]
    if (!monthKey || (filters.quarter && quarterOf(monthKey) !== filters.quarter)) return
    if (touchedCampaigns.has(row[MF.campaign]!)) spend += row[MF.spend] ?? 0
  })
  const topChannel = [...channels.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-'
  const topCampaign = [...campaigns.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-'
  return { attributedConversions, attributedRevenue, topChannel, topCampaign, roas: safeDivide(attributedRevenue, spend), cpa: safeDivide(spend, attributedConversions) }
}

export function isAttributionWindow(value: number): value is AttributionWindow {
  return attributionWindows.includes(value as AttributionWindow)
}
