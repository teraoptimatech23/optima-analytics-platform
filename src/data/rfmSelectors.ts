import { quarterLabel, quarterOf } from '@/data/cube'
import { rfmConfig, rfmSegmentMap, rfmSegments } from '@/config/rfmConfig'
import type { AppliedFilters } from '@/data/types'
import type { RFMSegmentId, RFMScore, RFMScoringMethod } from '@/config/rfmConfig'

type RFMObservationWindow = 'filter-period' | '90d' | '180d' | '365d' | 'lifetime'
type RFMScopeMode = 'global' | 'scoped'
type RFMMovement = 'upgraded' | 'stable' | 'downgraded' | 'reactivated' | 'new'
type RFMMembership = 'all' | 'member' | 'non-member'
export type RFMComparisonDimension = 'segment' | 'age' | 'gender' | 'occupation' | 'member' | 'channel' | 'location' | 'product' | 'acquisition'
export type RFMBubbleMetric = 'customers' | 'monetary' | 'clv'

export interface RFMLocalFilters {
  observationWindow: RFMObservationWindow
  scoringMethod: RFMScoringMethod
  segment: RFMSegmentId | 'all'
  rScore: RFMScore | 'all'
  fScore: RFMScore | 'all'
  mScore: RFMScore | 'all'
  movement: RFMMovement | 'all'
  membership: RFMMembership
  comparison: RFMComparisonDimension
  bubbleMetric: RFMBubbleMetric
  scopeMode: RFMScopeMode
  channel: string
}

export const defaultRFMLocalFilters: RFMLocalFilters = {
  observationWindow: '180d',
  scoringMethod: 'quantile',
  segment: 'all',
  rScore: 'all',
  fScore: 'all',
  mScore: 'all',
  movement: 'all',
  membership: 'all',
  comparison: 'segment',
  bubbleMetric: 'customers',
  scopeMode: 'global',
  channel: 'all',
}

export interface RFMJson {
  meta: {
    period: { start: string; end: string }
    validTransactions: number
    customers: number
    methodology: string[]
  }
  dims: {
    customerIds: string[]
    months: string[]
    outlets: { id: string; name: string; city: string; region: string; type: string }[]
    genders: string[]
    ageBands: string[]
    occupations: string[]
    customerSegments: string[]
    acquisitions: string[]
    channels: string[]
    products: { id: string; name: string; category: string }[]
    categories: string[]
  }
  customers: number[][]
  customerMonthly: number[][]
}

const CUSTOMER = {
  homeOutlet: 0, gender: 1, age: 2, occupation: 3, segment: 4, acquisition: 5,
  member: 6, clv: 7, avgSat: 8, nps: 9, favoriteCategory: 10, favoriteProduct: 11,
} as const

const MONTHLY = {
  customer: 0, month: 1, outlet: 2, channel: 3, tx: 4, net: 5, gross: 6,
  discount: 7, voucher: 8, campaign: 9, memberTx: 10, sat: 11, wait: 12,
  items: 13, firstDate: 14, lastDate: 15,
} as const

export interface RFMCustomerRecord {
  customerIndex: number
  customerId: string
  analysisDate: string
  firstPurchaseDate: string
  lastPurchaseDate: string
  recencyDays: number
  transactionCount: number
  monetary: number
  averageBasket: number
  activeMonths: number
  rScore: RFMScore
  fScore: RFMScore
  mScore: RFMScore
  rfmCode: string
  rfmTotalScore: number
  segmentId: RFMSegmentId
  segmentLabel: string
  previousSegmentId?: RFMSegmentId
  previousSegmentLabel?: string
  movement: RFMMovement
  member: boolean
  preferredChannel: string
  preferredOutlet: string
  favoriteProduct: string
  favoriteCategory: string
  voucherUsageRate: number
  campaignUsageRate: number
  clv: number
  satisfaction: number
  nps: number
  ageBand: string
  gender: string
  occupation: string
  customerSegment: string
  acquisition: string
  city: string
  region: string
}

export interface RFMSummary {
  analysisDate: string
  periodLabel: string
  filterLabel: string
  observationWindowLabel: string
  observationWindowStart: string
  eligibleCustomers: number
  averageRecency: number
  medianRecency: number
  averageFrequency: number
  averageMonetary: number
  totalMonetary: number
  champions: number
  championsShare: number
  loyalCustomers: number
  loyalShare: number
  atRiskCustomers: number
  atRiskShare: number
  lostCustomers: number
  lostShare: number
  highValueShare: number
  movementRate: number
  comparableCustomers: number
}

export interface RFMKpi {
  id: string
  label: string
  value: number
  display: 'number' | 'days' | 'frequency' | 'currency' | 'percent'
  detail: string
  delta?: number
  tone: 'blue' | 'purple' | 'cyan' | 'orange' | 'green' | 'red'
}

export interface RFMSegmentMetric {
  segmentId: RFMSegmentId
  label: string
  customerCount: number
  customerShare: number
  averageRecency: number
  averageFrequency: number
  averageMonetary: number
  totalMonetary: number
  revenueShare: number
  averageBasket: number
  memberRate: number
  repeatRate: number
  averageClv: number
  valueConcentrationIndex: number
  previousCustomerCount: number
  countChange: number
  countChangeRate: number
  description: string
}

export interface RFMDistributionRow {
  bucket: string
  customerCount: number
  customerShare: number
  averageRecency: number
  averageFrequency: number
  averageMonetary: number
  totalMonetary: number
  topSegment: string
  memberRate: number
}

export interface RFMMatrixCell {
  rScore: RFMScore
  fScore: RFMScore
  customerCount: number
  averageMonetary: number
  totalMonetary: number
  averageClv: number
  revenueShare: number
  topSegment: string
}

export interface RFMScoreDistributionRow {
  score: RFMScore
  recency: number
  frequency: number
  monetary: number
  recencyShare: number
  frequencyShare: number
  monetaryShare: number
}

export interface RFMDimensionComparison {
  id: string
  label: string
  customerCount: number
  championsShare: number
  loyalShare: number
  atRiskShare: number
  lostShare: number
  averageRecency: number
  averageFrequency: number
  averageMonetary: number
  averageClv: number
  topSegment: string
}

export interface RFMTransition {
  sourceSegmentId: RFMSegmentId | 'none'
  sourceLabel: string
  targetSegmentId: RFMSegmentId
  targetLabel: string
  customerCount: number
  transitionShare: number
  movement: RFMMovement
}

export interface RFMRecommendation {
  segmentId: RFMSegmentId
  title: string
  evidence: string
  action: string
  preferredChannel: string
  preferredProduct: string
  priority: 'high' | 'medium' | 'low'
  customerCount: number
  reliabilityNote: string
  route: string
}

export interface RFMAnalysisInsights {
  summary: RFMSummary
  previousSummary: RFMSummary | null
  kpis: RFMKpi[]
  customers: RFMCustomerRecord[]
  segments: RFMSegmentMetric[]
  matrix: RFMMatrixCell[]
  scoreDistribution: RFMScoreDistributionRow[]
  recencyDistribution: RFMDistributionRow[]
  frequencyDistribution: RFMDistributionRow[]
  monetaryDistribution: RFMDistributionRow[]
  comparisonRows: RFMDimensionComparison[]
  channelComparisons: RFMDimensionComparison[]
  locationComparisons: RFMDimensionComparison[]
  productComparisons: RFMDimensionComparison[]
  acquisitionComparisons: RFMDimensionComparison[]
  transitions: RFMTransition[]
  insights: string[]
  recommendations: RFMRecommendation[]
  available: {
    channels: string[]
    segments: Array<{ id: RFMSegmentId; label: string }>
  }
  methodology: string[]
  scopeNote: string
  insufficientSample: boolean
}

const dayMs = 24 * 60 * 60 * 1000
const safeDivide = (value: number, total: number) => (total ? value / total : 0)
const clampScore = (value: number): RFMScore => Math.max(1, Math.min(5, Math.round(value))) as RFMScore
const toDate = (ymd: string | number) => {
  const text = String(ymd)
  if (text.includes('-')) return new Date(`${text}T00:00:00`)
  return new Date(`${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}T00:00:00`)
}
const toYmd = (date: Date) => date.toISOString().slice(0, 10)
const daysBetween = (from: string | number, to: string | number) => Math.max(0, Math.round((toDate(to).getTime() - toDate(from).getTime()) / dayMs))
const endOfMonth = (month: string) => {
  const [year, monthIndex] = month.split('-').map(Number)
  return new Date(year ?? 2026, monthIndex ?? 1, 0)
}
const startOfMonth = (month: string) => {
  const [year, monthIndex] = month.split('-').map(Number)
  return new Date(year ?? 2026, (monthIndex ?? 1) - 1, 1)
}
const formatIdDate = (date: Date) => Number(toYmd(date).replaceAll('-', ''))

function percentile(values: number[], p: number) {
  if (!values.length) return 0
  const sorted = values.slice().sort((a, b) => a - b)
  const position = (sorted.length - 1) * p
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sorted[lower] ?? 0
  const weight = position - lower
  return (sorted[lower] ?? 0) * (1 - weight) + (sorted[upper] ?? 0) * weight
}

function median(values: number[]) {
  return percentile(values, 0.5)
}

function monthScope(data: RFMJson, filters: AppliedFilters) {
  const indices: number[] = []
  data.dims.months.forEach((month, index) => {
    if (!filters.quarter || quarterOf(month) === filters.quarter) indices.push(index)
  })
  const fallback = data.dims.months.map((_, index) => index)
  const active = indices.length ? indices : fallback
  const firstMonth = data.dims.months[Math.min(...active)] ?? data.dims.months[0]!
  const lastMonth = data.dims.months[Math.max(...active)] ?? data.dims.months[data.dims.months.length - 1]!
  return {
    months: new Set(active),
    firstMonth,
    lastMonth,
    periodStart: startOfMonth(firstMonth),
    analysisDate: endOfMonth(lastMonth),
    label: filters.quarter ? quarterLabel(filters.quarter) : 'Semua Periode',
  }
}

function previousScope(scope: ReturnType<typeof monthScope>) {
  const periodDays = Math.max(1, Math.round((scope.analysisDate.getTime() - scope.periodStart.getTime()) / dayMs) + 1)
  const previousEnd = new Date(scope.periodStart.getTime() - dayMs)
  const previousStart = new Date(previousEnd.getTime() - (periodDays - 1) * dayMs)
  return { analysisDate: previousEnd, periodStart: previousStart }
}

function observationStart(data: RFMJson, window: RFMObservationWindow, periodStart: Date, analysisDate: Date) {
  const config = rfmConfig.observationWindows.find((item) => item.id === window) ?? rfmConfig.observationWindows[2]
  if (window === 'lifetime') return toDate(data.meta.period.start)
  if (window === 'filter-period') return periodStart
  const days = config.days ?? 180
  return new Date(analysisDate.getTime() - (days - 1) * dayMs)
}

function globalCustomerPass(data: RFMJson, customer: number[], filters: AppliedFilters) {
  const homeOutlet = data.dims.outlets[customer[CUSTOMER.homeOutlet] ?? -1]
  if (filters.region && homeOutlet?.region !== filters.region) return false
  if (filters.city && homeOutlet?.city !== filters.city) return false
  if (filters.outlet && homeOutlet?.id !== filters.outlet) return false
  if (filters.gender && data.dims.genders[customer[CUSTOMER.gender] ?? -1] !== filters.gender) return false
  if (filters.ageBand && data.dims.ageBands[customer[CUSTOMER.age] ?? -1] !== filters.ageBand) return false
  return true
}

function monthlyPass(data: RFMJson, row: number[], filters: AppliedFilters, channel: string) {
  const outlet = data.dims.outlets[row[MONTHLY.outlet]!]
  const customer = data.customers[row[MONTHLY.customer]!]!
  if (filters.region && outlet?.region !== filters.region) return false
  if (filters.city && outlet?.city !== filters.city) return false
  if (filters.outlet && outlet?.id !== filters.outlet) return false
  if (filters.gender && data.dims.genders[customer[CUSTOMER.gender] ?? -1] !== filters.gender) return false
  if (filters.ageBand && data.dims.ageBands[customer[CUSTOMER.age] ?? -1] !== filters.ageBand) return false
  if (channel !== 'all' && data.dims.channels[row[MONTHLY.channel]!] !== channel) return false
  return true
}

interface RawCustomerMetric {
  customerIndex: number
  rows: number[][]
  firstDate: number
  lastDate: number
  transactionCount: number
  monetary: number
  voucherTx: number
  campaignTx: number
  memberTx: number
  satSum: number
  itemQty: number
  activeMonths: Set<number>
  byChannel: Map<number, number>
  byOutlet: Map<number, number>
}

function collectMetrics(data: RFMJson, filters: AppliedFilters, local: RFMLocalFilters, analysisDate: Date, periodStart: Date) {
  const analysisYmd = formatIdDate(analysisDate)
  const startYmd = formatIdDate(observationStart(data, local.observationWindow, periodStart, analysisDate))
  const eligible = new Set<number>()
  const scopedRowsByCustomer = new Map<number, number[][]>()

  for (const row of data.customerMonthly) {
    if (row[MONTHLY.lastDate]! > analysisYmd) continue
    if (!monthlyPass(data, row, filters, local.channel)) continue
    const customerIndex = row[MONTHLY.customer]!
    if (!globalCustomerPass(data, data.customers[customerIndex]!, filters)) continue
    eligible.add(customerIndex)
    const rows = scopedRowsByCustomer.get(customerIndex) ?? []
    rows.push(row)
    scopedRowsByCustomer.set(customerIndex, rows)
  }

  const metrics = new Map<number, RawCustomerMetric>()
  for (const row of data.customerMonthly) {
    const customerIndex = row[MONTHLY.customer]!
    if (!eligible.has(customerIndex)) continue
    if (row[MONTHLY.lastDate]! > analysisYmd || row[MONTHLY.lastDate]! < startYmd) continue
    if (local.scopeMode === 'scoped' && !monthlyPass(data, row, filters, local.channel)) continue
    if (local.scopeMode === 'global' && !globalCustomerPass(data, data.customers[customerIndex]!, filters)) continue
    const cell = metrics.get(customerIndex) ?? {
      customerIndex,
      rows: [],
      firstDate: row[MONTHLY.firstDate]!,
      lastDate: row[MONTHLY.lastDate]!,
      transactionCount: 0,
      monetary: 0,
      voucherTx: 0,
      campaignTx: 0,
      memberTx: 0,
      satSum: 0,
      itemQty: 0,
      activeMonths: new Set<number>(),
      byChannel: new Map<number, number>(),
      byOutlet: new Map<number, number>(),
    }
    cell.rows.push(row)
    cell.firstDate = Math.min(cell.firstDate, row[MONTHLY.firstDate]!)
    cell.lastDate = Math.max(cell.lastDate, row[MONTHLY.lastDate]!)
    cell.transactionCount += row[MONTHLY.tx]!
    cell.monetary += row[MONTHLY.net]!
    cell.voucherTx += row[MONTHLY.voucher]!
    cell.campaignTx += row[MONTHLY.campaign]!
    cell.memberTx += row[MONTHLY.memberTx]!
    cell.satSum += row[MONTHLY.sat]!
    cell.itemQty += row[MONTHLY.items]!
    cell.activeMonths.add(row[MONTHLY.month]!)
    cell.byChannel.set(row[MONTHLY.channel]!, (cell.byChannel.get(row[MONTHLY.channel]!) ?? 0) + row[MONTHLY.tx]!)
    cell.byOutlet.set(row[MONTHLY.outlet]!, (cell.byOutlet.get(row[MONTHLY.outlet]!) ?? 0) + row[MONTHLY.tx]!)
    metrics.set(customerIndex, cell)
  }
  return { metrics: [...metrics.values()].filter((row) => row.transactionCount >= rfmConfig.minimumTransactions), startYmd }
}

function scoreByQuantile(values: number[], lowIsBetter: boolean) {
  const unique = [...new Set(values)].sort((a, b) => a - b)
  const scores = new Map<number, RFMScore>()
  if (unique.length === 1) {
    scores.set(unique[0]!, 3)
    return scores
  }
  unique.forEach((value, index) => {
    const percentileRank = index / (unique.length - 1)
    const highScore = Math.floor(percentileRank * (rfmConfig.scoreScale - 1)) + 1
    scores.set(value, clampScore(lowIsBetter ? rfmConfig.scoreScale + 1 - highScore : highScore))
  })
  return scores
}

function scoreBusiness(value: number, metric: 'recency' | 'frequency' | 'monetary') {
  if (metric === 'recency') return clampScore(rfmConfig.businessThresholds.recency.find((rule) => value <= rule.max)?.score ?? 1)
  const rules = metric === 'frequency' ? rfmConfig.businessThresholds.frequency : rfmConfig.businessThresholds.monetary
  return clampScore(rules.find((rule) => value >= rule.min)?.score ?? 1)
}

function segmentFor(rScore: RFMScore, fScore: RFMScore, mScore: RFMScore): RFMSegmentId {
  if (rScore <= 0 || fScore <= 0 || mScore <= 0) return 'unclassified'
  if (rScore <= 1 && fScore >= 4 && mScore >= 4) return 'cannot-lose-them'
  if (rScore >= 5 && fScore >= 4 && mScore >= 4) return 'champions'
  if (fScore >= 4 && rScore >= 3) return 'loyal-customers'
  if (rScore >= 4 && fScore >= 2) return 'potential-loyalists'
  if (rScore === 5 && fScore === 1) return 'new-customers'
  if (rScore >= 4 && fScore <= 2) return 'promising'
  if (rScore === 3 && (fScore >= 3 || mScore >= 3)) return 'need-attention'
  if (rScore === 2 && fScore <= 2) return 'about-to-sleep'
  if (rScore <= 2 && (fScore >= 3 || mScore >= 3)) return 'at-risk'
  if (rScore === 1 && fScore <= 2 && mScore <= 2) return 'lost-customers'
  if (rScore <= 2) return 'hibernating'
  return 'need-attention'
}

function topIndex(map: Map<number, number>) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? -1
}

function productPreference(data: RFMJson, customerIndex: number) {
  const customer = data.customers[customerIndex]!
  return {
    product: data.dims.products[customer[CUSTOMER.favoriteProduct] ?? -1]?.name ?? 'Unknown Product',
    category: data.dims.categories[customer[CUSTOMER.favoriteCategory] ?? -1] ?? 'Unknown Category',
  }
}

function buildSnapshot(data: RFMJson, filters: AppliedFilters, local: RFMLocalFilters, analysisDate: Date, periodStart: Date) {
  const collected = collectMetrics(data, filters, local, analysisDate, periodStart)
  const raw = collected.metrics
  const recencies = raw.map((row) => daysBetween(row.lastDate, formatIdDate(analysisDate)))
  const frequencies = raw.map((row) => row.transactionCount)
  const monetaries = raw.map((row) => row.monetary)
  const rScores = local.scoringMethod === 'quantile' ? scoreByQuantile(recencies, true) : null
  const fScores = local.scoringMethod === 'quantile' ? scoreByQuantile(frequencies, false) : null
  const mScores = local.scoringMethod === 'quantile' ? scoreByQuantile(monetaries, false) : null

  const records = raw.map<RFMCustomerRecord>((row) => {
    const customer = data.customers[row.customerIndex]!
    const outletIndex = topIndex(row.byOutlet)
    const channelIndex = topIndex(row.byChannel)
    const recencyDays = daysBetween(row.lastDate, formatIdDate(analysisDate))
    const transactionCount = row.transactionCount
    const monetary = row.monetary
    const rScore = local.scoringMethod === 'quantile' ? (rScores?.get(recencyDays) ?? 1) : scoreBusiness(recencyDays, 'recency')
    const fScore = local.scoringMethod === 'quantile' ? (fScores?.get(transactionCount) ?? 1) : scoreBusiness(transactionCount, 'frequency')
    const mScore = local.scoringMethod === 'quantile' ? (mScores?.get(monetary) ?? 1) : scoreBusiness(monetary, 'monetary')
    const segmentId = segmentFor(rScore, fScore, mScore)
    const preference = productPreference(data, row.customerIndex)
    const outlet = data.dims.outlets[outletIndex] ?? data.dims.outlets[customer[CUSTOMER.homeOutlet] ?? -1]
    return {
      customerIndex: row.customerIndex,
      customerId: data.dims.customerIds[row.customerIndex] ?? `CUS-${row.customerIndex}`,
      analysisDate: toYmd(analysisDate),
      firstPurchaseDate: toYmd(toDate(row.firstDate)),
      lastPurchaseDate: toYmd(toDate(row.lastDate)),
      recencyDays,
      transactionCount,
      monetary,
      averageBasket: safeDivide(monetary, transactionCount),
      activeMonths: row.activeMonths.size,
      rScore,
      fScore,
      mScore,
      rfmCode: `${rScore}${fScore}${mScore}`,
      rfmTotalScore: rScore + fScore + mScore,
      segmentId,
      segmentLabel: rfmSegmentMap[segmentId].label,
      movement: 'new' as RFMMovement,
      member: Boolean(customer[CUSTOMER.member]),
      preferredChannel: data.dims.channels[channelIndex] ?? 'Unknown Channel',
      preferredOutlet: outlet?.name ?? 'Unknown Outlet',
      favoriteProduct: preference.product,
      favoriteCategory: preference.category,
      voucherUsageRate: safeDivide(row.voucherTx, transactionCount),
      campaignUsageRate: safeDivide(row.campaignTx, transactionCount),
      clv: customer[CUSTOMER.clv] ?? 0,
      satisfaction: safeDivide(row.satSum, transactionCount) / 100,
      nps: customer[CUSTOMER.nps] ?? -99,
      ageBand: data.dims.ageBands[customer[CUSTOMER.age] ?? -1] ?? 'Unknown',
      gender: data.dims.genders[customer[CUSTOMER.gender] ?? -1] ?? 'Unknown',
      occupation: data.dims.occupations[customer[CUSTOMER.occupation] ?? -1] ?? 'Unknown',
      customerSegment: data.dims.customerSegments[customer[CUSTOMER.segment] ?? -1] ?? 'Unknown',
      acquisition: data.dims.acquisitions[customer[CUSTOMER.acquisition] ?? -1] ?? 'Unknown',
      city: outlet?.city ?? 'Unknown',
      region: outlet?.region ?? 'Unknown',
    }
  })
  return records
}

function applyRecordFilters(records: RFMCustomerRecord[], local: RFMLocalFilters) {
  return records.filter((record) => {
    if (local.segment !== 'all' && record.segmentId !== local.segment) return false
    if (local.rScore !== 'all' && record.rScore !== local.rScore) return false
    if (local.fScore !== 'all' && record.fScore !== local.fScore) return false
    if (local.mScore !== 'all' && record.mScore !== local.mScore) return false
    if (local.movement !== 'all' && record.movement !== local.movement) return false
    if (local.membership === 'member' && !record.member) return false
    if (local.membership === 'non-member' && record.member) return false
    return true
  })
}

function summarize(records: RFMCustomerRecord[], periodLabel: string, filterLabel: string, analysisDate: Date, observationWindow: RFMObservationWindow, windowStart: Date): RFMSummary {
  const totalMonetary = records.reduce((sum, row) => sum + row.monetary, 0)
  const champions = records.filter((row) => row.segmentId === 'champions').length
  const loyalCustomers = records.filter((row) => row.segmentId === 'loyal-customers').length
  const atRiskCustomers = records.filter((row) => row.segmentId === 'at-risk' || row.segmentId === 'cannot-lose-them').length
  const lostCustomers = records.filter((row) => row.segmentId === 'lost-customers').length
  const comparableCustomers = records.filter((row) => row.previousSegmentId).length
  const moved = records.filter((row) => row.previousSegmentId && row.previousSegmentId !== row.segmentId).length
  return {
    analysisDate: toYmd(analysisDate),
    periodLabel,
    filterLabel,
    observationWindowLabel: rfmConfig.observationWindows.find((item) => item.id === observationWindow)?.label ?? 'Rolling 180 Days',
    observationWindowStart: toYmd(windowStart),
    eligibleCustomers: records.length,
    averageRecency: safeDivide(records.reduce((sum, row) => sum + row.recencyDays, 0), records.length),
    medianRecency: median(records.map((row) => row.recencyDays)),
    averageFrequency: safeDivide(records.reduce((sum, row) => sum + row.transactionCount, 0), records.length),
    averageMonetary: safeDivide(totalMonetary, records.length),
    totalMonetary,
    champions,
    championsShare: safeDivide(champions, records.length),
    loyalCustomers,
    loyalShare: safeDivide(loyalCustomers, records.length),
    atRiskCustomers,
    atRiskShare: safeDivide(atRiskCustomers, records.length),
    lostCustomers,
    lostShare: safeDivide(lostCustomers, records.length),
    highValueShare: safeDivide(records.filter((row) => row.rfmTotalScore >= rfmConfig.highValueMinimumScore).length, records.length),
    movementRate: safeDivide(moved, comparableCustomers),
    comparableCustomers,
  }
}

function delta(current: number, previous?: number) {
  if (previous === undefined) return undefined
  return current - previous
}

function buildKpis(summary: RFMSummary, previous: RFMSummary | null): RFMKpi[] {
  return [
    { id: 'eligible', label: 'Eligible Customers', value: summary.eligibleCustomers, display: 'number', detail: 'Minimal 1 transaksi valid dalam basis analisis.', delta: delta(summary.eligibleCustomers, previous?.eligibleCustomers), tone: 'blue' },
    { id: 'recency', label: 'Average Recency', value: summary.averageRecency, display: 'days', detail: `Median ${Math.round(summary.medianRecency)} hari.`, delta: delta(summary.averageRecency, previous?.averageRecency), tone: 'cyan' },
    { id: 'frequency', label: 'Average Purchase Frequency', value: summary.averageFrequency, display: 'frequency', detail: 'TransactionID unik per customer.', delta: delta(summary.averageFrequency, previous?.averageFrequency), tone: 'purple' },
    { id: 'monetary', label: 'Average Monetary Value', value: summary.averageMonetary, display: 'currency', detail: 'NetAmount setelah diskon.', delta: delta(summary.averageMonetary, previous?.averageMonetary), tone: 'green' },
    { id: 'champions', label: 'Champions', value: summary.championsShare, display: 'percent', detail: `${summary.champions.toLocaleString('id-ID')} pelanggan.`, delta: delta(summary.championsShare, previous?.championsShare), tone: 'orange' },
    { id: 'loyal', label: 'Loyal Customers', value: summary.loyalShare, display: 'percent', detail: `${summary.loyalCustomers.toLocaleString('id-ID')} pelanggan.`, delta: delta(summary.loyalShare, previous?.loyalShare), tone: 'blue' },
    { id: 'risk', label: 'At-Risk Customers', value: summary.atRiskShare, display: 'percent', detail: `${summary.atRiskCustomers.toLocaleString('id-ID')} pelanggan, deskriptif bukan prediksi churn.`, delta: delta(summary.atRiskShare, previous?.atRiskShare), tone: 'red' },
    { id: 'movement', label: 'RFM Movement Rate', value: summary.movementRate, display: 'percent', detail: `${summary.comparableCustomers.toLocaleString('id-ID')} pelanggan comparable.`, tone: 'purple' },
  ]
}

function segmentMetrics(records: RFMCustomerRecord[], previousRecords: RFMCustomerRecord[]): RFMSegmentMetric[] {
  const revenue = records.reduce((sum, row) => sum + row.monetary, 0)
  const previousCounts = new Map<RFMSegmentId, number>()
  previousRecords.forEach((row) => previousCounts.set(row.segmentId, (previousCounts.get(row.segmentId) ?? 0) + 1))
  return rfmSegments
    .filter((segment) => segment.id !== 'unclassified')
    .map((segment) => {
      const rows = records.filter((row) => row.segmentId === segment.id)
      const totalMonetary = rows.reduce((sum, row) => sum + row.monetary, 0)
      const tx = rows.reduce((sum, row) => sum + row.transactionCount, 0)
      const previousCount = previousCounts.get(segment.id) ?? 0
      return {
        segmentId: segment.id,
        label: segment.label,
        customerCount: rows.length,
        customerShare: safeDivide(rows.length, records.length),
        averageRecency: safeDivide(rows.reduce((sum, row) => sum + row.recencyDays, 0), rows.length),
        averageFrequency: safeDivide(tx, rows.length),
        averageMonetary: safeDivide(totalMonetary, rows.length),
        totalMonetary,
        revenueShare: safeDivide(totalMonetary, revenue),
        averageBasket: safeDivide(totalMonetary, tx),
        memberRate: safeDivide(rows.filter((row) => row.member).length, rows.length),
        repeatRate: safeDivide(rows.filter((row) => row.transactionCount > 1).length, rows.length),
        averageClv: safeDivide(rows.reduce((sum, row) => sum + row.clv, 0), rows.length),
        valueConcentrationIndex: safeDivide(safeDivide(totalMonetary, revenue), safeDivide(rows.length, records.length)),
        previousCustomerCount: previousCount,
        countChange: rows.length - previousCount,
        countChangeRate: safeDivide(rows.length - previousCount, previousCount),
        description: segment.description,
      }
    })
    .sort((a, b) => b.customerCount - a.customerCount)
}

function topSegment(rows: RFMCustomerRecord[]) {
  const counts = new Map<string, number>()
  rows.forEach((row) => counts.set(row.segmentLabel, (counts.get(row.segmentLabel) ?? 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? '-'
}

function bucketDistribution(records: RFMCustomerRecord[], kind: 'recency' | 'frequency' | 'monetary') {
  const monetaryCuts = kind === 'monetary'
    ? [percentile(records.map((row) => row.monetary), 0.25), percentile(records.map((row) => row.monetary), 0.5), percentile(records.map((row) => row.monetary), 0.75), percentile(records.map((row) => row.monetary), 0.9)]
    : []
  const labels = kind === 'recency'
    ? ['0-7 hari', '8-14 hari', '15-30 hari', '31-60 hari', '61-90 hari', '91-180 hari', '>180 hari']
    : kind === 'frequency'
      ? ['1 transaksi', '2-3', '4-6', '7-10', '11-20', '>20']
      : ['P0-P25', 'P25-P50', 'P50-P75', 'P75-P90', 'P90+']
  const picker = (row: RFMCustomerRecord) => {
    if (kind === 'recency') {
      const value = row.recencyDays
      return value <= 7 ? 0 : value <= 14 ? 1 : value <= 30 ? 2 : value <= 60 ? 3 : value <= 90 ? 4 : value <= 180 ? 5 : 6
    }
    if (kind === 'frequency') {
      const value = row.transactionCount
      return value <= 1 ? 0 : value <= 3 ? 1 : value <= 6 ? 2 : value <= 10 ? 3 : value <= 20 ? 4 : 5
    }
    const value = row.monetary
    return value <= (monetaryCuts[0] ?? 0) ? 0 : value <= (monetaryCuts[1] ?? 0) ? 1 : value <= (monetaryCuts[2] ?? 0) ? 2 : value <= (monetaryCuts[3] ?? 0) ? 3 : 4
  }
  return labels.map((bucket, index) => {
    const rows = records.filter((row) => picker(row) === index)
    return {
      bucket,
      customerCount: rows.length,
      customerShare: safeDivide(rows.length, records.length),
      averageRecency: safeDivide(rows.reduce((sum, row) => sum + row.recencyDays, 0), rows.length),
      averageFrequency: safeDivide(rows.reduce((sum, row) => sum + row.transactionCount, 0), rows.length),
      averageMonetary: safeDivide(rows.reduce((sum, row) => sum + row.monetary, 0), rows.length),
      totalMonetary: rows.reduce((sum, row) => sum + row.monetary, 0),
      topSegment: topSegment(rows),
      memberRate: safeDivide(rows.filter((row) => row.member).length, rows.length),
    }
  })
}

function scoreDistribution(records: RFMCustomerRecord[]): RFMScoreDistributionRow[] {
  return ([1, 2, 3, 4, 5] as RFMScore[]).map((score) => {
    const recency = records.filter((row) => row.rScore === score).length
    const frequency = records.filter((row) => row.fScore === score).length
    const monetary = records.filter((row) => row.mScore === score).length
    return {
      score,
      recency,
      frequency,
      monetary,
      recencyShare: safeDivide(recency, records.length),
      frequencyShare: safeDivide(frequency, records.length),
      monetaryShare: safeDivide(monetary, records.length),
    }
  })
}

function matrix(records: RFMCustomerRecord[]) {
  const revenue = records.reduce((sum, row) => sum + row.monetary, 0)
  const cells: RFMMatrixCell[] = []
  for (const rScore of [1, 2, 3, 4, 5] as RFMScore[]) {
    for (const fScore of [1, 2, 3, 4, 5] as RFMScore[]) {
      const rows = records.filter((row) => row.rScore === rScore && row.fScore === fScore)
      const totalMonetary = rows.reduce((sum, row) => sum + row.monetary, 0)
      cells.push({
        rScore,
        fScore,
        customerCount: rows.length,
        averageMonetary: safeDivide(totalMonetary, rows.length),
        totalMonetary,
        averageClv: safeDivide(rows.reduce((sum, row) => sum + row.clv, 0), rows.length),
        revenueShare: safeDivide(totalMonetary, revenue),
        topSegment: topSegment(rows),
      })
    }
  }
  return cells
}

function compare(records: RFMCustomerRecord[], dimension: RFMComparisonDimension): RFMDimensionComparison[] {
  const groups = new Map<string, RFMCustomerRecord[]>()
  const keyFor = (row: RFMCustomerRecord) => {
    if (dimension === 'age') return row.ageBand
    if (dimension === 'gender') return row.gender
    if (dimension === 'occupation') return row.occupation
    if (dimension === 'member') return row.member ? 'Member' : 'Non Member'
    if (dimension === 'channel') return row.preferredChannel
    if (dimension === 'location') return `${row.region} - ${row.city}`
    if (dimension === 'product') return row.favoriteCategory
    if (dimension === 'acquisition') return row.acquisition
    return row.customerSegment
  }
  records.forEach((row) => {
    const key = keyFor(row)
    groups.set(key, [...(groups.get(key) ?? []), row])
  })
  return [...groups.entries()].map(([label, rows]) => ({
    id: label.toLowerCase().replace(/\s+/g, '-'),
    label,
    customerCount: rows.length,
    championsShare: safeDivide(rows.filter((row) => row.segmentId === 'champions').length, rows.length),
    loyalShare: safeDivide(rows.filter((row) => row.segmentId === 'loyal-customers').length, rows.length),
    atRiskShare: safeDivide(rows.filter((row) => row.segmentId === 'at-risk' || row.segmentId === 'cannot-lose-them').length, rows.length),
    lostShare: safeDivide(rows.filter((row) => row.segmentId === 'lost-customers').length, rows.length),
    averageRecency: safeDivide(rows.reduce((sum, row) => sum + row.recencyDays, 0), rows.length),
    averageFrequency: safeDivide(rows.reduce((sum, row) => sum + row.transactionCount, 0), rows.length),
    averageMonetary: safeDivide(rows.reduce((sum, row) => sum + row.monetary, 0), rows.length),
    averageClv: safeDivide(rows.reduce((sum, row) => sum + row.clv, 0), rows.length),
    topSegment: topSegment(rows),
  })).sort((a, b) => b.customerCount - a.customerCount)
}

function transitions(records: RFMCustomerRecord[]) {
  const total = records.filter((row) => row.previousSegmentId).length
  const groups = new Map<string, RFMTransition>()
  records.forEach((row) => {
    const source = row.previousSegmentId ?? 'none'
    const key = `${source}|${row.segmentId}|${row.movement}`
    const existing = groups.get(key) ?? {
      sourceSegmentId: source,
      sourceLabel: source === 'none' ? 'No Previous Snapshot' : rfmSegmentMap[source].label,
      targetSegmentId: row.segmentId,
      targetLabel: row.segmentLabel,
      customerCount: 0,
      transitionShare: 0,
      movement: row.movement,
    }
    existing.customerCount += 1
    groups.set(key, existing)
  })
  return [...groups.values()].map((row) => ({ ...row, transitionShare: safeDivide(row.customerCount, total || records.length) })).sort((a, b) => b.customerCount - a.customerCount)
}

function generateInsights(summary: RFMSummary, segments: RFMSegmentMetric[], comparisons: RFMDimensionComparison[]) {
  const largest = segments[0]
  const revenueLeader = segments.slice().sort((a, b) => b.revenueShare - a.revenueShare)[0]
  const concentration = segments.slice().sort((a, b) => b.valueConcentrationIndex - a.valueConcentrationIndex)[0]
  const channelLeader = comparisons[0]
  return [
    largest ? `${largest.label} menjadi segment terbesar dengan ${largest.customerCount.toLocaleString('id-ID')} pelanggan (${(largest.customerShare * 100).toFixed(1).replace('.', ',')}%).` : '',
    revenueLeader ? `${revenueLeader.label} menyumbang ${(revenueLeader.revenueShare * 100).toFixed(1).replace('.', ',')}% monetary value dari scope aktif.` : '',
    concentration && concentration.valueConcentrationIndex > 1 ? `${concentration.label} memiliki value concentration index ${concentration.valueConcentrationIndex.toFixed(2).replace('.', ',')}x, artinya revenue share di atas customer share.` : '',
    summary.movementRate > 0 ? `Sebanyak ${(summary.movementRate * 100).toFixed(1).replace('.', ',')}% pelanggan comparable berpindah segment dibanding snapshot sebelumnya.` : '',
    channelLeader ? `${channelLeader.label} menjadi kelompok comparison terbesar dengan top segment ${channelLeader.topSegment}.` : '',
    summary.atRiskShare > 0.15 ? `At-Risk dan Cannot Lose Them mencakup ${(summary.atRiskShare * 100).toFixed(1).replace('.', ',')}% pelanggan; ini sinyal historis untuk prioritas reactivation, bukan prediksi churn pasti.` : '',
  ].filter(Boolean)
}

function recommendations(segments: RFMSegmentMetric[], records: RFMCustomerRecord[]): RFMRecommendation[] {
  const rows: RFMRecommendation[] = []
  const push = (segmentId: RFMSegmentId, title: string, action: string, priority: 'high' | 'medium' | 'low') => {
    const segment = segments.find((item) => item.segmentId === segmentId)
    const sample = records.filter((row) => row.segmentId === segmentId)
    if (!segment || segment.customerCount === 0) return
    rows.push({
      segmentId,
      title,
      evidence: `${segment.customerCount.toLocaleString('id-ID')} pelanggan, avg recency ${Math.round(segment.averageRecency)} hari, avg monetary Rp${Math.round(segment.averageMonetary).toLocaleString('id-ID')}.`,
      action,
      preferredChannel: topSegment(sample.map((row) => ({ ...row, segmentLabel: row.preferredChannel }))),
      preferredProduct: topSegment(sample.map((row) => ({ ...row, segmentLabel: row.favoriteCategory }))),
      priority,
      customerCount: segment.customerCount,
      reliabilityNote: 'Decision-support berbasis RFM historis; dampak campaign tidak diklaim otomatis.',
      route: '/purchase-analytics/perilaku-pembelian',
    })
  }
  push('champions', 'Protect high-value repeat buyers', 'Pertahankan experience dan uji early-access/menu bundle untuk menjaga frequency.', 'high')
  push('at-risk', 'Win-back historically valuable customers', 'Aktifkan win-back berdasarkan preferred channel dan favorite category.', 'high')
  push('cannot-lose-them', 'Recover high-value lapsed customers', 'Prioritaskan personal offer berbasis histori monetary tinggi.', 'high')
  push('potential-loyalists', 'Convert recent repeaters', 'Dorong member benefit dan next purchase trigger setelah transaksi terakhir.', 'medium')
  push('new-customers', 'Create second purchase habit', 'Kirim activation offer ringan untuk mendorong transaksi kedua.', 'medium')
  push('lost-customers', 'Low-cost reactivation test', 'Gunakan campaign batch kecil dan ukur response sebelum scale.', 'low')
  return rows
}

function filterLabel(filters: AppliedFilters) {
  return [filters.region ?? 'Semua Wilayah', filters.city, filters.outlet, filters.gender, filters.ageBand ? `${filters.ageBand} tahun` : null].filter(Boolean).join(' - ')
}

export function queryRFMAnalysis(data: RFMJson, filters: AppliedFilters, local: RFMLocalFilters = defaultRFMLocalFilters): RFMAnalysisInsights {
  const scope = monthScope(data, filters)
  const previous = previousScope(scope)
  const currentWindowStart = observationStart(data, local.observationWindow, scope.periodStart, scope.analysisDate)
  const previousWindowStart = observationStart(data, local.observationWindow, previous.periodStart, previous.analysisDate)
  const currentRaw = buildSnapshot(data, filters, local, scope.analysisDate, scope.periodStart)
  const previousRaw = buildSnapshot(data, filters, local, previous.analysisDate, previous.periodStart)
  const previousByCustomer = new Map(previousRaw.map((row) => [row.customerIndex, row]))
  currentRaw.forEach((row) => {
    const previousRow = previousByCustomer.get(row.customerIndex)
    if (!previousRow) {
      row.movement = 'new'
      return
    }
    row.previousSegmentId = previousRow.segmentId
    row.previousSegmentLabel = previousRow.segmentLabel
    if (previousRow.segmentId === row.segmentId) row.movement = 'stable'
    else if (previousRow.rfmTotalScore < row.rfmTotalScore) row.movement = 'upgraded'
    else if (previousRow.rfmTotalScore > row.rfmTotalScore) row.movement = 'downgraded'
    else row.movement = row.recencyDays < previousRow.recencyDays ? 'reactivated' : 'stable'
  })
  const current = applyRecordFilters(currentRaw, local)
  const previousComparable = previousRaw.filter((row) => current.some((currentRow) => currentRow.customerIndex === row.customerIndex))
  const summary = summarize(current, scope.label, filterLabel(filters), scope.analysisDate, local.observationWindow, currentWindowStart)
  const previousSummary = previousRaw.length ? summarize(previousComparable, 'Previous Comparable Period', filterLabel(filters), previous.analysisDate, local.observationWindow, previousWindowStart) : null
  const segments = segmentMetrics(current, previousRaw)
  const comparisonRows = compare(current, local.comparison)
  const channelComparisons = compare(current, 'channel')
  return {
    summary,
    previousSummary,
    kpis: buildKpis(summary, previousSummary),
    customers: current.sort((a, b) => b.rfmTotalScore - a.rfmTotalScore || b.monetary - a.monetary).slice(0, 250),
    segments,
    matrix: matrix(current),
    scoreDistribution: scoreDistribution(current),
    recencyDistribution: bucketDistribution(current, 'recency'),
    frequencyDistribution: bucketDistribution(current, 'frequency'),
    monetaryDistribution: bucketDistribution(current, 'monetary'),
    comparisonRows,
    channelComparisons,
    locationComparisons: compare(current, 'location'),
    productComparisons: compare(current, 'product'),
    acquisitionComparisons: compare(current, 'acquisition'),
    transitions: transitions(current).slice(0, 12),
    insights: generateInsights(summary, segments, channelComparisons),
    recommendations: recommendations(segments, current),
    available: {
      channels: data.dims.channels,
      segments: rfmSegments.filter((segment) => segment.id !== 'unclassified').map((segment) => ({ id: segment.id, label: segment.label })),
    },
    methodology: [
      `Analysis Date memakai akhir periode aktif: ${toYmd(scope.analysisDate)}.`,
      `Observation Window ${summary.observationWindowLabel}: ${summary.observationWindowStart} sampai ${summary.analysisDate}.`,
      'Recency dihitung dari Analysis Date ke transaksi valid terakhir customer. Frequency memakai jumlah TransactionID unik. Monetary memakai NetAmount.',
      local.scoringMethod === 'quantile'
        ? 'Quantile scoring memakai dense unique-value percentile; nilai identik mendapat score yang sama, sehingga tie Frequency=1 tidak dipecah random.'
        : 'Business scoring memakai threshold eksplisit dari rfmConfig.ts.',
      'Segment rules dievaluasi berurutan dan berhenti pada match pertama; setiap customer hanya memiliki satu segment per snapshot.',
      'Previous snapshot memakai akhir periode sebelum periode aktif dengan observation window dan scoring method yang sama.',
    ],
    scopeNote: local.scopeMode === 'global'
      ? 'Global Customer RFM: filter outlet/channel menentukan eligibility, tetapi R/F/M customer dihitung dari seluruh transaksi valid customer sampai Analysis Date.'
      : 'Scoped Behaviour RFM: R/F/M dihitung hanya dari transaksi yang sesuai outlet/channel/filter aktif.',
    insufficientSample: current.length > 0 && current.length < rfmConfig.minimumSampleSize,
  }
}
