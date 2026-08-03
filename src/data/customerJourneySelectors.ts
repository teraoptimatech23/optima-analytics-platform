import { CJ, CJM, monthLabel, quarterLabel, quarterOf } from '@/data/cube'
import { customerJourneyThresholds } from '@/config/customerJourneyThresholds'
import type { AppliedFilters, InsightCube } from '@/data/types'

export type JourneyStage =
  | 'identified'
  | 'first-purchase'
  | 'second-purchase'
  | 'repeat'
  | 'loyalty-member'
  | 'high-value'
  | 'active'
  | 'at-risk'
  | 'dormant'
  | 'churned'
  | 'reactivated'

export interface CustomerJourneyLocalFilters {
  segment: string
  channel: string
  acquisition: string
  membership: 'all' | 'member' | 'non-member'
}

export interface JourneyKpi {
  id: string
  label: string
  value: number
  display: 'number' | 'percent' | 'days' | 'currency'
  detail: string
  tone: 'blue' | 'purple' | 'cyan' | 'orange'
}

export interface JourneyFunnelStep {
  id: string
  label: string
  count: number
  conversionFromPrevious: number
  cumulativeConversion: number
  dropOffCount: number
  dropOffRate: number
  medianDaysToStage: number | null
}

export interface LifecycleStageRow {
  id: JourneyStage
  label: string
  count: number
  share: number
  description: string
}

export interface JourneyTransition {
  source: JourneyStage
  sourceLabel: string
  target: JourneyStage
  targetLabel: string
  count: number
  share: number
  direction: 'progression' | 'stable' | 'regression' | 'recovery'
}

export interface AcquisitionCohortRow {
  cohort: string
  acquired: number
  firstPurchaseRate: number
  repeatRate: number
  activeAtPeriodEndRate: number
  avgClv: number
}

export interface JourneyBreakdownRow {
  label: string
  customers: number
  share: number
  repeatRate: number
  churnRate: number
  avgClv: number
}

export interface CustomerJourneyInsights {
  periodLabel: string
  filterLabel: string
  kpis: JourneyKpi[]
  funnel: JourneyFunnelStep[]
  lifecycleSnapshot: LifecycleStageRow[]
  transitions: JourneyTransition[]
  cohorts: AcquisitionCohortRow[]
  segmentBreakdown: JourneyBreakdownRow[]
  channelBreakdown: JourneyBreakdownRow[]
  insights: string[]
  methodology: string[]
  availableSegments: string[]
  availableChannels: string[]
  availableAcquisitions: string[]
  scope: {
    customers: number
    periodCustomers: number
    periodTransactions: number
    periodRevenue: number
    startMonth: string
    endMonth: string
  }
}

type JourneyRow = number[]
type MonthlyRow = number[]

interface Scope {
  outlets: Set<number>
  months: Set<number>
  monthKeys: string[]
  genders: Set<number>
  ages: Set<number>
}

interface CustomerActivity {
  txToStart: number
  txToEnd: number
  netToEnd: number
  periodTx: number
  periodNet: number
  periodVoucherTx: number
  periodCampaignTx: number
  lastMonthToStart: number
  lastMonthToEnd: number
  channels: Set<number>
}

export const defaultCustomerJourneyLocalFilters: CustomerJourneyLocalFilters = {
  segment: 'all',
  channel: 'all',
  acquisition: 'all',
  membership: 'all',
}

const stageLabels: Record<JourneyStage, string> = {
  identified: 'Identified',
  'first-purchase': 'First Purchase',
  'second-purchase': 'Second Purchase',
  repeat: 'Repeat Customer',
  'loyalty-member': 'Loyalty Member',
  'high-value': 'High-Value Customer',
  active: 'Active Customer',
  'at-risk': 'At-Risk',
  dormant: 'Dormant',
  churned: 'Churned',
  reactivated: 'Reactivated',
}

const stageDescriptions: Record<JourneyStage, string> = {
  identified: 'Customer memiliki signup/acquisition source tetapi belum ada pembelian sampai akhir periode.',
  'first-purchase': 'Customer sudah melakukan satu transaksi sampai akhir periode.',
  'second-purchase': 'Customer sudah mencapai pembelian kedua sampai akhir periode.',
  repeat: 'Customer memiliki transaksi berulang di atas minimum repeat.',
  'loyalty-member': 'Customer aktif sebagai member loyalty dan sudah repeat.',
  'high-value': 'Customer repeat dengan CLV berada di percentile tinggi scope aktif.',
  active: 'Customer membeli dalam batas active recency.',
  'at-risk': 'Customer melewati active recency namun belum dormant.',
  dormant: 'Customer tidak membeli melewati dormant threshold.',
  churned: 'Customer tidak membeli melewati churn threshold.',
  reactivated: 'Customer sebelumnya dormant/churned lalu membeli lagi pada periode aktif.',
}

const stageRank: Record<JourneyStage, number> = {
  identified: 0,
  'first-purchase': 1,
  'second-purchase': 2,
  repeat: 3,
  active: 3,
  'loyalty-member': 4,
  'high-value': 5,
  'at-risk': -1,
  dormant: -2,
  churned: -3,
  reactivated: 2,
}

const dayMs = 86400000
const dayNumber = (date: Date) => Math.floor(date.getTime() / dayMs)
const safeDivide = (value: number, total: number) => (total ? value / total : 0)
const median = (values: number[]) => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] ?? 0 : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
}

function monthEndDay(cube: InsightCube, monthIndex: number) {
  const month = cube.dims.months[monthIndex]
  if (!month) return dayNumber(new Date(cube.meta.period.end + 'T00:00:00Z'))
  if (cube.meta.period.end.startsWith(month)) return dayNumber(new Date(cube.meta.period.end + 'T00:00:00Z'))
  const [year, monthNo] = month.split('-').map(Number)
  return dayNumber(new Date(Date.UTC(year ?? 2026, monthNo ?? 1, 0)))
}

function resolveScope(cube: InsightCube, filters: AppliedFilters): Scope {
  const outlets = new Set<number>()
  cube.dims.outlets.forEach((outlet, index) => {
    if (filters.outlet && outlet.id !== filters.outlet) return
    if (filters.city && outlet.city !== filters.city) return
    if (filters.region && outlet.region !== filters.region) return
    outlets.add(index)
  })

  const months = new Set<number>()
  const monthKeys: string[] = []
  cube.dims.months.forEach((month, index) => {
    if (filters.quarter && quarterOf(month) !== filters.quarter) return
    months.add(index)
    monthKeys.push(month)
  })

  const genders = new Set<number>()
  cube.dims.genders.forEach((gender, index) => {
    if (!filters.gender || gender === filters.gender) genders.add(index)
  })

  const ages = new Set<number>()
  cube.dims.ageBands.forEach((age, index) => {
    if (!filters.ageBand || age === filters.ageBand) ages.add(index)
  })

  return { outlets, months, monthKeys, genders, ages }
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)))
  return sorted[index] ?? 0
}

function baseMatches(cube: InsightCube, row: JourneyRow, scope: Scope, local: CustomerJourneyLocalFilters) {
  if (!scope.outlets.has(row[CJ.outlet]!) || !scope.genders.has(row[CJ.gender]!) || !scope.ages.has(row[CJ.age]!)) return false
  if (local.segment !== 'all' && cube.dims.segments[row[CJ.segment]!] !== local.segment) return false
  if (local.acquisition !== 'all' && cube.dims.acquisitions[row[CJ.acquisition]!] !== local.acquisition) return false
  if (local.membership === 'member' && row[CJ.member] !== 1) return false
  if (local.membership === 'non-member' && row[CJ.member] === 1) return false
  return true
}

function buildActivity(cube: InsightCube, scope: Scope, customerIndexes: Set<number>, periodStart: number, periodEnd: number) {
  const activity = new Map<number, CustomerActivity>()
  const ensure = (customer: number) => {
    const existing = activity.get(customer)
    if (existing) return existing
    const fresh: CustomerActivity = {
      txToStart: 0,
      txToEnd: 0,
      netToEnd: 0,
      periodTx: 0,
      periodNet: 0,
      periodVoucherTx: 0,
      periodCampaignTx: 0,
      lastMonthToStart: -1,
      lastMonthToEnd: -1,
      channels: new Set<number>(),
    }
    activity.set(customer, fresh)
    return fresh
  }

  cube.customerJourneyMonthly.forEach((row: MonthlyRow) => {
    const customer = row[CJM.customer]!
    if (!customerIndexes.has(customer)) return
    const month = row[CJM.month]!
    if (month <= periodEnd) {
      const cell = ensure(customer)
      cell.txToEnd += row[CJM.tx]!
      cell.netToEnd += row[CJM.net]!
      cell.lastMonthToEnd = Math.max(cell.lastMonthToEnd, month)
      if (month < periodStart) {
        cell.txToStart += row[CJM.tx]!
        cell.lastMonthToStart = Math.max(cell.lastMonthToStart, month)
      }
      if (scope.months.has(month)) {
        cell.periodTx += row[CJM.tx]!
        cell.periodNet += row[CJM.net]!
        cell.periodVoucherTx += row[CJM.voucherTx]!
        cell.periodCampaignTx += row[CJM.campaignTx]!
        cell.channels.add(row[CJM.channel]!)
      }
    }
  })

  return activity
}

function lifecycleStage(cube: InsightCube, row: JourneyRow, activity: CustomerActivity | undefined, endDay: number, highValueThreshold: number): JourneyStage {
  const tx = activity?.txToEnd ?? 0
  if (tx <= 0) return 'identified'
  const lastMonth = activity?.lastMonthToEnd ?? -1
  const lastDay = lastMonth >= 0 ? Math.min(monthEndDay(cube, lastMonth), endDay) : row[CJ.lastPurchaseDay]!
  const recency = Math.max(0, endDay - lastDay)
  if (recency >= customerJourneyThresholds.churnRecencyDays) return 'churned'
  if (recency >= customerJourneyThresholds.dormantRecencyDays) return 'dormant'
  if (recency >= customerJourneyThresholds.atRiskRecencyDays) return 'at-risk'
  if (tx >= customerJourneyThresholds.repeatPurchaseMinimumTransactions && row[CJ.clv]! >= highValueThreshold) return 'high-value'
  if (tx >= customerJourneyThresholds.repeatPurchaseMinimumTransactions && row[CJ.member] === 1) return 'loyalty-member'
  if (tx > customerJourneyThresholds.repeatPurchaseMinimumTransactions) return 'repeat'
  if (tx === customerJourneyThresholds.repeatPurchaseMinimumTransactions) return 'second-purchase'
  return 'first-purchase'
}

function stateAtMonth(cube: InsightCube, row: JourneyRow, activity: CustomerActivity | undefined, monthIndex: number, highValueThreshold: number): JourneyStage {
  if (monthIndex < 0) return 'identified'
  const endDay = monthEndDay(cube, monthIndex)
  const previousActivity = activity
    ? { ...activity, txToEnd: activity.txToStart, netToEnd: 0, lastMonthToEnd: activity.lastMonthToStart }
    : undefined
  return lifecycleStage(cube, row, previousActivity, endDay, highValueThreshold)
}

function directionOf(source: JourneyStage, target: JourneyStage): JourneyTransition['direction'] {
  if (source === target) return 'stable'
  if ((source === 'dormant' || source === 'churned' || source === 'at-risk') && !['dormant', 'churned', 'at-risk'].includes(target)) return 'recovery'
  return stageRank[target] >= stageRank[source] ? 'progression' : 'regression'
}

function summarizeByLabel(rows: Array<{ row: JourneyRow; index: number }>, labels: string[], labelOf: (row: JourneyRow) => string, activity: Map<number, CustomerActivity>, endStages: Map<number, JourneyStage>) {
  const byLabel = new Map<string, { customers: number; first: number; repeat: number; churn: number; clv: number }>()
  rows.forEach(({ row, index }) => {
    const label = labelOf(row)
    const cell = byLabel.get(label) ?? { customers: 0, first: 0, repeat: 0, churn: 0, clv: 0 }
    const act = activity.get(index)
    cell.customers += 1
    if ((act?.txToEnd ?? 0) >= 1) cell.first += 1
    if ((act?.txToEnd ?? 0) >= customerJourneyThresholds.repeatPurchaseMinimumTransactions) cell.repeat += 1
    if (endStages.get(index) === 'churned') cell.churn += 1
    cell.clv += row[CJ.clv]!
    byLabel.set(label, cell)
  })
  const total = rows.length
  return labels
    .map((label) => {
      const cell = byLabel.get(label) ?? { customers: 0, first: 0, repeat: 0, churn: 0, clv: 0 }
      return {
        label,
        customers: cell.customers,
        share: safeDivide(cell.customers, total),
        repeatRate: safeDivide(cell.repeat, cell.first),
        churnRate: safeDivide(cell.churn, cell.first),
        avgClv: safeDivide(cell.clv, cell.customers),
      }
    })
    .filter((row) => row.customers > 0)
    .sort((a, b) => b.customers - a.customers)
}

function cohortLabel(value: number) {
  const raw = String(value)
  if (raw.length !== 6) return 'Unknown'
  return monthLabel(`${raw.slice(0, 4)}-${raw.slice(4, 6)}`)
}

export function queryCustomerJourney(cube: InsightCube, filters: AppliedFilters, local: CustomerJourneyLocalFilters = defaultCustomerJourneyLocalFilters): CustomerJourneyInsights {
  const scope = resolveScope(cube, filters)
  const sortedMonths = [...scope.months].sort((a, b) => a - b)
  const periodStart = sortedMonths[0] ?? 0
  const periodEnd = sortedMonths.at(-1) ?? cube.dims.months.length - 1
  const startMonth = cube.dims.months[periodStart] ?? cube.dims.months[0] ?? cube.meta.period.start.slice(0, 7)
  const endMonth = cube.dims.months[periodEnd] ?? cube.meta.period.end.slice(0, 7)
  const endDay = monthEndDay(cube, periodEnd)

  const baseRowsWithIndex = cube.customerJourney
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => baseMatches(cube, row, scope, local))
  const baseIndexes = new Set(baseRowsWithIndex.map(({ index }) => index))
  const activity = buildActivity(cube, scope, baseIndexes, periodStart, periodEnd)

  const availableSegments = [...new Set(baseRowsWithIndex.map(({ row }) => cube.dims.segments[row[CJ.segment]!] ?? 'Unknown'))].sort()
  const availableAcquisitions = [...new Set(baseRowsWithIndex.map(({ row }) => cube.dims.acquisitions[row[CJ.acquisition]!] ?? 'Unknown'))].sort()
  const availableChannels = [...new Set(cube.customerJourneyMonthly
    .filter((row) => baseIndexes.has(row[CJM.customer]!) && scope.months.has(row[CJM.month]!))
    .map((row) => cube.dims.channels[row[CJM.channel]!] ?? 'Unknown'))].sort()

  const filteredWithIndex = baseRowsWithIndex.filter(({ index }) => {
    if (local.channel === 'all') return true
    const channelIndex = cube.dims.channels.indexOf(local.channel)
    return activity.get(index)?.channels.has(channelIndex) ?? false
  })
  const rows = filteredWithIndex.map(({ row }) => row)
  const indexes = filteredWithIndex.map(({ index }) => index)
  const highValueThreshold = percentile(rows.map((row) => row[CJ.clv]!), customerJourneyThresholds.highValuePercentile)

  const endStages = new Map<number, JourneyStage>()
  const priorStages = new Map<number, JourneyStage>()
  indexes.forEach((index, rowIndex) => {
    const row = rows[rowIndex]!
    endStages.set(index, lifecycleStage(cube, row, activity.get(index), endDay, highValueThreshold))
    priorStages.set(index, stateAtMonth(cube, row, activity.get(index), periodStart - 1, highValueThreshold))
  })

  const acquired = rows.filter((row) => row[CJ.signupDay]! <= endDay).length
  const firstPurchase = indexes.filter((index, i) => (activity.get(index)?.txToEnd ?? 0) >= 1 && rows[i]![CJ.firstPurchaseDay]! <= endDay).length
  const secondPurchase = indexes.filter((index, i) => (activity.get(index)?.txToEnd ?? 0) >= 2 && rows[i]![CJ.secondPurchaseDay]! <= endDay).length
  const repeat = secondPurchase
  const loyalty = rows.filter((row, i) => row[CJ.member] === 1 && (row[CJ.memberSinceDay] === -1 || row[CJ.memberSinceDay]! <= endDay) && (activity.get(indexes[i]!)?.txToEnd ?? 0) >= 1).length
  const highValue = rows.filter((row, i) => row[CJ.clv]! >= highValueThreshold && (activity.get(indexes[i]!)?.txToEnd ?? 0) >= 1).length
  const periodCustomers = indexes.filter((index) => (activity.get(index)?.periodTx ?? 0) > 0).length
  const periodTransactions = indexes.reduce((sum, index) => sum + (activity.get(index)?.periodTx ?? 0), 0)
  const periodRevenue = indexes.reduce((sum, index) => sum + (activity.get(index)?.periodNet ?? 0), 0)

  const atRisk = indexes.filter((index) => endStages.get(index) === 'at-risk').length
  const churned = indexes.filter((index) => endStages.get(index) === 'churned').length
  const previouslyDormantOrChurned = indexes.filter((index) => ['dormant', 'churned'].includes(priorStages.get(index) ?? 'identified')).length
  const reactivated = indexes.filter((index) => {
    const prior = priorStages.get(index)
    const current = endStages.get(index)
    return ['dormant', 'churned'].includes(prior ?? 'identified') && !['dormant', 'churned'].includes(current ?? 'identified') && (activity.get(index)?.periodTx ?? 0) > 0
  }).length

  const timeToFirst = rows.map((row) => row[CJ.firstPurchaseDay]! - row[CJ.signupDay]!).filter((value) => value >= 0)
  const timeToSecond = rows.map((row) => row[CJ.secondPurchaseDay]! - row[CJ.firstPurchaseDay]!).filter((value) => value >= 0)
  const medianSecond = median(timeToSecond)

  const funnelCounts = [
    { id: 'identified', label: 'Acquired / Identified', count: acquired, days: median(timeToFirst) },
    { id: 'first-purchase', label: 'First Purchase', count: firstPurchase, days: median(timeToFirst) },
    { id: 'second-purchase', label: 'Second Purchase', count: secondPurchase, days: medianSecond },
    { id: 'repeat', label: 'Repeat Customer', count: repeat, days: medianSecond },
    { id: 'loyalty-member', label: 'Loyalty Member', count: loyalty, days: null },
    { id: 'high-value', label: 'High-Value Customer', count: highValue, days: null },
  ]
  const firstCount = funnelCounts[0]?.count ?? 0
  const funnel = funnelCounts.map((step, index) => {
    const previous = funnelCounts[index - 1]?.count ?? step.count
    const dropOff = Math.max(0, previous - step.count)
    return {
      id: step.id,
      label: step.label,
      count: step.count,
      conversionFromPrevious: index === 0 ? 1 : safeDivide(step.count, previous),
      cumulativeConversion: safeDivide(step.count, firstCount),
      dropOffCount: dropOff,
      dropOffRate: safeDivide(dropOff, previous),
      medianDaysToStage: step.days,
    }
  })

  const lifecycleOrder: JourneyStage[] = ['identified', 'first-purchase', 'second-purchase', 'repeat', 'loyalty-member', 'high-value', 'at-risk', 'dormant', 'churned']
  const lifecycleSnapshot = lifecycleOrder.map((stage) => {
    const count = indexes.filter((index) => endStages.get(index) === stage).length
    return { id: stage, label: stageLabels[stage], count, share: safeDivide(count, rows.length), description: stageDescriptions[stage] }
  }).filter((row) => row.count > 0)

  const transitionMap = new Map<string, JourneyTransition>()
  indexes.forEach((index) => {
    const source = priorStages.get(index) ?? 'identified'
    const target = endStages.get(index) ?? 'identified'
    const key = `${source}|${target}`
    const cell = transitionMap.get(key) ?? {
      source,
      sourceLabel: stageLabels[source],
      target,
      targetLabel: stageLabels[target],
      count: 0,
      share: 0,
      direction: directionOf(source, target),
    }
    cell.count += 1
    transitionMap.set(key, cell)
  })
  const transitions = [...transitionMap.values()]
    .map((row) => ({ ...row, share: safeDivide(row.count, rows.length) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  const cohortMap = new Map<number, { acquired: number; first: number; repeat: number; active: number; clv: number }>()
  rows.forEach((row, i) => {
    const key = row[CJ.cohortYm]!
    const cell = cohortMap.get(key) ?? { acquired: 0, first: 0, repeat: 0, active: 0, clv: 0 }
    const act = activity.get(indexes[i]!)
    const state = endStages.get(indexes[i]!)
    cell.acquired += 1
    if ((act?.txToEnd ?? 0) >= 1) cell.first += 1
    if ((act?.txToEnd ?? 0) >= 2) cell.repeat += 1
    if (state && !['identified', 'dormant', 'churned'].includes(state)) cell.active += 1
    cell.clv += row[CJ.clv]!
    cohortMap.set(key, cell)
  })
  const cohorts = [...cohortMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .slice(0, 8)
    .map(([cohort, cell]) => ({
      cohort: cohortLabel(cohort),
      acquired: cell.acquired,
      firstPurchaseRate: safeDivide(cell.first, cell.acquired),
      repeatRate: safeDivide(cell.repeat, cell.first),
      activeAtPeriodEndRate: safeDivide(cell.active, cell.first),
      avgClv: safeDivide(cell.clv, cell.acquired),
    }))

  const indexedRowsByCustomer = new Map(filteredWithIndex.map(({ row, index }) => [index, row]))
  const segmentBreakdown = summarizeByLabel(
    filteredWithIndex,
    cube.dims.segments,
    (row) => cube.dims.segments[row[CJ.segment]!] ?? 'Unknown',
    activity,
    endStages,
  )
  const channelAgg = new Map<string, { customers: Set<number>; first: number; repeat: number; churn: number; clv: number }>()
  cube.customerJourneyMonthly.forEach((monthly) => {
    const customer = monthly[CJM.customer]!
    if (!indexedRowsByCustomer.has(customer) || !scope.months.has(monthly[CJM.month]!)) return
    const label = cube.dims.channels[monthly[CJM.channel]!] ?? 'Unknown'
    const cell = channelAgg.get(label) ?? { customers: new Set<number>(), first: 0, repeat: 0, churn: 0, clv: 0 }
    cell.customers.add(customer)
    channelAgg.set(label, cell)
  })
  const channelBreakdown = [...channelAgg.entries()].map(([label, cell]) => {
    for (const customer of cell.customers) {
      const row = indexedRowsByCustomer.get(customer)
      const act = activity.get(customer)
      if (!row) continue
      if ((act?.txToEnd ?? 0) >= 1) cell.first += 1
      if ((act?.txToEnd ?? 0) >= 2) cell.repeat += 1
      if (endStages.get(customer) === 'churned') cell.churn += 1
      cell.clv += row[CJ.clv]!
    }
    return {
      label,
      customers: cell.customers.size,
      share: safeDivide(cell.customers.size, periodCustomers),
      repeatRate: safeDivide(cell.repeat, cell.first),
      churnRate: safeDivide(cell.churn, cell.first),
      avgClv: safeDivide(cell.clv, cell.customers.size),
    }
  }).sort((a, b) => b.customers - a.customers)

  const largestDrop = funnel.slice(1).sort((a, b) => b.dropOffRate - a.dropOffRate)[0]
  const biggestTransition = transitions[0]
  const strongestCohort = [...cohorts].sort((a, b) => b.activeAtPeriodEndRate - a.activeAtPeriodEndRate)[0]
  const insights = [
    largestDrop ? `${largestDrop.label} menjadi titik loss terbesar dengan drop-off ${(largestDrop.dropOffRate * 100).toFixed(1)}% dari stage sebelumnya.` : 'Belum ada drop-off stage yang dapat dihitung pada filter aktif.',
    biggestTransition ? `Transition terbesar selama periode adalah ${biggestTransition.sourceLabel} ke ${biggestTransition.targetLabel} dengan ${biggestTransition.count.toLocaleString('id-ID')} customer.` : 'Belum ada transition yang terukur pada filter aktif.',
    strongestCohort ? `Cohort ${strongestCohort.cohort} memiliki active-at-period-end rate tertinggi di cohort view sebesar ${(strongestCohort.activeAtPeriodEndRate * 100).toFixed(1)}%.` : 'Cohort aktif belum cukup untuk dibandingkan.',
  ]

  const periodLabel = filters.quarter ? quarterLabel(filters.quarter) : `${monthLabel(startMonth)} - ${monthLabel(endMonth)}`
  const filterParts = [
    periodLabel,
    local.segment === 'all' ? 'Semua Segmen' : local.segment,
    local.channel === 'all' ? 'Semua Channel' : local.channel,
    filters.region ?? filters.city ?? filters.outlet ?? 'Semua Wilayah',
  ]

  return {
    periodLabel,
    filterLabel: filterParts.join(' · '),
    kpis: [
      { id: 'customers', label: 'Total Customers in Journey', value: rows.length, display: 'number', detail: 'Customer matching global dan analysis filters', tone: 'blue' },
      { id: 'firstPurchase', label: 'First Purchase Conversion', value: safeDivide(firstPurchase, acquired), display: 'percent', detail: `${firstPurchase.toLocaleString('id-ID')} dari ${acquired.toLocaleString('id-ID')} acquired`, tone: 'cyan' },
      { id: 'secondPurchase', label: 'Second Purchase Conversion', value: safeDivide(secondPurchase, firstPurchase), display: 'percent', detail: `${secondPurchase.toLocaleString('id-ID')} dari ${firstPurchase.toLocaleString('id-ID')} first purchase`, tone: 'purple' },
      { id: 'repeat', label: 'Repeat Customer Rate', value: safeDivide(repeat, firstPurchase), display: 'percent', detail: 'Denominator: customers with at least one purchase', tone: 'blue' },
      { id: 'loyalty', label: 'Loyalty Member Rate', value: safeDivide(loyalty, firstPurchase), display: 'percent', detail: 'Member aktif di customer yang sudah pernah membeli', tone: 'orange' },
      { id: 'atRisk', label: 'At-Risk Customers', value: safeDivide(atRisk, firstPurchase), display: 'percent', detail: `${atRisk.toLocaleString('id-ID')} customer melewati active recency`, tone: 'orange' },
      { id: 'churn', label: 'Churn Rate', value: safeDivide(churned, firstPurchase), display: 'percent', detail: `${churned.toLocaleString('id-ID')} customer melewati churn recency`, tone: 'purple' },
      { id: 'reactivation', label: 'Reactivation Rate', value: safeDivide(reactivated, previouslyDormantOrChurned), display: 'percent', detail: `${reactivated.toLocaleString('id-ID')} dari ${previouslyDormantOrChurned.toLocaleString('id-ID')} dormant/churned prior`, tone: 'cyan' },
      { id: 'timeSecond', label: 'Median Time to Second Purchase', value: medianSecond ?? 0, display: 'days', detail: 'Median secondPurchaseDate - firstPurchaseDate', tone: 'blue' },
      { id: 'clv', label: 'Average Customer Lifetime Value', value: safeDivide(rows.reduce((sum, row) => sum + row[CJ.clv]!, 0), rows.length), display: 'currency', detail: 'Rata-rata CLV customer dalam scope', tone: 'purple' },
    ],
    funnel,
    lifecycleSnapshot,
    transitions,
    cohorts,
    segmentBreakdown,
    channelBreakdown,
    insights,
    methodology: [
      'Acquisition cohort memakai SignupDate/CohortMonth dari customers.csv dan tidak disamakan dengan first purchase.',
      'Transition dihitung dari lifecycle state pada akhir bulan sebelum periode ke lifecycle state pada akhir periode aktif.',
      'Snapshot akhir periode memakai histori transaksi sampai period end; at-risk/dormant/churn diturunkan dari recency threshold terdokumentasi.',
      'Channel filter membatasi customer yang punya aktivitas channel tersebut dalam periode, sementara lifecycle state tetap dihitung dari histori pembelian customer.',
    ],
    availableSegments,
    availableChannels,
    availableAcquisitions,
    scope: { customers: rows.length, periodCustomers, periodTransactions, periodRevenue, startMonth, endMonth },
  }
}
