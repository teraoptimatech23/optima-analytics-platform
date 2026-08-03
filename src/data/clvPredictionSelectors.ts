import type { AppliedFilters } from '@/data/types'

export type ClvHorizon = 90 | 180
export type ClvComparisonDimension = 'segment' | 'acquisition' | 'location' | 'gender' | 'age' | 'member' | 'rfm' | 'journey' | 'channel'
export type ClvReliabilityFilter = 'all' | 'high' | 'medium' | 'low'
export type ClvBandFilter = 'all' | 'Top Value' | 'High Value' | 'Core Value' | 'Low Value'

export interface ClvPredictionLocalFilters {
  horizon: ClvHorizon
  valueBand: ClvBandFilter
  reliability: ClvReliabilityFilter
  member: 'all' | 'member' | 'non-member'
  rfmSegment: string
  journeyStage: string
  model: string
  comparison: ClvComparisonDimension
  search: string
}

export const defaultClvPredictionLocalFilters: ClvPredictionLocalFilters = {
  horizon: 180,
  valueBand: 'all',
  reliability: 'all',
  member: 'all',
  rfmSegment: 'all',
  journeyStage: 'all',
  model: 'all',
  comparison: 'segment',
  search: '',
}

export interface ClvPredictionJson {
  meta: {
    source: string
    input: string
    generatedAt: string
    period: { start: string; end: string }
    predictionReferenceDate: string
    predictionReferenceMonth: string
    observationWindowMonths: number
    minimumTransactions: number
    minimumObservedMonths: number
    methodology: string[]
    limitations: string[]
  }
  dims: {
    customerIds: string[]
    outlets: { id: string; name: string; city: string; region: string; type: string }[]
    genders: string[]
    ageBands: string[]
    segments: string[]
    acquisitions: string[]
    channels: string[]
    rfmSegments: string[]
    journeyStages: string[]
    valueBands: string[]
    reliabilityStatuses: Array<'high' | 'medium' | 'low'>
    drivers: string[]
    modelIds: string[]
    featureNames: string[]
  }
  predictions: Record<string, number[][]>
  actualVsPredicted: Record<string, number[][]>
  models: Record<string, ClvModelPayload>
}

interface MetricPayload {
  sampleCount: number
  mae: number
  rmse: number
  wape: number
  medianAbsoluteError: number
  bias: number
  r2: number
  topDecileCapture: number
  idealTopDecileCapture: number
}

interface ClvModelPayload {
  selectedModel: string
  selectedModelLabel: string
  baselineModel: string
  baselineModelLabel: string
  predictionReferenceDate: string
  predictionReferenceMonth: string
  predictionHorizonDays: number
  predictionHorizonMonths: number
  observationWindowMonths: number
  trainPeriod: string
  validationPeriod: string
  testPeriod: string
  snapshots: number
  trainSnapshots: number
  validationSnapshots: number
  testSnapshots: number
  validation: Record<string, MetricPayload>
  selected: MetricPayload
  baseline: MetricPayload
  residualIntervalSource: string
  reliability: string
  featureImportance: Array<[string, number, number]>
  calibration: Array<[number, number, number, number]>
}

const P = {
  customer: 0, outlet: 1, gender: 2, age: 3, segment: 4, acquisition: 5, member: 6,
  refMonth: 7, refYmd: 8, horizon: 9, historicalValue: 10, predictedFutureValue: 11,
  totalExpectedValue: 12, lower: 13, upper: 14, churnRisk: 15, churnAdjustedValue: 16,
  valueAtRisk: 17, band: 18, reliabilityScore: 19, reliabilityStatus: 20, coldStart: 21,
  tx: 22, activeMonths: 23, recencyMonths: 24, avgBasket: 25, purchaseFrequency: 26,
  voucherRate: 27, campaignRate: 28, rfm: 29, journey: 30, channel: 31, driver: 32, model: 33,
} as const

const B = { customer: 0, refMonth: 1, refYmd: 2, horizon: 3, historicalValue: 4, predicted: 5, actual: 6, coldStart: 7, segment: 8, outlet: 9 } as const

const pct = (value: number) => value / 10000
const safeDivide = (value: number, total: number) => (total ? value / total : 0)

export interface ClvCustomerPrediction {
  customerId: string
  outletName: string
  city: string
  region: string
  gender: string
  ageBand: string
  segment: string
  acquisition: string
  member: boolean
  predictionReferenceDate: string
  predictionHorizonDays: number
  historicalClv: number
  predictedClv: number
  totalExpectedClv: number
  predictionLower: number
  predictionUpper: number
  churnRisk: number
  churnAdjustedFutureValue: number
  valueAtRisk: number
  valueBand: string
  reliabilityScore: number
  reliabilityStatus: 'high' | 'medium' | 'low'
  coldStart: boolean
  transactionCount: number
  activeMonths: number
  recencyMonths: number
  averageBasket: number
  purchaseFrequency: number
  voucherRate: number
  campaignRate: number
  rfmSegment: string
  journeyStage: string
  preferredChannel: string
  primaryDriver: string
  modelId: string
}

export interface ClvKpi {
  id: string
  label: string
  value: number
  display: 'number' | 'currency' | 'percent' | 'score' | 'text'
  detail: string
  tone: 'blue' | 'green' | 'orange' | 'purple' | 'cyan' | 'red'
}

export interface ClvComparisonRow {
  id: string
  label: string
  customerCount: number
  historicalClv: number
  predictedClv: number
  totalExpectedClv: number
  averagePredictedClv: number
  valueAtRisk: number
  coldStartShare: number
  reliableShare: number
  topValueShare: number
  primaryDriver: string
}

export interface ClvBacktestRow {
  customerId: string
  referenceDate: string
  historicalClv: number
  predictedFutureClv: number
  actualFutureClv: number
  error: number
  coldStart: boolean
  segment: string
  outletName: string
}

export interface ClvPredictionResult {
  meta: ClvPredictionJson['meta']
  model: ClvModelPayload
  summary: {
    predictionReferenceDate: string
    predictionHorizonDays: number
    observationWindowMonths: number
    eligibleCustomers: number
    coldStartCustomers: number
    reliableCustomers: number
    historicalClv: number
    predictedFutureClv: number
    totalExpectedClv: number
    predictionLowerTotal: number
    predictionUpperTotal: number
    valueAtRisk: number
    churnAdjustedFutureValue: number
    averagePredictedClv: number
    averageReliability: number
  }
  kpis: ClvKpi[]
  customers: ClvCustomerPrediction[]
  bands: Array<{ band: string; customerCount: number; share: number; historicalClv: number; predictedClv: number; averagePredictedClv: number; reliabilityScore: number }>
  comparisons: ClvComparisonRow[]
  modelPerformance: Array<{ modelName: string; isSelected: boolean; isBaseline: boolean; mae: number; rmse: number; wape: number; bias: number; r2: number; topDecileCapture: number }>
  calibration: Array<{ bucket: string; sampleCount: number; averagePredicted: number; averageActual: number; gap: number }>
  actualVsPredicted: ClvBacktestRow[]
  drivers: Array<{ feature: string; label: string; importance: number; direction: 'value-up' | 'value-down'; interpretation: string }>
  insights: string[]
  recommendations: Array<{ id: string; target: string; evidence: string; action: string; priority: 'high' | 'medium' | 'low'; reliabilityNote: string }>
  available: { rfmSegments: string[]; journeyStages: string[]; models: string[] }
  methodology: string[]
  limitations: string[]
}

const driverLabels: Record<string, string> = {
  historical_value: 'Historical CLV',
  window_value: 'Observed Value Window',
  recent_value: 'Recent Value',
  positive_momentum: 'Positive Monetary Momentum',
  transaction_count: 'Transaction Count',
  window_transactions: 'Window Transactions',
  active_months: 'Active Months',
  window_active_months: 'Window Active Months',
  tenure_months: 'Customer Tenure',
  recency_months: 'Recency',
  average_basket: 'Average Basket',
  purchase_frequency: 'Purchase Frequency',
  voucher_rate: 'Voucher Rate',
  campaign_rate: 'Campaign Rate',
  member_flag: 'Membership',
  customer_segment: 'Customer Segment',
  acquisition_source: 'Acquisition Source',
  prediction_horizon: 'Prediction Horizon',
}

function ymd(value: number) {
  return String(value).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3')
}

function rowToCustomer(payload: ClvPredictionJson, row: number[]): ClvCustomerPrediction {
  const outlet = payload.dims.outlets[row[P.outlet]!]!
  return {
    customerId: payload.dims.customerIds[row[P.customer]!] ?? `CUS-${row[P.customer]}`,
    outletName: outlet?.name ?? 'Unknown Outlet',
    city: outlet?.city ?? 'Unknown',
    region: outlet?.region ?? 'Unknown',
    gender: payload.dims.genders[row[P.gender]!] ?? 'Unknown',
    ageBand: payload.dims.ageBands[row[P.age]!] ?? 'Unknown',
    segment: payload.dims.segments[row[P.segment]!] ?? 'Unknown',
    acquisition: payload.dims.acquisitions[row[P.acquisition]!] ?? 'Unknown',
    member: Boolean(row[P.member]),
    predictionReferenceDate: ymd(row[P.refYmd]!),
    predictionHorizonDays: row[P.horizon]!,
    historicalClv: row[P.historicalValue]!,
    predictedClv: row[P.predictedFutureValue]!,
    totalExpectedClv: row[P.totalExpectedValue]!,
    predictionLower: row[P.lower]!,
    predictionUpper: row[P.upper]!,
    churnRisk: pct(row[P.churnRisk]!),
    churnAdjustedFutureValue: row[P.churnAdjustedValue]!,
    valueAtRisk: row[P.valueAtRisk]!,
    valueBand: payload.dims.valueBands[row[P.band]!] ?? 'Low Value',
    reliabilityScore: row[P.reliabilityScore]!,
    reliabilityStatus: payload.dims.reliabilityStatuses[row[P.reliabilityStatus]!] ?? 'low',
    coldStart: Boolean(row[P.coldStart]),
    transactionCount: row[P.tx]!,
    activeMonths: row[P.activeMonths]!,
    recencyMonths: row[P.recencyMonths]!,
    averageBasket: row[P.avgBasket]!,
    purchaseFrequency: row[P.purchaseFrequency]! / 100,
    voucherRate: pct(row[P.voucherRate]!),
    campaignRate: pct(row[P.campaignRate]!),
    rfmSegment: payload.dims.rfmSegments[row[P.rfm]!] ?? 'Unknown',
    journeyStage: payload.dims.journeyStages[row[P.journey]!] ?? 'Unknown',
    preferredChannel: payload.dims.channels[row[P.channel]!] ?? 'Unknown',
    primaryDriver: payload.dims.drivers[row[P.driver]!] ?? 'Historical run rate',
    modelId: payload.dims.modelIds[row[P.model]!] ?? 'unknown',
  }
}

function rowMatchesGlobal(payload: ClvPredictionJson, row: number[], filters: AppliedFilters) {
  const outlet = payload.dims.outlets[row[P.outlet]!]
  if (!outlet) return false
  if (filters.region && outlet.region !== filters.region) return false
  if (filters.city && outlet.city !== filters.city) return false
  if (filters.outlet && outlet.id !== filters.outlet) return false
  if (filters.gender && payload.dims.genders[row[P.gender]!] !== filters.gender) return false
  if (filters.ageBand && payload.dims.ageBands[row[P.age]!] !== filters.ageBand) return false
  return true
}

function localFilter(row: ClvCustomerPrediction, local: ClvPredictionLocalFilters) {
  if (local.valueBand !== 'all' && row.valueBand !== local.valueBand) return false
  if (local.reliability !== 'all' && row.reliabilityStatus !== local.reliability) return false
  if (local.member === 'member' && !row.member) return false
  if (local.member === 'non-member' && row.member) return false
  if (local.rfmSegment !== 'all' && row.rfmSegment !== local.rfmSegment) return false
  if (local.journeyStage !== 'all' && row.journeyStage !== local.journeyStage) return false
  if (local.model !== 'all' && row.modelId !== local.model) return false
  if (local.search && !row.customerId.toLowerCase().includes(local.search.toLowerCase())) return false
  return true
}

function comparisonLabel(row: ClvCustomerPrediction, dimension: ClvComparisonDimension) {
  if (dimension === 'acquisition') return row.acquisition
  if (dimension === 'location') return `${row.city} - ${row.region}`
  if (dimension === 'gender') return row.gender
  if (dimension === 'age') return row.ageBand
  if (dimension === 'member') return row.member ? 'Member' : 'Non Member'
  if (dimension === 'rfm') return row.rfmSegment
  if (dimension === 'journey') return row.journeyStage
  if (dimension === 'channel') return row.preferredChannel
  return row.segment
}

function compare(rows: ClvCustomerPrediction[], dimension: ClvComparisonDimension): ClvComparisonRow[] {
  const groups = new Map<string, ClvCustomerPrediction[]>()
  rows.forEach((row) => {
    const key = comparisonLabel(row, dimension)
    groups.set(key, [...(groups.get(key) ?? []), row])
  })
  return [...groups.entries()].map(([label, items]) => {
    const driverCounts = new Map<string, number>()
    items.forEach((item) => driverCounts.set(item.primaryDriver, (driverCounts.get(item.primaryDriver) ?? 0) + 1))
    const predictedClv = items.reduce((sum, item) => sum + item.predictedClv, 0)
    return {
      id: label.toLowerCase().replace(/\W+/g, '-'),
      label,
      customerCount: items.length,
      historicalClv: items.reduce((sum, item) => sum + item.historicalClv, 0),
      predictedClv,
      totalExpectedClv: items.reduce((sum, item) => sum + item.totalExpectedClv, 0),
      averagePredictedClv: safeDivide(predictedClv, items.length),
      valueAtRisk: items.reduce((sum, item) => sum + item.valueAtRisk, 0),
      coldStartShare: safeDivide(items.filter((item) => item.coldStart).length, items.length),
      reliableShare: safeDivide(items.filter((item) => item.reliabilityStatus !== 'low').length, items.length),
      topValueShare: safeDivide(items.filter((item) => item.valueBand === 'Top Value').length, items.length),
      primaryDriver: [...driverCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Historical run rate',
    }
  }).sort((a, b) => b.predictedClv - a.predictedClv)
}

function bandRows(rows: ClvCustomerPrediction[]) {
  const groups = new Map<string, ClvCustomerPrediction[]>()
  rows.forEach((row) => groups.set(row.valueBand, [...(groups.get(row.valueBand) ?? []), row]))
  return ['Top Value', 'High Value', 'Core Value', 'Low Value'].map((band) => {
    const items = groups.get(band) ?? []
    return {
      band,
      customerCount: items.length,
      share: safeDivide(items.length, rows.length),
      historicalClv: items.reduce((sum, item) => sum + item.historicalClv, 0),
      predictedClv: items.reduce((sum, item) => sum + item.predictedClv, 0),
      averagePredictedClv: safeDivide(items.reduce((sum, item) => sum + item.predictedClv, 0), items.length),
      reliabilityScore: safeDivide(items.reduce((sum, item) => sum + item.reliabilityScore, 0), items.length),
    }
  })
}

function driverRows(model: ClvModelPayload) {
  return model.featureImportance.slice(0, 8).map(([feature, importance, coefficient]) => ({
    feature,
    label: driverLabels[feature] ?? feature,
    importance,
    direction: coefficient >= 0 ? 'value-up' as const : 'value-down' as const,
    interpretation: coefficient >= 0 ? 'Nilai fitur lebih tinggi menaikkan estimasi future value.' : 'Nilai fitur lebih tinggi menurunkan estimasi future value.',
  }))
}

function backtestRows(payload: ClvPredictionJson, horizon: ClvHorizon) {
  return (payload.actualVsPredicted[String(horizon)] ?? []).map((row) => {
    const outlet = payload.dims.outlets[row[B.outlet]!]
    return {
      customerId: payload.dims.customerIds[row[B.customer]!] ?? `CUS-${row[B.customer]}`,
      referenceDate: ymd(row[B.refYmd]!),
      historicalClv: row[B.historicalValue]!,
      predictedFutureClv: row[B.predicted]!,
      actualFutureClv: row[B.actual]!,
      error: row[B.predicted]! - row[B.actual]!,
      coldStart: Boolean(row[B.coldStart]),
      segment: payload.dims.segments[row[B.segment]!] ?? 'Unknown',
      outletName: outlet?.name ?? 'Unknown Outlet',
    }
  })
}

function buildInsights(rows: ClvCustomerPrediction[], comparisons: ClvComparisonRow[], model: ClvModelPayload) {
  const top = comparisons[0]
  const lowReliability = rows.filter((row) => row.reliabilityStatus === 'low')
  const topBand = rows.filter((row) => row.valueBand === 'Top Value')
  const coldStart = rows.filter((row) => row.coldStart)
  return [
    `Predicted CLV dihitung untuk horizon ${model.predictionHorizonDays} hari; nilai ini adalah estimasi future value, bukan revenue pasti.`,
    `${topBand.length.toLocaleString('id-ID')} pelanggan berada pada Top Value band dan menyumbang ${((safeDivide(topBand.reduce((sum, row) => sum + row.predictedClv, 0), rows.reduce((sum, row) => sum + row.predictedClv, 0))) * 100).toFixed(1).replace('.', ',')}% predicted future value.`,
    top ? `${top.label} menjadi kelompok terbesar dari sisi predicted future CLV dengan rata-rata Rp${Math.round(top.averagePredictedClv).toLocaleString('id-ID')}.` : '',
    `${coldStart.length.toLocaleString('id-ID')} pelanggan memakai cold-start fallback; confidence sengaja lebih rendah karena histori terbatas.`,
    `Backtest temporal model terpilih memiliki WAPE ${(model.selected.wape * 100).toFixed(1).replace('.', ',')}% pada test reference yang sudah memiliki actual future value.`,
    lowReliability.length ? `${lowReliability.length.toLocaleString('id-ID')} pelanggan berstatus reliability rendah; gunakan sebagai daftar monitoring, bukan target otomatis.` : '',
  ].filter(Boolean)
}

function recommendations(rows: ClvCustomerPrediction[], comparisons: ClvComparisonRow[]) {
  const out: ClvPredictionResult['recommendations'] = []
  const top = comparisons.find((row) => row.customerCount >= 20)
  if (top) {
    out.push({
      id: `protect-${top.id}`,
      target: top.label,
      evidence: `${top.customerCount.toLocaleString('id-ID')} customer, predicted future CLV Rp${Math.round(top.predictedClv).toLocaleString('id-ID')}, value at risk Rp${Math.round(top.valueAtRisk).toLocaleString('id-ID')}.`,
      action: 'Prioritaskan retention offer yang terukur pada pelanggan high value dengan reliability medium/high; ukur lift lewat eksperimen.',
      priority: 'high',
      reliabilityNote: 'Evidence berasal dari predicted value dan churn risk exposure, bukan klaim kausal.',
    })
  }
  const coldStartGroup = comparisons.find((row) => row.coldStartShare > 0.35 && row.customerCount >= 20)
  if (coldStartGroup) {
    out.push({
      id: `cold-start-${coldStartGroup.id}`,
      target: coldStartGroup.label,
      evidence: `Cold-start share ${(coldStartGroup.coldStartShare * 100).toFixed(1).replace('.', ',')}% sehingga ranking nilai kurang stabil.`,
      action: 'Kumpulkan sinyal awal tambahan melalui second purchase trigger sebelum memperlakukan segment ini sebagai high-confidence target.',
      priority: 'medium',
      reliabilityNote: 'Recommendation ditandai hati-hati karena histori customer belum cukup.',
    })
  }
  const lowReliabilityValue = rows.filter((row) => row.reliabilityStatus === 'low').reduce((sum, row) => sum + row.predictedClv, 0)
  if (lowReliabilityValue > 0) {
    out.push({
      id: 'monitor-low-reliability',
      target: 'Low reliability customers',
      evidence: `Predicted future CLV pada low reliability group Rp${Math.round(lowReliabilityValue).toLocaleString('id-ID')}.`,
      action: 'Pisahkan dari decision queue utama dan tampilkan sebagai monitoring sampai histori minimum terpenuhi.',
      priority: 'medium',
      reliabilityNote: 'Blocked untuk aksi agresif karena source signal belum cukup kuat.',
    })
  }
  return out.slice(0, 5)
}

export function queryClvPrediction(payload: ClvPredictionJson, filters: AppliedFilters, local: ClvPredictionLocalFilters = defaultClvPredictionLocalFilters): ClvPredictionResult {
  const raw = (payload.predictions[String(local.horizon)] ?? []).filter((row) => rowMatchesGlobal(payload, row, filters))
  const allRows = raw.map((row) => rowToCustomer(payload, row))
  const customers = allRows.filter((row) => localFilter(row, local))
  const model = payload.models[String(local.horizon)]!
  const predictedFutureClv = customers.reduce((sum, row) => sum + row.predictedClv, 0)
  const historicalClv = customers.reduce((sum, row) => sum + row.historicalClv, 0)
  const summary = {
    predictionReferenceDate: payload.meta.predictionReferenceDate,
    predictionHorizonDays: local.horizon,
    observationWindowMonths: payload.meta.observationWindowMonths,
    eligibleCustomers: customers.length,
    coldStartCustomers: customers.filter((row) => row.coldStart).length,
    reliableCustomers: customers.filter((row) => row.reliabilityStatus !== 'low').length,
    historicalClv,
    predictedFutureClv,
    totalExpectedClv: customers.reduce((sum, row) => sum + row.totalExpectedClv, 0),
    predictionLowerTotal: customers.reduce((sum, row) => sum + row.predictionLower, 0),
    predictionUpperTotal: customers.reduce((sum, row) => sum + row.predictionUpper, 0),
    valueAtRisk: customers.reduce((sum, row) => sum + row.valueAtRisk, 0),
    churnAdjustedFutureValue: customers.reduce((sum, row) => sum + row.churnAdjustedFutureValue, 0),
    averagePredictedClv: safeDivide(predictedFutureClv, customers.length),
    averageReliability: safeDivide(customers.reduce((sum, row) => sum + row.reliabilityScore, 0), customers.length),
  }
  const comparisons = compare(customers, local.comparison)
  return {
    meta: payload.meta,
    model,
    summary,
    kpis: [
      { id: 'eligible', label: 'Eligible Customers', value: summary.eligibleCustomers, display: 'number', detail: `${summary.coldStartCustomers.toLocaleString('id-ID')} cold-start fallback`, tone: 'blue' },
      { id: 'historical', label: 'Historical CLV', value: summary.historicalClv, display: 'currency', detail: `Observed s/d ${summary.predictionReferenceDate}`, tone: 'green' },
      { id: 'predicted', label: 'Predicted Future CLV', value: summary.predictedFutureClv, display: 'currency', detail: `${summary.predictionHorizonDays} hari ke depan`, tone: 'purple' },
      { id: 'interval', label: 'Prediction Interval', value: summary.predictionUpperTotal - summary.predictionLowerTotal, display: 'currency', detail: 'Empirical validation residuals', tone: 'cyan' },
      { id: 'risk', label: 'Value at Risk', value: summary.valueAtRisk, display: 'currency', detail: 'Predicted value x churn risk', tone: 'orange' },
      { id: 'wape', label: 'Backtest WAPE', value: model.selected.wape, display: 'percent', detail: `${model.selectedModelLabel}`, tone: 'red' },
      { id: 'reliable', label: 'Reliable Customers', value: safeDivide(summary.reliableCustomers, summary.eligibleCustomers), display: 'percent', detail: 'High + medium reliability', tone: 'blue' },
      { id: 'avg', label: 'Avg Predicted CLV', value: summary.averagePredictedClv, display: 'currency', detail: `Mean per customer`, tone: 'green' },
    ],
    customers: customers.sort((a, b) => b.totalExpectedClv - a.totalExpectedClv || b.reliabilityScore - a.reliabilityScore).slice(0, 300),
    bands: bandRows(customers),
    comparisons,
    modelPerformance: [
      { modelName: model.selectedModelLabel, isSelected: true, isBaseline: model.selectedModel === model.baselineModel, mae: model.selected.mae, rmse: model.selected.rmse, wape: model.selected.wape, bias: model.selected.bias, r2: model.selected.r2, topDecileCapture: model.selected.topDecileCapture },
      { modelName: model.baselineModelLabel, isSelected: false, isBaseline: true, mae: model.baseline.mae, rmse: model.baseline.rmse, wape: model.baseline.wape, bias: model.baseline.bias, r2: model.baseline.r2, topDecileCapture: model.baseline.topDecileCapture },
    ],
    calibration: model.calibration.map(([bucket, sampleCount, averagePredicted, averageActual]) => ({ bucket: `Q${bucket + 1}`, sampleCount, averagePredicted, averageActual, gap: averagePredicted - averageActual })),
    actualVsPredicted: backtestRows(payload, local.horizon).slice(0, 160),
    drivers: driverRows(model),
    insights: buildInsights(customers, comparisons, model),
    recommendations: recommendations(customers, comparisons),
    available: { rfmSegments: payload.dims.rfmSegments, journeyStages: payload.dims.journeyStages, models: payload.dims.modelIds },
    methodology: [
      ...payload.meta.methodology,
      `Current view uses scoped filters on compact prediction rows; React does not compute predictions from raw transactions.`,
      `Selected model for active horizon: ${model.selectedModelLabel}; chosen using validation WAPE, not test WAPE.`,
      `Train: ${model.trainPeriod}. Validation: ${model.validationPeriod}. Test: ${model.testPeriod}.`,
    ],
    limitations: payload.meta.limitations,
  }
}
