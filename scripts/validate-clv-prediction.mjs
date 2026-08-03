import fs from 'node:fs'
import path from 'node:path'

const file = path.join('public', 'assets', 'clvPrediction.json')
const payload = JSON.parse(fs.readFileSync(file, 'utf8'))

const P = {
  customer: 0, outlet: 1, gender: 2, age: 3, segment: 4, acquisition: 5, member: 6,
  refMonth: 7, refYmd: 8, horizon: 9, historicalValue: 10, predictedFutureValue: 11,
  totalExpectedValue: 12, lower: 13, upper: 14, churnRisk: 15, churnAdjustedValue: 16,
  valueAtRisk: 17, band: 18, reliabilityScore: 19, reliabilityStatus: 20, coldStart: 21,
  tx: 22, activeMonths: 23, recencyMonths: 24, avgBasket: 25, purchaseFrequency: 26,
  voucherRate: 27, campaignRate: 28, rfm: 29, journey: 30, channel: 31, driver: 32, model: 33,
}
const B = { customer: 0, refMonth: 1, refYmd: 2, horizon: 3, historicalValue: 4, predicted: 5, actual: 6, coldStart: 7 }

function assert(condition, message) {
  if (!condition) {
    console.error(`CLV validation failed: ${message}`)
    process.exit(1)
  }
}

assert(payload.meta && payload.dims && payload.predictions && payload.models && payload.actualVsPredicted, 'missing top-level shape')
assert(payload.meta.predictionReferenceDate <= payload.meta.period.end, 'reference date after available period')
assert(payload.meta.observationWindowMonths > 0, 'invalid observation window')
assert(payload.meta.minimumTransactions > 0, 'invalid minimum transactions')
assert(payload.meta.methodology.some((item) => item.includes('Historical CLV')), 'historical CLV methodology missing')
assert(payload.meta.methodology.some((item) => item.includes('Future transactions')), 'future target methodology missing')

for (const horizon of [90, 180]) {
  const rows = payload.predictions[String(horizon)]
  const backtest = payload.actualVsPredicted[String(horizon)]
  const model = payload.models[String(horizon)]
  assert(Array.isArray(rows) && rows.length > 0, `missing predictions for ${horizon}`)
  assert(Array.isArray(backtest), `missing backtest rows for ${horizon}`)
  assert(model && model.selected && model.baseline && model.validation, `missing model metadata for ${horizon}`)
  assert(model.predictionHorizonDays === horizon, `model horizon mismatch ${horizon}`)
  assert(model.selectedModel && model.baselineModel, `model names missing ${horizon}`)
  assert(model.selectedModel === model.baselineModel || model.validation[model.selectedModel].wape <= model.validation[model.baselineModel].wape * 0.98, `selected model appears chosen outside validation rule ${horizon}`)
  assert(model.selected.sampleCount === model.testSnapshots, `test sample mismatch ${horizon}`)
  assert(model.validationSnapshots > 0 && model.testSnapshots > 0, `temporal validation/test missing ${horizon}`)
  for (const metric of ['mae', 'rmse', 'wape', 'medianAbsoluteError']) {
    assert(Number.isFinite(model.selected[metric]) && model.selected[metric] >= 0, `invalid selected ${metric} ${horizon}`)
    assert(Number.isFinite(model.baseline[metric]) && model.baseline[metric] >= 0, `invalid baseline ${metric} ${horizon}`)
  }
  assert(model.residualIntervalSource.includes('validation residual'), `interval source invalid ${horizon}`)
  const seen = new Set()
  for (const [index, row] of rows.entries()) {
    assert(!seen.has(row[P.customer]), `duplicate customer ${horizon}/${row[P.customer]}`)
    seen.add(row[P.customer])
    assert(row[P.customer] >= 0 && row[P.customer] < payload.dims.customerIds.length, `invalid customer index ${horizon}/${index}`)
    assert(row[P.outlet] >= 0 && row[P.outlet] < payload.dims.outlets.length, `invalid outlet ${horizon}/${index}`)
    assert(row[P.horizon] === horizon, `row horizon mismatch ${horizon}/${index}`)
    assert(row[P.refYmd] === Number(payload.meta.predictionReferenceDate.replaceAll('-', '')), `current prediction reference mismatch ${horizon}/${index}`)
    assert(row[P.historicalValue] >= 0, `negative historical value ${horizon}/${index}`)
    assert(row[P.predictedFutureValue] >= 0, `negative predicted future value ${horizon}/${index}`)
    assert(row[P.totalExpectedValue] === row[P.historicalValue] + row[P.predictedFutureValue], `total expected value mismatch ${horizon}/${index}`)
    assert(row[P.lower] >= 0 && row[P.upper] >= row[P.lower], `invalid interval ${horizon}/${index}`)
    assert(row[P.churnRisk] >= 0 && row[P.churnRisk] <= 10000, `churn risk out of range ${horizon}/${index}`)
    assert(row[P.churnAdjustedValue] >= 0 && row[P.valueAtRisk] >= 0, `negative risk value ${horizon}/${index}`)
    assert(Math.abs(row[P.churnAdjustedValue] + row[P.valueAtRisk] - row[P.predictedFutureValue]) <= 2, `churn adjustment double-count risk ${horizon}/${index}`)
    assert(row[P.band] >= 0 && row[P.band] < payload.dims.valueBands.length, `invalid band ${horizon}/${index}`)
    assert(row[P.reliabilityScore] >= 0 && row[P.reliabilityScore] <= 100, `invalid reliability score ${horizon}/${index}`)
    assert(row[P.reliabilityStatus] >= 0 && row[P.reliabilityStatus] < payload.dims.reliabilityStatuses.length, `invalid reliability status ${horizon}/${index}`)
    assert(row[P.coldStart] === 0 || row[P.reliabilityStatus] === 2, `cold-start must be low reliability ${horizon}/${index}`)
    assert(row[P.tx] >= 1 && row[P.activeMonths] >= 1, `invalid history counters ${horizon}/${index}`)
    assert(row[P.avgBasket] >= 0 && row[P.purchaseFrequency] >= 0, `invalid behavioural metric ${horizon}/${index}`)
    assert(row[P.voucherRate] >= 0 && row[P.voucherRate] <= 10000, `voucher rate invalid ${horizon}/${index}`)
    assert(row[P.campaignRate] >= 0 && row[P.campaignRate] <= 10000, `campaign rate invalid ${horizon}/${index}`)
    assert(row[P.rfm] >= 0 && row[P.rfm] < payload.dims.rfmSegments.length, `rfm index invalid ${horizon}/${index}`)
    assert(row[P.journey] >= 0 && row[P.journey] < payload.dims.journeyStages.length, `journey index invalid ${horizon}/${index}`)
    assert(row[P.channel] >= 0 && row[P.channel] < payload.dims.channels.length, `channel index invalid ${horizon}/${index}`)
    assert(row[P.driver] >= 0 && row[P.driver] < payload.dims.drivers.length, `driver index invalid ${horizon}/${index}`)
    assert(row[P.model] >= 0 && row[P.model] < payload.dims.modelIds.length, `model index invalid ${horizon}/${index}`)
  }
  for (const [index, row] of backtest.entries()) {
    assert(row[B.horizon] === horizon, `backtest horizon mismatch ${horizon}/${index}`)
    assert(row[B.refYmd] < Number(payload.meta.predictionReferenceDate.replaceAll('-', '')), `backtest reference not historical ${horizon}/${index}`)
    assert(row[B.historicalValue] >= 0 && row[B.predicted] >= 0 && row[B.actual] >= 0, `backtest negative value ${horizon}/${index}`)
    assert(row[B.coldStart] === 0 || row[B.coldStart] === 1, `backtest cold-start flag invalid ${horizon}/${index}`)
  }
}

console.log('CLV Prediction validation passed')
console.log(`  reference date        ${payload.meta.predictionReferenceDate}`)
for (const horizon of [90, 180]) {
  const rows = payload.predictions[String(horizon)]
  const model = payload.models[String(horizon)]
  console.log(`  horizon ${horizon}d          ${rows.length.toLocaleString('en-US')} predictions - ${model.selectedModelLabel} - WAPE ${model.selected.wape}`)
}
