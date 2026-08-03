import {
  Bike, Coffee, CreditCard, Gift, Grid2x2, ListChecks, MapPin,
  RefreshCcw, ShoppingBag, Smartphone, Smile, Sparkles, Star, Store, Tag, Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { A, C, CAT, CH, F, H, M, N, V, monthLabel, quarterLabel, quarterOf } from '@/data/cube'
import type {
  AppliedFilters, ChannelRow, DonutSlice, InsightCube, InsightSnapshot,
  KpiItem, KpiSummaryRow, MediaRow, NeedRow, PainPointRow, RecommendationRow, Tone,
} from '@/data/types'

// ── presentation metadata for the measured attributes ────────────
const ATTRIBUTE_LABELS: Record<string, { label: string; icon: LucideIcon; motivation: string }> = {
  taste: { label: 'Rasa yang konsisten', icon: Coffee, motivation: 'Rasa' },
  price: { label: 'Harga yang terjangkau', icon: Tag, motivation: 'Harga' },
  service: { label: 'Layanan cepat', icon: Zap, motivation: 'Layanan Cepat' },
  ordering: { label: 'Mudah dipesan', icon: Smartphone, motivation: 'Convenience' },
  ambience: { label: 'Tempat yang nyaman', icon: Store, motivation: 'Kenyamanan' },
  variety: { label: 'Banyak pilihan menu', icon: ListChecks, motivation: 'Variasi Menu' },
  promo: { label: 'Promo menarik', icon: Gift, motivation: 'Promo' },
  location: { label: 'Lokasi mudah dijangkau', icon: MapPin, motivation: 'Lokasi' },
  app: { label: 'Aplikasi mudah dipakai', icon: Grid2x2, motivation: 'Aplikasi' },
  parking: { label: 'Parkir memadai', icon: CreditCard, motivation: 'Parkir' },
}

/** Pain-point copy per attribute; severity and impact come from the data. */
const PAIN_COPY: Record<string, { title: string; owner: string; action: string; detail: string }> = {
  service: {
    title: 'Antrean panjang pada jam puncak',
    owner: 'Operations',
    action: 'Atasi Antrean Jam Puncak',
    detail: 'Tambah barista dan jalur pesanan terpisah pada jam 07.00-09.00, 12.00-13.00, dan 17.00-19.00.',
  },
  taste: {
    title: 'Kualitas minuman tidak konsisten',
    owner: 'QA Team',
    action: 'Standarisasi Kualitas Minuman',
    detail: 'Kalibrasi mesin dan pelatihan ulang barista di outlet dengan skor rasa terendah.',
  },
  price: {
    title: 'Harga dirasa mahal untuk porsi',
    owner: 'Pricing',
    action: 'Tinjau Arsitektur Harga',
    detail: 'Uji paket bundling dan ukuran menengah pada outlet dengan sensitivitas harga tertinggi.',
  },
  ambience: {
    title: 'Tempat duduk terbatas di outlet tertentu',
    owner: 'Facility',
    action: 'Perluas Area Tempat Duduk',
    detail: 'Evaluasi outlet dengan okupansi tinggi untuk penambahan kapasitas duduk.',
  },
  parking: {
    title: 'Parkir sulit di jam sibuk',
    owner: 'Facility',
    action: 'Perbaiki Akses Parkir',
    detail: 'Negosiasi slot parkir tambahan dan penandaan area khusus take away.',
  },
  app: {
    title: 'Aplikasi lambat saat jam ramai',
    owner: 'Digital Product',
    action: 'Optimalkan Performa Aplikasi',
    detail: 'Perbaiki waktu muat menu dan alur pembayaran pada trafik puncak.',
  },
  promo: {
    title: 'Promo dianggap kurang relevan',
    owner: 'CRM Team',
    action: 'Optimalkan Program Loyalty',
    detail: 'Personalisasi penawaran berdasarkan segmen RFM dan riwayat menu favorit.',
  },
  ordering: {
    title: 'Alur pemesanan membingungkan',
    owner: 'Digital Product',
    action: 'Sederhanakan Alur Pemesanan',
    detail: 'Kurangi langkah checkout dan simpan pesanan favorit pelanggan.',
  },
  variety: {
    title: 'Variasi menu kurang berkembang',
    owner: 'Product',
    action: 'Perluas Varian Menu',
    detail: 'Rotasi menu musiman dan uji varian non-coffee di outlet dengan pangsa snack tinggi.',
  },
  location: {
    title: 'Lokasi outlet sulit dijangkau',
    owner: 'Expansion',
    action: 'Evaluasi Sebaran Outlet',
    detail: 'Petakan area dengan permintaan delivery tinggi namun tanpa outlet terdekat.',
  },
}

const CHANNEL_META: Record<string, { icon: LucideIcon; tone: ChannelRow['tone'] }> = {
  'Dine In': { icon: Store, tone: 'cyan' },
  'Take Away': { icon: ShoppingBag, tone: 'blue' },
  GrabFood: { icon: Bike, tone: 'green' },
  GoFood: { icon: Bike, tone: 'orange' },
  ShopeeFood: { icon: Bike, tone: 'orange' },
  'Aplikasi Kopi Kenangan': { icon: Smartphone, tone: 'purple' },
}

const SEGMENT_COPY: Record<string, string> = {
  Champion: 'Paling sering datang, nilai belanja tertinggi',
  Loyal: 'Rutin datang, responsif terhadap program poin',
  Potential: 'Mulai berulang, belum stabil frekuensinya',
  New: 'Baru satu hingga dua transaksi',
  'At Risk': 'Dulu aktif, mulai menjauh',
  Hibernating: 'Sudah lama tidak bertransaksi',
}

const TONES: Tone[] = ['blue', 'purple', 'cyan', 'orange']
const SLICE_COLORS = ['#2f73ff', '#7d55f5', '#25c4df', '#ff9b3d']

const idr = (value: number) => 'Rp ' + Math.round(value).toLocaleString('id-ID')
const pct1 = (value: number) => (value * 100).toFixed(1).replace('.', ',') + '%'
const num1 = (value: number) => value.toFixed(1).replace('.', ',')

// ── slice resolution ─────────────────────────────────────────────
interface Scope {
  outlets: Set<number>
  months: Set<number>
  genders: Set<number>
  ages: Set<number>
  monthKeys: string[]
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
  cube.dims.ageBands.forEach((band, index) => {
    if (!filters.ageBand || band === filters.ageBand) ages.add(index)
  })

  return { outlets, months, genders, ages, monthKeys }
}

/** Same slice, shifted one quarter back — the basis for every delta shown. */
function previousQuarter(cube: InsightCube, filters: AppliedFilters): AppliedFilters | null {
  const quarters = [...new Set(cube.dims.months.map(quarterOf))].sort()
  if (!filters.quarter) {
    return null
  }
  const index = quarters.indexOf(filters.quarter)
  if (index <= 0) return null
  return { ...filters, quarter: quarters[index - 1] ?? null }
}

// ── core aggregation ─────────────────────────────────────────────
interface CoreMetrics {
  tx: number
  net: number
  gross: number
  discount: number
  items: number
  waitSum: number
  satSum: number
  memberTx: number
  voucherTx: number
  people: number
  activeCustomers: number
  periodActive: number
  periodRepeat: number
  clvSum: number
  memberCount: number
  surveyN: number
  surveySat: number
  promoters: number
  detractors: number
  months: number
}

function aggregate(cube: InsightCube, scope: Scope): CoreMetrics {
  const m: CoreMetrics = {
    tx: 0, net: 0, gross: 0, discount: 0, items: 0, waitSum: 0, satSum: 0,
    memberTx: 0, voucherTx: 0, people: 0, activeCustomers: 0, periodActive: 0,
    periodRepeat: 0, clvSum: 0, memberCount: 0, surveyN: 0, surveySat: 0,
    promoters: 0, detractors: 0, months: scope.months.size || 1,
  }

  for (const row of cube.facts) {
    if (!scope.months.has(row[F.month]!) || !scope.outlets.has(row[F.outlet]!)) continue
    if (!scope.genders.has(row[F.gender]!) || !scope.ages.has(row[F.age]!)) continue
    m.tx += row[F.tx]!
    m.net += row[F.net]!
    m.gross += row[F.gross]!
    m.discount += row[F.discount]!
    m.items += row[F.items]!
    m.waitSum += row[F.waitSum]!
    m.satSum += row[F.satSum]!
    m.memberTx += row[F.memberTx]!
    m.voucherTx += row[F.voucherTx]!
  }

  for (const row of cube.customers) {
    if (!scope.outlets.has(row[C.outlet]!)) continue
    if (!scope.genders.has(row[C.gender]!) || !scope.ages.has(row[C.age]!)) continue
    m.people += 1
    m.activeCustomers += row[C.active]!
    m.clvSum += row[C.clv]!
    m.memberCount += row[C.member]!
  }

  for (const row of cube.activity) {
    if (!scope.months.has(row[A.month]!) || !scope.outlets.has(row[A.outlet]!)) continue
    if (!scope.genders.has(row[A.gender]!) || !scope.ages.has(row[A.age]!)) continue
    m.periodActive += row[A.active]!
    m.periodRepeat += row[A.repeat]!
  }

  for (const row of cube.survey) {
    if (!scope.outlets.has(row[V.outlet]!)) continue
    if (!scope.genders.has(row[V.gender]!) || !scope.ages.has(row[V.age]!)) continue
    m.surveyN += row[V.n]!
    m.surveySat += row[V.satSum]! / 100
    m.promoters += row[V.promoters]!
    m.detractors += row[V.detractors]!
  }

  return m
}

const derive = (m: CoreMetrics) => ({
  satisfaction: m.tx ? m.satSum / m.tx : 0,
  satisfactionPct: m.tx ? m.satSum / m.tx / 5 : 0,
  surveySatisfaction: m.surveyN ? m.surveySat / m.surveyN : 0,
  nps: m.surveyN ? ((m.promoters - m.detractors) / m.surveyN) * 100 : 0,
  repeatRate: m.periodActive ? m.periodRepeat / m.periodActive : 0,
  frequency: m.periodActive ? m.tx / (m.periodActive / m.months) / m.months : 0,
  avgBasket: m.tx ? m.net / m.tx : 0,
  avgWait: m.tx ? m.waitSum / m.tx : 0,
  monthlyRevenue: m.net / m.months,
  retention: m.people ? m.activeCustomers / m.people : 0,
  churn: m.people ? 1 - m.activeCustomers / m.people : 0,
  clv: m.people ? m.clvSum / m.people : 0,
  discountRate: m.gross ? m.discount / m.gross : 0,
  complaintRate: m.surveyN ? m.detractors / m.surveyN : 0,
  membership: m.people ? m.memberCount / m.people : 0,
  itemsPerBasket: m.tx ? m.items / m.tx : 0,
})

/** Monthly series inside the slice, used for every sparkline. */
function monthlyTrend(cube: InsightCube, scope: Scope, measure: 'tx' | 'net' | 'sat'): number[] {
  const byMonth = new Map<number, { value: number; weight: number }>()
  for (const row of cube.facts) {
    if (!scope.months.has(row[F.month]!) || !scope.outlets.has(row[F.outlet]!)) continue
    if (!scope.genders.has(row[F.gender]!) || !scope.ages.has(row[F.age]!)) continue
    const cell = byMonth.get(row[F.month]!) ?? { value: 0, weight: 0 }
    cell.value += measure === 'tx' ? row[F.tx]! : measure === 'net' ? row[F.net]! : row[F.satSum]!
    cell.weight += row[F.tx]!
    byMonth.set(row[F.month]!, cell)
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, cell]) => (measure === 'sat' ? cell.value / (cell.weight || 1) : cell.value))
}

// ── public API ───────────────────────────────────────────────────
export function buildSnapshot(cube: InsightCube, filters: AppliedFilters): InsightSnapshot {
  const scope = resolveScope(cube, filters)
  const core = aggregate(cube, scope)
  const now = derive(core)

  const priorFilters = previousQuarter(cube, filters)
  const prior = priorFilters ? derive(aggregate(cube, resolveScope(cube, priorFilters))) : null

  const trendTx = monthlyTrend(cube, scope, 'tx')
  const trendNet = monthlyTrend(cube, scope, 'net')
  const trendSat = monthlyTrend(cube, scope, 'sat')

  // ── needs, measured per attribute over the selected outlets ──
  const needAgg = new Map<number, { n: number; perf: number; imp: number; low: number; high: number; vLow: number; nLow: number; vHigh: number; nHigh: number }>()
  for (const row of cube.needs) {
    if (!scope.outlets.has(row[N.outlet]!)) continue
    const key = row[N.attribute]!
    const cell = needAgg.get(key) ?? { n: 0, perf: 0, imp: 0, low: 0, high: 0, vLow: 0, nLow: 0, vHigh: 0, nHigh: 0 }
    cell.n += row[N.n]!
    cell.perf += row[N.perfSum]! / 100
    cell.imp += row[N.impSum]! / 100
    cell.low += row[N.lowScorers]!
    cell.high += row[N.highScorers]!
    cell.vLow += row[N.visitsLow]!
    cell.nLow += row[N.nLow]!
    cell.vHigh += row[N.visitsHigh]!
    cell.nHigh += row[N.nHigh]!
    needAgg.set(key, cell)
  }

  const needRows = [...needAgg.entries()].map(([attrIndex, cell]) => {
    const key = cube.dims.attributes[attrIndex] ?? 'taste'
    const meta = ATTRIBUTE_LABELS[key] ?? { label: key, icon: Sparkles, motivation: key }
    const importance = cell.n ? cell.imp / cell.n : 0
    const performance = cell.n ? cell.perf / cell.n : 0
    const affected = cell.n ? cell.low / cell.n : 0
    // Repeat-purchase impact: how many fewer visits low scorers actually made.
    const visitsLow = cell.nLow ? cell.vLow / cell.nLow : 0
    const visitsHigh = cell.nHigh ? cell.vHigh / cell.nHigh : 0
    const repeatImpact = visitsHigh ? visitsLow / visitsHigh - 1 : 0
    return { key, meta, importance, performance, gap: performance - importance, affected, repeatImpact, delight: cell.n ? cell.high / cell.n : 0 }
  })

  const byGap = [...needRows].sort((a, b) => a.gap - b.gap)

  const needs: NeedRow[] = [...needRows]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 7)
    .map((row) => ({
      key: row.key,
      label: row.meta.label,
      icon: row.meta.icon,
      importance: row.importance,
      performance: row.performance,
    }))

  const painPoints: PainPointRow[] = byGap.slice(0, 3).map((row) => {
    const copy = PAIN_COPY[row.key]
    return {
      title: copy?.title ?? row.meta.label,
      impact: `${Math.round(row.affected * 100)}% pelanggan terdampak`,
      loss: pct1(row.repeatImpact),
      severity: row.gap < -0.7 ? 'Kritis' : row.gap < -0.45 ? 'Tinggi' : 'Sedang',
    }
  })

  const motivations = [...needRows]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 6)
    .map((row) => ({ label: row.meta.motivation, value: row.importance }))

  // ── customer segments ──
  const segmentAgg = new Map<number, { n: number; spend: number; visits: number }>()
  let segmentTotal = 0
  for (const row of cube.customers) {
    if (!scope.outlets.has(row[C.outlet]!)) continue
    if (!scope.genders.has(row[C.gender]!) || !scope.ages.has(row[C.age]!)) continue
    const key = row[C.segment]!
    const cell = segmentAgg.get(key) ?? { n: 0, spend: 0, visits: 0 }
    cell.n += 1
    cell.spend += row[C.netSpend]!
    cell.visits += row[C.visits]!
    segmentAgg.set(key, cell)
    segmentTotal += 1
  }
  const profiles = [...segmentAgg.entries()]
    .map(([index, cell]) => ({
      label: cube.dims.segments[index] ?? 'Lainnya',
      detail: SEGMENT_COPY[cube.dims.segments[index] ?? ''] ?? `${(cell.visits / cell.n).toFixed(1).replace('.', ',')}x kunjungan`,
      value: segmentTotal ? Math.round((cell.n / segmentTotal) * 100) : 0,
      order: index,
    }))
    .sort((a, b) => a.order - b.order)
    .slice(0, 5)
    .map(({ label, detail, value }) => ({ label, detail, value }))

  // ── purchase behaviour ──
  const freqBuckets = [0, 0, 0, 0]
  for (const row of cube.customers) {
    if (!scope.outlets.has(row[C.outlet]!)) continue
    if (!scope.genders.has(row[C.gender]!) || !scope.ages.has(row[C.age]!)) continue
    const perMonth = row[C.freq]! / 100
    const index = perMonth >= 8 ? 0 : perMonth >= 4 ? 1 : perMonth >= 1.5 ? 2 : 3
    freqBuckets[index] = (freqBuckets[index] ?? 0) + 1
  }
  const freqTotal = freqBuckets.reduce((sum, value) => sum + value, 0) || 1
  const frequency: DonutSlice[] = ['Hampir tiap hari', '2-3 kali/minggu', 'Mingguan', 'Jarang'].map((label, index) => ({
    label,
    value: Math.round((freqBuckets[index]! / freqTotal) * 100),
    color: SLICE_COLORS[index] ?? '#2f73ff',
  }))

  const channelAgg = new Map<number, number>()
  let channelTotal = 0
  for (const row of cube.channelMix) {
    if (!scope.months.has(row[CH.month]!) || !scope.outlets.has(row[CH.outlet]!)) continue
    channelAgg.set(row[CH.channel]!, (channelAgg.get(row[CH.channel]!) ?? 0) + row[CH.tx]!)
    channelTotal += row[CH.tx]!
  }
  const channels: ChannelRow[] = [...channelAgg.entries()]
    .map(([index, tx]) => {
      const label = cube.dims.channels[index] ?? 'Lainnya'
      const meta = CHANNEL_META[label] ?? { icon: ShoppingBag, tone: 'blue' as const }
      return { label, value: Math.round((tx / (channelTotal || 1)) * 100), icon: meta.icon, tone: meta.tone, raw: tx }
    })
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 5)
    .map(({ label, value, icon, tone }) => ({ label, value, icon, tone }))

  // ── day-part heatmap: 3 bands × 7 days, normalised to the busiest cell ──
  const HOUR_BANDS: [number, number][] = [[6, 10], [11, 15], [16, 21]]
  const heatCounts = HOUR_BANDS.map(() => new Array(7).fill(0) as number[])
  for (const row of cube.hourly) {
    if (!scope.outlets.has(row[H.outlet]!)) continue
    const hour = row[H.hour]!
    const band = HOUR_BANDS.findIndex(([from, to]) => hour >= from && hour <= to)
    const bandRow = band === -1 ? undefined : heatCounts[band]
    if (!bandRow) continue
    bandRow[row[H.dow]!] = (bandRow[row[H.dow]!] ?? 0) + row[H.tx]!
  }
  const heatMax = Math.max(1, ...heatCounts.flat())
  const heatmap = heatCounts.map((band) => band.map((value) => Math.round((value / heatMax) * 4)))
  const busiest = heatCounts.flat().indexOf(heatMax)
  const busiestDay = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][busiest % 7] ?? 'Sab'

  // ── perception ──
  const delight = [...needRows].sort((a, b) => b.delight - a.delight)
  const traits = delight.slice(0, 5).map((row) => row.meta.motivation)
  const associations = delight.slice(0, 4).map((row) => ({
    label: row.meta.motivation,
    value: Math.round(row.delight * 100) + '%',
  }))
  const priceRow = needRows.find((row) => row.key === 'price')
  const modernRow = needRows.find((row) => row.key === 'app')

  // ── KPI cards ──
  const delta = (current: number, previous: number | undefined, formatter: (value: number) => string) => {
    if (previous === undefined || previous === 0) return { change: '–', direction: 'up' as const, positive: true }
    const diff = current - previous
    return {
      change: formatter(Math.abs(diff)),
      direction: diff >= 0 ? ('up' as const) : ('down' as const),
      positive: diff >= 0,
    }
  }

  const satDelta = delta(now.satisfactionPct, prior?.satisfactionPct, (v) => pct1(v))
  const repeatDelta = delta(now.repeatRate, prior?.repeatRate, (v) => pct1(v))
  const freqDelta = delta(now.frequency, prior?.frequency, (v) => num1(v) + 'x')
  // NPS comes from a one-response-per-customer survey, so it only moves when the
  // audience changes — never on a pure time filter. Show "–" rather than a
  // misleading "0".
  const npsChanged = prior !== null && Math.round(prior.nps) !== Math.round(now.nps)
  const npsDelta = npsChanged
    ? delta(now.nps, prior?.nps, (v) => Math.round(v).toString())
    : { change: '–', direction: 'up' as const, positive: true }

  const kpis: KpiItem[] = [
    { id: 'satisfaction', title: 'Customer Satisfaction', value: Math.round(now.satisfactionPct * 100) + '%', tone: 'blue', icon: Smile, trend: trendSat, ...satDelta },
    { id: 'repeat', title: 'Repeat Purchase Rate', value: Math.round(now.repeatRate * 100) + '%', tone: 'purple', icon: RefreshCcw, trend: trendTx, ...repeatDelta },
    { id: 'frequency', title: 'Avg. Purchase Frequency', value: num1(now.frequency) + 'x', tone: 'cyan', icon: ShoppingBag, trend: trendTx, ...freqDelta },
    { id: 'nps', title: 'Net Promoter Score (NPS)', value: Math.round(now.nps).toString(), tone: 'orange', icon: Star, trend: trendSat, ...npsDelta },
  ]

  // ── KPI summary table ──
  const summaryRow = (
    label: string,
    current: string,
    currentValue: number,
    priorValue: number | undefined,
    format: (value: number) => string,
    target: string,
    onTarget: boolean,
    trend: number[],
    lowerIsBetter = false,
  ): KpiSummaryRow => {
    const diff = priorValue === undefined ? 0 : currentValue - priorValue
    const improving = lowerIsBetter ? diff <= 0 : diff >= 0
    return {
      label,
      current,
      change: priorValue === undefined ? '–' : format(Math.abs(diff)),
      target,
      status: onTarget ? 'Baik' : 'Perlu Aksi',
      onTarget,
      down: diff < 0,
      trend,
      tone: improving ? 'green' : 'red',
    }
  }

  const kpiSummary: KpiSummaryRow[] = [
    summaryRow('Customer Satisfaction', Math.round(now.satisfactionPct * 100) + '%', now.satisfactionPct, prior?.satisfactionPct, pct1, '> 78%', now.satisfactionPct > 0.78, trendSat),
    summaryRow('Repeat Purchase Rate', Math.round(now.repeatRate * 100) + '%', now.repeatRate, prior?.repeatRate, pct1, '> 40%', now.repeatRate > 0.4, trendTx),
    summaryRow('Net Promoter Score (NPS)', Math.round(now.nps).toString(), now.nps, prior?.nps, (v) => Math.round(v).toString(), '> 30', now.nps > 30, trendSat),
    summaryRow('Avg. Purchase Frequency', num1(now.frequency) + 'x', now.frequency, prior?.frequency, (v) => num1(v) + 'x', '> 1,9x', now.frequency > 1.9, trendTx),
    summaryRow('Avg. Spending / Order', idr(now.avgBasket), now.avgBasket, prior?.avgBasket, (v) => idr(v), '> Rp 45.000', now.avgBasket > 45000, trendNet),
    summaryRow('Complaint Rate', pct1(now.complaintRate), now.complaintRate, prior?.complaintRate, pct1, '< 12%', now.complaintRate < 0.12, trendSat, true),
  ]

  // ── recommendations: the four widest gaps, with measured progress ──
  const recommendations: RecommendationRow[] = byGap.slice(0, 4).map((row, index) => {
    const copy = PAIN_COPY[row.key]
    const severity = -row.gap
    return {
      index: String(index + 1).padStart(2, '0'),
      title: copy?.action ?? `Perbaiki ${row.meta.label}`,
      description: copy?.detail ?? 'Tindak lanjuti berdasarkan gap importance dan performance.',
      priority: severity > 0.7 ? 'Tinggi' : severity > 0.45 ? 'Sedang' : 'Rendah',
      impact: severity > 0.7 ? 'Tinggi' : 'Sedang',
      effort: row.key === 'ambience' || row.key === 'parking' ? 'Tinggi' : 'Sedang',
      owner: copy?.owner ?? 'Operations',
      due: ['30 Jun 2026', '15 Jul 2026', '30 Jul 2026', '31 Agu 2026'][index] ?? '31 Agu 2026',
      // Progress = share of respondents already scoring the attribute 4.5+.
      progress: Math.round(row.delight * 100),
      tone: TONES[index % TONES.length] ?? 'blue',
    }
  })

  // ── media ──
  const mediaAgg = new Map<string, { spend: number; impressions: number; clicks: number; conversions: number; value: number }>()
  for (const row of cube.media) {
    if (!scope.months.has(row[M.month]!)) continue
    const campaign = cube.dims.campaigns[row[M.campaign]!]
    const platform = campaign?.platform ?? 'Lainnya'
    const cell = mediaAgg.get(platform) ?? { spend: 0, impressions: 0, clicks: 0, conversions: 0, value: 0 }
    cell.spend += row[M.spend]!
    cell.impressions += row[M.impressions]!
    cell.clicks += row[M.clicks]!
    cell.conversions += row[M.conversions]!
    cell.value += row[M.value]!
    mediaAgg.set(platform, cell)
  }
  const media: MediaRow[] = [...mediaAgg.entries()].map(([platform, cell]) => ({
    platform,
    spend: cell.spend,
    impressions: cell.impressions,
    clicks: cell.clicks,
    conversions: cell.conversions,
    ctr: cell.impressions ? cell.clicks / cell.impressions : 0,
    cpc: cell.clicks ? cell.spend / cell.clicks : 0,
    cpa: cell.conversions ? cell.spend / cell.conversions : 0,
    roas: cell.spend ? cell.value / cell.spend : 0,
  }))

  const periodLabel = filters.quarter
    ? quarterLabel(filters.quarter)
    : `${monthLabel(scope.monthKeys[0] ?? '')} - ${monthLabel(scope.monthKeys[scope.monthKeys.length - 1] ?? '')}`

  return {
    filters,
    scope: {
      transactions: core.tx,
      customers: core.people,
      activeCustomers: Math.round(core.periodActive / core.months),
      outlets: scope.outlets.size,
      months: scope.monthKeys,
      periodLabel,
    },
    kpis,
    profiles,
    needs,
    painPoints,
    motivations,
    purchase: {
      frequency,
      averageLabel: num1(now.frequency),
      channels,
      heatmap,
      heatmapMaxLabel: busiestDay,
    },
    perception: {
      traits,
      associations,
      // Brand position: modernity from digital scores, premium from price perception.
      positionX: modernRow ? Math.min(0.9, Math.max(0.1, modernRow.performance / 5)) : 0.7,
      positionY: priceRow ? Math.min(0.9, Math.max(0.1, 1 - priceRow.performance / 5)) : 0.6,
    },
    kpiSummary,
    recommendations,
    media,
  }
}

export const EMPTY_FILTERS: AppliedFilters = {
  quarter: null, region: null, city: null, outlet: null, gender: null, ageBand: null,
}
