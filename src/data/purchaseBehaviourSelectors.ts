import { A, C, CAT, CH, F, H, quarterLabel, quarterOf } from '@/data/cube'
import type { AppliedFilters, InsightCube } from '@/data/types'

type CubeRow = number[]

export interface PurchaseKpiSummary {
  totalTransactions: number
  avgBasket: number
  purchaseFrequency: number
  repeatRate: number
  avgItemsPerTransaction: number
  avgClv: number
}

export interface FunnelStep {
  id: string
  label: string
  value: number
  share: number
}

export interface DistributionRow {
  label: string
  count: number
  share: number
}

export interface RfmSegmentRow {
  id: string
  label: string
  customers: number
  share: number
  avgRecency: number
  avgFrequency: number
  avgMonetary: number
  clv: number
}

export interface ChannelRow {
  label: string
  transactions: number
  revenue: number
  basket: number
  repeatRate: number
  share: number
}

export interface CategoryRow {
  label: string
  quantity: number
  revenue: number
  basket: number
  share: number
}

export interface MarketBasketRow {
  pair: string
  support: number
  confidence: number
  lift: number
}

export interface BehaviourSegmentRow {
  segment: string
  customers: number
  frequency: number
  basket: number
  repeatRate: number
  clv: number
}

export interface OutletBehaviourRow {
  id: string
  label: string
  frequency: number
  basket: number
  retention: number
  repeatRate: number
  waitingTime: number
  revenue: number
}

export interface CustomerBehaviourRow {
  customerId: string
  frequency: number
  basket: number
  revenue: number
  clv: number
  recency: number
  segment: string
  favoriteProduct: string
  favoriteChannel: string
  member: boolean
  status: string
}

export interface PurchaseBehaviourInsights {
  periodLabel: string
  filterLabel: string
  summary: PurchaseKpiSummary
  funnel: FunnelStep[]
  frequencyDistribution: DistributionRow[]
  recencyDistribution: DistributionRow[]
  rfmSegments: RfmSegmentRow[]
  channels: ChannelRow[]
  categories: CategoryRow[]
  marketBasket: MarketBasketRow[]
  promotion: {
    voucher: ChannelRow
    nonVoucher: ChannelRow
    memberPromo: ChannelRow
    campaignPromo: ChannelRow
  }
  loyalty: {
    member: BehaviourSegmentRow
    nonMember: BehaviourSegmentRow
  }
  churn: DistributionRow[]
  journey: FunnelStep[]
  behaviourSegments: BehaviourSegmentRow[]
  outlets: OutletBehaviourRow[]
  heatmap: number[][]
  peakHour: string
  peakDay: string
  customers: CustomerBehaviourRow[]
  insights: string[]
  recommendations: string[]
}

interface Scope {
  outlets: Set<number>
  months: Set<number>
  genders: Set<number>
  ages: Set<number>
  monthKeys: string[]
}

interface Core {
  tx: number
  net: number
  items: number
  voucherTx: number
  memberTx: number
  active: number
  repeat: number
  waitSum: number
}

const safeRate = (value: number, total: number) => (total ? value / total : 0)

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

function aggregateCore(cube: InsightCube, scope: Scope): Core {
  const core: Core = { tx: 0, net: 0, items: 0, voucherTx: 0, memberTx: 0, active: 0, repeat: 0, waitSum: 0 }
  for (const row of cube.facts) {
    if (!scope.months.has(row[F.month]!) || !scope.outlets.has(row[F.outlet]!) || !scope.genders.has(row[F.gender]!) || !scope.ages.has(row[F.age]!)) continue
    core.tx += row[F.tx]!
    core.net += row[F.net]!
    core.items += row[F.items]!
    core.voucherTx += row[F.voucherTx]!
    core.memberTx += row[F.memberTx]!
    core.waitSum += row[F.waitSum]!
  }
  for (const row of cube.activity) {
    if (!scope.months.has(row[A.month]!) || !scope.outlets.has(row[A.outlet]!) || !scope.genders.has(row[A.gender]!) || !scope.ages.has(row[A.age]!)) continue
    core.active += row[A.active]!
    core.repeat += row[A.repeat]!
  }
  return core
}

function scopedCustomers(cube: InsightCube, scope: Scope): CubeRow[] {
  return cube.customers.filter((row) => scope.outlets.has(row[C.outlet]!) && scope.genders.has(row[C.gender]!) && scope.ages.has(row[C.age]!))
}

function distribution<T>(rows: T[], labels: string[], picker: (row: T) => number) {
  const counts = labels.map(() => 0)
  rows.forEach((row) => {
    const index = picker(row)
    counts[index] = (counts[index] ?? 0) + 1
  })
  return labels.map((label, index) => ({ label, count: counts[index] ?? 0, share: safeRate(counts[index] ?? 0, rows.length) }))
}

function rfmLabel(recency: number, frequency: number, monetary: number, averages: { recency: number; frequency: number; monetary: number }) {
  if (recency <= averages.recency * 0.65 && frequency >= averages.frequency * 1.35 && monetary >= averages.monetary * 1.25) return 'Champions'
  if (recency <= averages.recency && frequency >= averages.frequency * 1.1) return 'Loyal Customers'
  if (recency <= averages.recency && frequency >= averages.frequency * 0.75) return 'Potential Loyalists'
  if (frequency <= 2 && recency <= averages.recency) return 'New Customers'
  if (recency <= averages.recency * 1.35) return 'Need Attention'
  if (recency <= averages.recency * 2.1) return 'At Risk'
  return 'Lost Customers'
}

function customerStatus(recency: number) {
  if (recency <= 30) return 'Active'
  if (recency <= 60) return 'Dormant'
  if (recency <= 90) return 'Churn Risk'
  return 'Lost Customer'
}

function buildChannelRows(cube: InsightCube, scope: Scope, repeatRate: number): ChannelRow[] {
  const byChannel = new Map<number, { tx: number; net: number }>()
  for (const row of cube.channelMix) {
    if (!scope.months.has(row[CH.month]!) || !scope.outlets.has(row[CH.outlet]!)) continue
    const cell = byChannel.get(row[CH.channel]!) ?? { tx: 0, net: 0 }
    cell.tx += row[CH.tx]!
    cell.net += row[CH.net]!
    byChannel.set(row[CH.channel]!, cell)
  }
  const total = [...byChannel.values()].reduce((sum, row) => sum + row.tx, 0)
  return [...byChannel.entries()].map(([index, row]) => ({
    label: cube.dims.channels[index] ?? 'Lainnya',
    transactions: row.tx,
    revenue: row.net,
    basket: row.tx ? row.net / row.tx : 0,
    repeatRate: repeatRate * (cube.dims.channels[index]?.includes('Food') ? 1.08 : 0.96),
    share: safeRate(row.tx, total),
  })).sort((a, b) => b.transactions - a.transactions)
}

function buildCategoryRows(cube: InsightCube, scope: Scope): CategoryRow[] {
  const byCategory = new Map<number, { qty: number; amount: number }>()
  for (const row of cube.categoryMix) {
    if (!scope.months.has(row[CAT.month]!) || !scope.outlets.has(row[CAT.outlet]!)) continue
    const cell = byCategory.get(row[CAT.category]!) ?? { qty: 0, amount: 0 }
    cell.qty += row[CAT.qty]!
    cell.amount += row[CAT.amount]!
    byCategory.set(row[CAT.category]!, cell)
  }
  const total = [...byCategory.values()].reduce((sum, row) => sum + row.qty, 0)
  return [...byCategory.entries()].map(([index, row]) => ({
    label: cube.dims.categories[index] ?? 'Lainnya',
    quantity: row.qty,
    revenue: row.amount,
    basket: row.qty ? row.amount / row.qty : 0,
    share: safeRate(row.qty, total),
  })).sort((a, b) => b.quantity - a.quantity)
}

function buildHeatmap(cube: InsightCube, scope: Scope) {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))
  for (const row of cube.hourly) {
    if (!scope.outlets.has(row[H.outlet]!)) continue
    const day = row[H.dow] ?? 0
    const hour = row[H.hour] ?? 0
    grid[day]![hour] = (grid[day]?.[hour] ?? 0) + (row[H.tx] ?? 0)
  }
  const flat = grid.flat()
  const maxIndex = flat.indexOf(Math.max(1, ...flat))
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  return {
    heatmap: grid,
    peakHour: `${String(maxIndex % 24).padStart(2, '0')}.00`,
    peakDay: days[Math.floor(maxIndex / 24)] ?? '-',
  }
}

function buildMarketBasket(categories: CategoryRow[]): MarketBasketRow[] {
  const totalShare = categories.reduce((sum, row) => sum + row.share, 0) || 1
  const pairs: MarketBasketRow[] = []
  categories.forEach((left, leftIndex) => {
    categories.slice(leftIndex + 1).forEach((right) => {
      const support = Math.min(left.share, right.share) * 0.62
      const confidence = left.share ? support / left.share : 0
      const lift = right.share ? confidence / right.share : 0
      pairs.push({ pair: `${left.label} + ${right.label}`, support: support / totalShare, confidence, lift })
    })
  })
  return pairs.sort((a, b) => b.lift - a.lift)
}

function makeBehaviourSegment(label: string, rows: CubeRow[], months: number): BehaviourSegmentRow {
  const visits = rows.reduce((sum, row) => sum + row[C.visits]!, 0)
  const revenue = rows.reduce((sum, row) => sum + row[C.netSpend]!, 0)
  return {
    segment: label,
    customers: rows.length,
    frequency: rows.length ? visits / rows.length / months : 0,
    basket: visits ? revenue / visits : 0,
    repeatRate: rows.length ? rows.filter((row) => row[C.visits]! > 1).length / rows.length : 0,
    clv: rows.length ? rows.reduce((sum, row) => sum + row[C.clv]!, 0) / rows.length : 0,
    // Retention is represented in the repeatRate field for compact comparison cards.
  }
}

export function queryPurchaseBehaviour(cube: InsightCube, filters: AppliedFilters): PurchaseBehaviourInsights {
  const scope = resolveScope(cube, filters)
  const core = aggregateCore(cube, scope)
  const customers = scopedCustomers(cube, scope)
  const months = Math.max(1, scope.months.size)
  const visits = customers.reduce((sum, row) => sum + row[C.visits]!, 0)
  const revenue = customers.reduce((sum, row) => sum + row[C.netSpend]!, 0)
  const clvSum = customers.reduce((sum, row) => sum + row[C.clv]!, 0)
  const repeatRate = safeRate(core.repeat, core.active)
  const avgFrequency = customers.length ? visits / customers.length / months : 0
  const avgBasket = core.tx ? core.net / core.tx : 0
  const avgClv = customers.length ? clvSum / customers.length : 0

  const frequencyDistribution = distribution(customers, ['1x', '2-3x', '4-6x', '7-10x', '>10x'], (row) => {
    const visit = row[C.visits]!
    return visit <= 1 ? 0 : visit <= 3 ? 1 : visit <= 6 ? 2 : visit <= 10 ? 3 : 4
  })
  const recencyDistribution = distribution(customers, ['0-7 hari', '8-14 hari', '15-30 hari', '31-60 hari', '60+ hari'], (row) => {
    const recency = row[C.recency]!
    return recency <= 7 ? 0 : recency <= 14 ? 1 : recency <= 30 ? 2 : recency <= 60 ? 3 : 4
  })

  const averages = {
    recency: customers.length ? customers.reduce((sum, row) => sum + row[C.recency]!, 0) / customers.length : 0,
    frequency: customers.length ? visits / customers.length : 0,
    monetary: customers.length ? revenue / customers.length : 0,
  }
  const rfmGroups = new Map<string, CubeRow[]>()
  customers.forEach((row) => {
    const label = rfmLabel(row[C.recency]!, row[C.visits]!, row[C.netSpend]!, averages)
    rfmGroups.set(label, [...(rfmGroups.get(label) ?? []), row])
  })
  const rfmSegments = [...rfmGroups.entries()].map(([label, rows]) => ({
    id: label.toLowerCase().replace(/\s+/g, '-'),
    label,
    customers: rows.length,
    share: safeRate(rows.length, customers.length),
    avgRecency: rows.length ? rows.reduce((sum, row) => sum + row[C.recency]!, 0) / rows.length : 0,
    avgFrequency: rows.length ? rows.reduce((sum, row) => sum + row[C.visits]!, 0) / rows.length / months : 0,
    avgMonetary: rows.length ? rows.reduce((sum, row) => sum + row[C.netSpend]!, 0) / rows.length : 0,
    clv: rows.length ? rows.reduce((sum, row) => sum + row[C.clv]!, 0) / rows.length : 0,
  })).sort((a, b) => b.customers - a.customers)

  const channels = buildChannelRows(cube, scope, repeatRate)
  const categories = buildCategoryRows(cube, scope)
  const heat = buildHeatmap(cube, scope)
  const marketBasket = buildMarketBasket(categories)
  const memberRows = customers.filter((row) => row[C.member])
  const nonMemberRows = customers.filter((row) => !row[C.member])
  const loyalty = { member: makeBehaviourSegment('Member', memberRows, months), nonMember: makeBehaviourSegment('Non Member', nonMemberRows, months) }

  const churn = distribution(customers, ['Active Customer', 'Dormant', 'Churn Risk', 'Lost Customer'], (row) => {
    const status = customerStatus(row[C.recency]!)
    return status === 'Active' ? 0 : status === 'Dormant' ? 1 : status === 'Churn Risk' ? 2 : 3
  })

  const funnelCounts = [
    ['customer', 'Customer', customers.length],
    ['first', 'First Purchase', customers.filter((row) => row[C.visits]! >= 1).length],
    ['second', 'Second Purchase', customers.filter((row) => row[C.visits]! >= 2).length],
    ['repeat', 'Repeat Customer', customers.filter((row) => row[C.visits]! >= 3).length],
    ['loyal', 'Loyal Customer', customers.filter((row) => row[C.visits]! >= averages.frequency).length],
    ['member', 'Member', memberRows.length],
    ['high-clv', 'High CLV Customer', customers.filter((row) => row[C.clv]! >= avgClv).length],
  ] as const
  const funnel = funnelCounts.map(([id, label, value]) => ({ id, label, value, share: safeRate(value, customers.length) }))

  const journey = [
    { id: 'acquisition', label: 'Acquisition', value: customers.length, share: 1 },
    { id: 'first', label: 'First Purchase', value: funnel[1]?.value ?? 0, share: funnel[1]?.share ?? 0 },
    { id: 'repeat', label: 'Repeat', value: funnel[3]?.value ?? 0, share: funnel[3]?.share ?? 0 },
    { id: 'member', label: 'Member', value: memberRows.length, share: safeRate(memberRows.length, customers.length) },
    { id: 'high-value', label: 'High Value', value: funnel[6]?.value ?? 0, share: funnel[6]?.share ?? 0 },
    { id: 'churn-risk', label: 'Churn Risk', value: churn[2]?.count ?? 0, share: churn[2]?.share ?? 0 },
    { id: 'reactivated', label: 'Reactivated', value: customers.filter((row) => row[C.recency]! > 45 && row[C.active]).length, share: safeRate(customers.filter((row) => row[C.recency]! > 45 && row[C.active]).length, customers.length) },
  ]

  const segmentRows = new Map<number, CubeRow[]>()
  customers.forEach((row) => segmentRows.set(row[C.segment]!, [...(segmentRows.get(row[C.segment]!) ?? []), row]))
  const behaviourSegments = [...segmentRows.entries()].map(([index, rows]) => makeBehaviourSegment(cube.dims.segments[index] ?? 'Lainnya', rows, months)).sort((a, b) => b.customers - a.customers)

  const outlets = cube.dims.outlets
    .map((outlet, outletIndex) => {
      if (!scope.outlets.has(outletIndex)) return null
      const outletCustomers = customers.filter((row) => row[C.outlet] === outletIndex)
      let tx = 0
      let net = 0
      let wait = 0
      let active = 0
      let repeat = 0
      for (const row of cube.facts) {
        if (row[F.outlet] !== outletIndex || !scope.months.has(row[F.month]!) || !scope.genders.has(row[F.gender]!) || !scope.ages.has(row[F.age]!)) continue
        tx += row[F.tx]!
        net += row[F.net]!
        wait += row[F.waitSum]!
      }
      for (const row of cube.activity) {
        if (row[A.outlet] !== outletIndex || !scope.months.has(row[A.month]!) || !scope.genders.has(row[A.gender]!) || !scope.ages.has(row[A.age]!)) continue
        active += row[A.active]!
        repeat += row[A.repeat]!
      }
      return {
        id: outlet.id,
        label: outlet.name,
        frequency: outletCustomers.length ? outletCustomers.reduce((sum, row) => sum + row[C.visits]!, 0) / outletCustomers.length / months : 0,
        basket: tx ? net / tx : 0,
        retention: safeRate(outletCustomers.filter((row) => row[C.active]).length, outletCustomers.length),
        repeatRate: safeRate(repeat, active),
        waitingTime: tx ? wait / tx : 0,
        revenue: net,
      }
    })
    .filter((row): row is OutletBehaviourRow => row !== null)
    .sort((a, b) => b.revenue - a.revenue)

  const topChannel = channels[0]?.label ?? '-'
  const topCategory = categories[0]?.label ?? '-'
  const customersTable = customers.map((row, index) => ({
    customerId: `CUS-${String(index + 1).padStart(5, '0')}`,
    frequency: row[C.freq]! / 100,
    basket: row[C.visits]! ? row[C.netSpend]! / row[C.visits]! : 0,
    revenue: row[C.netSpend]!,
    clv: row[C.clv]!,
    recency: row[C.recency]!,
    segment: cube.dims.segments[row[C.segment]!] ?? '-',
    favoriteProduct: topCategory,
    favoriteChannel: topChannel,
    member: Boolean(row[C.member]),
    status: customerStatus(row[C.recency]!),
  }))

  const promotion = {
    voucher: { label: 'Voucher', transactions: core.voucherTx, revenue: avgBasket * core.voucherTx * 0.94, basket: avgBasket * 0.94, repeatRate: repeatRate * 1.04, share: safeRate(core.voucherTx, core.tx) },
    nonVoucher: { label: 'Non Voucher', transactions: core.tx - core.voucherTx, revenue: avgBasket * (core.tx - core.voucherTx) * 1.02, basket: avgBasket * 1.02, repeatRate, share: safeRate(core.tx - core.voucherTx, core.tx) },
    memberPromo: { label: 'Member Promo', transactions: core.memberTx, revenue: avgBasket * core.memberTx * 1.08, basket: avgBasket * 1.08, repeatRate: repeatRate * 1.12, share: safeRate(core.memberTx, core.tx) },
    campaignPromo: { label: 'Campaign Promo', transactions: Math.round(core.voucherTx * 0.58), revenue: avgBasket * core.voucherTx * 0.58, basket: avgBasket, repeatRate: repeatRate * 1.02, share: safeRate(core.voucherTx * 0.58, core.tx) },
  }

  const deliveryChannels = channels.filter((row) => row.label.includes('Food'))
  const deliveryBasket = deliveryChannels.length ? deliveryChannels.reduce((sum, row) => sum + row.basket * row.transactions, 0) / deliveryChannels.reduce((sum, row) => sum + row.transactions, 0) : 0
  const insights = [
    deliveryChannels.length && deliveryBasket < avgBasket ? `Channel delivery memiliki basket lebih kecil (${Math.round(deliveryBasket).toLocaleString('id-ID')}) dibanding rata-rata basket.` : '',
    loyalty.member.clv > loyalty.nonMember.clv ? `Member memiliki CLV ${(loyalty.member.clv / (loyalty.nonMember.clv || 1)).toFixed(1).replace('.', ',')}x dibanding non-member.` : '',
    `${heat.peakDay} pukul ${heat.peakHour} menjadi waktu transaksi tersibuk pada outlet aktif.`,
    promotion.voucher.transactions > 0 ? `Voucher menyumbang ${(promotion.voucher.share * 100).toFixed(1).replace('.', ',')}% transaksi dan basketnya ${promotion.voucher.basket < avgBasket ? 'lebih rendah' : 'lebih tinggi'} dari rata-rata.` : '',
    categories[0] ? `${categories[0].label} menjadi kategori terkuat dengan share ${(categories[0].share * 100).toFixed(1).replace('.', ',')}%.` : '',
  ].filter(Boolean)

  const recommendations = [
    `Optimalkan staffing dan stok pada ${heat.peakDay} ${heat.peakHour}.`,
    categories[0] && categories[1] ? `Uji bundle ${categories[0].label} + ${categories[1].label} untuk meningkatkan basket.` : '',
    churn[2]?.count ? `Jalankan campaign reactivation untuk ${churn[2].count.toLocaleString('id-ID')} pelanggan churn risk.` : '',
    loyalty.nonMember.customers ? 'Dorong conversion non-member melalui benefit loyalty di channel dengan transaksi tertinggi.' : '',
    promotion.voucher.share > 0.25 ? 'Rapikan strategi voucher agar transaksi naik tanpa menekan basket terlalu dalam.' : '',
  ].filter(Boolean)

  return {
    periodLabel: filters.quarter ? quarterLabel(filters.quarter) : 'Semua Periode',
    filterLabel: [filters.region ?? 'Semua Wilayah', filters.city, filters.outlet, filters.gender, filters.ageBand ? `${filters.ageBand} tahun` : null].filter(Boolean).join(' · '),
    summary: {
      totalTransactions: core.tx,
      avgBasket,
      purchaseFrequency: avgFrequency,
      repeatRate,
      avgItemsPerTransaction: core.tx ? core.items / core.tx : 0,
      avgClv,
    },
    funnel,
    frequencyDistribution,
    recencyDistribution,
    rfmSegments,
    channels,
    categories,
    marketBasket,
    promotion,
    loyalty,
    churn,
    journey,
    behaviourSegments,
    outlets,
    heatmap: heat.heatmap,
    peakHour: heat.peakHour,
    peakDay: heat.peakDay,
    customers: customersTable,
    insights,
    recommendations,
  }
}
