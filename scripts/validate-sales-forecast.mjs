import fs from 'node:fs'
import path from 'node:path'

const file = path.join('public', 'assets', 'salesForecast.json')
const payload = JSON.parse(fs.readFileSync(file, 'utf8'))
const metrics = ['revenue', 'orders', 'transactions', 'units', 'averageBasket', 'grossProfit', 'conversion']

function assert(condition, message) {
  if (!condition) {
    console.error(`Sales Forecast validation failed: ${message}`)
    process.exit(1)
  }
}

assert(payload.meta && payload.dims && payload.series && payload.seasonality, 'missing top-level shape')
assert(payload.meta.period.start < payload.meta.period.end, 'invalid period')
assert(payload.meta.maxHorizonDays >= 365, '365-day horizon unavailable')
assert(payload.series.length > 0, 'no forecast series')
assert(payload.meta.methodology.some((item) => item.includes('Seasonal Moving Average')), 'baseline methodology missing')
assert(payload.meta.methodology.some((item) => item.includes('residual')), 'residual interval methodology missing')

const historyEnd = Number(payload.meta.period.end.replaceAll('-', ''))
for (const [seriesIndex, series] of payload.series.entries()) {
  assert(series.id && series.level && series.label, `series identity missing ${seriesIndex}`)
  assert(series.history.length > 0, `history missing ${series.id}`)
  assert(series.history.at(-1)[0] === payload.meta.period.end, `history does not end at period end ${series.id}`)
  for (const metric of metrics) {
    const model = series.metrics[metric]
    assert(model, `metric ${metric} missing ${series.id}`)
    assert(model.selectedModel && model.baselineModel, `model names missing ${series.id}/${metric}`)
    assert(model.forecast.length === payload.meta.maxHorizonDays, `forecast length invalid ${series.id}/${metric}`)
    assert(model.metrics && Number.isFinite(model.metrics.wape), `metrics invalid ${series.id}/${metric}`)
    assert(model.metrics.folds >= 2, `backtest folds insufficient ${series.id}/${metric}`)
    for (const key of ['mae', 'rmse', 'mape', 'wape', 'bias', 'forecastAccuracy']) {
      assert(Number.isFinite(model.metrics[key]), `${key} NaN ${series.id}/${metric}`)
      if (key !== 'bias') assert(model.metrics[key] >= 0, `${key} negative ${series.id}/${metric}`)
    }
    for (const [index, row] of model.forecast.entries()) {
      const date = Number(row[0].replaceAll('-', ''))
      assert(date > historyEnd, `forecast date not after history ${series.id}/${metric}/${index}`)
      assert(row[1] >= 0 && row[2] >= 0 && row[3] >= row[2] && row[4] >= 0 && row[5] >= row[4], `invalid interval ${series.id}/${metric}/${index}`)
      for (const value of row.slice(1)) assert(Number.isFinite(value), `forecast NaN ${series.id}/${metric}/${index}`)
    }
    for (const [index, row] of model.backtest.entries()) {
      const date = Number(row[0].replaceAll('-', ''))
      assert(date <= historyEnd, `backtest date in future ${series.id}/${metric}/${index}`)
      assert(row[1] >= 0 && row[2] >= 0, `negative backtest value ${series.id}/${metric}/${index}`)
      assert(Number.isFinite(row[3]), `backtest residual NaN ${series.id}/${metric}/${index}`)
    }
  }
  assert(series.target.revenue >= 0 && series.target.achievement >= 0, `target invalid ${series.id}`)
}

const overall = payload.series.find((series) => series.id === 'overall:overall')
assert(overall, 'overall series missing')
const example = overall.metrics.revenue.forecast[0]

console.log('Sales Forecast validation passed')
console.log(`  series           ${payload.series.length.toLocaleString('en-US')}`)
console.log(`  period           ${payload.meta.period.start} - ${payload.meta.period.end}`)
console.log(`  default revenue  ${Math.round(payload.summary.defaultRevenue).toLocaleString('en-US')}`)
console.log(`  revenue model    ${payload.summary.selectedRevenueModel}`)
console.log(`  first forecast   ${example[0]} revenue ${Math.round(example[1]).toLocaleString('en-US')} (${Math.round(example[2]).toLocaleString('en-US')} - ${Math.round(example[3]).toLocaleString('en-US')})`)
