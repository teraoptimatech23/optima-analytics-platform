import { MARKET_BASKET_THRESHOLDS } from '@/config/marketBasketThresholds'
import { MBB, quarterLabel, quarterOf } from '@/data/cube'
import { formatCompactNumber, formatPercent } from '@/data/formatters'
import type { AppliedFilters, InsightCube } from '@/data/types'

export type MarketBasketRankingMetric = 'pairCount' | 'support' | 'confidence' | 'lift' | 'combinedRevenue' | 'opportunityScore'
export type MarketBasketStrength = 'very-strong' | 'strong' | 'moderate' | 'weak'

export interface MarketBasketLocalFilters {
  product: string
  category: string
  minimumSupport: number
  minimumConfidence: number
  minimumLift: number
  minimumPairCount: number
  segment: string
  channel: string
  rankingMetric: MarketBasketRankingMetric
  strength: MarketBasketStrength | 'all'
  selectedProduct: string
  matrixMetric: 'pairCount' | 'support' | 'confidence' | 'lift'
}

export interface MarketBasketSummary {
  eligibleTransactions: number
  multiItemTransactions: number
  multiItemRate: number
  averageUniqueItems: number
  averageQuantityItems: number
  uniqueProducts: number
  totalPairs: number
  strongRules: number
  averageLift: number
  highestLift: number
  highestLiftPair?: string
  estimatedOpportunityValue: number
}

export interface ProductPair {
  id: string
  productAId: string
  productAName: string
  productBId: string
  productBName: string
  categoryA: string
  categoryB: string
  transactionCount: number
  support: number
  confidenceAToB: number
  confidenceBToA: number
  lift: number
  combinedItemRevenue: number
  basketRevenue: number
  averageBasket: number
  trend: number
  strength: MarketBasketStrength
  opportunityScore: number
}

export interface AssociationRule {
  id: string
  antecedentId: string
  antecedentLabel: string
  consequentId: string
  consequentLabel: string
  antecedentCount: number
  consequentCount: number
  pairCount: number
  support: number
  confidence: number
  lift: number
  basketRevenue: number
  averageBasket: number
  opportunityScore: number
  strength: MarketBasketStrength
  recommendedUse: string
}

export interface ProductAffinity {
  productId: string
  productName: string
  category: string
  transactionCount: number
  support: number
  revenue: number
  averageBasket: number
  relatedProducts: Array<{
    productId: string
    productName: string
    pairCount: number
    support: number
    confidenceFromSelected: number
    confidenceToSelected: number
    lift: number
  }>
}

export interface BasketComposition {
  bucket: string
  transactionCount: number
  transactionShare: number
  revenue: number
  revenueShare: number
  averageBasket: number
  voucherRate: number
  memberRate: number
}

export interface CategoryAffinityRow {
  id: string
  categoryA: string
  categoryB: string
  pairCount: number
  support: number
  confidence: number
  lift: number
  basketRevenue: number
}

export interface BasketPatternRow {
  id: string
  dimension: string
  value: string
  pairId: string
  pairLabel: string
  pairCount: number
  support: number
  confidence: number
  lift: number
  averageBasket: number
  multiItemRate?: number
  voucherRate?: number
}

export interface OutletBasketPattern {
  outletId: string
  outletName: string
  eligibleTransactions: number
  multiItemRate: number
  averageItems: number
  topPair: string
  topPairSupport: number
  topPairLift: number
  basketRevenue: number
}

export interface BundleOpportunity {
  productAId: string
  productBId: string
  label: string
  pairCount: number
  support: number
  confidence: number
  lift: number
  combinedPrice: number
  averageBasket: number
  dominantSegment: string
  dominantChannel: string
  suggestedBundleType: string
  opportunityScore: number
  evidence: string
}

export interface CrossSellRecommendation {
  baseProductId: string
  baseProductName: string
  recommendedProductId: string
  recommendedProductName: string
  eligibleTransactions: number
  confidence: number
  lift: number
  bestSegment: string
  bestChannel: string
  bestTime: string
  opportunityScore: number
}

export interface MarketBasketRecommendation {
  ruleId: string
  title: string
  evidence: string
  action: string
  priority: 'high' | 'medium' | 'low'
  productIds: string[]
}

export interface MarketBasketInsights {
  periodLabel: string
  filterLabel: string
  summary: MarketBasketSummary
  previousSummary: MarketBasketSummary
  deltas: Partial<Record<keyof MarketBasketSummary, number>>
  products: ProductAffinity[]
  pairs: ProductPair[]
  rules: AssociationRule[]
  categoryAffinity: CategoryAffinityRow[]
  basketComposition: BasketComposition[]
  segmentPatterns: BasketPatternRow[]
  channelPatterns: BasketPatternRow[]
  timePatterns: BasketPatternRow[]
  outletPatterns: OutletBasketPattern[]
  voucherPatterns: BasketPatternRow[]
  bundleOpportunities: BundleOpportunity[]
  crossSellRecommendations: CrossSellRecommendation[]
  insights: string[]
  recommendations: MarketBasketRecommendation[]
  availableProducts: Array<{ id: string; name: string; category: string }>
  availableCategories: string[]
  availableSegments: string[]
  availableChannels: string[]
  methodology: {
    quantityRule: string
    supportFormula: string
    confidenceFormula: string
    liftFormula: string
    opportunityFormula: string
  }
}

interface BasketItem { product: number; qty: number; amount: number }
interface Basket {
  month: number
  outlet: number
  gender: number
  age: number
  segment: number
  channel: number
  member: number
  voucher: number
  dayPart: number
  weekend: number
  net: number
  gross: number
  discount: number
  uniqueProductCount: number
  quantitySum: number
  items: BasketItem[]
}
interface ProductAgg { count: number; qty: number; itemRevenue: number; basketRevenue: number }
interface PairAgg { a: number; b: number; count: number; qty: number; itemRevenue: number; basketRevenue: number; discount: number }
interface BasketAgg {
  eligible: number
  multi: number
  uniqueSum: number
  qtySum: number
  net: number
  gross: number
  discount: number
  member: number
  voucher: number
  products: Map<number, ProductAgg>
  pairs: Map<string, PairAgg>
}

export const defaultMarketBasketLocalFilters: MarketBasketLocalFilters = {
  product: 'all',
  category: 'all',
  minimumSupport: MARKET_BASKET_THRESHOLDS.minimumSupport,
  minimumConfidence: MARKET_BASKET_THRESHOLDS.minimumConfidence,
  minimumLift: MARKET_BASKET_THRESHOLDS.minimumLift,
  minimumPairCount: MARKET_BASKET_THRESHOLDS.minimumPairTransactions,
  segment: 'all',
  channel: 'all',
  rankingMetric: 'opportunityScore',
  strength: 'all',
  selectedProduct: 'all',
  matrixMetric: 'lift',
}

const safeDivide = (value: number, total: number) => (total ? value / total : 0)
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))
const pairKey = (a: number, b: number) => `${Math.min(a, b)}|${Math.max(a, b)}`
const delta = (current: number, previous: number) => (previous ? (current - previous) / previous : current ? 1 : 0)

function parseItems(encoded: string): BasketItem[] {
  if (!encoded) return []
  return encoded.split(',').filter(Boolean).map((item) => {
    const [product = 0, qty = 0, amount = 0] = item.split(':').map(Number)
    return { product, qty, amount }
  })
}

function decodeBasket(row: InsightCube['marketBasketBaskets'][number]): Basket {
  return {
    month: row[MBB.month],
    outlet: row[MBB.outlet],
    gender: row[MBB.gender],
    age: row[MBB.age],
    segment: row[MBB.segment],
    channel: row[MBB.channel],
    member: row[MBB.member],
    voucher: row[MBB.voucher],
    dayPart: row[MBB.dayPart],
    weekend: row[MBB.weekend],
    net: row[MBB.net],
    gross: row[MBB.gross],
    discount: row[MBB.discount],
    uniqueProductCount: row[MBB.uniqueProductCount],
    quantitySum: row[MBB.quantitySum],
    items: parseItems(row[MBB.encodedItems]),
  }
}

function previousQuarter(quarter: string | null) {
  if (!quarter) return null
  const [yearRaw, qRaw] = quarter.split('-Q')
  const year = Number(yearRaw)
  const q = Number(qRaw)
  if (!year || !q) return null
  return q === 1 ? `${year - 1}-Q4` : `${year}-Q${q - 1}`
}

function matchesGlobal(cube: InsightCube, row: Basket, filters: AppliedFilters) {
  const outlet = cube.dims.outlets[row.outlet]
  if (!outlet) return false
  if (filters.quarter && quarterOf(cube.dims.months[row.month] ?? '') !== filters.quarter) return false
  if (filters.outlet && outlet.id !== filters.outlet) return false
  if (filters.city && outlet.city !== filters.city) return false
  if (filters.region && outlet.region !== filters.region) return false
  if (filters.gender && cube.dims.genders[row.gender] !== filters.gender) return false
  if (filters.ageBand && cube.dims.ageBands[row.age] !== filters.ageBand) return false
  return true
}

function matchesLocal(cube: InsightCube, row: Basket, local: MarketBasketLocalFilters) {
  if (local.segment !== 'all' && cube.dims.segments[row.segment] !== local.segment) return false
  if (local.channel !== 'all' && cube.dims.channels[row.channel] !== local.channel) return false
  return true
}

function emptyAgg(): BasketAgg {
  return { eligible: 0, multi: 0, uniqueSum: 0, qtySum: 0, net: 0, gross: 0, discount: 0, member: 0, voucher: 0, products: new Map(), pairs: new Map() }
}

function addBasket(agg: BasketAgg, basket: Basket) {
  agg.eligible += 1
  if (basket.uniqueProductCount >= 2) agg.multi += 1
  agg.uniqueSum += basket.uniqueProductCount
  agg.qtySum += basket.quantitySum
  agg.net += basket.net
  agg.gross += basket.gross
  agg.discount += basket.discount
  agg.member += basket.member
  agg.voucher += basket.voucher
  const unique = new Map<number, BasketItem>()
  basket.items.forEach((item) => {
    const current = unique.get(item.product) ?? { product: item.product, qty: 0, amount: 0 }
    current.qty += item.qty
    current.amount += item.amount
    unique.set(item.product, current)
  })
  for (const item of unique.values()) {
    const product = agg.products.get(item.product) ?? { count: 0, qty: 0, itemRevenue: 0, basketRevenue: 0 }
    product.count += 1
    product.qty += item.qty
    product.itemRevenue += item.amount
    product.basketRevenue += basket.net
    agg.products.set(item.product, product)
  }
  const products = [...unique.keys()].sort((a, b) => a - b)
  for (let i = 0; i < products.length; i += 1) {
    for (let j = i + 1; j < products.length; j += 1) {
      const a = products[i]!
      const b = products[j]!
      const itemA = unique.get(a)
      const itemB = unique.get(b)
      const key = pairKey(a, b)
      const pair = agg.pairs.get(key) ?? { a, b, count: 0, qty: 0, itemRevenue: 0, basketRevenue: 0, discount: 0 }
      pair.count += 1
      pair.qty += (itemA?.qty ?? 0) + (itemB?.qty ?? 0)
      pair.itemRevenue += (itemA?.amount ?? 0) + (itemB?.amount ?? 0)
      pair.basketRevenue += basket.net
      pair.discount += basket.discount
      agg.pairs.set(key, pair)
    }
  }
}

function summarize(agg: BasketAgg, pairs: ProductPair[], rules: AssociationRule[]): MarketBasketSummary {
  const highest = [...pairs].sort((a, b) => b.lift - a.lift || b.transactionCount - a.transactionCount)[0]
  const topOpportunity = [...rules].sort((a, b) => b.opportunityScore - a.opportunityScore)[0]
  return {
    eligibleTransactions: agg.eligible,
    multiItemTransactions: agg.multi,
    multiItemRate: safeDivide(agg.multi, agg.eligible),
    averageUniqueItems: safeDivide(agg.uniqueSum, agg.eligible),
    averageQuantityItems: safeDivide(agg.qtySum, agg.eligible),
    uniqueProducts: agg.products.size,
    totalPairs: pairs.length,
    strongRules: rules.filter((rule) => rule.strength === 'very-strong' || rule.strength === 'strong').length,
    averageLift: safeDivide(rules.reduce((sum, rule) => sum + rule.lift, 0), rules.length),
    highestLift: highest?.lift ?? 0,
    highestLiftPair: highest ? `${highest.productAName} + ${highest.productBName}` : undefined,
    estimatedOpportunityValue: topOpportunity ? topOpportunity.confidence * topOpportunity.averageBasket * topOpportunity.antecedentCount * clamp(topOpportunity.lift - 1, 0, 1) : 0,
  }
}

function strengthFor(support: number, confidence: number, lift: number): MarketBasketStrength {
  if (support >= MARKET_BASKET_THRESHOLDS.strongSupport && confidence >= MARKET_BASKET_THRESHOLDS.strongConfidence && lift >= 1.6) return 'very-strong'
  if (support >= MARKET_BASKET_THRESHOLDS.strongSupport && confidence >= MARKET_BASKET_THRESHOLDS.strongConfidence && lift >= MARKET_BASKET_THRESHOLDS.strongLift) return 'strong'
  if (lift >= MARKET_BASKET_THRESHOLDS.minimumLift && confidence >= MARKET_BASKET_THRESHOLDS.minimumConfidence) return 'moderate'
  return 'weak'
}

function normalize(value: number, values: number[]) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  return max === min ? 0.5 : (value - min) / (max - min)
}

function buildPairs(cube: InsightCube, agg: BasketAgg, local: MarketBasketLocalFilters): ProductPair[] {
  const preliminary = [...agg.pairs.values()].map((pair) => {
    const a = agg.products.get(pair.a)
    const b = agg.products.get(pair.b)
    const productA = cube.dims.products[pair.a]
    const productB = cube.dims.products[pair.b]
    const support = safeDivide(pair.count, agg.eligible)
    const confidenceAToB = safeDivide(pair.count, a?.count ?? 0)
    const confidenceBToA = safeDivide(pair.count, b?.count ?? 0)
    const supportB = safeDivide(b?.count ?? 0, agg.eligible)
    const lift = safeDivide(confidenceAToB, supportB)
    const confidence = Math.max(confidenceAToB, confidenceBToA)
    return { pair, productA, productB, support, confidenceAToB, confidenceBToA, confidence, lift }
  }).filter((row): row is typeof row & { productA: NonNullable<typeof row.productA>; productB: NonNullable<typeof row.productB> } => Boolean(row.productA && row.productB))
    .filter((row) =>
    row.pair.count >= local.minimumPairCount &&
    row.support >= local.minimumSupport &&
    row.confidence >= local.minimumConfidence &&
    row.lift >= local.minimumLift &&
    (local.category === 'all' || row.productA.category === local.category || row.productB.category === local.category) &&
    (local.product === 'all' || row.productA.id === local.product || row.productB.id === local.product))

  const supports = preliminary.map((row) => row.support)
  const confidences = preliminary.map((row) => row.confidence)
  const lifts = preliminary.map((row) => Math.min(row.lift, 3))
  const revenues = preliminary.map((row) => row.pair.basketRevenue)
  const samples = preliminary.map((row) => row.pair.count)

  return preliminary.map((row) => {
    const opportunityScore = 100 * (
      normalize(row.support, supports) * 0.25 +
      normalize(row.confidence, confidences) * 0.25 +
      normalize(Math.min(row.lift, 3), lifts) * 0.2 +
      normalize(row.pair.basketRevenue, revenues) * 0.15 +
      normalize(row.pair.count, samples) * 0.15
    )
    const strength = strengthFor(row.support, row.confidence, row.lift)
    return {
      id: `${row.productA.id}|${row.productB.id}`,
      productAId: row.productA.id,
      productAName: row.productA.name,
      productBId: row.productB.id,
      productBName: row.productB.name,
      categoryA: row.productA.category,
      categoryB: row.productB.category,
      transactionCount: row.pair.count,
      support: row.support,
      confidenceAToB: row.confidenceAToB,
      confidenceBToA: row.confidenceBToA,
      lift: row.lift,
      combinedItemRevenue: row.pair.itemRevenue,
      basketRevenue: row.pair.basketRevenue,
      averageBasket: safeDivide(row.pair.basketRevenue, row.pair.count),
      trend: 0,
      strength,
      opportunityScore,
    }
  }).filter((pair) => local.strength === 'all' || pair.strength === local.strength)
}

function buildRules(cube: InsightCube, agg: BasketAgg, pairs: ProductPair[]): AssociationRule[] {
  return pairs.flatMap((pair) => {
    const aIndex = cube.dims.products.findIndex((product) => product.id === pair.productAId)
    const bIndex = cube.dims.products.findIndex((product) => product.id === pair.productBId)
    const countA = agg.products.get(aIndex)?.count ?? 0
    const countB = agg.products.get(bIndex)?.count ?? 0
    const base = [
      { antecedentIndex: aIndex, consequentIndex: bIndex, confidence: pair.confidenceAToB, antecedentCount: countA, consequentCount: countB },
      { antecedentIndex: bIndex, consequentIndex: aIndex, confidence: pair.confidenceBToA, antecedentCount: countB, consequentCount: countA },
    ]
    return base.map((rule) => {
      const antecedent = cube.dims.products[rule.antecedentIndex]!
      const consequent = cube.dims.products[rule.consequentIndex]!
      const strength = strengthFor(pair.support, rule.confidence, pair.lift)
      return {
        id: `${antecedent.id}->${consequent.id}`,
        antecedentId: antecedent.id,
        antecedentLabel: antecedent.name,
        consequentId: consequent.id,
        consequentLabel: consequent.name,
        antecedentCount: rule.antecedentCount,
        consequentCount: rule.consequentCount,
        pairCount: pair.transactionCount,
        support: pair.support,
        confidence: rule.confidence,
        lift: pair.lift,
        basketRevenue: pair.basketRevenue,
        averageBasket: pair.averageBasket,
        opportunityScore: pair.opportunityScore * (0.8 + rule.confidence * 0.2),
        strength,
        recommendedUse: rule.confidence >= 0.28 ? 'Checkout add-on' : pair.lift >= 1.4 ? 'Bundle test' : 'Menu placement',
      }
    })
  }).sort((a, b) => b.opportunityScore - a.opportunityScore || b.confidence - a.confidence)
}

function buildAgg(cube: InsightCube, filters: AppliedFilters, local: MarketBasketLocalFilters): BasketAgg {
  const agg = emptyAgg()
  for (const row of cube.marketBasketBaskets) {
    const basket = decodeBasket(row)
    if (!matchesGlobal(cube, basket, filters) || !matchesLocal(cube, basket, local)) continue
    addBasket(agg, basket)
  }
  return agg
}

function sortPairs(rows: ProductPair[], metric: MarketBasketRankingMetric) {
  const key: Record<MarketBasketRankingMetric, (row: ProductPair) => number> = {
    pairCount: (row) => row.transactionCount,
    support: (row) => row.support,
    confidence: (row) => Math.max(row.confidenceAToB, row.confidenceBToA),
    lift: (row) => row.lift,
    combinedRevenue: (row) => row.basketRevenue,
    opportunityScore: (row) => row.opportunityScore,
  }
  return [...rows].sort((a, b) => key[metric](b) - key[metric](a) || a.id.localeCompare(b.id, 'id-ID'))
}

function filterLabel(cube: InsightCube, filters: AppliedFilters, local: MarketBasketLocalFilters) {
  const outlet = filters.outlet ? cube.dims.outlets.find((row) => row.id === filters.outlet)?.name : null
  return [
    filters.quarter ? quarterLabel(filters.quarter) : 'Semua Periode',
    filters.region ?? 'Semua Wilayah',
    filters.city,
    outlet,
    filters.gender ? `Gender ${filters.gender}` : null,
    filters.ageBand ? `${filters.ageBand} tahun` : null,
    local.channel !== 'all' ? local.channel : 'Semua Channel',
    local.segment !== 'all' ? local.segment : null,
  ].filter(Boolean).join(' · ')
}

function buildProducts(cube: InsightCube, agg: BasketAgg, pairs: ProductPair[], selectedProduct: string): ProductAffinity[] {
  const relatedByProduct = new Map<string, ProductAffinity['relatedProducts']>()
  pairs.forEach((pair) => {
    const push = (id: string, row: ProductAffinity['relatedProducts'][number]) => relatedByProduct.set(id, [...(relatedByProduct.get(id) ?? []), row])
    push(pair.productAId, { productId: pair.productBId, productName: pair.productBName, pairCount: pair.transactionCount, support: pair.support, confidenceFromSelected: pair.confidenceAToB, confidenceToSelected: pair.confidenceBToA, lift: pair.lift })
    push(pair.productBId, { productId: pair.productAId, productName: pair.productAName, pairCount: pair.transactionCount, support: pair.support, confidenceFromSelected: pair.confidenceBToA, confidenceToSelected: pair.confidenceAToB, lift: pair.lift })
  })
  return [...agg.products.entries()].map(([index, productAgg]) => {
    const product = cube.dims.products[index]!
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      transactionCount: productAgg.count,
      support: safeDivide(productAgg.count, agg.eligible),
      revenue: productAgg.itemRevenue,
      averageBasket: safeDivide(productAgg.basketRevenue, productAgg.count),
      relatedProducts: (relatedByProduct.get(product.id) ?? []).sort((a, b) => b.lift - a.lift || b.pairCount - a.pairCount).slice(0, selectedProduct === product.id ? 10 : 5),
    }
  }).sort((a, b) => b.transactionCount - a.transactionCount)
}

function buildScopedBasketRows(cube: InsightCube, filters: AppliedFilters, local: MarketBasketLocalFilters) {
  const baskets: Basket[] = []
  for (const row of cube.marketBasketBaskets) {
    const basket = decodeBasket(row)
    if (!matchesGlobal(cube, basket, filters) || !matchesLocal(cube, basket, local)) continue
    baskets.push(basket)
  }
  return baskets
}

function compositionFromBaskets(baskets: Basket[], totalRevenue: number): BasketComposition[] {
  const buckets = new Map<string, { tx: number; net: number; voucher: number; member: number }>()
  baskets.forEach((basket) => {
    const label = basket.uniqueProductCount >= 5 ? '5+ products' : `${basket.uniqueProductCount} product${basket.uniqueProductCount > 1 ? 's' : ''}`
    const cell = buckets.get(label) ?? { tx: 0, net: 0, voucher: 0, member: 0 }
    cell.tx += 1
    cell.net += basket.net
    cell.voucher += basket.voucher
    cell.member += basket.member
    buckets.set(label, cell)
  })
  return [...buckets.entries()].map(([bucket, cell]) => ({
    bucket,
    transactionCount: cell.tx,
    transactionShare: safeDivide(cell.tx, baskets.length),
    revenue: cell.net,
    revenueShare: safeDivide(cell.net, totalRevenue),
    averageBasket: safeDivide(cell.net, cell.tx),
    voucherRate: safeDivide(cell.voucher, cell.tx),
    memberRate: safeDivide(cell.member, cell.tx),
  })).sort((a, b) => a.bucket.localeCompare(b.bucket, 'id-ID'))
}

function dominantContext(cube: InsightCube, baskets: Basket[], pair: ProductPair, key: 'segment' | 'channel' | 'dayPart') {
  const counts = new Map<string, number>()
  const a = cube.dims.products.findIndex((product) => product.id === pair.productAId)
  const b = cube.dims.products.findIndex((product) => product.id === pair.productBId)
  baskets.forEach((basket) => {
    const set = new Set(basket.items.map((item) => item.product))
    if (!set.has(a) || !set.has(b)) return
    const value = key === 'segment' ? cube.dims.segments[basket.segment] : key === 'channel' ? cube.dims.channels[basket.channel] : cube.dims.dayParts[basket.dayPart]
    counts.set(value ?? '-', (counts.get(value ?? '-') ?? 0) + 1)
  })
  return [...counts.entries()].sort((aRow, bRow) => bRow[1] - aRow[1])[0]?.[0] ?? '-'
}

function buildPatternRows(cube: InsightCube, baskets: Basket[], dimension: 'segment' | 'channel' | 'dayPart' | 'voucher'): BasketPatternRow[] {
  const groups = new Map<string, Basket[]>()
  baskets.forEach((basket) => {
    const value = dimension === 'segment'
      ? cube.dims.segments[basket.segment]
      : dimension === 'channel'
        ? cube.dims.channels[basket.channel]
        : dimension === 'dayPart'
          ? cube.dims.dayParts[basket.dayPart]
          : basket.voucher ? 'Voucher' : 'Non-Voucher'
    groups.set(value ?? '-', [...(groups.get(value ?? '-') ?? []), basket])
  })
  const out: BasketPatternRow[] = []
  ;[...groups.entries()].forEach(([value, rows]) => {
    const localAgg = emptyAgg()
    rows.forEach((basket) => addBasket(localAgg, basket))
    const pairs = buildPairs(cube, localAgg, { ...defaultMarketBasketLocalFilters, minimumPairCount: Math.max(20, Math.floor(rows.length * 0.005)), minimumSupport: 0.002, minimumConfidence: 0.05, minimumLift: 1 })
    const top = sortPairs(pairs, 'opportunityScore')[0]
    if (!top) return
    out.push({
      id: `${dimension}-${value}`,
      dimension,
      value,
      pairId: top.id,
      pairLabel: `${top.productAName} + ${top.productBName}`,
      pairCount: top.transactionCount,
      support: top.support,
      confidence: Math.max(top.confidenceAToB, top.confidenceBToA),
      lift: top.lift,
      averageBasket: top.averageBasket,
      multiItemRate: safeDivide(localAgg.multi, localAgg.eligible),
      voucherRate: safeDivide(localAgg.voucher, localAgg.eligible),
    })
  })
  return out.sort((a, b) => b.lift - a.lift)
}

function buildOutletPatterns(cube: InsightCube, baskets: Basket[]): OutletBasketPattern[] {
  const groups = new Map<number, Basket[]>()
  baskets.forEach((basket) => groups.set(basket.outlet, [...(groups.get(basket.outlet) ?? []), basket]))
  return [...groups.entries()].map(([outletIndex, rows]) => {
    const localAgg = emptyAgg()
    rows.forEach((basket) => addBasket(localAgg, basket))
    const pairs = buildPairs(cube, localAgg, { ...defaultMarketBasketLocalFilters, minimumPairCount: Math.max(12, Math.floor(rows.length * 0.006)), minimumSupport: 0.003, minimumConfidence: 0.05, minimumLift: 1 })
    const top = sortPairs(pairs, 'opportunityScore')[0]
    const outlet = cube.dims.outlets[outletIndex]!
    return {
      outletId: outlet.id,
      outletName: outlet.name,
      eligibleTransactions: localAgg.eligible,
      multiItemRate: safeDivide(localAgg.multi, localAgg.eligible),
      averageItems: safeDivide(localAgg.uniqueSum, localAgg.eligible),
      topPair: top ? `${top.productAName} + ${top.productBName}` : '-',
      topPairSupport: top?.support ?? 0,
      topPairLift: top?.lift ?? 0,
      basketRevenue: localAgg.net,
    }
  }).filter((row) => row.eligibleTransactions >= 120).sort((a, b) => b.multiItemRate - a.multiItemRate).slice(0, 10)
}

function buildCategoryAffinity(cube: InsightCube, baskets: Basket[]): CategoryAffinityRow[] {
  const catTx = new Map<string, number>()
  const catPairs = new Map<string, { count: number; basketRevenue: number; a: string; b: string }>()
  baskets.forEach((basket) => {
    const categoryCounts = new Map<string, number>()
    basket.items.forEach((item) => {
      const category = cube.dims.products[item.product]?.category ?? '-'
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1)
    })
    categoryCounts.forEach((_, category) => catTx.set(category, (catTx.get(category) ?? 0) + 1))
    const categories = [...categoryCounts.keys()].sort((a, b) => a.localeCompare(b, 'id-ID'))
    categories.forEach((category) => {
      if ((categoryCounts.get(category) ?? 0) >= 2) {
        const key = `${category}|${category}`
        const cell = catPairs.get(key) ?? { count: 0, basketRevenue: 0, a: category, b: category }
        cell.count += 1
        cell.basketRevenue += basket.net
        catPairs.set(key, cell)
      }
    })
    for (let i = 0; i < categories.length; i += 1) {
      for (let j = i + 1; j < categories.length; j += 1) {
        const a = categories[i]!
        const b = categories[j]!
        const key = `${a}|${b}`
        const cell = catPairs.get(key) ?? { count: 0, basketRevenue: 0, a, b }
        cell.count += 1
        cell.basketRevenue += basket.net
        catPairs.set(key, cell)
      }
    }
  })
  return [...catPairs.entries()].map(([id, row]) => {
    const support = safeDivide(row.count, baskets.length)
    const confidence = safeDivide(row.count, catTx.get(row.a) ?? 0)
    const lift = safeDivide(confidence, safeDivide(catTx.get(row.b) ?? 0, baskets.length))
    return { id, categoryA: row.a, categoryB: row.b, pairCount: row.count, support, confidence, lift, basketRevenue: row.basketRevenue }
  }).sort((a, b) => b.lift - a.lift)
}

function buildBundleType(pair: ProductPair, dominantChannel: string, dominantTime: string) {
  if (dominantTime === 'Pagi') return 'Breakfast Bundle'
  if (pair.categoryA === 'Snack' || pair.categoryB === 'Snack') return 'Snack Pairing'
  if (dominantChannel.includes('Food')) return 'Delivery Bundle'
  return 'Member Bundle'
}

function buildInsights(data: { pairs: ProductPair[]; rules: AssociationRule[]; categoryAffinity: CategoryAffinityRow[]; outletPatterns: OutletBasketPattern[]; channelPatterns: BasketPatternRow[] }) {
  const topPair = data.pairs[0]
  const liftPair = [...data.pairs].sort((a, b) => b.lift - a.lift)[0]
  const topRule = data.rules[0]
  const topCategory = data.categoryAffinity[0]
  const topOutlet = data.outletPatterns[0]
  const topChannel = data.channelPatterns[0]
  return [
    topPair ? `${topPair.productAName} + ${topPair.productBName} muncul bersama pada ${formatPercent(topPair.support)} eligible transactions dengan lift ${topPair.lift.toFixed(2).replace('.', ',')}x.` : '',
    liftPair ? `${liftPair.productAName} + ${liftPair.productBName} memiliki lift tertinggi yang lolos threshold: ${liftPair.lift.toFixed(2).replace('.', ',')}x dari ${formatCompactNumber(liftPair.transactionCount)} transaksi.` : '',
    topRule ? `Saat pelanggan membeli ${topRule.antecedentLabel}, ${formatPercent(topRule.confidence)} juga membeli ${topRule.consequentLabel} pada transaksi yang sama.` : '',
    topCategory ? `Kategori ${topCategory.categoryA} + ${topCategory.categoryB} menjadi affinity kategori terkuat dengan lift ${topCategory.lift.toFixed(2).replace('.', ',')}x.` : '',
    topOutlet ? `${topOutlet.outletName} memiliki multi-item basket rate tertinggi sebesar ${formatPercent(topOutlet.multiItemRate)}.` : '',
    topChannel ? `${topChannel.value} memiliki top pair ${topChannel.pairLabel} dengan lift ${topChannel.lift.toFixed(2).replace('.', ',')}x.` : '',
  ].filter(Boolean).slice(0, 6)
}

export function queryMarketBasket(cube: InsightCube, filters: AppliedFilters, local: MarketBasketLocalFilters): MarketBasketInsights {
  const currentAgg = buildAgg(cube, filters, local)
  const previousAgg = buildAgg(cube, { ...filters, quarter: previousQuarter(filters.quarter) }, local)
  const scopedBaskets = buildScopedBasketRows(cube, filters, local)
  let pairs = buildPairs(cube, currentAgg, local)
  pairs = sortPairs(pairs, local.rankingMetric)
  const previousPairs = buildPairs(cube, previousAgg, local)
  const rules = buildRules(cube, currentAgg, pairs).filter((rule) => local.strength === 'all' || rule.strength === local.strength)
  const previousRules = buildRules(cube, previousAgg, previousPairs)
  const summary = summarize(currentAgg, pairs, rules)
  const previousSummary = summarize(previousAgg, previousPairs, previousRules)
  const products = buildProducts(cube, currentAgg, pairs, local.selectedProduct)
  const categoryAffinity = buildCategoryAffinity(cube, scopedBaskets)
  const basketComposition = compositionFromBaskets(scopedBaskets, currentAgg.net)
  const segmentPatterns = buildPatternRows(cube, scopedBaskets, 'segment')
  const channelPatterns = buildPatternRows(cube, scopedBaskets, 'channel')
  const timePatterns = buildPatternRows(cube, scopedBaskets, 'dayPart')
  const voucherPatterns = buildPatternRows(cube, scopedBaskets, 'voucher')
  const outletPatterns = buildOutletPatterns(cube, scopedBaskets)
  const bundleOpportunities = pairs.slice(0, 8).map((pair) => {
    const dominantSegment = dominantContext(cube, scopedBaskets, pair, 'segment')
    const dominantChannel = dominantContext(cube, scopedBaskets, pair, 'channel')
    const dominantTime = dominantContext(cube, scopedBaskets, pair, 'dayPart')
    const productA = cube.dims.products.find((product) => product.id === pair.productAId)
    const productB = cube.dims.products.find((product) => product.id === pair.productBId)
    return {
      productAId: pair.productAId,
      productBId: pair.productBId,
      label: `${pair.productAName} + ${pair.productBName}`,
      pairCount: pair.transactionCount,
      support: pair.support,
      confidence: Math.max(pair.confidenceAToB, pair.confidenceBToA),
      lift: pair.lift,
      combinedPrice: (productA?.basePrice ?? 0) + (productB?.basePrice ?? 0),
      averageBasket: pair.averageBasket,
      dominantSegment,
      dominantChannel,
      suggestedBundleType: buildBundleType(pair, dominantChannel, dominantTime),
      opportunityScore: pair.opportunityScore,
      evidence: `${formatCompactNumber(pair.transactionCount)} transaksi · support ${formatPercent(pair.support)} · lift ${pair.lift.toFixed(2).replace('.', ',')}x`,
    }
  })
  const crossSellRecommendations = rules.slice(0, 10).map((rule) => {
    const pair = pairs.find((row) => row.id === [rule.antecedentId, rule.consequentId].sort().join('|'))
    return {
      baseProductId: rule.antecedentId,
      baseProductName: rule.antecedentLabel,
      recommendedProductId: rule.consequentId,
      recommendedProductName: rule.consequentLabel,
      eligibleTransactions: rule.antecedentCount,
      confidence: rule.confidence,
      lift: rule.lift,
      bestSegment: pair ? dominantContext(cube, scopedBaskets, pair, 'segment') : '-',
      bestChannel: pair ? dominantContext(cube, scopedBaskets, pair, 'channel') : '-',
      bestTime: pair ? dominantContext(cube, scopedBaskets, pair, 'dayPart') : '-',
      opportunityScore: rule.opportunityScore,
    }
  })
  const recommendations: MarketBasketRecommendation[] = rules.slice(0, 6).map((rule) => ({
    ruleId: rule.id,
    title: `${rule.recommendedUse}: ${rule.antecedentLabel} → ${rule.consequentLabel}`,
    evidence: `Confidence ${formatPercent(rule.confidence)}, lift ${rule.lift.toFixed(2).replace('.', ',')}x, support ${formatPercent(rule.support)}.`,
    action: rule.recommendedUse === 'Checkout add-on' ? `Tampilkan ${rule.consequentLabel} sebagai add-on ketika ${rule.antecedentLabel} dipilih.` : `Uji bundle/menu placement untuk ${rule.antecedentLabel} dan ${rule.consequentLabel}.`,
    priority: rule.opportunityScore >= 72 ? 'high' : rule.opportunityScore >= 48 ? 'medium' : 'low',
    productIds: [rule.antecedentId, rule.consequentId],
  }))

  return {
    periodLabel: filters.quarter ? quarterLabel(filters.quarter) : 'Semua Periode',
    filterLabel: filterLabel(cube, filters, local),
    summary,
    previousSummary,
    deltas: {
      multiItemRate: delta(summary.multiItemRate, previousSummary.multiItemRate),
      averageUniqueItems: delta(summary.averageUniqueItems, previousSummary.averageUniqueItems),
      strongRules: delta(summary.strongRules, previousSummary.strongRules),
      averageLift: delta(summary.averageLift, previousSummary.averageLift),
    },
    products,
    pairs,
    rules,
    categoryAffinity,
    basketComposition,
    segmentPatterns,
    channelPatterns,
    timePatterns,
    outletPatterns,
    voucherPatterns,
    bundleOpportunities,
    crossSellRecommendations,
    insights: buildInsights({ pairs, rules, categoryAffinity, outletPatterns, channelPatterns }),
    recommendations,
    availableProducts: cube.dims.products.map((product) => ({ id: product.id, name: product.name, category: product.category })),
    availableCategories: cube.dims.categories,
    availableSegments: cube.dims.segments,
    availableChannels: cube.dims.channels,
    methodology: {
      quantityRule: 'Support dan confidence memakai keberadaan produk unik dalam basket. Quantity hanya dipakai untuk volume dan revenue.',
      supportFormula: 'Support(A ∩ B) = pair transactions / eligible transactions pada filter aktif.',
      confidenceFormula: 'Confidence(A → B) = pair transactions / transactions containing A.',
      liftFormula: 'Lift(A → B) = Confidence(A → B) / Support(B).',
      opportunityFormula: '25% support + 25% confidence + 20% capped lift + 15% pair revenue + 15% sample size.',
    },
  }
}
