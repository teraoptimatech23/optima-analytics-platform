import fs from 'node:fs'
import path from 'node:path'

const file = path.join('public', 'assets', 'churnPrediction.json')
const payload = JSON.parse(fs.readFileSync(file, 'utf8'))

function assert(condition, message) {
  if (!condition) {
    console.error(`Churn validation failed: ${message}`)
    process.exit(1)
  }
}

const P = { customer: 0, outlet: 1, gender: 2, age: 3, segment: 4, acquisition: 5, member: 6, ref: 7, horizon: 8, score: 9, band: 10, threshold: 11, recency: 12, tx: 13, monetary: 15, clv: 24, channel: 25, expected: 30 }

assert(payload.meta && payload.dims && payload.predictions && payload.models, 'missing top-level shape')
assert(payload.meta.predictionReferenceDate <= payload.meta.period.end, 'prediction reference after dataset end')
assert(payload.meta.observationWindowDays > 0, 'invalid observation window')
assert(payload.meta.minimumHistoryDays > 0, 'invalid minimum history')

for (const horizon of [30, 60, 90]) {
  const rows = payload.predictions[String(horizon)]
  const model = payload.models[String(horizon)]
  assert(Array.isArray(rows), `missing predictions for ${horizon}`)
  assert(model && model.selected && model.baseline, `missing model metadata for ${horizon}`)
  assert(model.trainPeriod < model.validationPeriod && model.validationPeriod < model.testPeriod, `temporal split invalid for ${horizon}`)
  assert(model.selectedThreshold >= 0 && model.selectedThreshold <= 1, `threshold invalid for ${horizon}`)
  assert(model.baselineModel, `baseline missing for ${horizon}`)
  assert(model.selectedModel, `selected model missing for ${horizon}`)
  const [tp, fp, tn, fn] = model.selected.confusionMatrix
  assert(tp + fp + tn + fn === model.selected.sampleCount, `confusion matrix total mismatch for ${horizon}`)
  for (const key of ['rocAuc', 'prAuc', 'precision', 'recall', 'f1', 'brierScore', 'calibrationError']) {
    assert(Number.isFinite(model.selected[key]) && model.selected[key] >= 0 && model.selected[key] <= (key === 'liftAt10' ? 99 : 1), `${key} invalid for ${horizon}`)
  }
  for (const [index, point] of model.rocCurve.entries()) {
    assert(point[0] >= 0 && point[0] <= 1 && point[1] >= 0 && point[1] <= 1, `ROC point invalid ${horizon}/${index}`)
  }
  for (const [index, point] of model.precisionRecallCurve.entries()) {
    assert(point[0] >= 0 && point[0] <= 1 && point[1] >= 0 && point[1] <= 1, `PR point invalid ${horizon}/${index}`)
  }
  const seen = new Set()
  for (const [index, row] of rows.entries()) {
    assert(row[P.customer] >= 0 && row[P.customer] < payload.dims.customerIds.length, `invalid customer ${horizon}/${index}`)
    assert(!seen.has(row[P.customer]), `duplicate customer prediction ${horizon}/${row[P.customer]}`)
    seen.add(row[P.customer])
    assert(row[P.ref] === Number(payload.meta.predictionReferenceDate.replaceAll('-', '')), `reference date mismatch ${horizon}/${index}`)
    assert(row[P.horizon] === horizon, `horizon mismatch ${horizon}/${index}`)
    assert(row[P.score] >= 0 && row[P.score] <= 10000, `score out of range ${horizon}/${index}`)
    assert(row[P.band] >= 0 && row[P.band] < payload.dims.riskBands.length, `risk band invalid ${horizon}/${index}`)
    assert(row[P.threshold] >= 0 && row[P.threshold] <= 10000, `threshold out of range ${horizon}/${index}`)
    assert(row[P.recency] >= 0, `negative recency ${horizon}/${index}`)
    assert(row[P.tx] >= 1, `no observed transaction feature ${horizon}/${index}`)
    assert(Number.isFinite(row[P.monetary]) && row[P.monetary] >= 0, `invalid monetary ${horizon}/${index}`)
    assert(Number.isFinite(row[P.expected]) && row[P.expected] >= 0, `invalid expected value ${horizon}/${index}`)
  }
}

console.log('Churn Prediction validation passed')
console.log(`  reference date        ${payload.meta.predictionReferenceDate}`)
console.log(`  observation window    ${payload.meta.observationWindowDays} days`)
for (const horizon of [30, 60, 90]) {
  const rows = payload.predictions[String(horizon)]
  const model = payload.models[String(horizon)]
  console.log(`  horizon ${horizon}d           ${rows.length.toLocaleString('en-US')} predictions · ${model.selectedModel} · PR-AUC ${model.selected.prAuc}`)
}
