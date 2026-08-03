import motivationJson from '@/data/customerMotivation.json'
import { customerMotivationWeights } from '@/config/customerMotivationWeights'
import { quarterLabel, quarterOf } from '@/data/cube'
import type { AppliedFilters } from '@/data/types'

export interface CustomerMotivationLocalFilters {
  segment: string
  channel: string
  motivation: string
  comparison: 'segment' | 'age' | 'gender' | 'member' | 'acquisition' | 'channel' | 'region'
}

export interface MotivationOverviewRow {
  id: string
  label: string
  score: number
  customers: number
  share: number
  rank: number
  change: number
  sourceType: string
  reliability: 'High Reliability' | 'Moderate Reliability' | 'Low Reliability'
  description: string
}

export interface MotivationKpi {
  id: string
  label: string
  value: string
  detail: string
  tone: 'blue' | 'purple' | 'cyan' | 'orange'
}

export interface MotivationDistributionRow {
  id: string
  label: string
  secondary?: string
  customers: number
  share: number
  frequency: number
  averageBasket: number
  repeatRate: number
  clv: number
  satisfaction: number
  nps: number
  memberRate: number
  voucherRate: number
}

export interface MotivationPairRow extends MotivationDistributionRow {
  secondary: string
}

export interface MotivationComparisonCell {
  dimension: string
  motivation: string
  score: number
  share: number
  repeatRate: number
  clv: number
}

export interface MotivationInsight {
  title: string
  evidence: string
  action: string
  severity: 'high' | 'medium' | 'low'
}

export interface CustomerMotivationInsights {
  periodLabel: string
  filterLabel: string
  kpis: MotivationKpi[]
  overview: MotivationOverviewRow[]
  distribution: MotivationDistributionRow[]
  pairs: MotivationPairRow[]
  comparison: MotivationComparisonCell[]
  channels: MotivationDistributionRow[]
  locations: MotivationDistributionRow[]
  products: MotivationDistributionRow[]
  acquisitions: MotivationDistributionRow[]
  behaviour: MotivationDistributionRow[]
  insights: MotivationInsight[]
  methodology: string[]
  availableSegments: string[]
  availableChannels: string[]
  availableMotivations: { id: string; label: string }[]
  scope: { customers: number; activeCustomers: number; periodTransactions: number }
}

interface MotivationCube {
  meta: { methodology: string[] }
  dims: {
    months: string[]
    outlets: { id: string; name: string; city: string; region: string }[]
    genders: string[]
    ageBands: string[]
    segments: string[]
    occupations: string[]
    acquisitions: string[]
    channels: string[]
    categories: string[]
    products: { id: string; name: string; category: string }[]
  }
  customerMotivation: number[][]
  customerMotivationMonthly: number[][]
}

const cube = motivationJson as unknown as MotivationCube

export const defaultCustomerMotivationLocalFilters: CustomerMotivationLocalFilters = {
  segment: 'all',
  channel: 'all',
  motivation: 'all',
  comparison: 'segment',
}

const CM = {
  outlet: 0, gender: 1, age: 2, segment: 3, occupation: 4, acquisition: 5,
  member: 6, visits: 7, netSpend: 8, avgBasket: 9, voucherUses: 10,
  deliveryShare: 11, avgSat: 12, nps: 13, recency: 14, freq: 15, clv: 16,
  favoriteCategory: 17, favoriteProduct: 18, tasteScore: 19, tasteImp: 20,
  priceScore: 21, priceImp: 22, serviceScore: 23, serviceImp: 24,
  orderingScore: 25, orderingImp: 26, ambienceScore: 27, ambienceImp: 28,
  varietyScore: 29, varietyImp: 30, promoScore: 31, promoImp: 32,
  locationScore: 33, locationImp: 34, appScore: 35, appImp: 36,
  surveyCount: 39, wouldRecommend: 40,
} as const
const CMM = { customer: 0, month: 1, channel: 2, tx: 3, net: 4, voucher: 5, campaign: 6, memberTx: 7, morning: 8, delivery: 9, wait: 10, sat: 11, itemQty: 12, coffeeQty: 13, snackQty: 14 } as const

const safeDivide = (value: number, total: number) => (total ? value / total : 0)
const normalizeScore = (value: number) => Math.max(0, Math.min(1, value / 500))
const normalizePercent = (value: number) => Math.max(0, Math.min(1, value / 100))
const normalizeNps = (value: number) => (value < 0 ? 0 : Math.max(0, Math.min(1, value / 10)))
const formatPercentText = (value: number) => `${(value * 100).toFixed(1).replace('.', ',')}%`

function resolveMonths(filters: AppliedFilters) {
  const months = new Set<number>()
  const previous = new Set<number>()
  cube.dims.months.forEach((month, index) => {
    if (!filters.quarter || quarterOf(month) === filters.quarter) months.add(index)
  })
  const sorted = [...months].sort((a, b) => a - b)
  const length = sorted.length || 3
  const start = sorted[0] ?? cube.dims.months.length - length
  for (let i = start - length; i < start; i += 1) if (i >= 0) previous.add(i)
  return { months, previous, periodLabel: filters.quarter ? quarterLabel(filters.quarter) : 'Semua Periode' }
}

function baseCustomerIndexes(filters: AppliedFilters, local: CustomerMotivationLocalFilters) {
  return cube.customerMotivation
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => {
      const outlet = cube.dims.outlets[row[CM.outlet]!]
      if (!outlet) return false
      if (filters.outlet && outlet.id !== filters.outlet) return false
      if (filters.city && outlet.city !== filters.city) return false
      if (filters.region && outlet.region !== filters.region) return false
      if (filters.gender && cube.dims.genders[row[CM.gender]!] !== filters.gender) return false
      if (filters.ageBand && cube.dims.ageBands[row[CM.age]!] !== filters.ageBand) return false
      if (local.segment !== 'all' && cube.dims.segments[row[CM.segment]!] !== local.segment) return false
      return true
    })
}

function periodActivity(indexes: Set<number>, months: Set<number>) {
  const map = new Map<number, { tx: number; net: number; voucher: number; campaign: number; memberTx: number; morning: number; delivery: number; wait: number; sat: number; items: number; coffee: number; snack: number; channels: Set<number> }>()
  cube.customerMotivationMonthly.forEach((row) => {
    const customer = row[CMM.customer]!
    if (!indexes.has(customer) || !months.has(row[CMM.month]!)) return
    const cell = map.get(customer) ?? { tx: 0, net: 0, voucher: 0, campaign: 0, memberTx: 0, morning: 0, delivery: 0, wait: 0, sat: 0, items: 0, coffee: 0, snack: 0, channels: new Set<number>() }
    cell.tx += row[CMM.tx]!
    cell.net += row[CMM.net]!
    cell.voucher += row[CMM.voucher]!
    cell.campaign += row[CMM.campaign]!
    cell.memberTx += row[CMM.memberTx]!
    cell.morning += row[CMM.morning]!
    cell.delivery += row[CMM.delivery]!
    cell.wait += row[CMM.wait]!
    cell.sat += row[CMM.sat]!
    cell.items += row[CMM.itemQty]!
    cell.coffee += row[CMM.coffeeQty]!
    cell.snack += row[CMM.snackQty]!
    cell.channels.add(row[CMM.channel]!)
    map.set(customer, cell)
  })
  return map
}

function customerSignals(row: number[], activity?: ReturnType<typeof periodActivity> extends Map<number, infer T> ? T : never) {
  const visits = row[CM.visits]!
  const tx = activity?.tx ?? visits
  return {
    tasteImportance: normalizeScore(row[CM.tasteImp]!),
    tastePerformance: normalizeScore(row[CM.tasteScore]!),
    priceImportance: normalizeScore(row[CM.priceImp]!),
    pricePerformance: normalizeScore(row[CM.priceScore]!),
    promoImportance: normalizeScore(row[CM.promoImp]!),
    promoPerformance: normalizeScore(row[CM.promoScore]!),
    orderingScore: (normalizeScore(row[CM.orderingScore]!) + normalizeScore(row[CM.orderingImp]!)) / 2,
    appScore: (normalizeScore(row[CM.appScore]!) + normalizeScore(row[CM.appImp]!)) / 2,
    locationScore: (normalizeScore(row[CM.locationScore]!) + normalizeScore(row[CM.locationImp]!)) / 2,
    ambienceScore: (normalizeScore(row[CM.ambienceScore]!) + normalizeScore(row[CM.ambienceImp]!)) / 2,
    serviceScore: (normalizeScore(row[CM.serviceScore]!) + normalizeScore(row[CM.serviceImp]!)) / 2,
    satisfaction: normalizeScore(row[CM.avgSat]!),
    npsSignal: normalizeNps(row[CM.nps]!),
    memberSignal: row[CM.member] === 1 ? 1 : 0,
    repeatSignal: visits >= 2 ? Math.min(1, visits / 20) : 0,
    retentionSignal: row[CM.recency]! <= 60 ? 1 : row[CM.recency]! <= 120 ? 0.55 : 0.2,
    frequencySignal: Math.min(1, row[CM.freq]! / 600),
    recencySignal: Math.max(0, 1 - row[CM.recency]! / 240),
    voucherRate: safeDivide(activity?.voucher ?? row[CM.voucherUses]!, tx),
    campaignSignal: safeDivide(activity?.campaign ?? 0, tx),
    deliveryShare: activity ? safeDivide(activity.delivery, tx) : normalizePercent(row[CM.deliveryShare]!),
    waitSignal: Math.max(0, 1 - safeDivide((activity?.wait ?? 0) / 10, tx) / 18),
    daypartConsistency: safeDivide(activity?.morning ?? 0, tx),
    favoriteConsistency: row[CM.favoriteProduct]! >= 0 ? 0.75 : 0.35,
    coffeeShare: safeDivide(activity?.coffee ?? (cube.dims.categories[row[CM.favoriteCategory]!] === 'Coffee' ? visits : 0), activity?.items ?? visits),
    snackShare: safeDivide(activity?.snack ?? (cube.dims.categories[row[CM.favoriteCategory]!] === 'Snack' ? visits : 0), activity?.items ?? visits),
    morningShare: safeDivide(activity?.morning ?? 0, tx),
    basketAffordability: Math.max(0, 1 - row[CM.avgBasket]! / 85000),
    discountRate: safeDivide(row[CM.voucherUses]!, Math.max(1, visits)),
  }
}

function motivationScores(row: number[], activity?: ReturnType<typeof periodActivity> extends Map<number, infer T> ? T : never) {
  const signals = customerSignals(row, activity)
  return customerMotivationWeights.dimensions.map((dimension) => {
    const score = Object.entries(dimension.weights).reduce((total, [key, weight]) => total + (signals[key as keyof typeof signals] ?? 0) * weight, 0)
    return { id: dimension.id, label: dimension.label, score, sourceType: dimension.sourceType, description: dimension.description }
  })
}

function dominantFor(row: number[], activity?: ReturnType<typeof periodActivity> extends Map<number, infer T> ? T : never) {
  const scores = motivationScores(row, activity).sort((a, b) => b.score - a.score)
  return { primary: scores[0]!, secondary: scores[1]!, scores }
}

function reliability(sample: number, sourceType: string, avgScore: number, change: number): MotivationOverviewRow['reliability'] {
  const directBoost = sourceType === 'Mixed Evidence' ? 0.18 : 0.08
  const score = Math.min(0.45, sample / customerMotivationWeights.highReliabilitySampleSize * 0.45) + directBoost + Math.min(0.22, avgScore * 0.22) + Math.max(0, 0.15 - Math.abs(change) * 0.5)
  if (score >= 0.68) return 'High Reliability'
  if (score >= 0.42) return 'Moderate Reliability'
  return 'Low Reliability'
}

function aggregateDistribution(rows: Array<{ row: number[]; index: number }>, activity: Map<number, ReturnType<typeof periodActivity> extends Map<number, infer T> ? T : never>, groupKey: (item: { row: number[]; index: number; primary: string; secondary: string }) => string, groupLabel: (key: string) => string) {
  const cells = new Map<string, { customers: number; tx: number; net: number; visits: number; repeat: number; clv: number; sat: number; nps: number; member: number; voucher: number; secondary: string }>()
  rows.forEach((item) => {
    const dom = dominantFor(item.row, activity.get(item.index))
    const key = groupKey({ ...item, primary: dom.primary.id, secondary: dom.secondary.id })
    const cell = cells.get(key) ?? { customers: 0, tx: 0, net: 0, visits: 0, repeat: 0, clv: 0, sat: 0, nps: 0, member: 0, voucher: 0, secondary: dom.secondary.label }
    const act = activity.get(item.index)
    const tx = act?.tx ?? item.row[CM.visits]!
    cell.customers += 1
    cell.tx += tx
    cell.net += act?.net ?? item.row[CM.netSpend]!
    cell.visits += item.row[CM.visits]!
    if (item.row[CM.visits]! >= 2) cell.repeat += 1
    cell.clv += item.row[CM.clv]!
    cell.sat += item.row[CM.avgSat]! / 100
    cell.nps += item.row[CM.nps]!
    cell.member += item.row[CM.member]!
    cell.voucher += act?.voucher ?? item.row[CM.voucherUses]!
    cells.set(key, cell)
  })
  const total = rows.length
  return [...cells.entries()].map(([key, cell]) => ({
    id: key,
    label: groupLabel(key),
    secondary: cell.secondary,
    customers: cell.customers,
    share: safeDivide(cell.customers, total),
    frequency: safeDivide(cell.visits, cell.customers),
    averageBasket: safeDivide(cell.net, cell.tx),
    repeatRate: safeDivide(cell.repeat, cell.customers),
    clv: safeDivide(cell.clv, cell.customers),
    satisfaction: safeDivide(cell.sat, cell.customers),
    nps: safeDivide(cell.nps, cell.customers),
    memberRate: safeDivide(cell.member, cell.customers),
    voucherRate: safeDivide(cell.voucher, cell.tx),
  })).sort((a, b) => b.customers - a.customers)
}

export function queryCustomerMotivation(filters: AppliedFilters, local: CustomerMotivationLocalFilters = defaultCustomerMotivationLocalFilters): CustomerMotivationInsights {
  const { months, previous, periodLabel } = resolveMonths(filters)
  const base = baseCustomerIndexes(filters, local)
  const indexes = new Set(base.map((item) => item.index))
  const activity = periodActivity(indexes, months)
  const previousActivity = periodActivity(indexes, previous)
  const channelIndex = local.channel === 'all' ? -1 : cube.dims.channels.indexOf(local.channel)
  const activeRows = base.filter((item) => {
    const act = activity.get(item.index)
    if (channelIndex >= 0 && !act?.channels.has(channelIndex)) return false
    if (local.motivation === 'all') return true
    return dominantFor(item.row, act).primary.id === local.motivation
  })

  const overview = customerMotivationWeights.dimensions.map((dimension) => {
    let score = 0
    let previousScore = 0
    let customers = 0
    activeRows.forEach((item) => {
      const current = motivationScores(item.row, activity.get(item.index)).find((row) => row.id === dimension.id)?.score ?? 0
      const prev = motivationScores(item.row, previousActivity.get(item.index)).find((row) => row.id === dimension.id)?.score ?? current
      score += current
      previousScore += prev
      if (dominantFor(item.row, activity.get(item.index)).primary.id === dimension.id) customers += 1
    })
    const avg = safeDivide(score, activeRows.length)
    const previousAvg = safeDivide(previousScore, activeRows.length)
    return {
      id: dimension.id,
      label: dimension.label,
      score: avg,
      customers,
      share: safeDivide(customers, activeRows.length),
      rank: 0,
      change: previousAvg ? (avg - previousAvg) / previousAvg : 0,
      sourceType: dimension.sourceType,
      reliability: reliability(activeRows.length, dimension.sourceType, avg, previousAvg ? (avg - previousAvg) / previousAvg : 0),
      description: dimension.description,
    }
  }).sort((a, b) => b.score - a.score).map((row, index) => ({ ...row, rank: index + 1 }))

  const distribution = aggregateDistribution(activeRows, activity, (item) => item.primary, (key) => overview.find((row) => row.id === key)?.label ?? key)
  const pairs = aggregateDistribution(activeRows, activity, (item) => `${item.primary}+${item.secondary}`, (key) => key.split('+').map((id) => overview.find((row) => row.id === id)?.label ?? id).join(' + ')).slice(0, 8)
  const dimensionLabel = (item: { row: number[]; index: number }) => {
    if (local.comparison === 'age') return cube.dims.ageBands[item.row[CM.age]!] ?? 'Unknown'
    if (local.comparison === 'gender') return cube.dims.genders[item.row[CM.gender]!] ?? 'Unknown'
    if (local.comparison === 'member') return item.row[CM.member] === 1 ? 'Member' : 'Non Member'
    if (local.comparison === 'acquisition') return cube.dims.acquisitions[item.row[CM.acquisition]!] ?? 'Unknown'
    if (local.comparison === 'channel') {
      const act = activity.get(item.index)
      const channel = act ? [...act.channels][0] : undefined
      return channel === undefined ? 'No Period Activity' : cube.dims.channels[channel] ?? 'Unknown'
    }
    if (local.comparison === 'region') return cube.dims.outlets[item.row[CM.outlet]!]?.region ?? 'Unknown'
    return cube.dims.segments[item.row[CM.segment]!] ?? 'Unknown'
  }
  const comparison = overview.flatMap((motivation) => {
    const labels = [...new Set(activeRows.map(dimensionLabel))]
    return labels.map((label) => {
      const subset = activeRows.filter((item) => dimensionLabel(item) === label)
      const score = safeDivide(subset.reduce((total, item) => total + (motivationScores(item.row, activity.get(item.index)).find((row) => row.id === motivation.id)?.score ?? 0), 0), subset.length)
      const dist = aggregateDistribution(subset, activity, () => motivation.id, () => motivation.label)[0]
      return { dimension: label, motivation: motivation.label, score, share: safeDivide(subset.length, activeRows.length), repeatRate: dist?.repeatRate ?? 0, clv: dist?.clv ?? 0 }
    })
  })

  const channels = aggregateDistribution(activeRows, activity, (item) => {
    const act = activity.get(item.index)
    const channel = act ? [...act.channels][0] : undefined
    return channel === undefined ? 'No Period Activity' : String(channel)
  }, (key) => key === 'No Period Activity' ? key : cube.dims.channels[Number(key)] ?? key).slice(0, 8)
  const locations = aggregateDistribution(activeRows, activity, (item) => String(item.row[CM.outlet]), (key) => cube.dims.outlets[Number(key)]?.name ?? key).slice(0, 10)
  const products = aggregateDistribution(activeRows, activity, (item) => String(item.row[CM.favoriteProduct]), (key) => cube.dims.products[Number(key)]?.name ?? 'Unknown Product').slice(0, 10)
  const acquisitions = aggregateDistribution(activeRows, activity, (item) => String(item.row[CM.acquisition]), (key) => cube.dims.acquisitions[Number(key)] ?? key).slice(0, 8)
  const behaviour = [...distribution].sort((a, b) => b.repeatRate - a.repeatRate)

  const top = overview[0]
  const promoSegment = comparison.filter((row) => row.motivation === 'Promotion & Rewards').sort((a, b) => b.score - a.score)[0]
  const qualitySegment = comparison.filter((row) => row.motivation === 'Product Quality').sort((a, b) => b.score - a.score)[0]
  const loyalty = [...distribution].sort((a, b) => b.memberRate + b.repeatRate - (a.memberRate + a.repeatRate))[0]
  const clv = [...distribution].sort((a, b) => b.clv - a.clv)[0]
  const consistency = distribution[0]?.share ?? 0
  const activeCustomers = activeRows.filter((item) => (activity.get(item.index)?.tx ?? 0) > 0).length
  const periodTransactions = activeRows.reduce((total, item) => total + (activity.get(item.index)?.tx ?? 0), 0)

  return {
    periodLabel,
    filterLabel: [periodLabel, local.segment === 'all' ? 'Semua Segmen' : local.segment, local.channel === 'all' ? 'Semua Channel' : local.channel, filters.region ?? filters.city ?? filters.outlet ?? 'Semua Wilayah'].join(' · '),
    kpis: [
      { id: 'top', label: 'Top Purchase Motivation', value: top?.label ?? '-', detail: `${formatPercentText(top?.score ?? 0)} weighted evidence score`, tone: 'blue' },
      { id: 'strength', label: 'Motivation Strength Score', value: formatPercentText(safeDivide(overview.reduce((sum, row) => sum + row.score, 0), overview.length)), detail: 'Rata-rata normalized motivation score aktif', tone: 'cyan' },
      { id: 'promoSegment', label: 'Most Promotion-Driven Segment', value: promoSegment?.dimension ?? '-', detail: promoSegment ? formatPercentText(promoSegment.score) : 'Tidak tersedia', tone: 'orange' },
      { id: 'qualitySegment', label: 'Most Quality-Driven Segment', value: qualitySegment?.dimension ?? '-', detail: qualitySegment ? formatPercentText(qualitySegment.score) : 'Tidak tersedia', tone: 'purple' },
      { id: 'loyalty', label: 'Highest Loyalty-Linked Motivation', value: loyalty?.label ?? '-', detail: loyalty ? `Repeat ${formatPercentText(loyalty.repeatRate)} · member ${formatPercentText(loyalty.memberRate)}` : 'Tidak tersedia', tone: 'blue' },
      { id: 'clv', label: 'Highest CLV-Linked Motivation', value: clv?.label ?? '-', detail: clv ? `Avg CLV Rp${Math.round(clv.clv).toLocaleString('id-ID')}` : 'Tidak tersedia', tone: 'cyan' },
      { id: 'consistency', label: 'Motivation Consistency', value: formatPercentText(consistency), detail: 'Share dominant motivation terbesar pada scope aktif', tone: 'purple' },
      { id: 'respondents', label: 'Respondents / Eligible Customers', value: activeRows.length.toLocaleString('id-ID'), detail: `${activeCustomers.toLocaleString('id-ID')} customers aktif di periode`, tone: 'orange' },
    ],
    overview,
    distribution,
    pairs,
    comparison,
    channels,
    locations,
    products,
    acquisitions,
    behaviour,
    insights: [
      { title: `${top?.label ?? 'Motivation'} paling kuat pada scope aktif`, evidence: `Skor ${formatPercentText(top?.score ?? 0)} berdasarkan survey attribute dan proxy perilaku.`, action: 'Gunakan sebagai prioritas message, tetapi hindari klaim psikologis absolut.', severity: 'high' },
      { title: `${loyalty?.label ?? 'Motivation'} terkait loyalty lebih tinggi`, evidence: `Repeat ${formatPercentText(loyalty?.repeatRate ?? 0)} dan member rate ${formatPercentText(loyalty?.memberRate ?? 0)}.`, action: 'Uji campaign retensi dengan wording kecenderungan, bukan sebab-akibat.', severity: 'medium' },
      { title: 'Sumber motivasi berupa proxy terdokumentasi', evidence: 'Tidak ada field purchase reason eksplisit di survey_responses.csv.', action: 'Label semua pembacaan sebagai evidence index atau behavioural proxy.', severity: 'low' },
    ],
    methodology: cube.meta.methodology,
    availableSegments: [...new Set(base.map((item) => cube.dims.segments[item.row[CM.segment]!] ?? 'Unknown'))].sort(),
    availableChannels: cube.dims.channels,
    availableMotivations: customerMotivationWeights.dimensions.map((row) => ({ id: row.id, label: row.label })),
    scope: { customers: activeRows.length, activeCustomers, periodTransactions },
  }
}
