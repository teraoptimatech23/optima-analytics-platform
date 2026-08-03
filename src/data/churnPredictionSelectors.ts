import { churnFeatureLabels, churnPredictionConfig } from '@/config/churnPredictionConfig'
import type { AppliedFilters } from '@/data/types'
import type { ChurnHorizon, ChurnRiskBand, ChurnThresholdPolicy } from '@/config/churnPredictionConfig'

export type ChurnComparisonDimension = 'segment' | 'age' | 'gender' | 'member' | 'channel' | 'location' | 'acquisition' | 'rfm' | 'journey'
export type ChurnMembershipFilter = 'all' | 'member' | 'non-member'

export interface ChurnPredictionLocalFilters {
  horizon: ChurnHorizon
  riskBand: ChurnRiskBand | 'all'
  thresholdPolicy: ChurnThresholdPolicy
  member: ChurnMembershipFilter
  rfmSegment: string
  journeyStage: string
  driver: string
  comparison: ChurnComparisonDimension
  search: string
}

export const defaultChurnPredictionLocalFilters: ChurnPredictionLocalFilters = {
  horizon: churnPredictionConfig.defaultHorizon,
  riskBand: 'all',
  thresholdPolicy: 'balanced',
  member: 'all',
  rfmSegment: 'all',
  journeyStage: 'all',
  driver: 'all',
  comparison: 'segment',
  search: '',
}

export interface ChurnPredictionJson {
  meta: {
    generatedAt: string
    modelVersion: string
    featureVersion: string
    trainingDate: string
    period: { start: string; end: string }
    predictionReferenceDate: string
    observationWindowDays: number
    minimumHistoryDays: number
    minimumTransactions: number
    methodology: string[]
  }
  dims: {
    customerIds: string[]
    outlets: { id: string; name: string; city: string; region: string; type: string }[]
    genders: string[]
    ageBands: string[]
    customerSegments: string[]
    acquisitions: string[]
    channels: string[]
    categories: string[]
    products: { id: string; name: string; category: string }[]
    riskBands: string[]
    rfmSegments: string[]
    journeyStages: string[]
    drivers: string[]
    featureNames: string[]
  }
  predictions: Record<string, number[][]>
  insufficientHistory: Record<string, number>
  models: Record<string, ChurnModelPayload>
}

interface ChurnModelPayload {
  selectedModel: string
  baselineModel: string
  selectedThreshold: number
  trainPeriod: string
  validationPeriod: string
  testPeriod: string
  snapshots: number
  trainSnapshots: number
  validationSnapshots: number
  testSnapshots: number
  selected: {
    sampleCount: number
    positiveRate: number
    rocAuc: number
    prAuc: number
    precision: number
    recall: number
    f1: number
    accuracy: number
    brierScore: number
    logLoss: number
    calibrationError: number
    liftAt10: number
    recallAt10: number
    confusionMatrix: [number, number, number, number]
  }
  baseline: {
    rocAuc: number
    prAuc: number
    precision: number
    recall: number
    f1: number
    liftAt10: number
    threshold: number
  }
  validation: { logisticPrAuc: number; baselinePrAuc: number }
  featureImportance: Array<[string, number, number]>
  rocCurve: Array<[number, number]>
  precisionRecallCurve: Array<[number, number]>
  liftCurve: Array<[number, number, number]>
  calibration: Array<[number, number, number, number]>
  reliability: string
  calibrationStatus: string
}

const P = {
  customer: 0, homeOutlet: 1, gender: 2, age: 3, segment: 4, acquisition: 5, member: 6,
  ref: 7, horizon: 8, score: 9, band: 10, threshold: 11, recency: 12, tx: 13,
  freq: 14, monetary: 15, avgBasket: 16, freqChange: 17, monetaryChange: 18,
  activeMonths: 19, voucherRate: 20, campaignRate: 21, sat: 22, nps: 23, clv: 24,
  channel: 25, outlet: 26, rfm: 27, journey: 28, driver: 29, expectedValue: 30,
  priority: 31, favoriteCategory: 32, favoriteProduct: 33,
} as const

const safeDivide = (value: number, total: number) => (total ? value / total : 0)
const pct = (value: number) => value / 10000
const signedPct = (value: number) => value / 10000

export interface ChurnCustomerPrediction {
  customerId: string
  predictionReferenceDate: string
  predictionHorizonDays: number
  churnProbability: number
  riskBand: ChurnRiskBand
  riskBandLabel: string
  expectedValueAtRisk: number
  retentionPriorityScore: number
  recencyDays: number
  transactionCount: number
  purchaseFrequency: number
  monetary: number
  averageBasket: number
  frequencyChange: number
  monetaryChange: number
  rfmSegment: string
  journeyStage: string
  member: boolean
  preferredChannel: string
  preferredOutlet: string
  favoriteProduct: string
  favoriteCategory: string
  satisfaction: number
  nps: number
  clv: number
  primaryRiskDriver: string
  region: string
  city: string
  gender: string
  ageBand: string
  customerSegment: string
  acquisition: string
}

export interface ChurnKpi {
  id: string
  label: string
  value: number
  display: 'number' | 'percent' | 'currency' | 'score' | 'text'
  detail: string
  tone: 'blue' | 'purple' | 'cyan' | 'orange' | 'green' | 'red'
}

export interface ChurnBandMetric {
  band: ChurnRiskBand
  label: string
  customerCount: number
  customerShare: number
  averageProbability: number
  averageRecency: number
  averageFrequency: number
  averageMonetary: number
  averageClv: number
  expectedValueAtRisk: number
  memberRate: number
}

export interface ChurnComparisonRow {
  id: string
  label: string
  eligibleCustomers: number
  predictedChurnRate: number
  highRiskShare: number
  averageProbability: number
  expectedValueAtRisk: number
  averageClv: number
  primaryDriver: string
}

export interface ChurnPredictionResult {
  meta: ChurnPredictionJson['meta']
  summary: {
    predictionReferenceDate: string
    predictionHorizonDays: number
    observationWindowDays: number
    eligibleCustomers: number
    insufficientHistoryCustomers: number
    predictedChurnCustomers: number
    predictedChurnRate: number
    highRiskCustomers: number
    criticalRiskCustomers: number
    averageProbability: number
    expectedValueAtRisk: number
    selectedThreshold: number
    reliabilityStatus: string
  }
  kpis: ChurnKpi[]
  customers: ChurnCustomerPrediction[]
  riskBands: ChurnBandMetric[]
  probabilityDistribution: Array<{ bucket: string; customerCount: number; averagePredictedProbability: number; observedChurnRate: number }>
  modelPerformance: Array<{ modelName: string; isBaseline: boolean; isSelected: boolean; prAuc: number; rocAuc: number; precision: number; recall: number; f1: number; liftAt10: number }>
  confusionMatrix: { truePositive: number; falsePositive: number; trueNegative: number; falseNegative: number }
  rocCurve: Array<{ falsePositiveRate: number; truePositiveRate: number }>
  precisionRecallCurve: Array<{ recall: number; precision: number }>
  liftCurve: Array<{ targetedShare: number; churnCapturedShare: number; lift: number }>
  calibration: Array<{ bucket: string; predictedProbability: number; observedRate: number; sampleCount: number }>
  globalDrivers: Array<{ feature: string; label: string; importance: number; direction: 'risk-up' | 'risk-down'; interpretation: string }>
  comparisonRows: ChurnComparisonRow[]
  fairness: Array<{ label: string; sampleCount: number; averagePredictedRisk: number; highRiskShare: number; status: string }>
  drift: Array<{ label: string; value: number; status: string }>
  insights: string[]
  recommendations: Array<{ id: string; segment: string; riskDriver: string; evidence: string; action: string; priority: 'high' | 'medium' | 'low'; expectedValueAtRisk: number; reliabilityNote: string; route: string }>
  available: { rfmSegments: string[]; journeyStages: string[]; drivers: string[] }
  methodology: string[]
}

function thresholdFor(model: ChurnModelPayload, policy: ChurnThresholdPolicy, rows: number[][]) {
  if (policy === 'balanced') return model.selectedThreshold
  if (policy === 'top-capacity') {
    const sorted = rows.map((row) => pct(row[P.score]!)).sort((a, b) => b - a)
    return sorted[Math.max(0, Math.round(sorted.length * 0.2) - 1)] ?? model.selectedThreshold
  }
  if (policy === 'high-recall') return Math.max(0.05, model.selectedThreshold * 0.82)
  return Math.min(0.95, model.selectedThreshold * 1.12)
}

function riskBandFromScore(score: number, threshold: number): ChurnRiskBand {
  const adjustedHigh = Math.max(0.6, threshold)
  if (score >= 0.8) return 'critical'
  if (score >= adjustedHigh) return 'high'
  if (score >= Math.max(0.35, threshold * 0.55)) return 'medium'
  return 'low'
}

function rowToCustomer(payload: ChurnPredictionJson, row: number[], threshold: number): ChurnCustomerPrediction {
  const outlet = payload.dims.outlets[row[P.outlet]!] ?? payload.dims.outlets[row[P.homeOutlet]!]
  const score = pct(row[P.score]!)
  const band = riskBandFromScore(score, threshold)
  return {
    customerId: payload.dims.customerIds[row[P.customer]!] ?? `CUS-${row[P.customer]}`,
    predictionReferenceDate: String(row[P.ref]).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3'),
    predictionHorizonDays: row[P.horizon]!,
    churnProbability: score,
    riskBand: band,
    riskBandLabel: churnPredictionConfig.riskBands.find((item) => item.id === band)?.label ?? 'Low Risk',
    expectedValueAtRisk: row[P.expectedValue]!,
    retentionPriorityScore: row[P.priority]!,
    recencyDays: row[P.recency]!,
    transactionCount: row[P.tx]!,
    purchaseFrequency: row[P.freq]! / 100,
    monetary: row[P.monetary]!,
    averageBasket: row[P.avgBasket]!,
    frequencyChange: signedPct(row[P.freqChange]!),
    monetaryChange: signedPct(row[P.monetaryChange]!),
    rfmSegment: payload.dims.rfmSegments[row[P.rfm]!] ?? 'Unknown',
    journeyStage: payload.dims.journeyStages[row[P.journey]!] ?? 'Unknown',
    member: Boolean(row[P.member]),
    preferredChannel: payload.dims.channels[row[P.channel]!] ?? 'Unknown',
    preferredOutlet: outlet?.name ?? 'Unknown Outlet',
    favoriteProduct: payload.dims.products[row[P.favoriteProduct]!]?.name ?? 'Unknown Product',
    favoriteCategory: payload.dims.categories[row[P.favoriteCategory]!] ?? 'Unknown Category',
    satisfaction: row[P.sat]! / 100,
    nps: row[P.nps]!,
    clv: row[P.clv]!,
    primaryRiskDriver: payload.dims.drivers[row[P.driver]!] ?? 'Risk signal',
    region: outlet?.region ?? 'Unknown',
    city: outlet?.city ?? 'Unknown',
    gender: payload.dims.genders[row[P.gender]!] ?? 'Unknown',
    ageBand: payload.dims.ageBands[row[P.age]!] ?? 'Unknown',
    customerSegment: payload.dims.customerSegments[row[P.segment]!] ?? 'Unknown',
    acquisition: payload.dims.acquisitions[row[P.acquisition]!] ?? 'Unknown',
  }
}

function filterRows(payload: ChurnPredictionJson, rows: number[][], filters: AppliedFilters) {
  return rows.filter((row) => {
    const outlet = payload.dims.outlets[row[P.outlet]!] ?? payload.dims.outlets[row[P.homeOutlet]!]
    if (filters.region && outlet?.region !== filters.region) return false
    if (filters.city && outlet?.city !== filters.city) return false
    if (filters.outlet && outlet?.id !== filters.outlet) return false
    if (filters.gender && payload.dims.genders[row[P.gender]!] !== filters.gender) return false
    if (filters.ageBand && payload.dims.ageBands[row[P.age]!] !== filters.ageBand) return false
    return true
  })
}

function aggregateBand(rows: ChurnCustomerPrediction[]) {
  return churnPredictionConfig.riskBands.map((band) => {
    const selected = rows.filter((row) => row.riskBand === band.id)
    const tx = selected.reduce((sum, row) => sum + row.transactionCount, 0)
    return {
      band: band.id,
      label: band.label,
      customerCount: selected.length,
      customerShare: safeDivide(selected.length, rows.length),
      averageProbability: safeDivide(selected.reduce((sum, row) => sum + row.churnProbability, 0), selected.length),
      averageRecency: safeDivide(selected.reduce((sum, row) => sum + row.recencyDays, 0), selected.length),
      averageFrequency: safeDivide(tx, selected.length),
      averageMonetary: safeDivide(selected.reduce((sum, row) => sum + row.monetary, 0), selected.length),
      averageClv: safeDivide(selected.reduce((sum, row) => sum + row.clv, 0), selected.length),
      expectedValueAtRisk: selected.reduce((sum, row) => sum + row.expectedValueAtRisk, 0),
      memberRate: safeDivide(selected.filter((row) => row.member).length, selected.length),
    }
  })
}

function compare(rows: ChurnCustomerPrediction[], dimension: ChurnComparisonDimension) {
  const groups = new Map<string, ChurnCustomerPrediction[]>()
  const keyFor = (row: ChurnCustomerPrediction) => {
    if (dimension === 'age') return row.ageBand
    if (dimension === 'gender') return row.gender
    if (dimension === 'member') return row.member ? 'Member' : 'Non Member'
    if (dimension === 'channel') return row.preferredChannel
    if (dimension === 'location') return `${row.region} - ${row.city}`
    if (dimension === 'acquisition') return row.acquisition
    if (dimension === 'rfm') return row.rfmSegment
    if (dimension === 'journey') return row.journeyStage
    return row.customerSegment
  }
  rows.forEach((row) => {
    const key = keyFor(row)
    groups.set(key, [...(groups.get(key) ?? []), row])
  })
  return [...groups.entries()].map(([label, items]) => {
    const high = items.filter((row) => row.riskBand === 'critical' || row.riskBand === 'high')
    const driverCounts = new Map<string, number>()
    items.forEach((row) => driverCounts.set(row.primaryRiskDriver, (driverCounts.get(row.primaryRiskDriver) ?? 0) + 1))
    const primaryDriver = [...driverCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-'
    return {
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      eligibleCustomers: items.length,
      predictedChurnRate: safeDivide(items.filter((row) => row.churnProbability >= 0.5).length, items.length),
      highRiskShare: safeDivide(high.length, items.length),
      averageProbability: safeDivide(items.reduce((sum, row) => sum + row.churnProbability, 0), items.length),
      expectedValueAtRisk: items.reduce((sum, row) => sum + row.expectedValueAtRisk, 0),
      averageClv: safeDivide(items.reduce((sum, row) => sum + row.clv, 0), items.length),
      primaryDriver,
    }
  }).sort((a, b) => b.expectedValueAtRisk - a.expectedValueAtRisk)
}

function probabilityDistribution(rows: ChurnCustomerPrediction[], model: ChurnModelPayload) {
  return Array.from({ length: 10 }, (_, index) => {
    const min = index / 10
    const max = (index + 1) / 10
    const bucketRows = rows.filter((row) => row.churnProbability >= min && row.churnProbability < max + (index === 9 ? 0.001 : 0))
    const calibrationBucket = model.calibration[index]
    return {
      bucket: `${Math.round(min * 100)}-${Math.round(max * 100)}%`,
      customerCount: bucketRows.length,
      averagePredictedProbability: safeDivide(bucketRows.reduce((sum, row) => sum + row.churnProbability, 0), bucketRows.length),
      observedChurnRate: calibrationBucket?.[2] ?? 0,
    }
  })
}

function driverRows(model: ChurnModelPayload) {
  return model.featureImportance.slice(0, 8).map(([feature, importance, coefficient]) => ({
    feature,
    label: churnFeatureLabels[feature] ?? feature,
    importance,
    direction: coefficient >= 0 ? 'risk-up' as const : 'risk-down' as const,
    interpretation: coefficient >= 0 ? 'Nilai lebih tinggi menaikkan estimasi risiko.' : 'Nilai lebih tinggi menurunkan estimasi risiko.',
  }))
}

function insights(rows: ChurnCustomerPrediction[], riskBands: ChurnBandMetric[], model: ChurnModelPayload) {
  const high = riskBands.filter((row) => row.band === 'critical' || row.band === 'high').reduce((sum, row) => sum + row.customerCount, 0)
  const value = riskBands.reduce((sum, row) => sum + row.expectedValueAtRisk, 0)
  const topBand = riskBands.slice().sort((a, b) => b.customerCount - a.customerCount)[0]
  const topDriver = driverRows(model)[0]
  const topChannel = compare(rows, 'channel')[0]
  return [
    `${high.toLocaleString('id-ID')} pelanggan berada pada Critical/High Risk untuk horizon aktif; ini estimasi risiko, bukan kepastian churn.`,
    `Expected value at risk berbasis recent value x probability mencapai Rp${Math.round(value).toLocaleString('id-ID')}.`,
    topBand ? `${topBand.label} menjadi band terbesar dengan ${(topBand.customerShare * 100).toFixed(1).replace('.', ',')}% eligible customers.` : '',
    topDriver ? `${topDriver.label} menjadi driver global terkuat pada model terpilih.` : '',
    topChannel ? `${topChannel.label} memiliki expected value at risk terbesar di comparison channel.` : '',
    `Top 10% risk pada test set menangkap ${(model.selected.recallAt10 * 100).toFixed(1).replace('.', ',')}% actual churn dengan lift ${model.selected.liftAt10.toFixed(2).replace('.', ',')}x.`,
  ].filter(Boolean)
}

export function queryChurnPrediction(payload: ChurnPredictionJson, filters: AppliedFilters, local: ChurnPredictionLocalFilters = defaultChurnPredictionLocalFilters): ChurnPredictionResult {
  const raw = payload.predictions[String(local.horizon)] ?? []
  const model = payload.models[String(local.horizon)]!
  const baseRows = filterRows(payload, raw, filters)
  const threshold = thresholdFor(model, local.thresholdPolicy, baseRows)
  let customers = baseRows.map((row) => rowToCustomer(payload, row, threshold))
  customers = customers.filter((row) => {
    if (local.riskBand !== 'all' && row.riskBand !== local.riskBand) return false
    if (local.member === 'member' && !row.member) return false
    if (local.member === 'non-member' && row.member) return false
    if (local.rfmSegment !== 'all' && row.rfmSegment !== local.rfmSegment) return false
    if (local.journeyStage !== 'all' && row.journeyStage !== local.journeyStage) return false
    if (local.driver !== 'all' && row.primaryRiskDriver !== local.driver) return false
    if (local.search && !row.customerId.toLowerCase().includes(local.search.toLowerCase())) return false
    return true
  })
  const predicted = customers.filter((row) => row.churnProbability >= threshold)
  const highRisk = customers.filter((row) => row.riskBand === 'critical' || row.riskBand === 'high')
  const riskBands = aggregateBand(customers)
  const expectedValueAtRisk = customers.reduce((sum, row) => sum + row.expectedValueAtRisk, 0)
  const summary = {
    predictionReferenceDate: payload.meta.predictionReferenceDate,
    predictionHorizonDays: local.horizon,
    observationWindowDays: payload.meta.observationWindowDays,
    eligibleCustomers: customers.length,
    insufficientHistoryCustomers: payload.insufficientHistory[String(local.horizon)] ?? 0,
    predictedChurnCustomers: predicted.length,
    predictedChurnRate: safeDivide(predicted.length, customers.length),
    highRiskCustomers: highRisk.length,
    criticalRiskCustomers: customers.filter((row) => row.riskBand === 'critical').length,
    averageProbability: safeDivide(customers.reduce((sum, row) => sum + row.churnProbability, 0), customers.length),
    expectedValueAtRisk,
    selectedThreshold: threshold,
    reliabilityStatus: model.calibrationStatus,
  }
  const kpis: ChurnKpi[] = [
    { id: 'eligible', label: 'Eligible Customers', value: summary.eligibleCustomers, display: 'number', detail: `${summary.insufficientHistoryCustomers.toLocaleString('id-ID')} insufficient history`, tone: 'blue' },
    { id: 'predicted', label: 'Predicted Churn Customers', value: summary.predictedChurnCustomers, display: 'number', detail: `Threshold ${(threshold * 100).toFixed(1).replace('.', ',')}%`, tone: 'orange' },
    { id: 'rate', label: 'Predicted Churn Rate', value: summary.predictedChurnRate, display: 'percent', detail: `${local.horizon} hari horizon`, tone: 'red' },
    { id: 'high', label: 'High-Risk Customers', value: summary.highRiskCustomers, display: 'number', detail: 'Critical + High band', tone: 'purple' },
    { id: 'value', label: 'Expected Value at Risk', value: summary.expectedValueAtRisk, display: 'currency', detail: 'Recent value x churn probability', tone: 'green' },
    { id: 'avg', label: 'Average Churn Probability', value: summary.averageProbability, display: 'percent', detail: 'Model probability, calibration audited', tone: 'cyan' },
    { id: 'roc', label: 'Model ROC-AUC', value: model.selected.rocAuc, display: 'score', detail: model.selectedModel, tone: 'blue' },
    { id: 'pr', label: 'Model PR-AUC', value: model.selected.prAuc, display: 'score', detail: `Baseline ${model.baseline.prAuc.toFixed(2)}`, tone: 'purple' },
    { id: 'recall', label: 'Recall at Threshold', value: model.selected.recall, display: 'percent', detail: 'Measured on temporal test', tone: 'orange' },
    { id: 'reliability', label: 'Prediction Reliability', value: model.selected.calibrationError, display: 'score', detail: model.calibrationStatus, tone: 'green' },
  ]
  const comparisonRows = compare(customers, local.comparison)
  return {
    meta: payload.meta,
    summary,
    kpis,
    customers: customers.sort((a, b) => b.churnProbability - a.churnProbability || b.expectedValueAtRisk - a.expectedValueAtRisk).slice(0, 250),
    riskBands,
    probabilityDistribution: probabilityDistribution(customers, model),
    modelPerformance: [
      { modelName: model.selectedModel, isBaseline: false, isSelected: true, prAuc: model.selected.prAuc, rocAuc: model.selected.rocAuc, precision: model.selected.precision, recall: model.selected.recall, f1: model.selected.f1, liftAt10: model.selected.liftAt10 },
      { modelName: model.baselineModel, isBaseline: true, isSelected: false, prAuc: model.baseline.prAuc, rocAuc: model.baseline.rocAuc, precision: model.baseline.precision, recall: model.baseline.recall, f1: model.baseline.f1, liftAt10: model.baseline.liftAt10 },
    ],
    confusionMatrix: { truePositive: model.selected.confusionMatrix[0], falsePositive: model.selected.confusionMatrix[1], trueNegative: model.selected.confusionMatrix[2], falseNegative: model.selected.confusionMatrix[3] },
    rocCurve: model.rocCurve.map(([falsePositiveRate, truePositiveRate]) => ({ falsePositiveRate, truePositiveRate })),
    precisionRecallCurve: model.precisionRecallCurve.map(([recall, precision]) => ({ recall, precision })),
    liftCurve: model.liftCurve.map(([targetedShare, churnCapturedShare, lift]) => ({ targetedShare, churnCapturedShare, lift })),
    calibration: model.calibration.map(([bucket, predictedProbability, observedRate, sampleCount]) => ({ bucket: `${bucket * 10}-${bucket * 10 + 10}%`, predictedProbability, observedRate, sampleCount })),
    globalDrivers: driverRows(model),
    comparisonRows,
    fairness: compare(customers, 'gender').map((row) => ({ label: row.label, sampleCount: row.eligibleCustomers, averagePredictedRisk: row.averageProbability, highRiskShare: row.highRiskShare, status: row.eligibleCustomers < 100 ? 'Insufficient sample' : Math.abs(row.averageProbability - summary.averageProbability) > 0.08 ? 'Monitor' : 'Stable' })),
    drift: [
      { label: 'Churn prevalence shift', value: Math.abs(model.selected.positiveRate - model.baseline.prAuc), status: Math.abs(model.selected.positiveRate - model.baseline.prAuc) > 0.2 ? 'Monitor' : 'Stable' },
      { label: 'Calibration error', value: model.selected.calibrationError, status: model.selected.calibrationError > 0.12 ? 'Monitor' : 'Stable' },
      { label: 'Prediction concentration', value: safeDivide(highRisk.length, customers.length), status: safeDivide(highRisk.length, customers.length) > 0.45 ? 'Monitor' : 'Stable' },
    ],
    insights: insights(customers, riskBands, model),
    recommendations: comparisonRows.slice(0, 5).map((row, index) => ({
      id: row.id,
      segment: row.label,
      riskDriver: row.primaryDriver,
      evidence: `${row.eligibleCustomers.toLocaleString('id-ID')} eligible customers, high-risk share ${(row.highRiskShare * 100).toFixed(1).replace('.', ',')}%, value at risk Rp${Math.round(row.expectedValueAtRisk).toLocaleString('id-ID')}.`,
      action: 'Prioritaskan retention treatment berbasis preferred channel dan risk driver utama; ukur uplift secara eksperimen.',
      priority: index < 2 ? 'high' : index < 4 ? 'medium' : 'low',
      expectedValueAtRisk: row.expectedValueAtRisk,
      reliabilityNote: 'Recommendation berbasis model backtest temporal; tidak mengklaim pelanggan pasti churn.',
      route: '/purchase-analytics/customer-journey',
    })),
    available: { rfmSegments: payload.dims.rfmSegments, journeyStages: payload.dims.journeyStages, drivers: payload.dims.drivers },
    methodology: [
      ...payload.meta.methodology,
      `Selected threshold policy: ${churnPredictionConfig.thresholdPolicies[local.thresholdPolicy].label}.`,
      'Expected value at risk = recent value proxy x calibrated churn probability.',
      'Retention priority score = churn risk, expected value, membership, and behavioural decline signal.',
      'Fairness section compares average predicted risk and high-risk share by segment; it is monitoring, not an automated decision rule.',
    ],
  }
}
