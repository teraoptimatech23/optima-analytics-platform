import {
  customerPerceptionAttributes,
  customerPerceptionDimensionLabels,
} from '@/config/customerPerceptionWeights'
import type { PerceptionDimensionId, PerceptionSourceType } from '@/config/customerPerceptionWeights'
import { perceptionThresholds } from '@/config/customerPerceptionThresholds'
import { quarterLabel, quarterOf } from '@/data/cube'
import type { AppliedFilters } from '@/data/types'

export type PerceptionMetricKey = 'score' | 'positiveRate' | 'gap' | 'nps'
export type PerceptionComparisonDimension = 'segment' | 'ageBand' | 'gender' | 'channel' | 'outlet' | 'region' | 'product' | 'acquisition' | 'persona'

export interface CustomerPerceptionLocalFilters {
  dimension: PerceptionDimensionId | 'all'
  attribute: string
  sourceType: PerceptionSourceType | 'all'
  reliability: 'all' | 'high' | 'moderate' | 'low'
  persona: string
  comparisonDimension: PerceptionComparisonDimension
  metric: PerceptionMetricKey
  group: 'all' | 'positive' | 'neutral' | 'negative'
  member: 'all' | 'member' | 'non-member'
  minSampleSize: number
}

export interface CustomerPerceptionJson {
  meta: {
    generatedAt: string
    source: string
    surveyHasOpenText: boolean
    scoreScale: { min: number; max: number; positive: string; neutral: string; negative: string }
    overallFormula: string
    gapFormula: string
    reliabilityFormula: string
    proxyNote: string
  }
  dims: {
    months: string[]
    outlets: { id: string; name: string; city: string; region: string; type: string }[]
    genders: string[]
    ageBands: string[]
    segments: string[]
    occupations: string[]
    incomeBands: string[]
    acquisitions: string[]
    memberStates: string[]
    channels: string[]
    categories: string[]
    products: { id: string; name: string; category: string }[]
    npsGroups: string[]
    personas: string[]
    dimensions: PerceptionDimensionId[]
    attributes: string[]
    attributeDimensions: number[]
    attributeWeights: number[]
    dimensionWeights: number[]
    sourceTypes: PerceptionSourceType[]
    attributeSourceTypes: number[]
  }
  customerFacts: number[][]
}

export interface PerceptionDimensionMetric {
  id: PerceptionDimensionId
  label: string
  score: number
  normalizedScore: number
  positiveRate: number
  neutralRate: number
  negativeRate: number
  responseCount: number
  rank: number
  previousScore: number
  scoreChange: number
  sourceType: PerceptionSourceType
  reliabilityScore: number
  reliabilityStatus: 'high' | 'moderate' | 'low'
  strongestAttribute: string
  weakestAttribute: string
}

export interface PerceptionAttributeMetric {
  id: string
  label: string
  dimensionId: PerceptionDimensionId
  score: number
  normalizedScore: number
  positiveRate: number
  neutralRate: number
  negativeRate: number
  responseCount: number
  previousScore: number
  scoreChange: number
  importance: number
  gap: number
  sourceType: PerceptionSourceType
  reliabilityScore: number
  reliabilityStatus: 'high' | 'moderate' | 'low'
}

export interface PerceptionComparisonRow {
  id: string
  label: string
  customerCount: number
  overallPerception: number
  brandScore: number
  productScore: number
  priceValueScore: number
  serviceScore: number
  outletExperienceScore: number
  digitalExperienceScore: number
  positiveRate: number
  negativeRate: number
  satisfaction: number
  nps: number
  repeatRate: number
  averageClv: number
  biggestGap: string
}

export interface PerceptionPersona {
  id: string
  label: string
  customerCount: number
  customerShare: number
  dominantDimension: string
  weakestDimension: string
  overallPerception: number
  satisfaction: number
  nps: number
  repeatRate: number
  averageClv: number
  preferredProduct: string
  preferredChannel: string
  recommendedAction: string
}

export interface PerceptionDriver {
  attributeId: string
  label: string
  relationshipStrength: number
  direction: 'positive' | 'negative'
  sampleCount: number
  interpretation: string
}

export interface PerceptionSummary {
  eligibleCustomers: number
  respondents: number
  overallPerceptionScore: number
  brandTrustScore: number
  productQualityScore: number
  priceFairnessScore: number
  serviceScore: number
  digitalExperienceScore: number
  positivePerceptionRate: number
  negativePerceptionRate: number
  strongestAttribute: string
  biggestGapAttribute: string
  averageReliabilityScore: number
}

export interface PerceptionRecommendation {
  dimensionId: PerceptionDimensionId
  target: string
  evidence: string
  action: string
  owner: string
  priority: 'high' | 'medium' | 'low'
  reliabilityNote: string
  route: string
}

export interface CustomerPerceptionResult {
  periodLabel: string
  filterLabel: string
  summary: PerceptionSummary
  previousSummary: PerceptionSummary
  dimensions: PerceptionDimensionMetric[]
  attributes: PerceptionAttributeMetric[]
  overviewAttributes: PerceptionAttributeMetric[]
  expectationGaps: PerceptionAttributeMetric[]
  drivers: PerceptionDriver[]
  npsComparison: Array<{ npsGroup: string; customerCount: number; overallPerception: number; strongestDimension: string; weakestDimension: string }>
  segmentComparisons: PerceptionComparisonRow[]
  channelComparisons: PerceptionComparisonRow[]
  locationComparisons: PerceptionComparisonRow[]
  productComparisons: PerceptionComparisonRow[]
  acquisitionComparisons: PerceptionComparisonRow[]
  activeComparison: PerceptionComparisonRow[]
  trends: Array<{ period: string; dimensionId: PerceptionDimensionId; score: number; positiveRate: number; negativeRate: number; responseCount: number }>
  personas: PerceptionPersona[]
  insights: string[]
  recommendations: PerceptionRecommendation[]
  selectedExplorer: {
    title: string
    definition: string
    score: number
    positiveRate: number
    neutralRate: number
    negativeRate: number
    responseCount: number
    sourceType: PerceptionSourceType
    reliabilityScore: number
    reliabilityStatus: 'high' | 'moderate' | 'low'
    topComparison: string
    bottomComparison: string
    relatedGap: number
    action: string
  }
  localFilters: CustomerPerceptionLocalFilters
  sourceNotes: string[]
  availableAttributes: { id: string; label: string; dimensionId: PerceptionDimensionId }[]
  availablePersonas: string[]
}

const IDX = {
  customer: 0,
  month: 1,
  outlet: 2,
  gender: 3,
  age: 4,
  segment: 5,
  occupation: 6,
  incomeBand: 7,
  acquisition: 8,
  member: 9,
  channel: 10,
  favoriteCategory: 11,
  favoriteProduct: 12,
  npsGroup: 13,
  persona: 14,
  overall: 15,
  dimensionStart: 16,
} as const

const attributeStart = IDX.dimensionStart + 8
const importanceStart = attributeStart + 13
const tailStart = importanceStart + 13
const TAIL = {
  satisfaction: tailStart,
  nps: tailStart + 1,
  wouldRecommend: tailStart + 2,
  positiveRate: tailStart + 3,
  negativeRate: tailStart + 4,
  transactionCount: tailStart + 5,
  netSpend: tailStart + 6,
  transactionSatisfaction: tailStart + 7,
  avgWaitMinutes: tailStart + 8,
  repeatRate: tailStart + 9,
  retained: tailStart + 10,
  clv: tailStart + 11,
  deliveryShare: tailStart + 12,
  voucherRate: tailStart + 13,
} as const

export const defaultCustomerPerceptionLocalFilters: CustomerPerceptionLocalFilters = {
  dimension: 'all',
  attribute: 'all',
  sourceType: 'all',
  reliability: 'all',
  persona: 'all',
  comparisonDimension: 'segment',
  metric: 'score',
  group: 'all',
  member: 'all',
  minSampleSize: perceptionThresholds.minimumSampleSize,
}

const safeDivide = (value: number, total: number) => (total ? value / total : 0)
const scoreTo100 = (score: number) => (score - 1) * 25
const average = (values: number[]) => safeDivide(values.reduce((sum, value) => sum + value, 0), values.length)

function scoreState(score: number) {
  if (score >= perceptionThresholds.positiveMin) return 'positive'
  if (score <= perceptionThresholds.negativeMax) return 'negative'
  return 'neutral'
}

function reliabilityStatus(score: number): 'high' | 'moderate' | 'low' {
  if (score >= perceptionThresholds.highReliabilityMin) return 'high'
  if (score >= perceptionThresholds.moderateReliabilityMin) return 'moderate'
  return 'low'
}

function reliability(sample: number, scores: number[], sourceType: PerceptionSourceType) {
  const sampleScore = Math.min(1, sample / 100)
  const directScore = sourceType === 'direct-survey' ? 1 : sourceType === 'mixed' ? 0.75 : 0.45
  const mean = average(scores)
  const variance = average(scores.map((score) => (score - mean) ** 2))
  const consistencyScore = Math.max(0, 1 - Math.sqrt(variance) / 2)
  const completenessScore = safeDivide(scores.filter(Number.isFinite).length, scores.length)
  return Math.round((0.3 * sampleScore + 0.3 * directScore + 0.2 * consistencyScore + 0.2 * completenessScore) * 100)
}

function monthsFor(payload: CustomerPerceptionJson, filters: AppliedFilters) {
  return new Set(payload.dims.months.map((month, index) => ({ month, index })).filter((row) => !filters.quarter || quarterOf(row.month) === filters.quarter).map((row) => row.index))
}

function previousMonthSet(payload: CustomerPerceptionJson, current: Set<number>) {
  const sorted = [...current].sort((a, b) => a - b)
  if (!sorted.length) return new Set<number>()
  const length = sorted.length
  const start = sorted[0] ?? 0
  return new Set(Array.from({ length }, (_, index) => start - length + index).filter((index) => index >= 0 && index < payload.dims.months.length))
}

function rowMatches(payload: CustomerPerceptionJson, row: number[], filters: AppliedFilters, months: Set<number>, local: CustomerPerceptionLocalFilters) {
  if (!months.has(row[IDX.month]!)) return false
  const outlet = payload.dims.outlets[row[IDX.outlet]!]
  if (!outlet) return false
  if (filters.outlet && outlet.id !== filters.outlet) return false
  if (filters.city && outlet.city !== filters.city) return false
  if (filters.region && outlet.region !== filters.region) return false
  if (filters.gender && payload.dims.genders[row[IDX.gender]!] !== filters.gender) return false
  if (filters.ageBand && payload.dims.ageBands[row[IDX.age]!] !== filters.ageBand) return false
  if (local.persona !== 'all' && payload.dims.personas[row[IDX.persona]!] !== local.persona) return false
  if (local.member === 'member' && payload.dims.memberStates[row[IDX.member]!] !== 'Member') return false
  if (local.member === 'non-member' && payload.dims.memberStates[row[IDX.member]!] !== 'Non-member') return false
  const state = scoreState(row[IDX.overall]!)
  if (local.group !== 'all' && state !== local.group) return false
  return true
}

function periodLabel(payload: CustomerPerceptionJson, filters: AppliedFilters, months: Set<number>) {
  if (filters.quarter) return quarterLabel(filters.quarter)
  const labels = [...months].sort((a, b) => a - b).map((index) => payload.dims.months[index]).filter(Boolean)
  return `${labels[0] ?? '-'} - ${labels[labels.length - 1] ?? '-'}`
}

function filterLabel(filters: AppliedFilters) {
  return [filters.region ?? 'Semua Wilayah', filters.city, filters.outlet, filters.gender, filters.ageBand ? `${filters.ageBand} tahun` : null].filter(Boolean).join(' · ')
}

function sourceTypeForAttribute(payload: CustomerPerceptionJson, index: number): PerceptionSourceType {
  return payload.dims.sourceTypes[payload.dims.attributeSourceTypes[index]!] ?? 'direct-survey'
}

function sourceTypeForDimension(payload: CustomerPerceptionJson, dimensionIndex: number): PerceptionSourceType {
  const sources = payload.dims.attributeDimensions
    .map((dimension, index) => (dimension === dimensionIndex ? sourceTypeForAttribute(payload, index) : null))
    .filter(Boolean)
  if (sources.includes('behavioural-proxy') && sources.some((source) => source !== 'behavioural-proxy')) return 'mixed'
  if (sources.includes('mixed')) return 'mixed'
  if (sources.every((source) => source === 'behavioural-proxy')) return 'behavioural-proxy'
  return 'direct-survey'
}

function summarizeRows(payload: CustomerPerceptionJson, rows: number[]): PerceptionSummary {
  const facts = rows.map((index) => payload.customerFacts[index]!)
  const attributes = buildAttributes(payload, rows, null, false)
  const dimensions = buildDimensions(payload, rows, attributes, null)
  const strongest = [...attributes].sort((a, b) => b.score - a.score)[0]
  const biggestGap = [...attributes].filter((row) => row.importance > 0).sort((a, b) => b.gap - a.gap)[0]
  return {
    eligibleCustomers: new Set(facts.map((row) => row[IDX.customer])).size,
    respondents: facts.length,
    overallPerceptionScore: average(facts.map((row) => row[IDX.overall]!)),
    brandTrustScore: dimensions.find((row) => row.id === 'brand')?.score ?? 0,
    productQualityScore: attributes.find((row) => row.id === 'taste')?.score ?? 0,
    priceFairnessScore: attributes.find((row) => row.id === 'price')?.score ?? 0,
    serviceScore: dimensions.find((row) => row.id === 'service')?.score ?? 0,
    digitalExperienceScore: dimensions.find((row) => row.id === 'digital-experience')?.score ?? 0,
    positivePerceptionRate: average(facts.map((row) => row[TAIL.positiveRate]!)),
    negativePerceptionRate: average(facts.map((row) => row[TAIL.negativeRate]!)),
    strongestAttribute: strongest?.label ?? '-',
    biggestGapAttribute: biggestGap?.label ?? '-',
    averageReliabilityScore: average(dimensions.map((row) => row.reliabilityScore)),
  }
}

function buildAttributes(payload: CustomerPerceptionJson, rows: number[], previousRows: number[] | null, applyLocalSource: boolean, local?: CustomerPerceptionLocalFilters): PerceptionAttributeMetric[] {
  return payload.dims.attributes.map((id, index) => {
    const config = customerPerceptionAttributes.find((item) => item.id === id)
    const sourceType = sourceTypeForAttribute(payload, index)
    const values = rows.map((rowIndex) => payload.customerFacts[rowIndex]![attributeStart + index]!)
    const importanceValues = rows.map((rowIndex) => payload.customerFacts[rowIndex]![importanceStart + index]!).filter((value) => value > 0)
    const prevValues = previousRows?.map((rowIndex) => payload.customerFacts[rowIndex]![attributeStart + index]!) ?? []
    const score = average(values)
    const positive = safeDivide(values.filter((value) => value >= 4).length, values.length)
    const negative = safeDivide(values.filter((value) => value <= 2).length, values.length)
    const neutral = Math.max(0, 1 - positive - negative)
    const importance = average(importanceValues)
    const reliabilityScore = reliability(values.length, values, sourceType)
    return {
      id,
      label: config?.label ?? id,
      dimensionId: (config?.dimensionId ?? payload.dims.dimensions[payload.dims.attributeDimensions[index]!] ?? 'brand') as PerceptionDimensionId,
      score,
      normalizedScore: scoreTo100(score),
      positiveRate: positive,
      neutralRate: neutral,
      negativeRate: negative,
      responseCount: values.length,
      previousScore: average(prevValues),
      scoreChange: score - average(prevValues),
      importance,
      gap: importance ? importance - score : 0,
      sourceType,
      reliabilityScore,
      reliabilityStatus: reliabilityStatus(reliabilityScore),
    }
  }).filter((row) => {
    if (!applyLocalSource || !local) return true
    if (local.sourceType !== 'all' && row.sourceType !== local.sourceType) return false
    if (local.attribute !== 'all' && row.id !== local.attribute) return false
    if (local.dimension !== 'all' && row.dimensionId !== local.dimension) return false
    if (local.reliability !== 'all' && row.reliabilityStatus !== local.reliability) return false
    return row.responseCount >= local.minSampleSize
  })
}

function buildDimensions(payload: CustomerPerceptionJson, rows: number[], attributes: PerceptionAttributeMetric[], previousRows: number[] | null): PerceptionDimensionMetric[] {
  const output = payload.dims.dimensions.map((id, index) => {
    const values = rows.map((rowIndex) => payload.customerFacts[rowIndex]![IDX.dimensionStart + index]!)
    const prevValues = previousRows?.map((rowIndex) => payload.customerFacts[rowIndex]![IDX.dimensionStart + index]!) ?? []
    const score = average(values)
    const positive = safeDivide(values.filter((value) => value >= 4).length, values.length)
    const negative = safeDivide(values.filter((value) => value <= 2).length, values.length)
    const attrs = attributes.filter((row) => row.dimensionId === id)
    const strongest = [...attrs].sort((a, b) => b.score - a.score)[0]
    const weakest = [...attrs].sort((a, b) => a.score - b.score)[0]
    const sourceType = sourceTypeForDimension(payload, index)
    const reliabilityScore = reliability(values.length, values, sourceType)
    return {
      id,
      label: customerPerceptionDimensionLabels[id],
      score,
      normalizedScore: scoreTo100(score),
      positiveRate: positive,
      neutralRate: Math.max(0, 1 - positive - negative),
      negativeRate: negative,
      responseCount: values.length,
      rank: 0,
      previousScore: average(prevValues),
      scoreChange: score - average(prevValues),
      sourceType,
      reliabilityScore,
      reliabilityStatus: reliabilityStatus(reliabilityScore),
      strongestAttribute: strongest?.label ?? '-',
      weakestAttribute: weakest?.label ?? '-',
    }
  })
  return output.sort((a, b) => b.score - a.score).map((row, index) => ({ ...row, rank: index + 1 }))
}

function comparisonRows(payload: CustomerPerceptionJson, rows: number[], dimension: PerceptionComparisonDimension, minSample: number): PerceptionComparisonRow[] {
  const groups = new Map<string, number[]>()
  const labelFor = (row: number[]) => {
    if (dimension === 'segment') return payload.dims.segments[row[IDX.segment]!] ?? 'Unknown'
    if (dimension === 'ageBand') return payload.dims.ageBands[row[IDX.age]!] ?? 'Unknown'
    if (dimension === 'gender') return payload.dims.genders[row[IDX.gender]!] ?? 'Unknown'
    if (dimension === 'channel') return payload.dims.channels[row[IDX.channel]!] ?? 'Unknown'
    if (dimension === 'outlet') return payload.dims.outlets[row[IDX.outlet]!]?.name ?? 'Unknown'
    if (dimension === 'region') return payload.dims.outlets[row[IDX.outlet]!]?.region ?? 'Unknown'
    if (dimension === 'product') return payload.dims.products[row[IDX.favoriteProduct]!]?.name ?? 'Unknown'
    if (dimension === 'acquisition') return payload.dims.acquisitions[row[IDX.acquisition]!] ?? 'Unknown'
    return payload.dims.personas[row[IDX.persona]!] ?? 'Unknown'
  }
  rows.forEach((rowIndex) => {
    const label = labelFor(payload.customerFacts[rowIndex]!)
    const bucket = groups.get(label) ?? []
    bucket.push(rowIndex)
    groups.set(label, bucket)
  })
  return [...groups.entries()].filter(([, indexes]) => indexes.length >= minSample).map(([label, indexes]) => {
    const facts = indexes.map((index) => payload.customerFacts[index]!)
    const attrs = buildAttributes(payload, indexes, null, false)
    const biggestGap = [...attrs].filter((row) => row.importance > 0).sort((a, b) => b.gap - a.gap)[0]
    return {
      id: label,
      label,
      customerCount: indexes.length,
      overallPerception: average(facts.map((row) => row[IDX.overall]!)),
      brandScore: average(facts.map((row) => row[IDX.dimensionStart]!)),
      productScore: average(facts.map((row) => row[IDX.dimensionStart + 1]!)),
      priceValueScore: average(facts.map((row) => row[IDX.dimensionStart + 2]!)),
      serviceScore: average(facts.map((row) => row[IDX.dimensionStart + 3]!)),
      outletExperienceScore: average(facts.map((row) => row[IDX.dimensionStart + 4]!)),
      digitalExperienceScore: average(facts.map((row) => row[IDX.dimensionStart + 5]!)),
      positiveRate: average(facts.map((row) => row[TAIL.positiveRate]!)),
      negativeRate: average(facts.map((row) => row[TAIL.negativeRate]!)),
      satisfaction: average(facts.map((row) => row[TAIL.satisfaction]!)),
      nps: average(facts.map((row) => row[TAIL.nps]!)),
      repeatRate: average(facts.map((row) => row[TAIL.repeatRate]!)),
      averageClv: average(facts.map((row) => row[TAIL.clv]!)),
      biggestGap: biggestGap?.label ?? '-',
    }
  }).sort((a, b) => b.overallPerception - a.overallPerception)
}

function correlation(xs: number[], ys: number[]) {
  if (xs.length < 3 || ys.length !== xs.length) return 0
  const xMean = average(xs)
  const yMean = average(ys)
  const numerator = xs.reduce((sum, x, index) => sum + (x - xMean) * ((ys[index] ?? 0) - yMean), 0)
  const xDen = Math.sqrt(xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0))
  const yDen = Math.sqrt(ys.reduce((sum, y) => sum + (y - yMean) ** 2, 0))
  return safeDivide(numerator, xDen * yDen)
}

function buildDrivers(payload: CustomerPerceptionJson, rows: number[]): PerceptionDriver[] {
  const overall = rows.map((rowIndex) => payload.customerFacts[rowIndex]![IDX.overall]!)
  return payload.dims.attributes.map((id, index) => {
    const attr = customerPerceptionAttributes.find((item) => item.id === id)
    const values = rows.map((rowIndex) => payload.customerFacts[rowIndex]![attributeStart + index]!)
    const corr = correlation(values, overall)
    return {
      attributeId: id,
      label: attr?.label ?? id,
      relationshipStrength: Math.abs(corr),
      direction: (corr >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
      sampleCount: rows.length,
      interpretation: `${attr?.label ?? id} memiliki hubungan ${corr >= 0 ? 'searah' : 'berlawanan'} dengan overall perception. Ini korelasi, bukan bukti sebab-akibat.`,
    }
  }).sort((a, b) => b.relationshipStrength - a.relationshipStrength).slice(0, 7)
}

function buildPersonas(payload: CustomerPerceptionJson, rows: number[]): PerceptionPersona[] {
  return comparisonRows(payload, rows, 'persona', 1).map((row) => {
    const strongest = [
      ['Brand', row.brandScore],
      ['Product', row.productScore],
      ['Price & Value', row.priceValueScore],
      ['Service', row.serviceScore],
      ['Outlet', row.outletExperienceScore],
      ['Digital', row.digitalExperienceScore],
    ].sort((a, b) => Number(b[1]) - Number(a[1]))
    return {
      id: row.id,
      label: row.label,
      customerCount: row.customerCount,
      customerShare: 0,
      dominantDimension: String(strongest[0]?.[0] ?? '-'),
      weakestDimension: String(strongest[strongest.length - 1]?.[0] ?? '-'),
      overallPerception: row.overallPerception,
      satisfaction: row.satisfaction,
      nps: row.nps,
      repeatRate: row.repeatRate,
      averageClv: row.averageClv,
      preferredProduct: '-',
      preferredChannel: '-',
      recommendedAction: row.negativeRate > 0.12 ? 'Prioritaskan recovery pada atribut dengan negative rate tertinggi.' : 'Pertahankan experience dan monitor perubahan periode berikutnya.',
    }
  }).map((row, _, all) => ({ ...row, customerShare: safeDivide(row.customerCount, all.reduce((sum, item) => sum + item.customerCount, 0)) }))
}

function insights(data: Pick<CustomerPerceptionResult, 'summary' | 'dimensions' | 'attributes' | 'drivers' | 'segmentComparisons' | 'expectationGaps'>) {
  const strongestDimension = data.dimensions[0]
  const weakestDimension = [...data.dimensions].sort((a, b) => a.score - b.score)[0]
  const biggestGap = data.expectationGaps?.[0] ?? [...data.attributes].filter((row) => row.importance > 0).sort((a, b) => b.gap - a.gap)[0]
  const driver = data.drivers[0]
  const topSegment = data.segmentComparisons[0]
  return [
    strongestDimension ? `${strongestDimension.label} menjadi dimensi terkuat dengan skor ${strongestDimension.score.toFixed(2).replace('.', ',')}/5.` : null,
    weakestDimension ? `${weakestDimension.label} menjadi dimensi terlemah dengan skor ${weakestDimension.score.toFixed(2).replace('.', ',')}/5.` : null,
    biggestGap ? `${biggestGap.label} memiliki expectation gap terbesar sebesar ${biggestGap.gap.toFixed(2).replace('.', ',')}.` : null,
    driver ? `${driver.label} paling berkorelasi dengan overall perception (r=${driver.relationshipStrength.toFixed(2).replace('.', ',')}).` : null,
    topSegment ? `${topSegment.label} memiliki overall perception tertinggi di comparison aktif.` : null,
    data.summary.negativePerceptionRate > 0.1 ? `Negative perception rate mencapai ${(data.summary.negativePerceptionRate * 100).toFixed(1).replace('.', ',')}%, perlu dibaca bersama Pain Points.` : null,
  ].filter(Boolean) as string[]
}

function recommendations(attributes: PerceptionAttributeMetric[], comparisons: PerceptionComparisonRow[]): PerceptionRecommendation[] {
  return attributes
    .filter((row) => row.responseCount >= perceptionThresholds.minimumSampleSize)
    .sort((a, b) => (b.gap + b.negativeRate) - (a.gap + a.negativeRate))
    .slice(0, 5)
    .map((row) => ({
      dimensionId: row.dimensionId,
      target: comparisons[comparisons.length - 1]?.label ?? 'Scope aktif',
      evidence: `${row.label}: skor ${row.score.toFixed(2).replace('.', ',')}/5, negative rate ${(row.negativeRate * 100).toFixed(1).replace('.', ',')}%, gap ${row.gap.toFixed(2).replace('.', ',')}.`,
      action: row.dimensionId === 'price-value'
        ? 'Perjelas value proposition, evaluasi bundle, dan sederhanakan pesan promo.'
        : row.dimensionId === 'service'
          ? 'Audit queue, staffing peak hour, dan service recovery pada outlet terkait.'
          : row.dimensionId === 'digital-experience'
            ? 'Audit app friction, checkout, pembayaran, dan voucher flow.'
            : 'Prioritaskan eksperimen perbaikan experience dengan monitoring sebelum mengklaim uplift.',
      owner: row.dimensionId === 'digital-experience' ? 'Product/Digital' : row.dimensionId === 'service' ? 'Operations' : 'Customer Strategy',
      priority: row.gap > 0.7 || row.negativeRate > 0.15 ? 'high' : row.gap > 0.35 ? 'medium' : 'low',
      reliabilityNote: `${row.reliabilityScore}/100 · ${row.reliabilityStatus} reliability`,
      route: row.dimensionId === 'price-value' ? '/customer-insights/kebutuhan-pelanggan' : row.dimensionId === 'service' ? '/customer-insights/pain-points' : '/purchase-analytics/customer-journey',
    }))
}

export function queryCustomerPerception(payload: CustomerPerceptionJson, filters: AppliedFilters, local: CustomerPerceptionLocalFilters): CustomerPerceptionResult {
  const activeMonths = monthsFor(payload, filters)
  const previousMonths = previousMonthSet(payload, activeMonths)
  const rowIndexes = payload.customerFacts.map((_, index) => index).filter((index) => rowMatches(payload, payload.customerFacts[index]!, filters, activeMonths, local))
  const previousIndexes = payload.customerFacts.map((_, index) => index).filter((index) => rowMatches(payload, payload.customerFacts[index]!, filters, previousMonths, local))
  const allAttributes = buildAttributes(payload, rowIndexes, previousIndexes, false)
  const attributes = buildAttributes(payload, rowIndexes, previousIndexes, true, local)
  const dimensions = buildDimensions(payload, rowIndexes, attributes.length ? attributes : allAttributes, previousIndexes)
    .filter((row) => local.dimension === 'all' || row.id === local.dimension)
    .filter((row) => local.sourceType === 'all' || row.sourceType === local.sourceType)
    .filter((row) => local.reliability === 'all' || row.reliabilityStatus === local.reliability)
    .filter((row) => row.responseCount >= local.minSampleSize)
  const summary = summarizeRows(payload, rowIndexes)
  const previousSummary = summarizeRows(payload, previousIndexes)
  const segmentComparisons = comparisonRows(payload, rowIndexes, 'segment', local.minSampleSize)
  const channelComparisons = comparisonRows(payload, rowIndexes, 'channel', local.minSampleSize)
  const locationComparisons = comparisonRows(payload, rowIndexes, 'outlet', local.minSampleSize)
  const productComparisons = comparisonRows(payload, rowIndexes, 'product', local.minSampleSize)
  const acquisitionComparisons = comparisonRows(payload, rowIndexes, 'acquisition', local.minSampleSize)
  const activeComparison = comparisonRows(payload, rowIndexes, local.comparisonDimension, local.minSampleSize)
  const drivers = buildDrivers(payload, rowIndexes)
  const trends = payload.dims.months.flatMap((month, monthIndex) => payload.dims.dimensions.map((dimension, dimensionIndex) => {
    const rows = rowIndexes.filter((index) => payload.customerFacts[index]![IDX.month] === monthIndex)
    const values = rows.map((index) => payload.customerFacts[index]![IDX.dimensionStart + dimensionIndex]!)
    return { period: month, dimensionId: dimension, score: average(values), positiveRate: safeDivide(values.filter((value) => value >= 4).length, values.length), negativeRate: safeDivide(values.filter((value) => value <= 2).length, values.length), responseCount: rows.length }
  })).filter((row) => row.responseCount > 0)
  const npsGroups = ['Promoter', 'Passive', 'Detractor'].map((group) => {
    const indexes = rowIndexes.filter((index) => payload.dims.npsGroups[payload.customerFacts[index]![IDX.npsGroup]!] === group)
    const dims = buildDimensions(payload, indexes, allAttributes, null)
    return {
      npsGroup: group,
      customerCount: indexes.length,
      overallPerception: average(indexes.map((index) => payload.customerFacts[index]![IDX.overall]!)),
      strongestDimension: dims[0]?.label ?? '-',
      weakestDimension: [...dims].sort((a, b) => a.score - b.score)[0]?.label ?? '-',
    }
  }).filter((row) => row.customerCount > 0)
  const personas = buildPersonas(payload, rowIndexes)
  const expectationGaps = [...attributes].filter((row) => row.importance > 0).sort((a, b) => b.gap - a.gap).slice(0, 10)
  const selectedAttribute = attributes.find((row) => row.id === local.attribute) ?? attributes[0] ?? allAttributes[0]
  const selectedComparison = activeComparison
  const top = selectedComparison[0]?.label ?? '-'
  const bottom = selectedComparison[selectedComparison.length - 1]?.label ?? '-'
  const resultBase = {
    periodLabel: periodLabel(payload, filters, activeMonths),
    filterLabel: filterLabel(filters),
    summary,
    previousSummary,
    dimensions,
    attributes,
    overviewAttributes: attributes.slice(0, 12),
    expectationGaps,
    drivers,
    npsComparison: npsGroups,
    segmentComparisons,
    channelComparisons,
    locationComparisons,
    productComparisons,
    acquisitionComparisons,
    activeComparison,
    trends,
    personas,
    insights: [] as string[],
    recommendations: recommendations(attributes, activeComparison),
    selectedExplorer: {
      title: selectedAttribute?.label ?? 'Perception Explorer',
      definition: customerPerceptionAttributes.find((row) => row.id === selectedAttribute?.id)?.description ?? 'Structured perception metric from active dataset.',
      score: selectedAttribute?.score ?? 0,
      positiveRate: selectedAttribute?.positiveRate ?? 0,
      neutralRate: selectedAttribute?.neutralRate ?? 0,
      negativeRate: selectedAttribute?.negativeRate ?? 0,
      responseCount: selectedAttribute?.responseCount ?? 0,
      sourceType: selectedAttribute?.sourceType ?? 'direct-survey',
      reliabilityScore: selectedAttribute?.reliabilityScore ?? 0,
      reliabilityStatus: selectedAttribute?.reliabilityStatus ?? 'low',
      topComparison: top,
      bottomComparison: bottom,
      relatedGap: selectedAttribute?.gap ?? 0,
      action: recommendations(attributes, activeComparison)[0]?.action ?? 'Perluas filter atau pilih atribut lain untuk melihat rekomendasi.',
    },
    localFilters: local,
    sourceNotes: [
      payload.meta.source,
      payload.meta.surveyHasOpenText ? 'Open-text tersedia.' : 'Tidak ada open-text survey; label Positive/Neutral/Negative berasal dari bucket skor 1-5, bukan NLP sentiment.',
      payload.meta.proxyNote,
      payload.meta.reliabilityFormula,
    ],
    availableAttributes: customerPerceptionAttributes.map((row) => ({ id: row.id, label: row.label, dimensionId: row.dimensionId })),
    availablePersonas: payload.dims.personas,
  }
  return { ...resultBase, insights: insights({ ...resultBase, expectationGaps }) }
}

export function metricValue(row: PerceptionComparisonRow, metric: PerceptionMetricKey) {
  if (metric === 'positiveRate') return row.positiveRate
  if (metric === 'gap') return Number(row.biggestGap !== '-')
  if (metric === 'nps') return row.nps
  return row.overallPerception
}
