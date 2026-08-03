import { A, C, CAT, CH, F, H, quarterLabel, quarterOf, V } from '@/data/cube'
import type { AppliedFilters, InsightCube, Tone } from '@/data/types'

export interface DistributionRow {
  label: string
  count: number
  share: number
}

export interface CustomerSegmentRow {
  id: string
  label: string
  count: number
  share: number
  avgFrequency: number
  avgBasket: number
  repeatRate: number
  clv: number
  description: string
  tone: Tone
}

export interface RankedMetricRow {
  id: string
  label: string
  customerCount: number
  share: number
  satisfaction: number
  clv: number
}

export interface PreferenceRow {
  label: string
  value: number
  share: number
}

export interface BehaviourInsights {
  avgFrequency: number
  repeatRate: number
  retentionRate: number
  churnRate: number
  voucherUsageRate: number
  membershipRate: number
  avgRecency: number
  avgBasket: number
  avgItemsPerTransaction: number
}

export interface CustomerDetailRow {
  customerId: string
  segment: string
  ageGroup: string
  gender: string
  city: string
  favoriteProduct: string
  frequency: number
  avgBasket: number
  clv: number
  recency: number
  membership: boolean
  status: string
}

export interface CustomerProfileInsights {
  periodLabel: string
  summary: {
    totalCustomers: number
    activeCustomers: number
    members: number
    memberRate: number
    avgClv: number
    repeatCustomers: number
  }
  demographics: {
    ageGroups: DistributionRow[]
    genders: DistributionRow[]
    segments: DistributionRow[]
  }
  segments: CustomerSegmentRow[]
  locations: {
    regions: RankedMetricRow[]
    cities: RankedMetricRow[]
    outlets: RankedMetricRow[]
  }
  preferences: {
    categories: PreferenceRow[]
    purchaseChannels: PreferenceRow[]
    deliveryPlatforms: PreferenceRow[]
    visitHours: PreferenceRow[]
  }
  behaviour: BehaviourInsights
  customers: CustomerDetailRow[]
  insights: string[]
}

interface Scope {
  outlets: Set<number>
  months: Set<number>
  genders: Set<number>
  ages: Set<number>
  monthKeys: string[]
}

interface CustomerAgg {
  count: number
  active: number
  member: number
  clv: number
  visits: number
  spend: number
  recency: number
}

const SEGMENT_COPY: Record<string, string> = {
  Champion: 'Pelanggan bernilai tinggi dengan frekuensi dan belanja paling kuat.',
  Loyal: 'Basis repeat yang stabil dan responsif terhadap loyalty.',
  Potential: 'Mulai menunjukkan pola berulang, masih bisa dinaikkan frekuensinya.',
  New: 'Pelanggan baru yang perlu dibawa ke pembelian kedua.',
  'At Risk': 'Pernah aktif, tetapi recency sudah mulai melebar.',
  Hibernating: 'Lama tidak kembali dan perlu aktivasi ulang yang selektif.',
}

const TONES: Tone[] = ['blue', 'purple', 'cyan', 'orange', 'blue', 'purple']

const emptyAgg = (): CustomerAgg => ({ count: 0, active: 0, member: 0, clv: 0, visits: 0, spend: 0, recency: 0 })

const safeShare = (value: number, total: number) => (total ? value / total : 0)

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
    if (!filters.gender || filters.gender === gender) genders.add(index)
  })

  const ages = new Set<number>()
  cube.dims.ageBands.forEach((age, index) => {
    if (!filters.ageBand || filters.ageBand === age) ages.add(index)
  })

  return { outlets, months, genders, ages, monthKeys }
}

function addCustomer(cell: CustomerAgg, row: number[]) {
  cell.count += 1
  cell.active += row[C.active]!
  cell.member += row[C.member]!
  cell.clv += row[C.clv]!
  cell.visits += row[C.visits]!
  cell.spend += row[C.netSpend]!
  cell.recency += row[C.recency]!
}

function distribution(labels: string[], counts: number[], total: number): DistributionRow[] {
  return labels.map((label, index) => ({ label, count: counts[index] ?? 0, share: safeShare(counts[index] ?? 0, total) }))
}

function topPreferences(values: Map<number, number>, labels: string[], limit = 6): PreferenceRow[] {
  const total = [...values.values()].reduce((sum, value) => sum + value, 0)
  return [...values.entries()]
    .map(([index, value]) => ({ label: labels[index] ?? 'Lainnya', value, share: safeShare(value, total) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

function deliveryPreferences(values: Map<number, number>, labels: string[]): PreferenceRow[] {
  const delivery = [...values.entries()].filter(([index]) => labels[index]?.includes('Food'))
  const total = delivery.reduce((sum, [, value]) => sum + value, 0)
  return delivery
    .map(([index, value]) => ({ label: labels[index] ?? 'Lainnya', value, share: safeShare(value, total) }))
    .sort((a, b) => b.value - a.value)
}

function statusFrom(recency: number, active: boolean) {
  if (!active) return 'Tidak Aktif'
  if (recency <= 30) return 'Aktif'
  if (recency <= 75) return 'Perlu Follow-up'
  return 'At-Risk'
}

function topCategoryByOutlet(categoryByOutlet: Map<number, Map<number, number>>, outlet: number, categories: string[]) {
  const cell = categoryByOutlet.get(outlet)
  if (!cell?.size) return categories[0] ?? 'Tidak tersedia'
  const top = [...cell.entries()].sort((a, b) => b[1] - a[1])[0]
  return categories[top?.[0] ?? 0] ?? 'Tidak tersedia'
}

function rankedRows(
  rows: Map<string, CustomerAgg>,
  satisfaction: Map<string, { n: number; value: number }>,
  limit: number,
): RankedMetricRow[] {
  const total = [...rows.values()].reduce((sum, row) => sum + row.count, 0)
  return [...rows.entries()]
    .map(([id, row]) => {
      const sat = satisfaction.get(id)
      return {
        id,
        label: id,
        customerCount: row.count,
        share: safeShare(row.count, total),
        satisfaction: sat?.n ? sat.value / sat.n : 0,
        clv: row.count ? row.clv / row.count : 0,
      }
    })
    .sort((a, b) => b.customerCount - a.customerCount)
    .slice(0, limit)
}

function generateInsights(data: Omit<CustomerProfileInsights, 'insights'>): string[] {
  const topAge = [...data.demographics.ageGroups].sort((a, b) => b.count - a.count)[0]
  const topSegment = data.segments[0]
  const topChannel = data.preferences.purchaseChannels[0]
  const topLocation = data.locations.cities[0] ?? data.locations.regions[0]
  const avgClv = data.summary.avgClv || 1
  const strongerSegment = data.segments.find((segment) => segment.clv > avgClv * 1.12)
  const insights: string[] = []

  if (topAge) insights.push(`Kelompok usia ${topAge.label} menjadi basis terbesar dengan ${Math.round(topAge.share * 100)}% pelanggan aktif pada filter ini.`)
  if (topSegment) insights.push(`Segmen ${topSegment.label} memimpin basis pelanggan dan mencatat frekuensi rata-rata ${topSegment.avgFrequency.toFixed(2).replace('.', ',')}x.`)
  if (strongerSegment) insights.push(`CLV segmen ${strongerSegment.label} berada ${Math.round((strongerSegment.clv / avgClv - 1) * 100)}% di atas rata-rata pelanggan.`)
  if (topChannel) insights.push(`Channel ${topChannel.label} menyumbang porsi transaksi terbesar, yaitu ${Math.round(topChannel.share * 100)}% dari mix pembelian.`)
  if (topLocation) insights.push(`${topLocation.label} adalah wilayah pelanggan terkuat dengan share ${Math.round(topLocation.share * 100)}% dan kepuasan rata-rata ${topLocation.satisfaction.toFixed(1).replace('.', ',')}/5.`)

  return insights.slice(0, 5)
}

export function queryCustomerProfile(cube: InsightCube, filters: AppliedFilters): CustomerProfileInsights {
  const scope = resolveScope(cube, filters)
  const ageCounts = new Array(cube.dims.ageBands.length).fill(0) as number[]
  const genderCounts = new Array(cube.dims.genders.length).fill(0) as number[]
  const segmentCounts = new Array(cube.dims.segments.length).fill(0) as number[]
  const segmentAgg = new Map<number, CustomerAgg>()
  const regionAgg = new Map<string, CustomerAgg>()
  const cityAgg = new Map<string, CustomerAgg>()
  const outletAgg = new Map<string, CustomerAgg>()
  const customers: CustomerDetailRow[] = []
  const categoryByOutlet = new Map<number, Map<number, number>>()

  for (const row of cube.categoryMix) {
    if (!scope.months.has(row[CAT.month]!) || !scope.outlets.has(row[CAT.outlet]!)) continue
    const cell = categoryByOutlet.get(row[CAT.outlet]!) ?? new Map<number, number>()
    cell.set(row[CAT.category]!, (cell.get(row[CAT.category]!) ?? 0) + row[CAT.qty]!)
    categoryByOutlet.set(row[CAT.outlet]!, cell)
  }

  const total = emptyAgg()
  for (const row of cube.customers) {
    if (!scope.outlets.has(row[C.outlet]!) || !scope.genders.has(row[C.gender]!) || !scope.ages.has(row[C.age]!)) continue
    const outlet = cube.dims.outlets[row[C.outlet]!]
    if (!outlet) continue

    addCustomer(total, row)
    ageCounts[row[C.age]!] = (ageCounts[row[C.age]!] ?? 0) + 1
    genderCounts[row[C.gender]!] = (genderCounts[row[C.gender]!] ?? 0) + 1
    segmentCounts[row[C.segment]!] = (segmentCounts[row[C.segment]!] ?? 0) + 1

    const segmentCell = segmentAgg.get(row[C.segment]!) ?? emptyAgg()
    addCustomer(segmentCell, row)
    segmentAgg.set(row[C.segment]!, segmentCell)

    const regionCell = regionAgg.get(outlet.region) ?? emptyAgg()
    addCustomer(regionCell, row)
    regionAgg.set(outlet.region, regionCell)

    const cityCell = cityAgg.get(outlet.city) ?? emptyAgg()
    addCustomer(cityCell, row)
    cityAgg.set(outlet.city, cityCell)

    const outletCell = outletAgg.get(outlet.name) ?? emptyAgg()
    addCustomer(outletCell, row)
    outletAgg.set(outlet.name, outletCell)

    customers.push({
      customerId: `CUS-${String(customers.length + 1).padStart(5, '0')}`,
      segment: cube.dims.segments[row[C.segment]!] ?? 'Lainnya',
      ageGroup: cube.dims.ageBands[row[C.age]!] ?? '-',
      gender: cube.dims.genders[row[C.gender]!] === 'Female' ? 'Perempuan' : 'Laki-laki',
      city: outlet.city,
      favoriteProduct: topCategoryByOutlet(categoryByOutlet, row[C.outlet]!, cube.dims.categories),
      frequency: row[C.freq]! / 100,
      avgBasket: row[C.visits] ? row[C.netSpend]! / row[C.visits]! : 0,
      clv: row[C.clv]!,
      recency: row[C.recency]!,
      membership: Boolean(row[C.member]),
      status: statusFrom(row[C.recency]!, Boolean(row[C.active])),
    })
  }

  let periodActive = 0
  let periodRepeat = 0
  for (const row of cube.activity) {
    if (!scope.months.has(row[A.month]!) || !scope.outlets.has(row[A.outlet]!) || !scope.genders.has(row[A.gender]!) || !scope.ages.has(row[A.age]!)) continue
    periodActive += row[A.active]!
    periodRepeat += row[A.repeat]!
  }

  let tx = 0
  let voucherTx = 0
  let items = 0
  let net = 0
  for (const row of cube.facts) {
    if (!scope.months.has(row[F.month]!) || !scope.outlets.has(row[F.outlet]!) || !scope.genders.has(row[F.gender]!) || !scope.ages.has(row[F.age]!)) continue
    tx += row[F.tx]!
    voucherTx += row[F.voucherTx]!
    items += row[F.items]!
    net += row[F.net]!
  }

  const categoryAgg = new Map<number, number>()
  for (const row of cube.categoryMix) {
    if (!scope.months.has(row[CAT.month]!) || !scope.outlets.has(row[CAT.outlet]!)) continue
    categoryAgg.set(row[CAT.category]!, (categoryAgg.get(row[CAT.category]!) ?? 0) + row[CAT.qty]!)
  }

  const channelAgg = new Map<number, number>()
  for (const row of cube.channelMix) {
    if (!scope.months.has(row[CH.month]!) || !scope.outlets.has(row[CH.outlet]!)) continue
    channelAgg.set(row[CH.channel]!, (channelAgg.get(row[CH.channel]!) ?? 0) + row[CH.tx]!)
  }

  const hourAgg = new Map<number, number>()
  for (const row of cube.hourly) {
    if (!scope.outlets.has(row[H.outlet]!)) continue
    hourAgg.set(row[H.hour]!, (hourAgg.get(row[H.hour]!) ?? 0) + row[H.tx]!)
  }

  const locationSat = { regions: new Map<string, { n: number; value: number }>(), cities: new Map<string, { n: number; value: number }>(), outlets: new Map<string, { n: number; value: number }>() }
  for (const row of cube.survey) {
    if (!scope.outlets.has(row[V.outlet]!) || !scope.genders.has(row[V.gender]!) || !scope.ages.has(row[V.age]!)) continue
    const outlet = cube.dims.outlets[row[V.outlet]!]
    if (!outlet) continue
    const addSat = (map: Map<string, { n: number; value: number }>, key: string) => {
      const cell = map.get(key) ?? { n: 0, value: 0 }
      cell.n += row[V.n]!
      cell.value += row[V.satSum]! / 100
      map.set(key, cell)
    }
    addSat(locationSat.regions, outlet.region)
    addSat(locationSat.cities, outlet.city)
    addSat(locationSat.outlets, outlet.name)
  }

  const segments = [...segmentAgg.entries()]
    .map(([index, row]) => {
      const label = cube.dims.segments[index] ?? 'Lainnya'
      return {
        id: label.toLowerCase().replace(/\s+/g, '-'),
        label,
        count: row.count,
        share: safeShare(row.count, total.count),
        avgFrequency: row.count ? row.visits / row.count / Math.max(scope.months.size, 1) : 0,
        avgBasket: row.visits ? row.spend / row.visits : 0,
        repeatRate: row.count ? Math.max(0, Math.min(1, (row.count - segmentCounts[3]!) / row.count)) : 0,
        clv: row.count ? row.clv / row.count : 0,
        description: SEGMENT_COPY[label] ?? 'Segmentasi berdasarkan perilaku pelanggan di dataset.',
        tone: TONES[index % TONES.length] ?? 'blue',
      }
    })
    .sort((a, b) => b.count - a.count)

  const monthCount = Math.max(scope.months.size, 1)
  const base: Omit<CustomerProfileInsights, 'insights'> = {
    periodLabel: filters.quarter ? quarterLabel(filters.quarter) : `${scope.monthKeys[0] ?? '-'} - ${scope.monthKeys[scope.monthKeys.length - 1] ?? '-'}`,
    summary: {
      totalCustomers: total.count,
      activeCustomers: Math.round(periodActive / monthCount),
      members: total.member,
      memberRate: safeShare(total.member, total.count),
      avgClv: total.count ? total.clv / total.count : 0,
      repeatCustomers: Math.round(periodRepeat / monthCount),
    },
    demographics: {
      ageGroups: distribution(cube.dims.ageBands.map((age) => `${age} tahun`), ageCounts, total.count),
      genders: distribution(cube.dims.genders.map((gender) => (gender === 'Female' ? 'Perempuan' : 'Laki-laki')), genderCounts, total.count),
      segments: distribution(cube.dims.segments, segmentCounts, total.count),
    },
    segments,
    locations: {
      regions: rankedRows(regionAgg, locationSat.regions, 5),
      cities: rankedRows(cityAgg, locationSat.cities, 6),
      outlets: rankedRows(outletAgg, locationSat.outlets, 6),
    },
    preferences: {
      categories: topPreferences(categoryAgg, cube.dims.categories),
      purchaseChannels: topPreferences(channelAgg, cube.dims.channels),
      deliveryPlatforms: deliveryPreferences(channelAgg, cube.dims.channels),
      visitHours: topPreferences(hourAgg, [...new Array(24)].map((_, hour) => `${String(hour).padStart(2, '0')}.00`), 6),
    },
    behaviour: {
      avgFrequency: total.count ? total.visits / total.count / monthCount : 0,
      repeatRate: safeShare(periodRepeat, periodActive),
      retentionRate: safeShare(total.active, total.count),
      churnRate: total.count ? 1 - safeShare(total.active, total.count) : 0,
      voucherUsageRate: safeShare(voucherTx, tx),
      membershipRate: safeShare(total.member, total.count),
      avgRecency: total.count ? total.recency / total.count : 0,
      avgBasket: tx ? net / tx : 0,
      avgItemsPerTransaction: tx ? items / tx : 0,
    },
    customers,
  }

  return { ...base, insights: generateInsights(base) }
}
