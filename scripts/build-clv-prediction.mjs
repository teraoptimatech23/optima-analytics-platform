import fs from 'node:fs'
import path from 'node:path'

const COHORT_FILE = path.join('public', 'assets', 'cohortAnalysis.json')
const CHURN_FILE = path.join('public', 'assets', 'churnPrediction.json')
const OUT_FILE = path.join('public', 'assets', 'clvPrediction.json')

const C = {
  customer: 0, outlet: 1, gender: 2, age: 3, segment: 4, member: 5, acquisition: 6,
  firstMonth: 7, acquisitionMonth: 8, membershipMonth: 9, firstCampaignMonth: 10,
  firstPurchaseDay: 11, secondPurchaseDay: 12, lastPurchaseDay: 13, totalTx: 14,
  netSpend: 15, clv: 16, firstChannel: 17, voucherAtEntry: 18, campaignAtEntry: 19,
  firstMonthTx: 20, firstMonthRevenue: 21, lastActiveMonth: 22,
}

const A = { customer: 0, month: 1, outlet: 2, channel: 3, tx: 4, net: 5, voucherTx: 6, memberTx: 7, campaignTx: 8, satSum: 9 }
const CP = { customer: 0, horizon: 8, score: 9 }

const horizons = [
  { days: 90, months: 3 },
  { days: 180, months: 6 },
]
const observationWindowMonths = 6
const minimumTransactions = 2
const minimumObservedMonths = 2
const minTrainRows = 80
const moneyScale = 1000000
const pctScale = 10000

const cohort = JSON.parse(fs.readFileSync(COHORT_FILE, 'utf8'))
const churn = fs.existsSync(CHURN_FILE) ? JSON.parse(fs.readFileSync(CHURN_FILE, 'utf8')) : null

const outletDims = cohort.dims.outlets
const maxCustomerIndex = Math.max(...cohort.customers.map((row) => row[C.customer]))
const customerIds = Array.from({ length: maxCustomerIndex + 1 }, (_, index) => `CUS-${String(index + 1).padStart(5, '0')}`)
const rfmSegments = ['Champions', 'Loyal', 'Potential Loyalist', 'Need Attention', 'At Risk', 'Dormant', 'Cold Start']
const journeyStages = ['New', 'Repeat', 'Loyal', 'Recovering', 'Dormant']
const valueBands = ['Top Value', 'High Value', 'Core Value', 'Low Value']
const reliabilityStatuses = ['high', 'medium', 'low']
const drivers = [
  'Recent monetary momentum',
  'Historical run rate',
  'Frequency consistency',
  'Segment benchmark',
  'Cold-start fallback',
  'Churn-risk exposure',
]
const modelIds = ['historical-run-rate', 'segment-average', 'ridge-log-value']

const activitiesByCustomer = new Map()
for (const row of cohort.activities) {
  const list = activitiesByCustomer.get(row[A.customer]) ?? []
  list.push(row)
  activitiesByCustomer.set(row[A.customer], list)
}
for (const rows of activitiesByCustomer.values()) rows.sort((a, b) => a[A.month] - b[A.month])

const churnRiskByCustomer = new Map()
if (churn?.predictions?.['90']) {
  for (const row of churn.predictions['90']) {
    churnRiskByCustomer.set(row[CP.customer], (row[CP.score] ?? 0) / pctScale)
  }
}

function safeDivide(value, total, fallback = 0) {
  return total ? value / total : fallback
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function round(value, digits = 0) {
  const power = 10 ** digits
  return Math.round((Number.isFinite(value) ? value : 0) * power) / power
}

function monthToYmd(monthIndex) {
  const key = cohort.dims.months[monthIndex] ?? cohort.dims.months.at(-1)
  const isCurrent = monthIndex === cohort.meta.analysisCutoffMonth
  return isCurrent ? cohort.meta.analysisCutoff : `${key}-28`
}

function percentile(values, point) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = clamp(Math.floor((sorted.length - 1) * point), 0, sorted.length - 1)
  return sorted[index] ?? 0
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function featureRow(customerRow, refMonth, horizonMonths) {
  const customer = customerRow[C.customer]
  const rows = (activitiesByCustomer.get(customer) ?? []).filter((row) => row[A.month] <= refMonth)
  if (!rows.length) return null
  const windowStart = Math.max(0, refMonth - observationWindowMonths + 1)
  const windowRows = rows.filter((row) => row[A.month] >= windowStart)
  const recentRows = rows.filter((row) => row[A.month] >= Math.max(0, refMonth - 2))
  const previousRows = rows.filter((row) => row[A.month] >= Math.max(0, refMonth - 5) && row[A.month] <= refMonth - 3)
  const activeMonths = new Set(rows.map((row) => row[A.month])).size
  const windowActiveMonths = new Set(windowRows.map((row) => row[A.month])).size
  const totalTx = rows.reduce((sum, row) => sum + row[A.tx], 0)
  const totalRevenue = rows.reduce((sum, row) => sum + row[A.net], 0)
  const windowTx = windowRows.reduce((sum, row) => sum + row[A.tx], 0)
  const windowRevenue = windowRows.reduce((sum, row) => sum + row[A.net], 0)
  const recentRevenue = recentRows.reduce((sum, row) => sum + row[A.net], 0)
  const previousRevenue = previousRows.reduce((sum, row) => sum + row[A.net], 0)
  const recentTx = recentRows.reduce((sum, row) => sum + row[A.tx], 0)
  const previousTx = previousRows.reduce((sum, row) => sum + row[A.tx], 0)
  const firstMonth = customerRow[C.firstMonth]
  const tenureMonths = Math.max(1, refMonth - firstMonth + 1)
  const recencyMonths = Math.max(0, refMonth - Math.max(...rows.map((row) => row[A.month])))
  const voucherTx = rows.reduce((sum, row) => sum + row[A.voucherTx], 0)
  const campaignTx = rows.reduce((sum, row) => sum + row[A.campaignTx], 0)
  const channelCounts = new Map()
  for (const row of rows) channelCounts.set(row[A.channel], (channelCounts.get(row[A.channel]) ?? 0) + row[A.tx])
  const preferredChannel = [...channelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? customerRow[C.firstChannel]
  const actualTargetRows = (activitiesByCustomer.get(customer) ?? []).filter((row) => row[A.month] > refMonth && row[A.month] <= refMonth + horizonMonths)
  const targetValue = actualTargetRows.reduce((sum, row) => sum + row[A.net], 0)
  const rfmScore = (recencyMonths <= 1 ? 2 : recencyMonths <= 3 ? 1 : 0) + (totalTx >= 8 ? 2 : totalTx >= 3 ? 1 : 0) + (totalRevenue >= percentileRevenueHigh ? 2 : totalRevenue >= percentileRevenueMid ? 1 : 0)
  const rfmSegment = totalTx < minimumTransactions || windowActiveMonths < minimumObservedMonths ? 6 : rfmScore >= 5 ? 0 : rfmScore === 4 ? 1 : rfmScore === 3 ? 2 : rfmScore === 2 ? 3 : recencyMonths <= 4 ? 4 : 5
  const journeyStage = totalTx <= 1 ? 0 : totalTx >= 8 && recencyMonths <= 2 ? 2 : recencyMonths > 4 ? 4 : recencyMonths <= 2 ? 1 : 3
  const coldStart = totalTx < minimumTransactions || windowActiveMonths < minimumObservedMonths
  const features = [
    Math.log1p(totalRevenue) / 16,
    Math.log1p(windowRevenue) / 16,
    Math.log1p(recentRevenue) / 16,
    Math.log1p(Math.max(0, recentRevenue - previousRevenue)) / 15,
    totalTx / 30,
    windowTx / 16,
    activeMonths / 12,
    windowActiveMonths / observationWindowMonths,
    tenureMonths / 12,
    recencyMonths / 12,
    safeDivide(totalRevenue, totalTx) / moneyScale,
    safeDivide(windowTx, observationWindowMonths),
    safeDivide(voucherTx, totalTx),
    safeDivide(campaignTx, totalTx),
    customerRow[C.member],
    customerRow[C.segment] / Math.max(1, cohort.dims.segments.length - 1),
    customerRow[C.acquisition] / Math.max(1, cohort.dims.acquisitions.length - 1),
    horizonMonths / 12,
  ].map((value) => Number.isFinite(value) ? clamp(value, 0, 3) : 0)
  return {
    customer,
    customerRow,
    refMonth,
    horizonMonths,
    features,
    targetValue,
    totalRevenue,
    windowRevenue,
    recentRevenue,
    previousRevenue,
    totalTx,
    windowTx,
    activeMonths,
    windowActiveMonths,
    recencyMonths,
    avgBasket: safeDivide(totalRevenue, totalTx),
    purchaseFrequency: safeDivide(windowTx, observationWindowMonths),
    voucherRate: safeDivide(voucherTx, totalTx),
    campaignRate: safeDivide(campaignTx, totalTx),
    recentTx,
    previousTx,
    rfmSegment,
    journeyStage,
    coldStart,
    preferredChannel,
  }
}

function baselineHistorical(row) {
  return Math.max(0, safeDivide(row.windowRevenue, observationWindowMonths) * row.horizonMonths)
}

function baselineSegment(row, lookup, globalAverage) {
  const key = `${row.customerRow[C.segment]}|${row.customerRow[C.acquisition]}|${row.customerRow[C.member]}`
  return Math.max(0, lookup.get(key) ?? lookup.get(String(row.customerRow[C.segment])) ?? globalAverage)
}

function buildSegmentLookup(rows) {
  const grouped = new Map()
  const push = (key, value) => {
    const list = grouped.get(key) ?? []
    list.push(value)
    grouped.set(key, list)
  }
  for (const row of rows) {
    push(`${row.customerRow[C.segment]}|${row.customerRow[C.acquisition]}|${row.customerRow[C.member]}`, row.targetValue)
    push(String(row.customerRow[C.segment]), row.targetValue)
  }
  return new Map([...grouped.entries()].map(([key, values]) => [key, mean(values)]))
}

function trainRidge(rows, epochs = 180, learningRate = 0.045, lambda = 0.015) {
  const n = rows[0]?.features.length ?? 0
  const weights = Array.from({ length: n + 1 }, () => 0)
  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const grads = Array.from({ length: n + 1 }, () => 0)
    for (const row of rows) {
      const y = Math.log1p(row.targetValue) / 16
      let pred = weights[0]
      for (let i = 0; i < n; i += 1) pred += weights[i + 1] * row.features[i]
      const error = pred - y
      grads[0] += error
      for (let i = 0; i < n; i += 1) grads[i + 1] += error * row.features[i] + lambda * weights[i + 1]
    }
    for (let i = 0; i < weights.length; i += 1) weights[i] -= (learningRate * grads[i]) / Math.max(1, rows.length)
  }
  return weights
}

function predictRidge(weights, row) {
  let pred = weights[0] ?? 0
  for (let i = 0; i < row.features.length; i += 1) pred += (weights[i + 1] ?? 0) * row.features[i]
  return Math.max(0, Math.expm1(clamp(pred * 16, 0, 18)))
}

function evaluate(rows, predict) {
  const pairs = rows.map((row) => ({ actual: row.targetValue, predicted: Math.max(0, predict(row)) }))
  const abs = pairs.map((row) => Math.abs(row.actual - row.predicted))
  const squared = pairs.map((row) => (row.actual - row.predicted) ** 2)
  const actualSum = pairs.reduce((sum, row) => sum + row.actual, 0)
  const predictedSum = pairs.reduce((sum, row) => sum + row.predicted, 0)
  const actualMean = safeDivide(actualSum, pairs.length)
  const sse = squared.reduce((sum, value) => sum + value, 0)
  const sst = pairs.reduce((sum, row) => sum + (row.actual - actualMean) ** 2, 0)
  const topCount = Math.max(1, Math.ceil(pairs.length * 0.1))
  const topPredicted = [...pairs].sort((a, b) => b.predicted - a.predicted).slice(0, topCount)
  const topActual = [...pairs].sort((a, b) => b.actual - a.actual).slice(0, topCount)
  return {
    sampleCount: pairs.length,
    mae: round(mean(abs), 2),
    rmse: round(Math.sqrt(mean(squared)), 2),
    wape: round(safeDivide(abs.reduce((sum, value) => sum + value, 0), actualSum), 4),
    medianAbsoluteError: round(percentile(abs, 0.5), 2),
    bias: round(safeDivide(predictedSum - actualSum, actualSum), 4),
    r2: round(sst ? 1 - sse / sst : 0, 4),
    topDecileCapture: round(safeDivide(topPredicted.reduce((sum, row) => sum + row.actual, 0), actualSum), 4),
    idealTopDecileCapture: round(safeDivide(topActual.reduce((sum, row) => sum + row.actual, 0), actualSum), 4),
  }
}

function makeCalibration(rows, predict) {
  const sorted = rows.map((row) => ({ actual: row.targetValue, predicted: predict(row) })).sort((a, b) => a.predicted - b.predicted)
  const bucketSize = Math.max(1, Math.ceil(sorted.length / 5))
  return Array.from({ length: 5 }, (_, index) => {
    const bucket = sorted.slice(index * bucketSize, (index + 1) * bucketSize)
    return [index, bucket.length, round(mean(bucket.map((row) => row.predicted)), 2), round(mean(bucket.map((row) => row.actual)), 2)]
  }).filter((row) => row[1] > 0)
}

function coefficientImportance(weights) {
  const featureNames = [
    'historical_value', 'window_value', 'recent_value', 'positive_momentum',
    'transaction_count', 'window_transactions', 'active_months', 'window_active_months',
    'tenure_months', 'recency_months', 'average_basket', 'purchase_frequency',
    'voucher_rate', 'campaign_rate', 'member_flag', 'customer_segment',
    'acquisition_source', 'prediction_horizon',
  ]
  return featureNames.map((feature, index) => [feature, round(Math.abs(weights[index + 1] ?? 0), 5), round(weights[index + 1] ?? 0, 5)])
    .sort((a, b) => b[1] - a[1])
}

function primaryDriver(row, selectedModel) {
  if (row.coldStart) return 4
  if (selectedModel === 'segment-average') return 3
  if (row.recentRevenue > row.previousRevenue * 1.15) return 0
  if (row.totalRevenue > 0 && row.windowRevenue > 0) return 1
  if (row.windowActiveMonths >= 3) return 2
  return 5
}

function reliability(row, modelReliability, lower, upper, predicted, horizonDays) {
  const historyDepth = clamp(row.windowActiveMonths / observationWindowMonths, 0, 1)
  const txDepth = clamp(row.totalTx / 8, 0, 1)
  const intervalTightness = 1 - clamp((upper - lower) / Math.max(1, predicted * 2), 0, 1)
  let score = 100 * (0.35 * historyDepth + 0.25 * txDepth + 0.25 * modelReliability + 0.15 * intervalTightness)
  if (row.coldStart) score = Math.min(score, 44)
  if (horizonDays === 365) score = Math.min(score, 72)
  const rounded = Math.round(clamp(score, 0, 100))
  return { score: rounded, status: rounded >= 72 ? 0 : rounded >= 45 ? 1 : 2 }
}

const historicalRevenues = cohort.customers.map((row) => row[C.netSpend]).sort((a, b) => a - b)
const percentileRevenueMid = percentile(historicalRevenues, 0.5)
const percentileRevenueHigh = percentile(historicalRevenues, 0.75)

function trainForHorizon(horizon) {
  const latestMonth = cohort.meta.analysisCutoffMonth
  const minRef = Math.max(2, observationWindowMonths - 1)
  const maxBacktestRef = latestMonth - horizon.months
  const refs = Array.from({ length: Math.max(0, maxBacktestRef - minRef + 1) }, (_, index) => minRef + index)
  const snapshots = refs.flatMap((refMonth) => cohort.customers.map((customer) => featureRow(customer, refMonth, horizon.months)).filter(Boolean))
    .filter((row) => row.totalTx > 0)
  const refKeys = [...new Set(snapshots.map((row) => row.refMonth))].sort((a, b) => a - b)
  const testRef = refKeys.at(-1)
  const validationRef = refKeys.length >= 3 ? refKeys.at(-2) : refKeys.at(-1)
  const trainRefs = refKeys.filter((ref) => ref !== validationRef && ref !== testRef)
  const trainRows = snapshots.filter((row) => trainRefs.includes(row.refMonth))
  const validationRows = snapshots.filter((row) => row.refMonth === validationRef)
  const testRows = snapshots.filter((row) => row.refMonth === testRef)
  const usableTrain = trainRows.length >= minTrainRows ? trainRows : snapshots.filter((row) => row.refMonth !== testRef)
  const usableValidation = validationRows.length ? validationRows : usableTrain.slice(0, Math.min(usableTrain.length, 500))
  const usableTest = testRows.length ? testRows : snapshots.slice(-Math.min(snapshots.length, 500))
  const segmentLookup = buildSegmentLookup(usableTrain)
  const globalAverage = mean(usableTrain.map((row) => row.targetValue))
  const ridgeWeights = trainRidge(usableTrain)
  const candidates = [
    { id: 'historical-run-rate', label: 'Historical Run Rate Baseline', predict: baselineHistorical },
    { id: 'segment-average', label: 'Segment Average Baseline', predict: (row) => baselineSegment(row, segmentLookup, globalAverage) },
    { id: 'ridge-log-value', label: 'Ridge Log-Value Regression', predict: (row) => predictRidge(ridgeWeights, row) },
  ]
  const validationMetrics = candidates.map((candidate) => ({ ...candidate, metrics: evaluate(usableValidation, candidate.predict) }))
  const baselineWinner = validationMetrics.slice(0, 2).sort((a, b) => a.metrics.wape - b.metrics.wape)[0]
  const modelCandidate = validationMetrics.find((row) => row.id === 'ridge-log-value')
  const selected = modelCandidate && modelCandidate.metrics.wape <= baselineWinner.metrics.wape * 0.98 ? modelCandidate : baselineWinner
  const selectedTest = evaluate(usableTest, selected.predict)
  const baselineTest = evaluate(usableTest, baselineWinner.predict)
  const residuals = usableValidation.map((row) => row.targetValue - selected.predict(row)).sort((a, b) => a - b)
  const coldResiduals = usableValidation.filter((row) => row.coldStart).map((row) => row.targetValue - selected.predict(row)).sort((a, b) => a - b)
  const modelReliability = clamp(1 - selectedTest.wape, 0.15, 0.92)
  const currentRows = cohort.customers.map((customer) => featureRow(customer, latestMonth, horizon.months)).filter(Boolean)
  const scored = currentRows.map((row) => {
    const basePrediction = row.coldStart ? baselineSegment(row, segmentLookup, globalAverage) : selected.predict(row)
    const predicted = Math.max(0, basePrediction)
    const pool = row.coldStart && coldResiduals.length >= 20 ? coldResiduals : residuals
    const lower = Math.max(0, predicted + percentile(pool, row.coldStart ? 0.05 : 0.1))
    const upper = Math.max(lower, predicted + percentile(pool, row.coldStart ? 0.95 : 0.9))
    return { row, predicted, lower, upper }
  })
  const values = scored.map((item) => item.predicted).sort((a, b) => a - b)
  const p90 = percentile(values, 0.9)
  const p70 = percentile(values, 0.7)
  const p30 = percentile(values, 0.3)
  const rows = scored.map((item) => {
    const { row, predicted, lower, upper } = item
    const churnRisk = churnRiskByCustomer.get(row.customer) ?? clamp(row.recencyMonths / 8, 0, 0.8)
    const band = predicted >= p90 ? 0 : predicted >= p70 ? 1 : predicted >= p30 ? 2 : 3
    const rel = reliability(row, modelReliability, lower, upper, predicted, horizon.days)
    const churnAdjustedValue = Math.max(0, predicted * (1 - churnRisk))
    const valueAtRisk = Math.max(0, predicted * churnRisk)
    return [
      row.customer,
      row.customerRow[C.outlet],
      row.customerRow[C.gender],
      row.customerRow[C.age],
      row.customerRow[C.segment],
      row.customerRow[C.acquisition],
      row.customerRow[C.member],
      latestMonth,
      Number(monthToYmd(latestMonth).replaceAll('-', '')),
      horizon.days,
      Math.round(row.totalRevenue),
      Math.round(predicted),
      Math.round(row.totalRevenue + predicted),
      Math.round(lower),
      Math.round(upper),
      Math.round(churnRisk * pctScale),
      Math.round(churnAdjustedValue),
      Math.round(valueAtRisk),
      band,
      rel.score,
      rel.status,
      row.coldStart ? 1 : 0,
      row.totalTx,
      row.activeMonths,
      row.recencyMonths,
      Math.round(row.avgBasket),
      Math.round(row.purchaseFrequency * 100),
      Math.round(row.voucherRate * pctScale),
      Math.round(row.campaignRate * pctScale),
      row.rfmSegment,
      row.journeyStage,
      row.preferredChannel,
      primaryDriver(row, selected.id),
      modelIds.indexOf(row.coldStart ? 'segment-average' : selected.id),
    ]
  }).sort((a, b) => b[12] - a[12])
  const actualVsPredicted = usableTest.map((row) => [
    row.customer,
    row.refMonth,
    Number(monthToYmd(row.refMonth).replaceAll('-', '')),
    horizon.days,
    Math.round(row.totalRevenue),
    Math.round(Math.max(0, selected.predict(row))),
    Math.round(row.targetValue),
    row.coldStart ? 1 : 0,
    row.customerRow[C.segment],
    row.customerRow[C.outlet],
  ]).slice(0, 1600)

  return {
    horizonDays: horizon.days,
    rows,
    actualVsPredicted,
    model: {
      selectedModel: selected.id,
      selectedModelLabel: selected.label,
      baselineModel: baselineWinner.id,
      baselineModelLabel: baselineWinner.label,
      predictionReferenceDate: monthToYmd(latestMonth),
      predictionReferenceMonth: cohort.dims.months[latestMonth],
      predictionHorizonDays: horizon.days,
      predictionHorizonMonths: horizon.months,
      observationWindowMonths,
      trainPeriod: trainRefs.length ? `${cohort.dims.months[trainRefs[0]]}..${cohort.dims.months[trainRefs.at(-1)]}` : 'insufficient-history',
      validationPeriod: validationRef === undefined ? 'insufficient-history' : cohort.dims.months[validationRef],
      testPeriod: testRef === undefined ? 'insufficient-history' : cohort.dims.months[testRef],
      snapshots: snapshots.length,
      trainSnapshots: usableTrain.length,
      validationSnapshots: usableValidation.length,
      testSnapshots: usableTest.length,
      validation: Object.fromEntries(validationMetrics.map((candidate) => [candidate.id, candidate.metrics])),
      selected: selectedTest,
      baseline: baselineTest,
      residualIntervalSource: 'empirical validation residual quantiles',
      reliability: horizon.days === 365 || refKeys.length < 3 ? 'low-history-warning' : selectedTest.wape <= 0.65 ? 'usable' : 'monitor',
      featureImportance: coefficientImportance(ridgeWeights),
      calibration: makeCalibration(usableTest, selected.predict),
    },
  }
}

const results = horizons.map(trainForHorizon)
const payload = {
  meta: {
    source: 'scripts/build-clv-prediction.mjs',
    input: COHORT_FILE,
    generatedAt: new Date().toISOString(),
    period: cohort.meta.period,
    predictionReferenceDate: cohort.meta.analysisCutoff,
    predictionReferenceMonth: cohort.dims.months[cohort.meta.analysisCutoffMonth],
    observationWindowMonths,
    minimumTransactions,
    minimumObservedMonths,
    methodology: [
      'Historical CLV = valid observed revenue up to prediction reference date.',
      'Predicted CLV = expected future transaction value over explicit horizon; it is not guaranteed revenue.',
      'Feature windows include only activity at or before prediction reference month.',
      'Future transactions after reference month are used only as training/backtest target.',
      'Temporal split uses older reference months for training, next reference for validation, latest matured reference for test.',
      'Model selection is made on validation WAPE; test set is reporting only.',
      'Prediction interval uses empirical validation residual quantiles, not arbitrary +/- percentages.',
      'Churn risk is displayed as value-at-risk and churn-adjusted decision support; predicted value is not adjusted twice.',
      'Cold-start customers receive segment-average fallback with lower reliability.',
    ],
    limitations: [
      'Dataset history is about 12 months, so 365-day horizon is not exposed because no reliable full-horizon temporal test is available.',
      'Month-level activity limits precise daily seasonality and exact purchase timing within month.',
      'CLV prediction is observational decision support, not a promise of future revenue.',
      'Churn score is imported when the churn asset exists; otherwise recency proxy is used only for risk exposure display.',
    ],
  },
  dims: {
    customerIds,
    outlets: outletDims,
    genders: cohort.dims.genders,
    ageBands: cohort.dims.ageBands,
    segments: cohort.dims.segments,
    acquisitions: cohort.dims.acquisitions,
    channels: cohort.dims.channels,
    rfmSegments,
    journeyStages,
    valueBands,
    reliabilityStatuses,
    drivers,
    modelIds,
    featureNames: [
      'historical_value', 'window_value', 'recent_value', 'positive_momentum',
      'transaction_count', 'window_transactions', 'active_months', 'window_active_months',
      'tenure_months', 'recency_months', 'average_basket', 'purchase_frequency',
      'voucher_rate', 'campaign_rate', 'member_flag', 'customer_segment',
      'acquisition_source', 'prediction_horizon',
    ],
  },
  predictions: Object.fromEntries(results.map((result) => [String(result.horizonDays), result.rows])),
  actualVsPredicted: Object.fromEntries(results.map((result) => [String(result.horizonDays), result.actualVsPredicted])),
  models: Object.fromEntries(results.map((result) => [String(result.horizonDays), result.model])),
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(payload))
console.log(`wrote ${OUT_FILE} ${(fs.statSync(OUT_FILE).size / 1024).toFixed(0)} KB`)
console.log(`  reference date ${payload.meta.predictionReferenceDate}`)
for (const result of results) {
  console.log(`  horizon ${result.horizonDays}d ${result.rows.length.toLocaleString('en-US')} predictions - ${result.model.selectedModelLabel} - test WAPE ${result.model.selected.wape}`)
}
