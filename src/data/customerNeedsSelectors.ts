import { C, F, N, monthLabel, quarterLabel, quarterOf } from '@/data/cube'
import type { AppliedFilters, InsightCube } from '@/data/types'

export type NeedStatus = 'critical' | 'high' | 'monitor' | 'good'
export type NeedQuadrant = 'focus' | 'maintain' | 'low-priority' | 'possible-overkill'
export type CompareDimension = 'region' | 'outlet'

export interface CustomerNeedItem {
  id: string
  label: string
  category: string
  importance: number
  performance: number
  gap: number
  priorityScore: number
  responseCount: number
  positiveRate: number
  negativeRate: number
  trend: number
  status: NeedStatus
  recommendation: string
}

export interface NeedCategorySummary {
  id: string
  label: string
  importance: number
  performance: number
  gap: number
  responseCount: number
  topIssue: string
}

export interface NeedMatrixPoint {
  id: string
  label: string
  importance: number
  performance: number
  gap: number
  responseCount: number
  priorityRank: number
  quadrant: NeedQuadrant
}

export interface NeedComparisonCell {
  segment: string
  needId: string
  needLabel: string
  importance: number
  performance: number
  gap: number
  responseCount: number
}

export interface NeedTrendPoint {
  period: string
  needId: string
  importance: number
  performance: number
  gap: number
}

export interface UnmetNeed {
  needId: string
  label: string
  severity: number
  affectedCustomers: number
  affectedLocation: string
  relatedPainPoint: string
  action: string
}

export interface NeedRecommendation {
  needId: string
  issue: string
  evidence: string
  action: string
  priority: string
}

export interface CustomerNeedsInsights {
  periodLabel: string
  filterLabel: string
  summary: {
    fulfillmentRate: number
    avgImportance: number
    avgPerformance: number
    largestGap: number
    topPriorityNeed: string
    totalResponses: number
  }
  needs: CustomerNeedItem[]
  categories: NeedCategorySummary[]
  matrix: NeedMatrixPoint[]
  segmentComparison: NeedComparisonCell[]
  trends: NeedTrendPoint[]
  unmetNeeds: UnmetNeed[]
  insights: string[]
  recommendations: NeedRecommendation[]
}

interface NeedMeta {
  label: string
  category: string
  painPoint: string
  action: string
}

interface NeedAgg {
  n: number
  perf: number
  imp: number
  low: number
  high: number
}

interface Scope {
  outlets: Set<number>
  months: Set<number>
  genders: Set<number>
  ages: Set<number>
  monthKeys: string[]
}

const SCALE_MAX = 5

const NEED_META: Record<string, NeedMeta> = {
  taste: {
    label: 'Rasa yang konsisten',
    category: 'Produk',
    painPoint: 'Kualitas produk belum terasa konsisten di semua outlet.',
    action: 'Kalibrasi resep, audit bahan baku, dan refresh training barista pada outlet prioritas.',
  },
  price: {
    label: 'Harga yang terjangkau',
    category: 'Harga dan Promo',
    painPoint: 'Persepsi value belum seimbang dengan harga yang dibayar pelanggan.',
    action: 'Uji bundle value, komunikasikan benefit member, dan segmentasikan promo.',
  },
  service: {
    label: 'Layanan cepat',
    category: 'Pelayanan',
    painPoint: 'Kecepatan layanan tertinggal dari ekspektasi pelanggan.',
    action: 'Optimalkan staffing jam puncak, pisahkan pickup order, dan tetapkan SLA outlet.',
  },
  ordering: {
    label: 'Mudah dipesan',
    category: 'Digital Experience',
    painPoint: 'Alur pemesanan belum cukup mulus untuk transaksi cepat.',
    action: 'Sederhanakan checkout, simpan pesanan favorit, dan perjelas status pesanan.',
  },
  ambience: {
    label: 'Tempat yang nyaman',
    category: 'Pengalaman Outlet',
    painPoint: 'Kenyamanan outlet belum merata pada lokasi dengan trafik tinggi.',
    action: 'Audit layout duduk, kebersihan, suhu ruangan, dan flow antrean.',
  },
  variety: {
    label: 'Banyak pilihan menu',
    category: 'Produk',
    painPoint: 'Pilihan menu belum cukup menjawab kebutuhan variasi pelanggan.',
    action: 'Rotasi menu musiman dan tambah opsi non-coffee/snack pada outlet relevan.',
  },
  promo: {
    label: 'Promo menarik',
    category: 'Harga dan Promo',
    painPoint: 'Promo belum terasa cukup relevan bagi sebagian pelanggan.',
    action: 'Personalisasi voucher berdasarkan frekuensi, basket, dan channel pembelian.',
  },
  location: {
    label: 'Lokasi mudah dijangkau',
    category: 'Pengalaman Outlet',
    painPoint: 'Akses lokasi masih menjadi hambatan untuk kunjungan ulang.',
    action: 'Evaluasi signage, pickup point, dan peluang ekspansi area permintaan tinggi.',
  },
  app: {
    label: 'Aplikasi mudah dipakai',
    category: 'Digital Experience',
    painPoint: 'Pengalaman aplikasi belum cukup lancar pada momen transaksi.',
    action: 'Audit performa app, redemption voucher, dan stabilitas checkout.',
  },
  parking: {
    label: 'Parkir memadai',
    category: 'Pengalaman Outlet',
    painPoint: 'Ketersediaan parkir membatasi pengalaman outlet tertentu.',
    action: 'Negosiasi slot parkir, tanda pickup singkat, dan opsi take-away cepat.',
  },
}

const emptyAgg = (): NeedAgg => ({ n: 0, perf: 0, imp: 0, low: 0, high: 0 })
const safe = (value: number, fallback = 0) => (Number.isFinite(value) ? value : fallback)
const pct = (part: number, total: number) => (total ? part / total : 0)

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
  cell.perf += row[N.perfSum]! / 100
  cell.imp += row[N.impSum]! / 100
  cell.low += row[N.lowScorers]!
  cell.high += row[N.highScorers]!
}

function statusFor(gap: number, priority: number): NeedStatus {
  if (gap >= 0.65 || priority >= 70) return 'critical'
  if (gap >= 0.4 || priority >= 45) return 'high'
  if (gap > 0.12) return 'monitor'
  return 'good'
}

function buildNeeds(cube: InsightCube, outletScope: Set<number>, responseScale = 1): CustomerNeedItem[] {
  const byNeed = new Map<number, NeedAgg>()
  for (const row of cube.needs) {
    if (!outletScope.has(row[N.outlet]!)) continue
    const cell = byNeed.get(row[N.attribute]!) ?? emptyAgg()
    addNeed(cell, row)
    byNeed.set(row[N.attribute]!, cell)
  }

  const maxResponses = Math.max(1, ...[...byNeed.values()].map((cell) => cell.n))
  return [...byNeed.entries()].map(([index, cell]) => {
    const id = cube.dims.attributes[index] ?? `need-${index}`
    const meta = NEED_META[id] ?? { label: id, category: 'Lainnya', painPoint: 'Perlu dianalisis lebih lanjut.', action: 'Tindak lanjuti berdasarkan gap dan prioritas.' }
    const responseCount = Math.round(cell.n * responseScale)
    const importance = cell.n ? cell.imp / cell.n : 0
    const performance = cell.n ? cell.perf / cell.n : 0
    const gap = importance - performance
    const responseWeight = Math.sqrt(cell.n / maxResponses)
    const priorityScore = Math.max(0, Math.min(100, (importance / SCALE_MAX) * Math.max(gap, 0) * responseWeight * 100))
    return {
      id,
      label: meta.label,
      category: meta.category,
      importance,
      performance,
      gap,
      priorityScore,
      responseCount,
      positiveRate: pct(cell.high, cell.n),
      negativeRate: pct(cell.low, cell.n),
      trend: 0,
      status: statusFor(gap, priorityScore),
      recommendation: meta.action,
    }
  }).sort((a, b) => b.priorityScore - a.priorityScore)
}

function transactionContext(cube: InsightCube, scope: Scope) {
  let scopedTx = 0
  let scopedSat = 0
  let allTx = 0
  let allSat = 0
  for (const row of cube.facts) {
    if (!scope.outlets.has(row[F.outlet]!)) continue
    if (!scope.genders.has(row[F.gender]!) || !scope.ages.has(row[F.age]!)) continue
    allTx += row[F.tx]!
    allSat += row[F.satSum]!
    if (!scope.months.has(row[F.month]!)) continue
    scopedTx += row[F.tx]!
    scopedSat += row[F.satSum]!
  }
  return {
    responseScale: allTx ? Math.max(0.15, scopedTx / allTx) : 1,
    satisfactionDelta: scopedTx && allTx ? scopedSat / scopedTx - allSat / allTx : 0,
  }
}

function categorySummaries(needs: CustomerNeedItem[]): NeedCategorySummary[] {
  const byCategory = new Map<string, CustomerNeedItem[]>()
  needs.forEach((need) => byCategory.set(need.category, [...(byCategory.get(need.category) ?? []), need]))
  return [...byCategory.entries()].map(([label, rows]) => {
    const responses = rows.reduce((sum, row) => sum + row.responseCount, 0)
    const weighted = (selector: (row: CustomerNeedItem) => number) =>
      responses ? rows.reduce((sum, row) => sum + selector(row) * row.responseCount, 0) / responses : 0
    const topIssue = [...rows].sort((a, b) => b.gap - a.gap)[0]
    return {
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      importance: weighted((row) => row.importance),
      performance: weighted((row) => row.performance),
      gap: weighted((row) => row.gap),
      responseCount: responses,
      topIssue: topIssue?.label ?? '-',
    }
  }).sort((a, b) => b.gap - a.gap)
}

function matrixPoints(needs: CustomerNeedItem[], avgImportance: number, avgPerformance: number): NeedMatrixPoint[] {
  return needs.map((need, index) => {
    const quadrant: NeedQuadrant = need.importance >= avgImportance && need.performance < avgPerformance
      ? 'focus'
      : need.importance >= avgImportance && need.performance >= avgPerformance
        ? 'maintain'
        : need.importance < avgImportance && need.performance < avgPerformance
          ? 'low-priority'
          : 'possible-overkill'
    return { ...need, priorityRank: index + 1, quadrant }
  })
}

function comparison(cube: InsightCube, scope: Scope, dimension: CompareDimension): NeedComparisonCell[] {
  const groups = new Map<string, Set<number>>()
  cube.dims.outlets.forEach((outlet, index) => {
    if (!scope.outlets.has(index)) return
    const key = dimension === 'region' ? outlet.region : outlet.name
    groups.set(key, new Set([...(groups.get(key) ?? new Set<number>()), index]))
  })
  const selected = [...groups.entries()].slice(0, dimension === 'region' ? 6 : 5)
  return selected.flatMap(([segment, outlets]) =>
    buildNeeds(cube, outlets).slice(0, 8).map((need) => ({
      segment,
      needId: need.id,
      needLabel: need.label,
      importance: need.importance,
      performance: need.performance,
      gap: need.gap,
      responseCount: need.responseCount,
    })),
  )
}

function trendFallback(cube: InsightCube, scope: Scope, needs: CustomerNeedItem[]): NeedTrendPoint[] {
  const months = scope.monthKeys.length ? scope.monthKeys : cube.dims.months
  const byMonth = months.map((month) => {
    const monthIndex = cube.dims.months.indexOf(month)
    let tx = 0
    let sat = 0
    for (const row of cube.facts) {
      if (row[F.month] !== monthIndex || !scope.outlets.has(row[F.outlet]!)) continue
      if (!scope.genders.has(row[F.gender]!) || !scope.ages.has(row[F.age]!)) continue
      tx += row[F.tx]!
      sat += row[F.satSum]!
    }
    return { month, adjustment: tx ? (sat / tx - 4) * 0.18 : 0 }
  })
  return needs.slice(0, 6).flatMap((need) =>
    byMonth.map(({ month, adjustment }) => ({
      period: monthLabel(month),
      needId: need.id,
      importance: need.importance,
      performance: Math.max(1, Math.min(5, need.performance + adjustment)),
      gap: need.importance - Math.max(1, Math.min(5, need.performance + adjustment)),
    })),
  )
}

function affectedCustomers(cube: InsightCube, scope: Scope, needId: string) {
  let low = 0
  let n = 0
  for (const row of cube.needs) {
    if (!scope.outlets.has(row[N.outlet]!) || cube.dims.attributes[row[N.attribute]!] !== needId) continue
    low += row[N.lowScorers]!
    n += row[N.n]!
  }
  let customers = 0
  const byRegion = new Map<string, number>()
  for (const row of cube.customers) {
    if (!scope.outlets.has(row[C.outlet]!)) continue
    if (!scope.genders.has(row[C.gender]!) || !scope.ages.has(row[C.age]!)) continue
    customers += 1
    const outlet = cube.dims.outlets[row[C.outlet]!]
    if (outlet) byRegion.set(outlet.region, (byRegion.get(outlet.region) ?? 0) + 1)
  }
  const topRegion = [...byRegion.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  return { count: Math.round(customers * pct(low, n)), location: topRegion }
}

function recommendations(needs: CustomerNeedItem[]): NeedRecommendation[] {
  return needs.slice(0, 5).map((need) => ({
    needId: need.id,
    issue: need.label,
    evidence: `Gap ${need.gap.toFixed(2).replace('.', ',')} dari ${need.responseCount.toLocaleString('id-ID')} responden aktif.`,
    action: need.recommendation,
    priority: need.status === 'critical' ? 'Kritis' : need.status === 'high' ? 'Tinggi' : need.status === 'monitor' ? 'Pantau' : 'Baik',
  }))
}

function generateInsights(data: Omit<CustomerNeedsInsights, 'insights'>): string[] {
  const top = data.needs[0]
  const expected = [...data.needs].sort((a, b) => b.importance - a.importance)[0]
  const best = [...data.needs].sort((a, b) => b.performance - a.performance)[0]
  const unmet = data.unmetNeeds[0]
  const category = data.categories[0]
  return [
    top ? `${top.label} menjadi prioritas utama dengan importance ${top.importance.toFixed(2).replace('.', ',')} dan gap ${top.gap.toFixed(2).replace('.', ',')}.` : '',
    expected ? `${expected.label} adalah ekspektasi tertinggi pelanggan pada filter aktif.` : '',
    best ? `${best.label} menjadi kekuatan relatif dengan performance ${best.performance.toFixed(2).replace('.', ',')}.` : '',
    unmet ? `${unmet.affectedCustomers.toLocaleString('id-ID')} pelanggan terdampak pada isu ${unmet.label}, terutama di ${unmet.affectedLocation}.` : '',
    category ? `Kategori ${category.label} memiliki gap rata-rata terbesar dan perlu menjadi fokus perbaikan lintas outlet.` : '',
  ].filter(Boolean).slice(0, 5)
}

export function queryCustomerNeeds(cube: InsightCube, filters: AppliedFilters, compareDimension: CompareDimension = 'region'): CustomerNeedsInsights {
  const scope = resolveScope(cube, filters)
  const context = transactionContext(cube, scope)
  const baseNeeds = buildNeeds(cube, scope.outlets, context.responseScale)
  const needs = baseNeeds.map((need) => ({
    ...need,
    performance: Math.max(1, Math.min(5, need.performance + context.satisfactionDelta * 0.08)),
    gap: need.importance - Math.max(1, Math.min(5, need.performance + context.satisfactionDelta * 0.08)),
  })).map((need) => ({ ...need, status: statusFor(need.gap, need.priorityScore) }))
  const totalResponses = needs.reduce((sum, need) => sum + need.responseCount, 0)
  const weighted = (selector: (need: CustomerNeedItem) => number) =>
    totalResponses ? needs.reduce((sum, need) => sum + selector(need) * need.responseCount, 0) / totalResponses : 0
  const avgImportance = weighted((need) => need.importance)
  const avgPerformance = weighted((need) => need.performance)
  const dataWithoutInsights: Omit<CustomerNeedsInsights, 'insights'> = {
    periodLabel: filters.quarter ? quarterLabel(filters.quarter) : 'Semua Periode',
    filterLabel: [
      filters.region ?? 'Semua Wilayah',
      filters.city,
      filters.outlet,
      filters.gender ? `Gender ${filters.gender}` : null,
      filters.ageBand ? `${filters.ageBand} tahun` : null,
    ].filter(Boolean).join(' · '),
    summary: {
      fulfillmentRate: avgPerformance / SCALE_MAX,
      avgImportance,
      avgPerformance,
      largestGap: Math.max(0, ...needs.map((need) => need.gap)),
      topPriorityNeed: needs[0]?.label ?? '-',
      totalResponses,
    },
    needs,
    categories: categorySummaries(needs),
    matrix: matrixPoints(needs, avgImportance, avgPerformance),
    segmentComparison: comparison(cube, scope, compareDimension),
    trends: trendFallback(cube, scope, needs),
    unmetNeeds: needs
      .filter((need) => need.importance >= avgImportance && need.performance < avgPerformance)
      .map((need) => {
        const affected = affectedCustomers(cube, scope, need.id)
        const meta = NEED_META[need.id]
        return {
          needId: need.id,
          label: need.label,
          severity: safe(need.gap * need.negativeRate * 100),
          affectedCustomers: affected.count,
          affectedLocation: affected.location ?? 'wilayah aktif',
          relatedPainPoint: meta?.painPoint ?? 'Pain point terkait belum diklasifikasikan.',
          action: need.recommendation,
        }
      })
      .sort((a, b) => b.severity - a.severity),
    recommendations: recommendations(needs),
  }
  return { ...dataWithoutInsights, insights: generateInsights(dataWithoutInsights) }
}
