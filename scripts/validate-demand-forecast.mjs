import fs from 'node:fs'

const FILE = 'src/data/demandForecast.json'
const payload = JSON.parse(fs.readFileSync(FILE, 'utf8'))
const errors = []
const assert = (condition, message) => {
  if (!condition) errors.push(message)
}
const sum = (values) => values.reduce((total, value) => total + value, 0)

assert(payload.meta.metric === 'Units Sold', 'primary demand metric must be Units Sold')
assert(payload.meta.historyDays >= 300, `history should be about 12 months, got ${payload.meta.historyDays}`)
assert(Array.isArray(payload.series) && payload.series.length > 0, 'series must be present')

const historyEnd = payload.meta.historyEnd
for (const series of payload.series) {
  assert(series.historyDays > 0, `${series.id} has no history`)
  assert(series.forecast.length === payload.meta.maxHorizonDays, `${series.id} forecast horizon length mismatch`)
  assert(series.metrics.folds >= 2, `${series.id} must have at least 2 temporal backtest folds`)
  assert(series.metrics.wape >= 0 && Number.isFinite(series.metrics.wape), `${series.id} invalid WAPE`)
  assert(Number.isFinite(series.metrics.bias), `${series.id} invalid bias`)
  assert(series.selectedModel, `${series.id} missing selected model`)
  assert(series.baselineModel === 'seasonalNaive', `${series.id} missing seasonal naive baseline`)
  for (const row of series.forecast) {
    const [date, point, lower80, upper80, lower95, upper95] = row
    assert(date > historyEnd, `${series.id} forecast date ${date} is not after history end ${historyEnd}`)
    assert(point >= 0, `${series.id} has negative point forecast`)
    assert(lower80 >= 0 && lower95 >= 0, `${series.id} has negative interval lower bound`)
    assert(lower80 <= point && point <= upper80, `${series.id} 80% interval does not contain point`)
    assert(lower95 <= lower80 && upper95 >= upper80, `${series.id} 95% interval must cover 80% interval`)
  }
  for (const row of series.backtest) {
    const [date, actual, forecast] = row
    assert(date <= historyEnd, `${series.id} backtest date ${date} leaks into future`)
    assert(actual >= 0 && forecast >= 0, `${series.id} backtest demand must be non-negative`)
  }
}

const overall = payload.series.find((series) => series.id === 'overall:overall')
const productTotal = payload.series
  .filter((series) => series.level === 'product')
  .reduce((total, series) => total + sum(series.forecast.slice(0, payload.meta.defaultHorizonDays).map((row) => row[1])), 0)
const categoryTotal = payload.series
  .filter((series) => series.level === 'category')
  .reduce((total, series) => total + sum(series.forecast.slice(0, payload.meta.defaultHorizonDays).map((row) => row[1])), 0)
const overallTotal = sum(overall.forecast.slice(0, payload.meta.defaultHorizonDays).map((row) => row[1]))
assert(Math.abs(productTotal - categoryTotal) <= payload.series.length, 'product/category forecast reconciliation mismatch')
assert(Math.abs(categoryTotal - overallTotal) <= payload.series.length, 'category/overall forecast reconciliation mismatch')

if (errors.length) {
  console.error('\nDemand Forecast validation failed:')
  errors.slice(0, 30).forEach((error) => console.error('  - ' + error))
  if (errors.length > 30) console.error(`  ... ${errors.length - 30} more errors`)
  process.exit(1)
}

console.log('Demand Forecast validation passed')
console.log(`  series                 ${payload.series.length.toLocaleString('en-US')}`)
console.log(`  history window         ${payload.meta.historyStart} to ${payload.meta.historyEnd}`)
console.log(`  max horizon            ${payload.meta.maxHorizonDays} days`)
console.log(`  default horizon demand ${Math.round(overallTotal).toLocaleString('en-US')} units`)
