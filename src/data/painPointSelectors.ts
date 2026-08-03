import { C, F, H, N, monthLabel, quarterLabel, quarterOf, V } from '@/data/cube'
import type { AppliedFilters, InsightCube } from '@/data/types'

export type PainPointStatus = 'critical' | 'high' | 'medium' | 'low'
export type PainPointQuadrant = 'critical' | 'high-impact' | 'frequent-manageable' | 'low-priority'
export type PainPointCompareDimension = 'region' | 'outlet'

export interface PainPointItem {
  id: string
  label: string
  category: string
  affectedCustomers: number
  reportCount: number
  frequencyRate: number
  severity: number
  satisfactionImpact: number
  npsImpact: number
  repeatImpact: number
  businessImpact: number
  priorityScore: number
  topSegment: string
  topOutlet: string
  trend: number
  status: PainPointStatus
  rootCause: string
  action: string
  owner: string
}

export interface PainPointCategory {
  id: string
  label: string
  reportCount: number
  affectedCustomers: number
  share: number
  avgSeverity: number
  topPainPoint: string
  trend: number
}

export interface PainPointMatrixPoint {
  id: string
  label: string
  category: string
  frequencyRate: number
  severity: number
  businessImpact: number
  affectedCustomers: number
  satisfactionImpact: number
  npsImpact: number
  repeatImpact: number
  priorityRank: number
  quadrant: PainPointQuadrant
}

export interface PainPointComparison {
  segment: string
  painPointId: string
  painPointLabel: string
  affectedCustomers: number
  frequencyRate: number
  severity: number
  businessImpact: number
}

export interface PainPointLocation {
  id: string
  label: string
  customerCount: number
  reportCount: number
  painPointRate: number
  avgSeverity: number
  topPainPoint: string
  satisfaction: number
  nps: number
}

export interface PainPointTrend {
  period: string
  painPointId: string
  reportCount: number
  affectedRate: number
  severity: number
}

export interface PainPointContext {
  dimension: string
  value: string
  painPointId: string
  reportCount: number
  affectedRate: number
  severity: number
}

export interface AffectedCustomerCase {
  customerId: string
  segment: string
  painPoint: string
  severity: number
  outlet: string
  channel: string
  satisfaction: number
  nps: number
  recency: number
  repeatStatus: string
  riskStatus: string
}

export interface PainPointRecommendation {
  painPointId: string
  issue: string
  evidence: string
  rootCause: string
  action: string
  priority: string
  owner: string
}

export interface PainPointInsights {
  periodLabel: string
  filterLabel: string
  summary: {
    totalReports: number
    affectedCustomers: number
    affectedRate: number
    mostCriticalPainPoint: string
    avgSeverity: number
    resolutionGap: number
    atRiskCustomers: number
  }
  painPoints: PainPointItem[]
  categories: PainPointCategory[]
  matrix: PainPointMatrixPoint[]
  segmentComparison: PainPointComparison[]
  locations: PainPointLocation[]
  trends: PainPointTrend[]
  contexts: PainPointContext[]
  customers: AffectedCustomerCase[]
  insights: string[]
  recommendations: PainPointRecommendation[]
}

interface Scope {
  outlets: Set<number>
  months: Set<number>
  genders: Set<number>
  ages: Set<number>
  monthKeys: string[]
}

interface PainMeta {
  label: string
  category: string
  rootCause: string
  action: string
  owner: string
}

interface NeedAgg {
  n: number
  imp: number
  perf: number
  low: number
  high: number
  visitsLow: number
  nLow: number
  visitsHigh: number
  nHigh: number
}

const SCALE_MAX = 5

const PAIN_META: Record<string, PainMeta> = {
  taste: {
    label: 'Drink Inconsistent',
    category: 'Product',
    rootCause: 'SOP rasa dan kalibrasi bahan belum konsisten lintas outlet.',
    action: 'Standardisasi resep, quality audit per outlet, dan refresh training barista.',
    owner: 'QA Team',
  },
  price: {
    label: 'Price Too Expensive',
    category: 'Pricing and Promotion',
    rootCause: 'Value for money belum terbaca jelas oleh pelanggan.',
    action: 'Evaluasi bundle value, komunikasi benefit member, dan promo tersegmentasi.',
    owner: 'Pricing',
  },
  service: {
    label: 'Queue Too Long',
    category: 'Operational',
    rootCause: 'Kapasitas layanan belum cukup pada jam sibuk.',
    action: 'Optimalkan staffing peak hour, express lane, dan queue management.',
    owner: 'Operations',
  },
  ordering: {
    label: 'Wrong Order / Ordering Friction',
    category: 'Digital Experience',
    rootCause: 'Alur order dan konfirmasi pesanan belum cukup jelas.',
    action: 'Sederhanakan checkout, validasi order summary, dan perjelas status pickup.',
    owner: 'Digital Product',
  },
  ambience: {
    label: 'Store Crowded',
    category: 'Outlet Experience',
    rootCause: 'Layout dan kapasitas area duduk belum mengikuti pola kunjungan.',
    action: 'Audit seating layout, flow antrean, dan kebersihan area ramai.',
    owner: 'Facility',
  },
  variety: {
    label: 'Product Out of Stock / Limited Variety',
    category: 'Product',
    rootCause: 'Pilihan menu dan ketersediaan belum merata.',
    action: 'Perbaiki forecast menu, rotasi menu musiman, dan stok item favorit.',
    owner: 'Product',
  },
  promo: {
    label: 'Voucher Difficult to Use',
    category: 'Pricing and Promotion',
    rootCause: 'Syarat dan redemption promo belum cukup mudah dipahami.',
    action: 'Sederhanakan redemption flow, tampilkan syarat promo, audit eligibility rule.',
    owner: 'CRM Team',
  },
  location: {
    label: 'Location Hard to Access',
    category: 'Outlet Experience',
    rootCause: 'Akses outlet dan pickup point belum optimal.',
    action: 'Perbaiki signage, pickup point, dan arahkan pelanggan ke outlet alternatif.',
    owner: 'Expansion',
  },
  app: {
    label: 'App Slow / Checkout Issue',
    category: 'Digital Experience',
    rootCause: 'Performa aplikasi dan checkout flow menghambat transaksi.',
    action: 'Audit performance, optimalkan API call, dan perbaiki checkout voucher.',
    owner: 'Digital Product',
  },
  parking: {
    label: 'Parking Limited',
    category: 'Outlet Experience',
    rootCause: 'Kapasitas dan informasi parkir belum memadai.',
    action: 'Perjelas informasi parkir, partnership area sekitar, dan pickup cepat.',
    owner: 'Facility',
  },
}

const emptyAgg = (): NeedAgg => ({ n: 0, imp: 0, perf: 0, low: 0, high: 0, visitsLow: 0, nLow: 0, visitsHigh: 0, nHigh: 0 })
const safeRate = (value: number, total: number) => (total ? value / total : 0)
const bounded = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

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

  return { outlets, months, genders, ages, monthKeys }
}

function addNeed(cell: NeedAgg, row: number[]) {
  cell.n += row[N.n]!
  cell.imp += row[N.impSum]! / 100
  cell.perf += row[N.perfSum]! / 100
  cell.low += row[N.lowScorers]!
  cell.high += row[N.highScorers]!
  cell.visitsLow += row[N.visitsLow]!
  cell.nLow += row[N.nLow]!
  cell.visitsHigh += row[N.visitsHigh]!
  cell.nHigh += row[N.nHigh]!
}

function customerContext(cube: InsightCube, scope: Scope) {
  let customers = 0
  let atRiskBase = 0
  const segmentCounts = new Map<number, number>()
  const outletCounts = new Map<number, number>()
  for (const row of cube.customers) {
    if (!scope.outlets.has(row[C.outlet]!) || !scope.genders.has(row[C.gender]!) || !scope.ages.has(row[C.age]!)) continue
    customers += 1
    if (row[C.recency]! > 65 || !row[C.active]) atRiskBase += 1
    segmentCounts.set(row[C.segment]!, (segmentCounts.get(row[C.segment]!) ?? 0) + 1)
    outletCounts.set(row[C.outlet]!, (outletCounts.get(row[C.outlet]!) ?? 0) + 1)
  }
  return { customers, atRiskBase, segmentCounts, outletCounts }
}

function transactionScale(cube: InsightCube, scope: Scope) {
  let allTx = 0
  let scopedTx = 0
  let allWait = 0
  let scopedWait = 0
  for (const row of cube.facts) {
    if (!scope.outlets.has(row[F.outlet]!) || !scope.genders.has(row[F.gender]!) || !scope.ages.has(row[F.age]!)) continue
    allTx += row[F.tx]!
    allWait += row[F.waitSum]!
    if (!scope.months.has(row[F.month]!)) continue
    scopedTx += row[F.tx]!
    scopedWait += row[F.waitSum]!
  }
  return {
    responseScale: allTx ? bounded(scopedTx / allTx, 0.12, 1) : 1,
    waitLift: scopedTx && allTx ? scopedWait / scopedTx - allWait / allTx : 0,
  }
}

function statusFor(priorityScore: number, severity: number): PainPointStatus {
  if (priorityScore >= 70 || severity >= 4.35) return 'critical'
  if (priorityScore >= 45 || severity >= 4.05) return 'high'
  if (priorityScore >= 22 || severity >= 3.75) return 'medium'
  return 'low'
}

function buildPainPoints(cube: InsightCube, scope: Scope, outletSet: Set<number>, responseScale: number): PainPointItem[] {
  const context = customerContext(cube, { ...scope, outlets: outletSet })
  const byNeed = new Map<number, NeedAgg>()
  for (const row of cube.needs) {
    if (!outletSet.has(row[N.outlet]!)) continue
    const cell = byNeed.get(row[N.attribute]!) ?? emptyAgg()
    addNeed(cell, row)
    byNeed.set(row[N.attribute]!, cell)
  }

  return [...byNeed.entries()].map(([index, cell]) => {
    const id = cube.dims.attributes[index] ?? `pain-${index}`
    const meta = PAIN_META[id] ?? { label: id, category: 'Other', rootCause: 'Perlu audit lanjutan.', action: 'Tindak lanjuti berdasarkan severity dan frequency.', owner: 'Operations' }
    const importance = cell.n ? cell.imp / cell.n : 0
    const performance = cell.n ? cell.perf / cell.n : 0
    const gap = Math.max(0, importance - performance)
    const lowRate = safeRate(cell.low, cell.n)
    const affectedCustomers = Math.round(context.customers * lowRate * responseScale)
    const reportCount = Math.round(cell.low * responseScale)
    const frequencyRate = safeRate(affectedCustomers, context.customers)
    const severity = bounded(2.4 + gap * 1.7 + lowRate * 1.25, 1, SCALE_MAX)
    const satisfactionImpact = -(gap * 0.72 + lowRate * 0.36)
    const npsImpact = -(gap * 18 + lowRate * 14)
    const visitsLow = cell.nLow ? cell.visitsLow / cell.nLow : 0
    const visitsHigh = cell.nHigh ? cell.visitsHigh / cell.nHigh : 0
    const repeatImpact = visitsHigh ? visitsLow / visitsHigh - 1 : -lowRate * 0.35
    const businessImpact = bounded((Math.abs(satisfactionImpact) / 1.2) * 0.36 + (Math.abs(npsImpact) / 24) * 0.34 + Math.abs(repeatImpact) * 0.3, 0, 2)
    const priorityScore = bounded(frequencyRate * (severity / SCALE_MAX) * (1 + businessImpact) * 100, 0, 100)
    const topSegment = [...context.segmentCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const topOutlet = [...context.outletCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    return {
      id,
      label: meta.label,
      category: meta.category,
      affectedCustomers,
      reportCount,
      frequencyRate,
      severity,
      satisfactionImpact,
      npsImpact,
      repeatImpact,
      businessImpact,
      priorityScore,
      topSegment: topSegment === undefined ? '-' : cube.dims.segments[topSegment] ?? '-',
      topOutlet: topOutlet === undefined ? '-' : cube.dims.outlets[topOutlet]?.name ?? '-',
      trend: 0,
      status: statusFor(priorityScore, severity),
      rootCause: meta.rootCause,
      action: meta.action,
      owner: meta.owner,
    }
  }).sort((a, b) => b.priorityScore - a.priorityScore)
}

function matrixRows(points: PainPointItem[]): PainPointMatrixPoint[] {
  const avgFrequency = points.reduce((sum, point) => sum + point.frequencyRate, 0) / (points.length || 1)
  const avgSeverity = points.reduce((sum, point) => sum + point.severity, 0) / (points.length || 1)
  return points.map((point, index) => {
    const quadrant: PainPointQuadrant = point.frequencyRate >= avgFrequency && point.severity >= avgSeverity
      ? 'critical'
      : point.frequencyRate < avgFrequency && point.severity >= avgSeverity
        ? 'high-impact'
        : point.frequencyRate >= avgFrequency
          ? 'frequent-manageable'
          : 'low-priority'
    return { ...point, priorityRank: index + 1, quadrant }
  })
}

function categories(points: PainPointItem[]): PainPointCategory[] {
  const total = points.reduce((sum, point) => sum + point.reportCount, 0)
  const byCategory = new Map<string, PainPointItem[]>()
  points.forEach((point) => byCategory.set(point.category, [...(byCategory.get(point.category) ?? []), point]))
  return [...byCategory.entries()].map(([label, rows]) => {
    const reportCount = rows.reduce((sum, row) => sum + row.reportCount, 0)
    const affectedCustomers = rows.reduce((sum, row) => sum + row.affectedCustomers, 0)
    const topPainPoint = [...rows].sort((a, b) => b.priorityScore - a.priorityScore)[0]
    return {
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      reportCount,
      affectedCustomers,
      share: safeRate(reportCount, total),
      avgSeverity: reportCount ? rows.reduce((sum, row) => sum + row.severity * row.reportCount, 0) / reportCount : 0,
      topPainPoint: topPainPoint?.label ?? '-',
      trend: topPainPoint?.trend ?? 0,
    }
  }).sort((a, b) => b.reportCount - a.reportCount)
}

function comparison(cube: InsightCube, scope: Scope, dimension: PainPointCompareDimension): PainPointComparison[] {
  const groups = new Map<string, Set<number>>()
  cube.dims.outlets.forEach((outlet, index) => {
    if (!scope.outlets.has(index)) return
    const label = dimension === 'region' ? outlet.region : outlet.name
    groups.set(label, new Set([...(groups.get(label) ?? new Set<number>()), index]))
  })
  return [...groups.entries()].slice(0, dimension === 'region' ? 6 : 5).flatMap(([segment, outlets]) => {
    const tx = transactionScale(cube, { ...scope, outlets })
    return buildPainPoints(cube, scope, outlets, tx.responseScale).slice(0, 7).map((point) => ({
      segment,
      painPointId: point.id,
      painPointLabel: point.label,
      affectedCustomers: point.affectedCustomers,
      frequencyRate: point.frequencyRate,
      severity: point.severity,
      businessImpact: point.businessImpact,
    }))
  })
}

function locations(cube: InsightCube, scope: Scope): PainPointLocation[] {
  const rows = cube.dims.outlets
    .map((outlet, outletIndex) => {
      if (!scope.outlets.has(outletIndex)) return null
      const outletSet = new Set([outletIndex])
      const tx = transactionScale(cube, { ...scope, outlets: outletSet })
      const points = buildPainPoints(cube, scope, outletSet, tx.responseScale)
      const context = customerContext(cube, { ...scope, outlets: outletSet })
      let surveyN = 0
      let sat = 0
      let promoters = 0
      let detractors = 0
      for (const row of cube.survey) {
        if (row[V.outlet] !== outletIndex || !scope.genders.has(row[V.gender]!) || !scope.ages.has(row[V.age]!)) continue
        surveyN += row[V.n]!
        sat += row[V.satSum]! / 100
        promoters += row[V.promoters]!
        detractors += row[V.detractors]!
      }
      const reportCount = points.reduce((sum, point) => sum + point.reportCount, 0)
      const top = points[0]
      return {
        id: outlet.id,
        label: outlet.name,
        customerCount: context.customers,
        reportCount,
        painPointRate: safeRate(reportCount, surveyN || context.customers),
        avgSeverity: reportCount ? points.reduce((sum, point) => sum + point.severity * point.reportCount, 0) / reportCount : 0,
        topPainPoint: top?.label ?? '-',
        satisfaction: surveyN ? sat / surveyN : 0,
        nps: surveyN ? ((promoters - detractors) / surveyN) * 100 : 0,
      }
    })
    .filter((row): row is PainPointLocation => row !== null)
  return rows.sort((a, b) => b.painPointRate - a.painPointRate).slice(0, 8)
}

function trends(cube: InsightCube, scope: Scope, points: PainPointItem[]): PainPointTrend[] {
  const months = scope.monthKeys.length ? scope.monthKeys : cube.dims.months
  return points.slice(0, 5).flatMap((point) => months.map((month) => {
    const monthIndex = cube.dims.months.indexOf(month)
    let tx = 0
    let wait = 0
    for (const row of cube.facts) {
      if (row[F.month] !== monthIndex || !scope.outlets.has(row[F.outlet]!) || !scope.genders.has(row[F.gender]!) || !scope.ages.has(row[F.age]!)) continue
      tx += row[F.tx]!
      wait += row[F.waitSum]!
    }
    const waitFactor = tx ? bounded((wait / tx - 4.5) / 8, -0.35, 0.45) : 0
    return {
      period: monthLabel(month),
      painPointId: point.id,
      reportCount: Math.max(0, Math.round(point.reportCount / months.length * (1 + waitFactor))),
      affectedRate: Math.max(0, point.frequencyRate * (1 + waitFactor)),
      severity: bounded(point.severity + waitFactor, 1, SCALE_MAX),
    }
  }))
}

function contexts(cube: InsightCube, scope: Scope, points: PainPointItem[]): PainPointContext[] {
  const byHour = new Map<number, { tx: number; wait: number }>()
  for (const row of cube.hourly) {
    if (!scope.outlets.has(row[H.outlet]!)) continue
    const cell = byHour.get(row[H.hour]!) ?? { tx: 0, wait: 0 }
    cell.tx += row[H.tx]!
    cell.wait += row[H.waitSum]!
    byHour.set(row[H.hour]!, cell)
  }
  const topHours = [...byHour.entries()]
    .map(([hour, cell]) => ({ hour, tx: cell.tx, wait: cell.tx ? cell.wait / cell.tx : 0 }))
    .sort((a, b) => b.wait - a.wait)
    .slice(0, 8)
  const topPoint = points[0]
  if (!topPoint) return []
  return topHours.map(({ hour, tx, wait }) => ({
    dimension: 'hour',
    value: `${String(hour).padStart(2, '0')}.00`,
    painPointId: topPoint.id,
    reportCount: Math.round(topPoint.reportCount * safeRate(tx, topHours.reduce((sum, item) => sum + item.tx, 0) || 1)),
    affectedRate: topPoint.frequencyRate,
    severity: bounded(topPoint.severity + Math.max(0, wait - 5) * 0.08, 1, SCALE_MAX),
  }))
}

function customerCases(cube: InsightCube, scope: Scope, points: PainPointItem[]): AffectedCustomerCase[] {
  const topPoints = points.slice(0, 4)
  const cases: AffectedCustomerCase[] = []
  for (const row of cube.customers) {
    if (cases.length >= 48) break
    if (!scope.outlets.has(row[C.outlet]!) || !scope.genders.has(row[C.gender]!) || !scope.ages.has(row[C.age]!)) continue
    const riskScore = row[C.recency]! + (row[C.active] ? 0 : 35) + (row[C.nps]! < 0 ? 20 : 0)
    if (riskScore < 65) continue
    const point = topPoints[cases.length % Math.max(1, topPoints.length)]
    const outlet = cube.dims.outlets[row[C.outlet]!]
    cases.push({
      customerId: `CUS-${String(cases.length + 1).padStart(5, '0')}`,
      segment: cube.dims.segments[row[C.segment]!] ?? '-',
      painPoint: point?.label ?? '-',
      severity: point?.severity ?? 0,
      outlet: outlet?.name ?? '-',
      channel: point?.category === 'Digital Experience' ? 'Aplikasi Kopi Kenangan' : point?.category === 'Delivery Experience' ? 'Delivery' : 'Outlet',
      satisfaction: row[C.sat]! / 100,
      nps: row[C.nps]!,
      recency: row[C.recency]!,
      repeatStatus: row[C.visits]! > 2 ? 'Repeat' : 'New',
      riskStatus: riskScore > 95 ? 'High Risk' : 'Watchlist',
    })
  }
  return cases
}

function recommendations(points: PainPointItem[]): PainPointRecommendation[] {
  return points.slice(0, 5).map((point) => ({
    painPointId: point.id,
    issue: point.label,
    evidence: `${point.reportCount.toLocaleString('id-ID')} laporan, affected rate ${(point.frequencyRate * 100).toFixed(1).replace('.', ',')}%, severity ${point.severity.toFixed(2).replace('.', ',')}/5.`,
    rootCause: point.rootCause,
    action: point.action,
    priority: point.status === 'critical' ? 'Critical' : point.status === 'high' ? 'High' : point.status === 'medium' ? 'Medium' : 'Low',
    owner: point.owner,
  }))
}

function insights(data: Omit<PainPointInsights, 'insights'>): string[] {
  const top = data.painPoints[0]
  const location = data.locations[0]
  const category = data.categories[0]
  const nps = [...data.painPoints].sort((a, b) => Math.abs(b.npsImpact) - Math.abs(a.npsImpact))[0]
  return [
    top ? `${top.label} menjadi pain point paling kritis dengan affected rate ${(top.frequencyRate * 100).toFixed(1).replace('.', ',')}% dan severity ${top.severity.toFixed(2).replace('.', ',')}/5.` : '',
    location ? `${location.label} memiliki pain point rate tertinggi pada filter aktif, dengan isu utama ${location.topPainPoint}.` : '',
    category ? `Kategori ${category.label} menyumbang ${(category.share * 100).toFixed(1).replace('.', ',')}% laporan pain point.` : '',
    nps ? `${nps.label} berkorelasi dengan perbedaan NPS sekitar ${Math.round(nps.npsImpact)} poin.` : '',
    data.summary.atRiskCustomers ? `${data.summary.atRiskCustomers.toLocaleString('id-ID')} pelanggan masuk estimasi at-risk karena kombinasi pain point dan sinyal recency/satisfaction.` : '',
  ].filter(Boolean).slice(0, 5)
}

export function queryPainPoints(cube: InsightCube, filters: AppliedFilters, compareDimension: PainPointCompareDimension = 'region'): PainPointInsights {
  const scope = resolveScope(cube, filters)
  const tx = transactionScale(cube, scope)
  const context = customerContext(cube, scope)
  const painPoints = buildPainPoints(cube, scope, scope.outlets, tx.responseScale).map((point) => {
    const waitAdjustment = point.id === 'service' ? Math.max(0, tx.waitLift) * 0.08 : 0
    const severity = bounded(point.severity + waitAdjustment, 1, SCALE_MAX)
    const priorityScore = bounded(point.frequencyRate * (severity / SCALE_MAX) * (1 + point.businessImpact) * 100, 0, 100)
    return { ...point, severity, priorityScore, status: statusFor(priorityScore, severity) }
  }).sort((a, b) => b.priorityScore - a.priorityScore)

  const totalReports = painPoints.reduce((sum, point) => sum + point.reportCount, 0)
  const affectedCustomers = Math.min(context.customers, painPoints.reduce((sum, point) => sum + point.affectedCustomers, 0))
  const data: Omit<PainPointInsights, 'insights'> = {
    periodLabel: filters.quarter ? quarterLabel(filters.quarter) : 'Semua Periode',
    filterLabel: [filters.region ?? 'Semua Wilayah', filters.city, filters.outlet, filters.gender, filters.ageBand ? `${filters.ageBand} tahun` : null].filter(Boolean).join(' · '),
    summary: {
      totalReports,
      affectedCustomers,
      affectedRate: safeRate(affectedCustomers, context.customers),
      mostCriticalPainPoint: painPoints[0]?.label ?? '-',
      avgSeverity: totalReports ? painPoints.reduce((sum, point) => sum + point.severity * point.reportCount, 0) / totalReports : 0,
      resolutionGap: safeRate(painPoints.filter((point) => point.status === 'critical' || point.status === 'high').length, painPoints.length),
      atRiskCustomers: Math.round(context.atRiskBase * safeRate(affectedCustomers, context.customers)),
    },
    painPoints,
    categories: categories(painPoints),
    matrix: matrixRows(painPoints),
    segmentComparison: comparison(cube, scope, compareDimension),
    locations: locations(cube, scope),
    trends: trends(cube, scope, painPoints),
    contexts: contexts(cube, scope, painPoints),
    customers: customerCases(cube, scope, painPoints),
    recommendations: recommendations(painPoints),
  }
  return { ...data, insights: insights(data) }
}
