import { monthLabel, quarterLabel, quarterOf } from '@/data/cube'
import type { AppliedFilters } from '@/data/types'

export type CohortType = 'first-purchase' | 'acquisition' | 'membership-join' | 'first-campaign'
export type CohortMetric = 'retention' | 'activeCustomers' | 'revenueRetention' | 'revenue' | 'transactions' | 'averageBasket' | 'cumulativeRevenuePerCustomer'
export type CohortCellStatus = 'observed' | 'immature' | 'insufficient-sample'
export type ReturnScope = 'anywhere' | 'same-entry-scope'
export type CohortReliability = 'high' | 'medium' | 'low'

export interface CohortAnalysisPayload {
  meta: {
    source: string
    input: string
    generatedAt: string
    period: { start: string; end: string }
    analysisCutoff: string
    analysisCutoffDay: number
    analysisCutoffMonth: number
    customers: number
    activityRows: number
  }
  dims: {
    months: string[]
    outlets: { id: string; name: string; city: string; region: string; type: string }[]
    genders: string[]
    ageBands: string[]
    segments: string[]
    channels: string[]
    acquisitions: string[]
  }
  customers: number[][]
  activities: number[][]
}

export interface CohortAnalysisLocalFilters {
  cohortType: CohortType
  metric: CohortMetric
  comparisonDimension: 'acquisition' | 'firstChannel' | 'memberAtEntry' | 'segment' | 'location' | 'gender' | 'ageBand'
  minCohortSize: number
  returnScope: ReturnScope
  acquisition: string
  firstChannel: string
  memberAtEntry: 'all' | 'member' | 'non-member'
  maxAge: number
  reliability: 'all' | CohortReliability
}

export interface CohortCell {
  cohortPeriod: string
  activityPeriod: string | null
  cohortAge: number
  cohortSize: number
  activeCustomers: number
  retentionRate: number | null
  transactions: number
  revenue: number
  revenueRetention: number | null
  averageBasket: number | null
  cumulativeRevenue: number
  cumulativeRevenuePerCustomer: number | null
  status: CohortCellStatus
}

export interface CohortRow {
  cohortPeriod: string
  cohortLabel: string
  cohortSize: number
  cohortEntryRevenue: number
  firstBasket: number | null
  secondPurchaseCustomers: number
  secondPurchaseRate: number | null
  medianTimeToSecondPurchase: number | null
  memberAtEntryRate: number
  voucherAtEntryRate: number
  maximumObservedAge: number
  reliabilityScore: number
  reliabilityStatus: CohortReliability
  cells: CohortCell[]
}

export interface CohortDimensionMetric {
  dimension: string
  id: string
  label: string
  cohortCustomers: number
  maturedCustomersM1: number
  maturedCustomersM3: number
  maturedCustomersM6: number
  retentionM1: number | null
  retentionM3: number | null
  retentionM6: number | null
  revenueRetentionM3: number | null
  secondPurchaseRate: number | null
  medianTimeToSecondPurchase: number | null
  cumulativeRevenuePerCustomer: number
  firstBasket: number | null
  reliabilityStatus: CohortReliability
}

export interface CohortSummary {
  cohortType: CohortType
  analysisCutoff: string
  maximumObservedAge: number
  totalCohorts: number
  eligibleCustomers: number
  averageCohortSize: number
  weightedRetentionM1: number | null
  weightedRetentionM3: number | null
  weightedRetentionM6: number | null
  bestRetentionCohort: string | null
  highestRevenueRetentionCohort: string | null
  medianTimeToSecondPurchase: number | null
  cumulativeRevenuePerCustomer: number
  immatureCohortCount: number
}

export interface CohortCurvePoint {
  cohortAge: number
  maturedCohortCount: number
  maturedCohortCustomers: number
  activeCustomers: number
  retentionRate: number | null
}

export interface CohortRevenuePoint {
  cohortAge: number
  maturedCohortCount: number
  cohortEntryRevenue: number
  activityRevenue: number
  revenueRetention: number | null
}

export interface CohortSizeTrendRow {
  cohortPeriod: string
  cohortLabel: string
  cohortSize: number
  firstPurchaseRevenue: number
  firstBasket: number | null
  memberShare: number
  voucherShare: number
}

export interface TimeToSecondPurchaseRow {
  cohortPeriod: string
  cohortLabel: string
  eligibleCustomers: number
  convertedCustomers: number
  conversionRate: number | null
  medianDays: number | null
  averageDays: number | null
  p25: number | null
  p75: number | null
  within7Days: number | null
  within14Days: number | null
  within30Days: number | null
}

export interface CohortRecommendation {
  id: string
  cohortPeriod?: string
  dimension?: string
  dimensionValue?: string
  issue: string
  evidence: string
  action: string
  owner: string
  priority: 'high' | 'medium' | 'low'
  reliabilityNote: string
}

export interface CohortAnalysisResult {
  periodLabel: string
  filterLabel: string
  summary: CohortSummary
  cohorts: CohortRow[]
  weightedRetentionCurve: CohortCurvePoint[]
  revenueRetentionCurve: CohortRevenuePoint[]
  cohortSizeTrend: CohortSizeTrendRow[]
  timeToSecondPurchase: TimeToSecondPurchaseRow[]
  comparisons: CohortDimensionMetric[]
  insights: string[]
  recommendations: CohortRecommendation[]
  availableAcquisitions: string[]
  availableChannels: string[]
  methodology: string[]
  limitations: string[]
}

const C = {
  customer: 0,
  outlet: 1,
  gender: 2,
  age: 3,
  segment: 4,
  member: 5,
  acquisition: 6,
  firstMonth: 7,
  acquisitionMonth: 8,
  membershipMonth: 9,
  firstCampaignMonth: 10,
  firstPurchaseDay: 11,
  secondPurchaseDay: 12,
  lastPurchaseDay: 13,
  totalTx: 14,
  netSpend: 15,
  clv: 16,
  firstChannel: 17,
  voucherAtEntry: 18,
  campaignAtEntry: 19,
  firstMonthTx: 20,
  firstMonthRevenue: 21,
  lastActiveMonth: 22,
} as const

const A = { customer: 0, month: 1, outlet: 2, channel: 3, tx: 4, net: 5, voucherTx: 6, memberTx: 7, campaignTx: 8, satSum: 9 } as const

type CustomerRow = number[]
type ActivityRow = number[]

interface QueryCustomer {
  row: CustomerRow
  cohortMonth: number
  cohortKey: string
}

interface CellAccumulator {
  customers: Set<number>
  transactions: number
  revenue: number
}

export const defaultCohortAnalysisLocalFilters: CohortAnalysisLocalFilters = {
  cohortType: 'first-purchase',
  metric: 'retention',
  comparisonDimension: 'acquisition',
  minCohortSize: 30,
  returnScope: 'anywhere',
  acquisition: 'all',
  firstChannel: 'all',
  memberAtEntry: 'all',
  maxAge: 11,
  reliability: 'all',
}

const safeDivide = (value: number, total: number) => (total ? value / total : null)
const ratio = (value: number, total: number) => (total ? value / total : 0)
const monthKey = (payload: CohortAnalysisPayload, index: number) => payload.dims.months[index] ?? ''
const labelMonth = (payload: CohortAnalysisPayload, index: number) => {
  const key = monthKey(payload, index)
  return key ? monthLabel(key) : 'Unavailable'
}
const cohortId = (month: number) => String(month)

function percentile(values: number[], point: number) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * point)))
  return sorted[index] ?? null
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

function cohortMonthFor(row: CustomerRow, type: CohortType) {
  if (type === 'first-purchase') return row[C.firstMonth] ?? -1
  if (type === 'acquisition') return row[C.acquisitionMonth] ?? -1
  if (type === 'membership-join') return row[C.membershipMonth] ?? -1
  return row[C.firstCampaignMonth] ?? -1
}

function entryMonths(payload: CohortAnalysisPayload, filters: AppliedFilters) {
  const out = new Set<number>()
  payload.dims.months.forEach((month, index) => {
    if (filters.quarter && quarterOf(month) !== filters.quarter) return
    out.add(index)
  })
  return out
}

function rowMatches(payload: CohortAnalysisPayload, row: CustomerRow, filters: AppliedFilters, local: CohortAnalysisLocalFilters, cohortMonth: number, allowedEntryMonths: Set<number>) {
  if (cohortMonth < 0 || cohortMonth > payload.meta.analysisCutoffMonth) return false
  if (!allowedEntryMonths.has(cohortMonth)) return false
  const outlet = payload.dims.outlets[row[C.outlet]!]
  if (!outlet) return false
  if (filters.outlet && outlet.id !== filters.outlet) return false
  if (filters.city && outlet.city !== filters.city) return false
  if (filters.region && outlet.region !== filters.region) return false
  if (filters.gender && payload.dims.genders[row[C.gender]!] !== filters.gender) return false
  if (filters.ageBand && payload.dims.ageBands[row[C.age]!] !== filters.ageBand) return false
  if (local.acquisition !== 'all' && payload.dims.acquisitions[row[C.acquisition]!] !== local.acquisition) return false
  if (local.firstChannel !== 'all' && payload.dims.channels[row[C.firstChannel]!] !== local.firstChannel) return false
  if (local.memberAtEntry === 'member' && row[C.member] !== 1) return false
  if (local.memberAtEntry === 'non-member' && row[C.member] === 1) return false
  return true
}

function reliabilityFor(size: number, maxObservedAge: number, minSize: number): { score: number; status: CohortReliability } {
  const sizeScore = Math.min(1, size / Math.max(1, minSize * 3))
  const maturityScore = Math.min(1, maxObservedAge / 6)
  const score = Math.round((0.65 * sizeScore + 0.35 * maturityScore) * 100)
  if (score >= 75) return { score, status: 'high' }
  if (score >= 45) return { score, status: 'medium' }
  return { score, status: 'low' }
}

function cellValue(cell: CohortCell, metric: CohortMetric) {
  if (metric === 'retention') return cell.retentionRate
  if (metric === 'activeCustomers') return cell.activeCustomers
  if (metric === 'revenueRetention') return cell.revenueRetention
  if (metric === 'revenue') return cell.revenue
  if (metric === 'transactions') return cell.transactions
  if (metric === 'averageBasket') return cell.averageBasket
  return cell.cumulativeRevenuePerCustomer
}

function weightedRetention(rows: CohortRow[], age: number) {
  let active = 0
  let denominator = 0
  rows.forEach((row) => {
    const cell = row.cells.find((item) => item.cohortAge === age)
    if (!cell || cell.status === 'immature') return
    active += cell.activeCustomers
    denominator += row.cohortSize
  })
  return safeDivide(active, denominator)
}

function weightedCurve(rows: CohortRow[], maxAge: number): CohortCurvePoint[] {
  return Array.from({ length: maxAge + 1 }, (_, age) => {
    let active = 0
    let denominator = 0
    let matured = 0
    rows.forEach((row) => {
      const cell = row.cells.find((item) => item.cohortAge === age)
      if (!cell || cell.status === 'immature') return
      matured += 1
      active += cell.activeCustomers
      denominator += row.cohortSize
    })
    return { cohortAge: age, maturedCohortCount: matured, maturedCohortCustomers: denominator, activeCustomers: active, retentionRate: safeDivide(active, denominator) }
  })
}

function revenueCurve(rows: CohortRow[], maxAge: number): CohortRevenuePoint[] {
  return Array.from({ length: maxAge + 1 }, (_, age) => {
    let entry = 0
    let revenue = 0
    let matured = 0
    rows.forEach((row) => {
      const cell = row.cells.find((item) => item.cohortAge === age)
      if (!cell || cell.status === 'immature') return
      matured += 1
      entry += row.cohortEntryRevenue
      revenue += cell.revenue
    })
    return { cohortAge: age, maturedCohortCount: matured, cohortEntryRevenue: entry, activityRevenue: revenue, revenueRetention: safeDivide(revenue, entry) }
  })
}

function makeComparison(
  payload: CohortAnalysisPayload,
  customers: QueryCustomer[],
  activitiesByCustomer: Map<number, ActivityRow[]>,
  dimension: CohortAnalysisLocalFilters['comparisonDimension'],
  maxAge: number,
): CohortDimensionMetric[] {
  const groups = new Map<string, QueryCustomer[]>()
  const labelOf = (row: CustomerRow) => {
    if (dimension === 'acquisition') return payload.dims.acquisitions[row[C.acquisition]!] ?? 'Unknown'
    if (dimension === 'firstChannel') return payload.dims.channels[row[C.firstChannel]!] ?? 'Unknown'
    if (dimension === 'memberAtEntry') return row[C.member] === 1 ? 'Member at Entry' : 'Non-Member at Entry'
    if (dimension === 'segment') return payload.dims.segments[row[C.segment]!] ?? 'Unknown'
    if (dimension === 'gender') return payload.dims.genders[row[C.gender]!] ?? 'Unknown'
    if (dimension === 'ageBand') return payload.dims.ageBands[row[C.age]!] ?? 'Unknown'
    const outlet = payload.dims.outlets[row[C.outlet]!]
    return outlet ? `${outlet.city} - ${outlet.region}` : 'Unknown'
  }
  customers.forEach((customer) => {
    const label = labelOf(customer.row)
    const list = groups.get(label) ?? []
    list.push(customer)
    groups.set(label, list)
  })

  return [...groups.entries()].map(([label, group]) => {
    const rows = buildCohortRows(payload, group, activitiesByCustomer, { ...defaultCohortAnalysisLocalFilters, maxAge, minCohortSize: 1, returnScope: 'anywhere' })
    const allCells = rows.flatMap((row) => row.cells)
    const m1Cells = allCells.filter((cell) => cell.cohortAge === 1 && cell.status !== 'immature')
    const m3Cells = allCells.filter((cell) => cell.cohortAge === 3 && cell.status !== 'immature')
    const m6Cells = allCells.filter((cell) => cell.cohortAge === 6 && cell.status !== 'immature')
    const retentionFrom = (cells: CohortCell[]) => safeDivide(cells.reduce((sum, cell) => sum + cell.activeCustomers, 0), cells.reduce((sum, cell) => sum + cell.cohortSize, 0))
    const maturedM3EntryRevenue = rows.reduce((sum, row) => {
      const m3 = row.cells.find((cell) => cell.cohortAge === 3)
      return m3 && m3.status !== 'immature' ? sum + row.cohortEntryRevenue : sum
    }, 0)
    const secondDays = group.map((customer) => customer.row[C.secondPurchaseDay]! - customer.row[C.firstPurchaseDay]!).filter((days) => days >= 0)
    const cohortCustomers = group.length
    const reliability = reliabilityFor(cohortCustomers, Math.max(...group.map((customer) => payload.meta.analysisCutoffMonth - customer.cohortMonth)), 30)
    const entryRevenue = group.reduce((sum, customer) => sum + customer.row[C.firstMonthRevenue]!, 0)
    const totalRevenue = group.reduce((sum, customer) => sum + customer.row[C.netSpend]!, 0)
    return {
      dimension,
      id: label,
      label,
      cohortCustomers,
      maturedCustomersM1: m1Cells.reduce((sum, cell) => sum + cell.cohortSize, 0),
      maturedCustomersM3: m3Cells.reduce((sum, cell) => sum + cell.cohortSize, 0),
      maturedCustomersM6: m6Cells.reduce((sum, cell) => sum + cell.cohortSize, 0),
      retentionM1: retentionFrom(m1Cells),
      retentionM3: retentionFrom(m3Cells),
      retentionM6: retentionFrom(m6Cells),
      revenueRetentionM3: safeDivide(m3Cells.reduce((sum, cell) => sum + cell.revenue, 0), maturedM3EntryRevenue),
      secondPurchaseRate: safeDivide(secondDays.length, cohortCustomers),
      medianTimeToSecondPurchase: percentile(secondDays, 0.5),
      cumulativeRevenuePerCustomer: ratio(totalRevenue, cohortCustomers),
      firstBasket: safeDivide(entryRevenue, group.reduce((sum, customer) => sum + customer.row[C.firstMonthTx]!, 0)),
      reliabilityStatus: reliability.status,
    }
  }).sort((a, b) => b.cohortCustomers - a.cohortCustomers)
}

function buildCohortRows(
  payload: CohortAnalysisPayload,
  customers: QueryCustomer[],
  activitiesByCustomer: Map<number, ActivityRow[]>,
  local: Pick<CohortAnalysisLocalFilters, 'maxAge' | 'minCohortSize' | 'returnScope'>,
): CohortRow[] {
  const cohorts = new Map<string, QueryCustomer[]>()
  customers.forEach((customer) => {
    const list = cohorts.get(customer.cohortKey) ?? []
    list.push(customer)
    cohorts.set(customer.cohortKey, list)
  })

  return [...cohorts.entries()].sort((a, b) => Number(a[0]) - Number(b[0])).map(([key, group]) => {
    const cohortMonth = Number(key)
    const cohortSize = group.length
    const maxObservedAge = Math.max(0, Math.min(local.maxAge, payload.meta.analysisCutoffMonth - cohortMonth))
    const reliability = reliabilityFor(cohortSize, maxObservedAge, local.minCohortSize)
    const entryRevenue = group.reduce((sum, customer) => sum + customer.row[C.firstMonthRevenue]!, 0)
    const entryTx = group.reduce((sum, customer) => sum + customer.row[C.firstMonthTx]!, 0)
    const secondDays = group.map((customer) => customer.row[C.secondPurchaseDay]! - customer.row[C.firstPurchaseDay]!).filter((days) => days >= 0)
    const cellMap = new Map<number, CellAccumulator>()

    group.forEach((customer) => {
      const rows = activitiesByCustomer.get(customer.row[C.customer]!) ?? []
      rows.forEach((activity) => {
        const age = activity[A.month]! - cohortMonth
        if (age < 0 || age > local.maxAge) return
        if (local.returnScope === 'same-entry-scope' && (activity[A.outlet] !== customer.row[C.outlet] || activity[A.channel] !== customer.row[C.firstChannel])) return
        const cell = cellMap.get(age) ?? { customers: new Set<number>(), transactions: 0, revenue: 0 }
        cell.customers.add(customer.row[C.customer]!)
        cell.transactions += activity[A.tx] ?? 0
        cell.revenue += activity[A.net] ?? 0
        cellMap.set(age, cell)
      })
    })

    let cumulative = 0
    const cells = Array.from({ length: local.maxAge + 1 }, (_, age) => {
      const observed = age <= payload.meta.analysisCutoffMonth - cohortMonth
      const source = cellMap.get(age)
      const revenue = observed ? source?.revenue ?? 0 : 0
      cumulative += observed ? revenue : 0
      const active = observed ? source?.customers.size ?? 0 : 0
      const transactions = observed ? source?.transactions ?? 0 : 0
      const status: CohortCellStatus = !observed ? 'immature' : cohortSize < local.minCohortSize ? 'insufficient-sample' : 'observed'
      const activityMonth = cohortMonth + age
      return {
        cohortPeriod: monthKey(payload, cohortMonth),
        activityPeriod: observed ? monthKey(payload, activityMonth) : null,
        cohortAge: age,
        cohortSize,
        activeCustomers: active,
        retentionRate: observed ? ratio(active, cohortSize) : null,
        transactions,
        revenue,
        revenueRetention: observed ? safeDivide(revenue, entryRevenue) : null,
        averageBasket: observed ? safeDivide(revenue, transactions) : null,
        cumulativeRevenue: cumulative,
        cumulativeRevenuePerCustomer: observed ? ratio(cumulative, cohortSize) : null,
        status,
      }
    })

    return {
      cohortPeriod: monthKey(payload, cohortMonth),
      cohortLabel: labelMonth(payload, cohortMonth),
      cohortSize,
      cohortEntryRevenue: entryRevenue,
      firstBasket: safeDivide(entryRevenue, entryTx),
      secondPurchaseCustomers: secondDays.length,
      secondPurchaseRate: safeDivide(secondDays.length, cohortSize),
      medianTimeToSecondPurchase: percentile(secondDays, 0.5),
      memberAtEntryRate: ratio(group.filter((customer) => customer.row[C.member] === 1).length, cohortSize),
      voucherAtEntryRate: ratio(group.filter((customer) => customer.row[C.voucherAtEntry] === 1).length, cohortSize),
      maximumObservedAge: maxObservedAge,
      reliabilityScore: reliability.score,
      reliabilityStatus: reliability.status,
      cells,
    }
  })
}

function timeToSecondRows(payload: CohortAnalysisPayload, cohorts: CohortRow[], customers: QueryCustomer[]): TimeToSecondPurchaseRow[] {
  return cohorts.map((cohort) => {
    const cohortMonth = payload.dims.months.indexOf(cohort.cohortPeriod)
    const group = customers.filter((customer) => customer.cohortMonth === cohortMonth)
    const convertedDays = group.map((customer) => customer.row[C.secondPurchaseDay]! - customer.row[C.firstPurchaseDay]!).filter((days) => days >= 0)
    const eligible30 = group.filter((customer) => payload.meta.analysisCutoffDay - customer.row[C.firstPurchaseDay]! >= 30)
    const convertedWithin = (days: number) => safeDivide(convertedDays.filter((value) => value <= days).length, eligible30.length)
    return {
      cohortPeriod: cohort.cohortPeriod,
      cohortLabel: cohort.cohortLabel,
      eligibleCustomers: cohort.cohortSize,
      convertedCustomers: convertedDays.length,
      conversionRate: safeDivide(convertedDays.length, cohort.cohortSize),
      medianDays: percentile(convertedDays, 0.5),
      averageDays: average(convertedDays),
      p25: percentile(convertedDays, 0.25),
      p75: percentile(convertedDays, 0.75),
      within7Days: convertedWithin(7),
      within14Days: convertedWithin(14),
      within30Days: convertedWithin(30),
    }
  })
}

function buildInsights(result: {
  cohorts: CohortRow[]
  curve: CohortCurvePoint[]
  comparisons: CohortDimensionMetric[]
  summary: CohortSummary
}) {
  const insights: string[] = []
  const m1 = result.curve.find((point) => point.cohortAge === 1)
  const m3 = result.curve.find((point) => point.cohortAge === 3)
  const best = result.cohorts.filter((row) => row.reliabilityStatus !== 'low').sort((a, b) => (b.cells[3]?.retentionRate ?? -1) - (a.cells[3]?.retentionRate ?? -1))[0]
  const weakest = result.cohorts.filter((row) => row.reliabilityStatus !== 'low' && row.cells[1]?.status !== 'immature').sort((a, b) => (a.cells[1]?.retentionRate ?? 1) - (b.cells[1]?.retentionRate ?? 1))[0]
  const strongestDimension = result.comparisons.filter((row) => row.reliabilityStatus !== 'low').sort((a, b) => (b.retentionM3 ?? -1) - (a.retentionM3 ?? -1))[0]
  if (m1 && m1.retentionRate !== null) insights.push(`Weighted Month 1 retention adalah ${(m1.retentionRate * 100).toFixed(1).replace('.', ',')}% dari ${m1.maturedCohortCustomers.toLocaleString('id-ID')} matured cohort customers.`)
  if (m3 && m3.retentionRate !== null) insights.push(`Weighted Month 3 retention adalah ${(m3.retentionRate * 100).toFixed(1).replace('.', ',')}%; ini dihitung dari total active customers dibagi total original cohort size, bukan average persentase cohort.`)
  if (best) insights.push(`Cohort ${best.cohortLabel} memiliki Month 3 retention tertinggi di cohort yang reliable, dengan ${(((best.cells[3]?.retentionRate ?? 0) * 100)).toFixed(1).replace('.', ',')}%.`)
  if (weakest) insights.push(`Cohort ${weakest.cohortLabel} perlu dipantau karena Month 1 retention berada di sisi bawah cohort matured.`)
  if (strongestDimension) insights.push(`${strongestDimension.label} menonjol pada ${strongestDimension.dimension} dengan Month 3 retention ${strongestDimension.retentionM3 === null ? 'N/A' : `${(strongestDimension.retentionM3 * 100).toFixed(1).replace('.', ',')}%`}. Perbedaan ini observasional, bukan sebab-akibat.`)
  if (result.summary.immatureCohortCount > 0) insights.push(`${result.summary.immatureCohortCount.toLocaleString('id-ID')} cohort terbaru memiliki cell immature; cell tersebut tidak dihitung sebagai 0%.`)
  return insights.slice(0, 6)
}

function buildRecommendations(cohorts: CohortRow[], comparisons: CohortDimensionMetric[], summary: CohortSummary): CohortRecommendation[] {
  const out: CohortRecommendation[] = []
  const weakM1 = cohorts.filter((row) => row.reliabilityStatus !== 'low' && row.cells[1]?.status !== 'immature').sort((a, b) => (a.cells[1]?.retentionRate ?? 1) - (b.cells[1]?.retentionRate ?? 1))[0]
  if (weakM1 && (weakM1.cells[1]?.retentionRate ?? 1) < (summary.weightedRetentionM1 ?? 0)) {
    out.push({
      id: `cohort-m1-${weakM1.cohortPeriod}`,
      cohortPeriod: weakM1.cohortPeriod,
      issue: 'Month 1 retention di bawah weighted benchmark',
      evidence: `${weakM1.cohortLabel}: ${(((weakM1.cells[1]?.retentionRate ?? 0) * 100)).toFixed(1).replace('.', ',')}% vs benchmark ${summary.weightedRetentionM1 === null ? 'N/A' : `${(summary.weightedRetentionM1 * 100).toFixed(1).replace('.', ',')}%`}.`,
      action: 'Audit onboarding pasca transaksi pertama dan dorong second-purchase offer dengan kontrol sample per cohort.',
      owner: 'CRM & Lifecycle',
      priority: 'high',
      reliabilityNote: `Reliability ${weakM1.reliabilityStatus}; recommendation bersifat observasional, bukan klaim sebab-akibat.`,
    })
  }
  const slowSecond = cohorts.filter((row) => row.reliabilityStatus !== 'low' && row.medianTimeToSecondPurchase !== null).sort((a, b) => (b.medianTimeToSecondPurchase ?? 0) - (a.medianTimeToSecondPurchase ?? 0))[0]
  if (slowSecond) {
    out.push({
      id: `second-purchase-${slowSecond.cohortPeriod}`,
      cohortPeriod: slowSecond.cohortPeriod,
      issue: 'Time to second purchase relatif lambat',
      evidence: `${slowSecond.cohortLabel}: median ${Math.round(slowSecond.medianTimeToSecondPurchase ?? 0).toLocaleString('id-ID')} hari ke pembelian kedua.`,
      action: 'Uji reminder dan benefit member dalam 14-30 hari pertama setelah first purchase.',
      owner: 'Retention Marketing',
      priority: 'medium',
      reliabilityNote: `Menggunakan customer yang sudah memiliki observed second purchase; customer tanpa cukup follow-up diperlakukan sebagai censored untuk window metric.`,
    })
  }
  const weakDimension = comparisons.filter((row) => row.reliabilityStatus !== 'low' && row.retentionM3 !== null).sort((a, b) => (a.retentionM3 ?? 1) - (b.retentionM3 ?? 1))[0]
  if (weakDimension) {
    out.push({
      id: `dimension-${weakDimension.dimension}-${weakDimension.id}`,
      dimension: weakDimension.dimension,
      dimensionValue: weakDimension.label,
      issue: 'Segment cohort tertinggal pada Month 3',
      evidence: `${weakDimension.label}: M3 retention ${((weakDimension.retentionM3 ?? 0) * 100).toFixed(1).replace('.', ',')}% dari ${weakDimension.maturedCustomersM3.toLocaleString('id-ID')} matured customers.`,
      action: 'Bandingkan journey, channel entry, dan basket awal segment ini sebelum membuat intervensi.',
      owner: 'Customer Analytics',
      priority: 'medium',
      reliabilityNote: 'Perbandingan lintas segment bersifat asosiasi, bukan causal incrementality.',
    })
  }
  return out.slice(0, 5)
}

export function queryCohortAnalysis(payload: CohortAnalysisPayload, filters: AppliedFilters, local: CohortAnalysisLocalFilters): CohortAnalysisResult {
  const allowedEntryMonths = entryMonths(payload, filters)
  const activitiesByCustomer = new Map<number, ActivityRow[]>()
  payload.activities.forEach((activity) => {
    const list = activitiesByCustomer.get(activity[A.customer]!) ?? []
    list.push(activity)
    activitiesByCustomer.set(activity[A.customer]!, list)
  })

  const customers = payload.customers.flatMap((row): QueryCustomer[] => {
    const cohortMonth = cohortMonthFor(row, local.cohortType)
    if (!rowMatches(payload, row, filters, local, cohortMonth, allowedEntryMonths)) return []
    return [{ row, cohortMonth, cohortKey: cohortId(cohortMonth) }]
  })

  let cohorts = buildCohortRows(payload, customers, activitiesByCustomer, local)
  cohorts = cohorts.filter((row) => local.reliability === 'all' || row.reliabilityStatus === local.reliability)
  const maxAge = Math.min(local.maxAge, Math.max(0, ...cohorts.map((row) => row.maximumObservedAge)))
  const curve = weightedCurve(cohorts, local.maxAge)
  const revenue = revenueCurve(cohorts, local.maxAge)
  const comparisons = makeComparison(payload, customers, activitiesByCustomer, local.comparisonDimension, local.maxAge)
  const sizeTrend = cohorts.map((row) => ({
    cohortPeriod: row.cohortPeriod,
    cohortLabel: row.cohortLabel,
    cohortSize: row.cohortSize,
    firstPurchaseRevenue: row.cohortEntryRevenue,
    firstBasket: row.firstBasket,
    memberShare: row.memberAtEntryRate,
    voucherShare: row.voucherAtEntryRate,
  }))
  const timeRows = timeToSecondRows(payload, cohorts, customers)
  const bestRetention = cohorts.filter((row) => row.reliabilityStatus !== 'low' && row.cells[3]?.status !== 'immature').sort((a, b) => (b.cells[3]?.retentionRate ?? -1) - (a.cells[3]?.retentionRate ?? -1))[0]
  const bestRevenue = cohorts.filter((row) => row.reliabilityStatus !== 'low' && row.cells[3]?.status !== 'immature').sort((a, b) => (b.cells[3]?.revenueRetention ?? -1) - (a.cells[3]?.revenueRetention ?? -1))[0]
  const allSecondDays = customers.map((customer) => customer.row[C.secondPurchaseDay]! - customer.row[C.firstPurchaseDay]!).filter((days) => days >= 0)
  const totalCumulativeRevenue = customers.reduce((sum, customer) => sum + customer.row[C.netSpend]!, 0)
  const summary: CohortSummary = {
    cohortType: local.cohortType,
    analysisCutoff: payload.meta.analysisCutoff,
    maximumObservedAge: maxAge,
    totalCohorts: cohorts.length,
    eligibleCustomers: customers.length,
    averageCohortSize: ratio(customers.length, cohorts.length),
    weightedRetentionM1: weightedRetention(cohorts, 1),
    weightedRetentionM3: weightedRetention(cohorts, 3),
    weightedRetentionM6: weightedRetention(cohorts, 6),
    bestRetentionCohort: bestRetention?.cohortLabel ?? null,
    highestRevenueRetentionCohort: bestRevenue?.cohortLabel ?? null,
    medianTimeToSecondPurchase: percentile(allSecondDays, 0.5),
    cumulativeRevenuePerCustomer: ratio(totalCumulativeRevenue, customers.length),
    immatureCohortCount: cohorts.filter((row) => row.cells.some((cell) => cell.status === 'immature')).length,
  }

  const periodLabel = filters.quarter ? `${quarterLabel(filters.quarter)} cohort entry` : 'Semua cohort entry period'
  const filterLabel = [
    periodLabel,
    filters.region ?? filters.city ?? filters.outlet ?? 'Semua wilayah',
    filters.gender ?? 'Semua gender',
    filters.ageBand ? `${filters.ageBand} tahun` : 'Semua usia',
    local.returnScope === 'anywhere' ? 'Return Anywhere' : 'Return to Same Entry Scope',
  ].join(' - ')

  return {
    periodLabel,
    filterLabel,
    summary,
    cohorts,
    weightedRetentionCurve: curve,
    revenueRetentionCurve: revenue,
    cohortSizeTrend: sizeTrend,
    timeToSecondPurchase: timeRows,
    comparisons,
    insights: buildInsights({ cohorts, curve, comparisons, summary }),
    recommendations: buildRecommendations(cohorts, comparisons, summary),
    availableAcquisitions: payload.dims.acquisitions,
    availableChannels: payload.dims.channels,
    methodology: [
      'Default cohort adalah First Purchase Month: satu customer masuk ke bulan transaksi valid pertamanya.',
      'Filter periode global digunakan sebagai cohort-entry period; aktivitas setelah entry tetap digunakan sampai analysis cutoff dataset.',
      'Period retention = distinct active customers pada cohort age N / original cohort size.',
      'KPI Month N memakai weighted retention: sum active customers / sum original cohort sizes dari matured cohorts.',
      'Immature cell bernilai null/unavailable dan tidak dihitung sebagai 0%.',
      'Return Anywhere menghitung aktivitas customer di semua return activity; Return to Same Entry Scope membatasi outlet dan channel entry yang tersedia di compact activity.',
    ],
    limitations: [
      'Histori dataset sekitar 12 bulan, sehingga cohort terbaru belum matang untuk Month 6+.',
      'Product-level first purchase tidak tersedia di compact cohort asset saat ini.',
      'Campaign-customer attribution hanya tersedia sebagai campaign activity flag, bukan campaign ID granular.',
      'Membership at entry memakai status member dari customer lifecycle compact row; interpretasi dibuat eksplisit sebagai entry proxy.',
      'Perbedaan cohort adalah asosiasi observasional, bukan sebab-akibat.',
    ],
  }
}

export function getCohortMetricValue(cell: CohortCell, metric: CohortMetric) {
  return cellValue(cell, metric)
}
